/* 본사가 스케줄을 만들거나 바꾸거나 지우면, 담당 매니저의 로디톡 1:1방으로 자동 알림(+푸시)을 보냅니다. */
(function () {
  'use strict';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  // 바뀌면 알릴 항목 (이름은 알림 문구에 그대로 쓰임)
  const FIELDS = [
    ['date', '날짜'], ['startTime', '시작'], ['endTime', '종료'], ['location', '장소'],
    ['vehicleName', '차량'], ['title', '제목'], ['status', '상태'], ['contactName', '현장 담당자']
  ];

  function dateLabel(s) {
    if (!s.date) return '';
    const d = new Date(s.date + 'T00:00:00');
    if (isNaN(d)) return s.date;
    return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`;
  }
  function when(s) { return [dateLabel(s), s.startTime ? s.startTime + (s.endTime ? '~' + s.endTime : '') : ''].filter(Boolean).join(' '); }
  function head(s) { return `${s.title || '일정'}${s.artistName ? ' (' + s.artistName + ')' : ''}`; }
  function startsWithin(s, hours) {
    if (!s.date || !s.startTime) return false;
    const t = new Date(`${s.date}T${s.startTime}:00`).getTime();
    const diff = t - Date.now();
    return !isNaN(t) && diff > -3600e3 && diff <= hours * 3600e3;
  }
  function norm(v) { return String(v ?? '').trim(); }

  // 이전/이후 비교 → ['시작: 14:00 → 15:00', ...]
  function diff(prev, next) {
    const out = [];
    for (const [k, label] of FIELDS) {
      if (norm(prev[k]) !== norm(next[k])) out.push(`• ${label}: ${norm(prev[k]) || '없음'} → ${norm(next[k]) || '없음'}`);
    }
    return out;
  }
  function isMember(id) {
    if (!UUID.test(id || '')) return false;
    try { const m = (window.hqStore?.getManagers?.() || []).find(x => x.id === id); return !m || !['ceo', 'hq_admin'].includes(m.role); } catch (e) { return true; }
  }
  function myId() { return window.SupabaseClient?.currentUser?.id || ''; }

  // 결과: { ok:true } 또는 { ok:false, reason:'사유' }  (화면에 안내하기 위해 사유를 돌려준다)
  async function send(managerId, title, body, urgent) {
    if (!managerId) return { ok: false, reason: '담당 매니저가 지정되지 않았습니다.' };
    if (!window.Chat || !window.Chat.available()) return { ok: false, reason: '서버에 연결되어 있지 않습니다. 새로고침 후 다시 시도해 주세요.' };
    if (managerId === myId()) return { ok: false, reason: '담당자가 로그인한 본인입니다.' };
    if (!UUID.test(managerId)) return { ok: false, reason: '선택한 담당자는 서버 계정이 없어 알림을 보낼 수 없습니다. (서버에서 만든 매니저를 선택하세요)' };
    if (!isMember(managerId)) return { ok: false, reason: '본사 계정에는 알림을 보내지 않습니다.' };
    try { await window.Chat.sendNotice({ targetId: managerId, title, content: body, isUrgent: !!urgent }); return { ok: true }; }
    catch (e) { console.warn('일정 알림 전송 실패', e); return { ok: false, reason: e.message || '전송 오류' }; }
  }
  const note = (r) => r ? (r.ok ? '🔔 담당 매니저에게 알림을 보냈습니다.' : '⚠️ 담당 매니저 알림을 보내지 못했습니다: ' + r.reason) : null;

  // 비공개 일정은 알림 미리보기에 내용을 싣지 않는다
  function secretMsg(s, what) { return [`🔒 비공개 일정이 ${what}되었습니다.`, '앱에서 일정을 확인해 주세요.']; }

  const ScheduleNotify = {
    diff, when,
    // 저장 직후: prev(이전 값, 새 일정이면 null), next(저장한 값)
    async afterSave(prev, next) {
      try {
        const urgent = startsWithin(next, 3);
        const newMgr = next.managerId, oldMgr = prev?.managerId;
        const secret = !!next.isSecret;
        if (!prev || (oldMgr !== newMgr)) {      // 새 일정이거나 담당이 바뀜 → 새 담당에게 "새 일정"
          const lines = secret ? secretMsg(next, '배정') : [when(next) + (next.location ? ' · ' + next.location : ''), next.vehicleName ? '차량: ' + next.vehicleName : '', next.notes ? '메모: ' + String(next.notes).slice(0, 80) : ''].filter(Boolean);
          const r = await send(newMgr, '📅 새 일정 배정 · ' + (secret ? '비공개' : head(next)), lines.join('\n'), urgent);
          if (prev && oldMgr && oldMgr !== newMgr) {  // 이전 담당에게 "해제"
            await send(oldMgr, '📅 일정 담당 해제 · ' + (prev.isSecret ? '비공개' : head(prev)), prev.isSecret ? '비공개 일정 담당에서 제외되었습니다.' : `${when(prev)} 일정은 다른 매니저가 담당합니다.`, false);
          }
          return note(r);
        }
        const changes = diff(prev, next);
        if (!changes.length) return null;
        const isCx = v => ['취소', 'cancelled'].includes(norm(v));
        const canceled = isCx(next.status) && !isCx(prev.status);
        const lines = secret ? secretMsg(next, canceled ? '취소' : '변경') : [when(next) + (next.location ? ' · ' + next.location : ''), ...changes];
        return note(await send(newMgr, (canceled ? '❌ 일정 취소 · ' : '📅 일정 변경 · ') + (secret ? '비공개' : head(next)), lines.join('\n'), urgent || canceled && startsWithin(next, 24)));
      } catch (e) { console.warn('일정 알림 오류', e); return '⚠️ 담당 매니저 알림을 보내지 못했습니다: ' + (e.message || '오류'); }
    },
    // 삭제 직후
    async afterDelete(sch) {
      try {
        if (!sch) return null;
        const body = sch.isSecret ? '비공개 일정이 삭제되었습니다.' : `${when(sch)}${sch.location ? ' · ' + sch.location : ''}\n이 일정은 삭제되었습니다.`;
        return note(await send(sch.managerId, '❌ 일정 삭제 · ' + (sch.isSecret ? '비공개' : head(sch)), body, startsWithin(sch, 3)));
      } catch (e) { console.warn('일정 알림 오류', e); return '⚠️ 담당 매니저 알림을 보내지 못했습니다: ' + (e.message || '오류'); }
    }
  };
  window.ScheduleNotify = ScheduleNotify;
})();
