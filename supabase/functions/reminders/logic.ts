// =========================================
// 로드플래너 예약 알림 (Supabase Edge Function: reminders)
//  - 5분마다 DB 예약 작업(pg_cron)이 호출합니다.
//  1) 출발 15분 전 알림: 오늘 일정의 '출발·이동·픽업' 단계 시간이 10~16분 남았을 때 담당 매니저에게
//  2) 전날 밤 요약: 밤 9시에 매니저별 '내일 일정' 요약 + 본사에 '내일 일정·확인 대기' 요약
//  - 같은 알림은 reminder_log 로 한 번만 보냅니다.
//  - 호출 확인: 헤더 x-cron-key 가 app_settings('reminder_cron_key') 값과 같아야 함
// =========================================
// 순수 로직 (테스트 가능): DB 클라이언트와 푸시 전송 함수를 받아서 실행
type SupabaseClient = any;
type Row = Record<string, any>;
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DRIVE = /출발|이동|픽업/;
const APP_URL = "https://ktj8824-stack.github.io/manager-planner-app/";

// 한국 시간 기준 날짜/시각
function kst(ms: number) {
  const d = new Date(ms + 9 * 3600e3);
  const ymd = d.toISOString().slice(0, 10);
  return { ymd, hh: d.getUTCHours(), mm: d.getUTCMinutes(), dow: d.getUTCDay() };
}
const toMs = (ymd: string, hm: string) => Date.parse(`${ymd}T${hm.slice(0, 5)}:00+09:00`);
const dateLabel = (ymd: string) => { const d = new Date(ymd + "T00:00:00Z"); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${DAYS[d.getUTCDay()]})`; };
const stepName = (label: string) => String(label || "").replace(/^\[[^\]]+\]\s*/, "").trim();
const placeName = (s: string) => String(s || "").replace(/\s*\([^()]*\)\s*$/, "").trim();

async function claim(db: SupabaseClient, key: string): Promise<boolean> {
  // 처음 보내는 알림만 true (이미 기록이 있으면 false)
  const { error } = await db.from("reminder_log").insert({ key });
  return !error;
}

export type Sender = (sub: Row, payload: string, ttl: number) => Promise<void>;
async function push(db: SupabaseClient, send: Sender, userIds: string[], payload: Row, ttl = 1800) {
  if (!userIds.length) return { sent: 0, failed: 0 };
  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", userIds);
  let sent = 0, failed = 0;
  const dead: string[] = [];
  await Promise.all((subs ?? []).map(async (s: Row) => {
    try {
      await send(s, JSON.stringify(payload), ttl);
      sent++;
    } catch (e) {
      failed++;
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) dead.push(s.id);
    }
  }));
  if (dead.length) await db.from("push_subscriptions").delete().in("id", dead);
  return { sent, failed };
}

export async function run(db: SupabaseClient, send: Sender, nowMs: number) {
  const today = kst(nowMs);
  const tomorrow = kst(nowMs + 24 * 3600e3);
  const out = { departures: 0, evening: 0, pushed: 0 };

  const { data: rows, error } = await db.from("schedules")
    .select("id, title, date, start_time, location, manager_id, timeline_items, is_secret, status, status_logs, artists(name), vehicles(name), profiles!schedules_manager_id_fkey(name, company_id)")
    .in("date", [today.ymd, tomorrow.ymd]).not("status", "in", "(cancelled,completed)");
  if (error) throw error;
  const list = (rows ?? []) as Row[];

  // 1) 출발 15분 전
  for (const s of list) {
    if (s.date !== today.ymd || !s.manager_id) continue;
    const tl = Array.isArray(s.timeline_items) ? s.timeline_items : [];
    for (let i = 0; i < tl.length; i++) {
      const st = tl[i] || {};
      if (st.done || st.moving || !st.time || !DRIVE.test(st.label || "") || /철수/.test(st.label || "")) continue;
      const left = (toMs(s.date, st.time) - nowMs) / 60000;
      if (left <= 9 || left > 16) continue;
      if (!(await claim(db, `dep|${s.id}|${i}|${st.time}`))) continue;
      out.departures++;
      const who = s.is_secret ? "비공개 일정" : `${s.artists?.name ? s.artists.name + " · " : ""}${s.title}`;
      const r = await push(db, send, [s.manager_id], {
        title: `🚗 ${Math.round(left)}분 뒤 출발 · ${st.time}`,
        body: `${stepName(st.label)}\n${who}\n눌러서 바로 길안내`,
        tag: `dep-${s.id}-${i}`, url: APP_URL + "?go=next", kind: "departure",
      }, 1200);
      out.pushed += r.sent;
    }
  }

  // 2) 전날 밤 9시 요약
  if (today.hh === 21 && today.mm < 30) {
    const tmr = list.filter((s) => s.date === tomorrow.ymd);
    const byMgr = new Map<string, Row[]>();
    for (const s of tmr) if (s.manager_id) byMgr.set(s.manager_id, [...(byMgr.get(s.manager_id) || []), s]);
    for (const [mid, items] of byMgr) {
      if (!(await claim(db, `eve|${mid}|${tomorrow.ymd}`))) continue;
      items.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
      const first = items[0];
      const tl0 = (Array.isArray(first.timeline_items) ? first.timeline_items : []).find((t: Row) => t && t.time) || null;
      const lines = items.slice(0, 4).map((s) => `${String(s.start_time).slice(0, 5)} ${s.is_secret ? "비공개 일정" : (s.artists?.name ? s.artists.name + " " : "") + s.title}${!s.is_secret && s.location ? " · " + placeName(s.location) : ""}`);
      if (items.length > 4) lines.push(`외 ${items.length - 4}건`);
      const r = await push(db, send, [mid], {
        title: `📅 내일 ${dateLabel(tomorrow.ymd)} 일정 ${items.length}건${tl0 ? ` · 첫 출발 ${tl0.time}` : ""}`,
        body: lines.join("\n") + (first.vehicles?.name ? `\n차량: ${first.vehicles.name}` : ""),
        tag: `eve-${tomorrow.ymd}`, url: APP_URL, kind: "evening",
      }, 36000);
      out.evening++; out.pushed += r.sent;
    }
    // 본사(대표·관리자): 회사별 내일 일정 수 + 매니저 확인 대기
    const byCo = new Map<string, Row[]>();
    for (const s of tmr) { const co = s.profiles?.company_id; if (co) byCo.set(co, [...(byCo.get(co) || []), s]); }
    for (const [co, items] of byCo) {
      if (!(await claim(db, `eve-hq|${co}|${tomorrow.ymd}`))) continue;
      const pending = items.filter((s) => {
        const logs = Array.isArray(s.status_logs) ? s.status_logs : [];
        const req = logs.find((l: Row) => l && l.ack && l.ack.need);
        return req && !logs.some((l: Row) => l && l.ackOf === req.id);
      }).length;
      const noMgr = items.filter((s) => !s.manager_id).length;
      const { data: hq } = await db.from("profiles").select("id").eq("company_id", co).in("role", ["ceo", "hq_admin"]);
      const r = await push(db, send, (hq ?? []).map((h: Row) => h.id), {
        title: `📅 내일 ${dateLabel(tomorrow.ymd)} 일정 ${items.length}건`,
        body: [pending ? `매니저 확인 대기 ${pending}건` : "모든 변경 확인 완료", noMgr ? `담당 미지정 ${noMgr}건` : ""].filter(Boolean).join(" · "),
        tag: `eve-hq-${tomorrow.ymd}`, url: APP_URL.replace("manager-planner-app", "manager-planner-web"), kind: "evening",
      }, 36000);
      out.pushed += r.sent;
    }
  }
  return out;
}

