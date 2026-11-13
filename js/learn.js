/* =========================================
   로드플래너 — 쌓인 기록으로 먼저 알려 주기 (CEO플래너에서 가져옴)
   화면과 상관없는 순수 계산 → tests/server/learn-test.cjs (node)

   Learn  — 실제 이동 시간 학습
     samples(schedules): 매니저가 [출발]→[완료]를 누른 이동 단계의 실제 걸린 시간
     travel(schedules, { from, to, at }): 같은 길 평균 (3번 이상 쌓이면). at(출발 예정)을 주면 같은 시간대 먼저
   Drafts — 현장 담당자(PD·작가 등)에게 보낼 문자 초안 (보내기 전에 고칠 수 있음)
     late / change / cancel / depart / arrive
   Repeat — 반복 일정 날짜 (매주 · 평일 · 격주 · 매월)
   ========================================= */
(function (root) {
  const DRIVE = /출발|이동|픽업|복귀|귀가/;
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // 장소 비교용 열쇠: 주소가 있으면 주소, 없으면 이름. 괄호 속 주소·띄어쓰기·'번지' 등 정리
  const placeKey = (p) => {
    if (!p) return '';
    let s = typeof p === 'string' ? p : (p.address || p.place || p.name || '');
    s = String(s);
    const m = s.match(/\(([^()]*\d[^()]*)\)\s*$/);     // "MBC (서울 마포구 성암로 267)" → 주소
    if (m) s = m[1];
    return s.replace(/\s+/g, '').replace(/[,.·]/g, '').replace(/번지$/, '').toLowerCase();
  };
  const KIND = (label) => {
    const l = String(label || '');
    if (/^\[(기상|대기|식사)/.test(l) || !DRIVE.test(l) || /철수|^\[메인/.test(l)) return '';
    if (/픽업/.test(l)) return 'pickup';
    if (/복귀|귀가/.test(l)) return 'return';
    return 'venue';
  };

  const Learn = {
    MIN_SAMPLES: 3,
    placeKey,

    /** 시간대 — 같은 길도 출근·퇴근 때는 훨씬 오래 걸려요 (한국 시간 기준) */
    slot(at) {
      const d = new Date(at);
      const h = (d.getUTCHours() + 9) % 24;
      if (h >= 6 && h < 10) return { key: 'am', label: '출근 시간대' };
      if (h >= 10 && h < 16) return { key: 'mid', label: '낮 시간대' };
      if (h >= 16 && h < 20) return { key: 'pm', label: '퇴근 시간대' };
      return { key: 'night', label: '밤 시간대' };
    },

    /** 이 일정의 이동 단계가 어디서 어디로 가는지 */
    legOf(s, label) {
      const kind = KIND(label);
      if (!kind) return null;
      const dep = s.departure || s.departure_info || {};
      const shopRaw = s.shop || s.shop_info || {};
      const shop = shopRaw && shopRaw.needed && (shopRaw.address || shopRaw.name) ? shopRaw : null;
      const venue = s.locationAddress || s.location || '';
      if (kind === 'pickup') return { from: dep, to: shop || venue };
      if (kind === 'return') return { from: venue, to: dep };
      return { from: shop || dep, to: venue };
    },

    /** 실제로 다닌 기록: [{ from, to, min, at }] — [출발] 누른 시각 → [완료] 누른 시각 */
    samples(schedules) {
      const out = [];
      (Array.isArray(schedules) ? schedules : []).forEach(s => {
        const tl = Array.isArray(s && (s.timeline || s.timeline_items)) ? (s.timeline || s.timeline_items) : [];
        tl.forEach(st => {
          if (!st || !st.movingAtIso || !st.doneAtIso) return;
          const leg = this.legOf(s, st.label);
          if (!leg) return;
          const min = Math.round((Date.parse(st.doneAtIso) - Date.parse(st.movingAtIso)) / 60000);
          if (!(min >= 5 && min <= 300)) return;      // 누르는 걸 잊은 기록은 뺌
          const from = placeKey(leg.from), to = placeKey(leg.to);
          if (!from || !to || from === to) return;
          out.push({ from, to, min, at: st.movingAtIso });
        });
      });
      return out;
    },

    /** 같은 길 실제 평균: { avg, n, slot, all } 또는 null (3번 미만) */
    travel(schedules, q) {
      const from = placeKey(q && q.from), to = placeKey(q && q.to);
      if (!from || !to) return null;
      const same = this.samples(schedules).filter(x => x.from === from && x.to === to);
      if (same.length < this.MIN_SAMPLES) return null;
      const avg = (a) => Math.round(a.reduce((t, x) => t + x.min, 0) / a.length);
      if (q.at) {
        const sl = this.slot(q.at);
        const inSlot = same.filter(x => this.slot(x.at).key === sl.key);
        if (inSlot.length >= this.MIN_SAMPLES) return { avg: avg(inSlot), n: inSlot.length, slot: sl.label, all: same.length };
      }
      return { avg: avg(same), n: same.length, slot: '', all: same.length };
    },
  };

  /* ── 문자 초안 ── */
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  const Drafts = {
    when(date, start) {
      const d = new Date(String(date) + 'T12:00:00');
      if (isNaN(d)) return String(start || '');
      return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEK[d.getDay()]})${start ? ' ' + start : ''}`;
    },
    hello(name) {
      const who = String(name || '').split(/[,·/]| 외 /)[0].replace(/\(.*\)/, '').trim();
      return who ? `${who.replace(/님$/, '')}님, 안녕하세요.` : '안녕하세요.';
    },
    me(p) {
      const art = String((p && p.artist) || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
      const mgr = String((p && p.manager) || '').trim();
      // 이름에 직함이 붙어 있으면(김태현 본부장) '매니저'를 또 붙이지 않음
      const who = !mgr ? '매니저' : /(매니저|팀장|실장|본부장|부장|차장|과장|대리|주임|이사|대표|사원|님)$/.test(mgr) ? mgr : mgr + ' 매니저';
      if (art && art !== '전체 아티스트' && !/전원/.test(art)) return `${art} ${who}입니다.`;
      return `${who}입니다.`;
    },
    place(s) { return String((s && s.location) || '현장').replace(/\s*\([^()]*\d[^()]*\)\s*$/, '').trim() || '현장'; },

    /** 늦을 때 — min: 몇 분 늦는지 */
    late(s, min, p) {
      return `${this.hello(s && s.contactName)} ${this.me(p)}\n교통 상황으로 ${this.place(s)} 도착이 약 ${min}분 늦어질 것 같습니다. 최대한 서둘러 가겠습니다. 죄송합니다.`;
    },
    depart(s, eta, p) {
      return `${this.hello(s && s.contactName)} ${this.me(p)}\n지금 ${this.place(s)} 쪽으로 출발했습니다.${eta ? ` ${eta}쯤 도착 예정입니다.` : ''}`;
    },
    arrive(s, p) {
      return `${this.hello(s && s.contactName)} ${this.me(p)}\n${this.place(s)}에 도착했습니다. 어디로 가면 될지 알려 주시면 바로 가겠습니다.`;
    },
    /** 본사가 시간을 바꿨을 때 — from/to: { date, start } */
    change(s, from, to, p) {
      const same = from.date === to.date;
      return `${this.hello(s && s.contactName)} ${this.me(p)}\n${this.when(from.date, from.start)} ${this.place(s)} 일정을 ${same ? to.start : this.when(to.date, to.start)} 시작으로 변경해 주실 수 있을까요? 번거롭게 해 드려 죄송합니다.`;
    },
    cancel(s, p) {
      return `${this.hello(s && s.contactName)} ${this.me(p)}\n${this.when(s.date, s.startTime)} ${this.place(s)} 일정이 부득이하게 취소되어 연락드립니다. 불편을 드려 정말 죄송합니다.`;
    },
    /** 문자 앱 열기 주소 (아이폰은 &body, 그 밖에는 ?body) */
    smsUrl(phone, body, ua) {
      const num = String(phone || '').replace(/[^\d+]/g, '');
      const ios = /iPhone|iPad|iPod|Macintosh/.test(String(ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '')));
      return `sms:${num}${ios ? '&' : '?'}body=${encodeURIComponent(body)}`;
    },
  };

  /* ── 반복 일정 날짜 ── */
  const Repeat = {
    KINDS: { weekly: '매주', weekdays: '평일(월~금)', biweekly: '격주', monthly: '매월' },
    MAX: 26,
    /** 첫 날짜 포함 count개 (매월은 그 날짜가 없는 달은 건너뜀: 31일 → 다음 31일 있는 달) */
    dates(date, kind, count) {
      const n = Math.max(1, Math.min(this.MAX, Number(count) || 1));
      const d0 = new Date(String(date) + 'T12:00:00');
      if (isNaN(d0) || !this.KINDS[kind]) return [String(date)];
      const out = [ymd(d0)];
      if (kind === 'monthly') {
        for (let k = 1; out.length < n && k < 60; k++) {
          const t = new Date(d0.getFullYear(), d0.getMonth() + k, d0.getDate(), 12);
          if (t.getDate() === d0.getDate()) out.push(ymd(t));
        }
        return out;
      }
      const d = new Date(d0);
      while (out.length < n) {
        if (kind === 'weekly') d.setDate(d.getDate() + 7);
        else if (kind === 'biweekly') d.setDate(d.getDate() + 14);
        else { do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6); }
        out.push(ymd(d));
      }
      return out;
    },
    /** 이 일정 뒤에 오는 같은 반복 일정들 (날짜순) */
    later(schedules, s) {
      const sid = s && s.series && s.series.id;
      if (!sid) return [];
      return (schedules || []).filter(x => x && x.id !== s.id && x.series && x.series.id === sid && String(x.date) > String(s.date) && !['취소', 'cancelled'].includes(x.status))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    },
  };

  const api = { Learn, Drafts, Repeat };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
