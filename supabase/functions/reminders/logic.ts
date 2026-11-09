// =========================================
// 로드플래너 예약 알림 (Supabase Edge Function: reminders)
//  - 5분마다 DB 예약 작업(pg_cron)이 호출합니다.
//  1) 출발 15분 전 알림: 오늘 일정의 '출발·이동·픽업' 단계 시간이 10~16분 남았을 때 담당 매니저에게
//  2) 전날 밤 요약: 밤 9시에 매니저별 '내일 일정' 요약 + 본사에 '내일 일정·확인 대기' 요약
//  3) 아침 동선 재계산 (05:30~06:00): 오늘 아직 시작 안 한 일정의 이동 시간을 '오늘 교통 예측'으로 다시 계산,
//     5분 이상 바뀌면 동선을 고치고 담당 매니저에게 알림 + 확인 요청
//  4) 출발 지연 알림: 출발 시간이 5분 넘게 지났는데 출발/완료 표시가 없으면 매니저와 본사에 알림
//  - 같은 알림은 reminder_log 로 한 번만 보냅니다.
//  - 본사 알림은 notify_prefs(본인 설정)에서 끈 사람에게는 보내지 않습니다.
//  - 호출 확인: 헤더 x-cron-key 가 app_settings('reminder_cron_key') 값과 같아야 함
// =========================================
// 순수 로직 (테스트 가능): DB 클라이언트와 푸시 전송 함수를 받아서 실행
type SupabaseClient = any;
type Row = Record<string, any>;
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DRIVE = /출발|이동|픽업/;
// 알림을 눌렀을 때 여는 주소 — 기본값. 도메인을 바꾸면 app_settings 표의 app_url / hq_url 만 고치면 됨
let APP_URL = "https://ktj8824-stack.github.io/manager-planner-app/";
let HQ_URL = "https://ktj8824-stack.github.io/manager-planner-web/";

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
const hm2min = (hm: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(hm || "")); return m ? (+m[1]) * 60 + (+m[2]) : NaN; };
const min2hm = (n: number) => { const v = ((Math.round(n) % 1440) + 1440) % 1440; return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`; };
// 단계별 날짜 차이 (-1 전날 / 0 당일 / +1 다음날) — 앱(data.js stepDayOffsets)과 같은 규칙
export function stepDayOffsets(tl: Row[], startTime?: string): number[] {
  const list = Array.isArray(tl) ? tl : [];
  if (list.length && list.every((x) => Number.isInteger(x?.dayOffset))) return list.map((x) => x.dayOffset);
  const mins = list.map((x) => hm2min(x?.time));
  let mi = list.findIndex((x) => /^\[메인/.test(String(x?.label || "")));
  if (mi < 0) mi = list.findIndex((x) => x?.time === String(startTime || "").slice(0, 5));
  if (mi < 0) mi = 0;
  const off = list.map(() => 0);
  for (let i = mi - 1; i >= 0; i--) off[i] = off[i + 1] - (mins[i] > mins[i + 1] ? 1 : 0);
  for (let i = mi + 1; i < list.length; i++) off[i] = off[i - 1] + (mins[i] < mins[i - 1] ? 1 : 0);
  return off;
}
const tag = (label: string) => (String(label || "").match(/^\[([^\]]+)\]/) || [, ""])[1];

// "MBC 상암 신사옥 (서울 마포구 성암로 267)" → 이름/주소
export function splitPlace(s: string) {
  const str = String(s || "").replace(/\s+/g, " ").trim();
  const m = str.match(/^(.*?)\s*[(\[]([^()\[\]]+)[)\]]\s*$/);
  const looksAddr = (v: string) => /(시|도|구|군|읍|면|동|리|로|길)\s*\d|\d+(-\d+)?\s*$/.test(v) && /(시|도|구|군)\s/.test(v + " ");
  if (m && m[1].trim() && looksAddr(m[2])) return { name: m[1].trim(), addr: m[2].trim() };
  if (looksAddr(str)) return { name: "", addr: str };
  return { name: m && m[1].trim() ? m[1].trim() : str, addr: "" };
}

export type Route = (service: string, params: Row) => Promise<Row | null>;
async function geocode(route: Route, text: string): Promise<{ x: number; y: number } | null> {
  const p = splitPlace(text);
  const tries: [string, string][] = [];
  if (p.addr) tries.push(["kakao_address", p.addr], ["kakao_keyword", p.addr]);
  if (p.name) tries.push(["kakao_keyword", p.name]);
  for (const [svc, q] of tries) {
    const r = await route(svc, { query: q });
    const d = r && Array.isArray(r.documents) && r.documents[0];
    if (d && d.x && d.y) return { x: Number(d.x), y: Number(d.y) };
  }
  return null;
}
async function predict(route: Route, from: string, to: string, ymd: string, arriveMin: number): Promise<number | null> {
  if (!from || !to || !Number.isFinite(arriveMin)) return null;
  const [a, b] = await Promise.all([geocode(route, from), geocode(route, to)]);
  if (!a || !b) return null;
  const r = await route("tmap_route_at", { sx: a.x, sy: a.y, ex: b.x, ey: b.y, at: `${ymd}T${min2hm(arriveMin)}`, mode: "arrive" });
  const f = r && Array.isArray(r.features) && r.features[0];
  const sec = f && f.properties && Number(f.properties.totalTime);
  return sec > 0 ? Math.ceil(sec / 60) : null;
}

// 오늘 아침 동선 재계산 (한 일정). 바뀌었으면 { timeline, changes } 반환
export async function retimeSchedule(route: Route, s: Row, ymd: string) {
  const tl: Row[] = Array.isArray(s.timeline_items) ? s.timeline_items.map((x: Row) => ({ ...x })) : [];
  const iMain = tl.findIndex((x) => tag(x.label) === "메인 일정");
  const iMove = tl.findIndex((x, i) => i < iMain && tag(x.label) === "현장 이동");
  if (iMain < 0 || iMove < 0) return null;
  if (tl.slice(0, iMain + 1).some((x) => (x.done || x.moving) && !/^\[기상/.test(String(x.label || "")))) return null;     // 이미 시작한 일정은 건드리지 않음
  const wait = Number((String(tl[iMain].desc || "").match(/(\d+)분 전\(/) || [])[1] ?? 10);
  const buf = Number((String(tl[iMove].desc || "").match(/버퍼 (\d+)분/) || [])[1] ?? 10);
  const shop = s.shop_info && s.shop_info.needed ? s.shop_info : null;
  const dep = s.departure_info || {};
  const depText = dep.address || dep.place || "";
  const shopText = shop ? (shop.address || shop.name || "") : "";
  const arrive = hm2min(String(s.start_time)) - wait;
  if (!(arrive > 0)) return null;   // 자정을 넘는 동선은 재계산하지 않음 (전날 단계)
  const t2 = await predict(route, shop ? shopText : depText, String(s.location || ""), ymd, arrive);
  if (!t2) return null;
  const newTimes: Record<number, { time: string; travel: number; at: number }> = {};
  const move = arrive - t2 - buf;
  newTimes[iMove] = { time: min2hm(move), travel: t2, at: arrive };
  const iShop = tl.findIndex((x, i) => i < iMove && tag(x.label) === "헤어·메이크업");
  const iPick = tl.findIndex((x, i) => i < iMove && tag(x.label) === "픽업 출발");
  if (shop && iShop >= 0 && iPick >= 0) {
    const dur = Number(shop.durationMin) || Math.max(30, hm2min(tl[iMove].time) - hm2min(tl[iShop].time));
    const shopArrive = move - dur;
    const t1 = await predict(route, depText, shopText, ymd, shopArrive);
    newTimes[iShop] = { time: min2hm(shopArrive), travel: 0, at: shopArrive };
    if (t1) newTimes[iPick] = { time: min2hm(shopArrive - t1 - buf), travel: t1, at: shopArrive };
    else delete newTimes[iShop];
  }
  const changes: string[] = [];
  let maxDiff = 0;
  for (const [k, v] of Object.entries(newTimes)) {
    const i = Number(k);
    const diff = Math.abs(hm2min(v.time) - hm2min(tl[i].time));
    maxDiff = Math.max(maxDiff, diff);
    if (v.time !== tl[i].time) changes.push(`${tag(tl[i].label)} ${tl[i].time}→${v.time}`);
    tl[i].time = v.time;
    if (v.travel) tl[i].desc = `이동 약 ${v.travel}분 + 버퍼 ${buf}분 배정 (예상 소요 약 ${v.travel + buf}분 · 오늘 ${min2hm(v.at)} 도착 기준 교통 예측)`;
  }
  if (maxDiff < 5) return { timeline: null, changes: [] };
  // 기상·준비 단계도 첫 출발에 맞춰 같이 옮김
  const iWake = tl.findIndex((x) => /^\[기상/.test(String(x.label || "")));
  const firstRun = tl.find((x, i) => i !== iWake && x.time);
  if (iWake >= 0 && firstRun) {
    const prep = Number((String(tl[iWake].desc || "").match(/(\d+)분 전/) || [])[1] ?? 60);
    const w = hm2min(firstRun.time) - prep;
    if (w >= 0 && min2hm(w) !== tl[iWake].time) { changes.push(`기상·준비 ${tl[iWake].time}→${min2hm(w)}`); tl[iWake].time = min2hm(w); }
  }
  return { timeline: tl, changes };
}

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

// 본사(대표·관리자) 받는 사람 — 본인이 설정에서 끈 알림은 빼고
async function hqIds(db: SupabaseClient, co: string, pref: "hq_late" | "hq_evening"): Promise<string[]> {
  const { data: hq } = await db.from("profiles").select("id").eq("company_id", co).in("role", ["ceo", "hq_admin"]);
  const ids = (hq ?? []).map((h: Row) => h.id as string);
  if (!ids.length) return ids;
  const { data: off } = await db.from("notify_prefs").select("user_id").in("user_id", ids).eq(pref, false);
  const offSet = new Set((off ?? []).map((r: Row) => r.user_id));
  return ids.filter((id) => !offSet.has(id));
}

export async function run(db: SupabaseClient, send: Sender, nowMs: number, route: Route | null = null) {
  const today = kst(nowMs);
  const tomorrow = kst(nowMs + 24 * 3600e3);
  const out = { departures: 0, evening: 0, pushed: 0, retimed: 0, late: 0 };
  try {
    const { data: urls } = await db.from("app_settings").select("key, value").in("key", ["app_url", "hq_url"]);
    for (const u of (urls ?? []) as Row[]) {
      if (u.key === "app_url" && /^https:\/\//.test(u.value)) APP_URL = u.value.endsWith("/") ? u.value : u.value + "/";
      if (u.key === "hq_url" && /^https:\/\//.test(u.value)) HQ_URL = u.value.endsWith("/") ? u.value : u.value + "/";
    }
  } catch (_e) { /* 기본값 사용 */ }

  const { data: rows, error } = await db.from("schedules")
    .select("id, title, date, start_time, location, manager_id, timeline_items, is_secret, status, status_logs, departure_info, shop_info, artists(name), vehicles(name), profiles!schedules_manager_id_fkey(name, company_id), creator:profiles!schedules_created_by_fkey(company_id)")
    .in("date", [today.ymd, tomorrow.ymd]).not("status", "in", "(cancelled,completed)");
  if (error) throw error;
  const list = (rows ?? []) as Row[];

  // 3) 아침 동선 재계산 (05:30~06:00)
  if (route && today.hh === 5 && today.mm >= 30) {
    // 개인 매니저(회사 없음): 알림은 무료, 아침 교통 재계산만 유료 → 무료 사용자는 재계산에서 빼기
    const indieIds = [...new Set(list.filter((s) => s.manager_id && s.profiles && !s.profiles.company_id).map((s) => s.manager_id as string))];
    const unpaid = new Set<string>();
    for (const id of indieIds) {
      try {
        const { data } = await db.rpc("indie_pro_until", { p_user: id });
        if (!data || !(Date.parse(String(data)) > nowMs)) unpaid.add(id);
      } catch (_e) { unpaid.add(id); }
    }
    for (const s of list) {
      if (s.date !== today.ymd || !s.manager_id || unpaid.has(s.manager_id)) continue;
      if (!(await claim(db, `retime|${s.id}|${today.ymd}`))) continue;
      try {
        const r = await retimeSchedule(route, s, today.ymd);
        if (!r || !r.timeline) continue;
        const d = new Date(nowMs + 9 * 3600e3);
        const log = {
          id: "log_retime_" + s.id.slice(0, 8) + "_" + today.ymd, time: min2hm(d.getUTCHours() * 60 + d.getUTCMinutes()), date: today.ymd,
          recordedAt: new Date(nowMs).toISOString(), label: "[아침 동선 재계산] " + r.changes.join(" · ") + " (오늘 교통 예측)",
          status: s.status, stepIdx: null, managerName: "로드플래너 자동", ack: { need: true, managerId: s.manager_id },
        };
        const logs = [log, ...(Array.isArray(s.status_logs) ? s.status_logs : [])];
        const { error: upErr } = await db.from("schedules").update({ timeline_items: r.timeline, status_logs: logs }).eq("id", s.id);
        if (upErr) continue;
        s.timeline_items = r.timeline; s.status_logs = logs;   // 아래 출발 알림도 새 시간 기준
        out.retimed++;
        const who = s.is_secret ? "비공개 일정" : `${s.artists?.name ? s.artists.name + " · " : ""}${s.title}`;
        const p = await push(db, send, [s.manager_id], {
          title: "🚦 오늘 동선이 바뀌었어요 (교통 예측)", body: `${who}\n${r.changes.join("\n")}\n앱에서 [확인했습니다]를 눌러 주세요`,
          tag: `retime-${s.id}`, url: APP_URL, kind: "retime",
        }, 7200);
        out.pushed += p.sent;
      } catch (_e) { /* 이 일정만 건너뜀 */ }
    }
  }

  // 1) 출발 15분 전
  for (const s of list) {
    if (!s.manager_id) continue;
    const tl = Array.isArray(s.timeline_items) ? s.timeline_items : [];
    const offs = stepDayOffsets(tl, s.start_time);   // 내일 새벽 일정의 전날 밤 픽업도 오늘 알림
    for (let i = 0; i < tl.length; i++) {
      const st = tl[i] || {};
      if (st.done || st.moving || !st.time || !DRIVE.test(st.label || "") || /철수|^\[기상/.test(st.label || "")) continue;
      const left = (toMs(s.date, st.time) + (offs[i] || 0) * 86400e3 - nowMs) / 60000;
      if (left > 16 || left < -21) continue;
      // 4) 출발 지연: 출발 시간이 5~20분 지났는데 출발/완료 표시가 없음 → 매니저 + 본사
      if (left <= -5 && left > -20) {
        if (!(await claim(db, `late|${s.id}|${i}|${st.time}`))) continue;
        out.late++;
        const lateMin = Math.round(-left);
        const who = s.is_secret ? "비공개 일정" : `${s.artists?.name ? s.artists.name + " · " : ""}${s.title}`;
        const a = await push(db, send, [s.manager_id], {
          title: `⏰ 출발 시간(${st.time})이 ${lateMin}분 지났어요`, body: `${stepName(st.label)}\n출발하셨으면 앱에서 [출발]을 눌러 주세요`,
          tag: `late-${s.id}-${i}`, url: APP_URL, kind: "late",
        }, 1800);
        const co = s.profiles?.company_id;
        let b = { sent: 0 };
        if (co) {
          b = await push(db, send, await hqIds(db, co, "hq_late"), {
            title: `⏰ 출발 지연 ${lateMin}분 · ${s.profiles?.name || "담당 매니저"}`, body: `${who}\n${stepName(st.label)} (${st.time}) — 출발 표시 없음`,
            tag: `late-hq-${s.id}-${i}`, url: HQ_URL, kind: "late",
          }, 1800);
        }
        out.pushed += a.sent + b.sent;
        continue;
      }
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
      const tlF = Array.isArray(first.timeline_items) ? first.timeline_items : [];
      const i0 = Math.max(tlF.findIndex((t: Row) => t && t.time && DRIVE.test(String(t.label || ""))), tlF.findIndex((t: Row) => t && t.time));
      const tl0 = i0 >= 0 ? { time: (stepDayOffsets(tlF, first.start_time)[i0] === -1 ? "오늘 " : "") + tlF[i0].time } : null;
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
    for (const s of tmr) { const co = s.profiles?.company_id || s.creator?.company_id; if (co) byCo.set(co, [...(byCo.get(co) || []), s]); }
    for (const [co, items] of byCo) {
      if (!(await claim(db, `eve-hq|${co}|${tomorrow.ymd}`))) continue;
      const pending = items.filter((s) => {
        const logs = Array.isArray(s.status_logs) ? s.status_logs : [];
        const req = logs.find((l: Row) => l && l.ack && l.ack.need);
        return req && !logs.some((l: Row) => l && l.ackOf === req.id);
      }).length;
      const noMgr = items.filter((s) => !s.manager_id).length;
      const r = await push(db, send, await hqIds(db, co, "hq_evening"), {
        title: `📅 내일 ${dateLabel(tomorrow.ymd)} 일정 ${items.length}건`,
        body: [pending ? `매니저 확인 대기 ${pending}건` : "모든 변경 확인 완료", noMgr ? `담당 미지정 ${noMgr}건` : ""].filter(Boolean).join(" · "),
        tag: `eve-hq-${tomorrow.ymd}`, url: HQ_URL, kind: "evening",
      }, 36000);
      out.pushed += r.sent;
    }
  }
  return out;
}

