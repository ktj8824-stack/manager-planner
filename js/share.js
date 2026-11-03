/*
 * share.js — 일정 공유 링크 (앱 설치 없이 외부 협력자가 일정 하나를 보는 링크)
 *  - 서버 함수 create_schedule_share / revoke_schedule_shares 사용 (Supabase)
 *  - 링크: https://ktj8824-stack.github.io/manager-planner-app/share.html?t=토큰
 *  - 일정 다음 날 자정 자동 만료, 비공개 일정은 공유 불가
 */
(function () {
  'use strict';
  const BASE = 'https://ktj8824-stack.github.io/manager-planner-app/share.html?t=';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m) => { try { if (window.U && U.toast) return U.toast(m); } catch (e) { } try { alert(m); } catch (e) { } };

  function findSchedule(id) {
    try { return (window.hqStore?.getSchedules?.() || []).find(s => s.id === id || s.remoteId === id) || null; } catch (e) { return null; }
  }
  function remoteId(s) {
    if (!s) return null;
    return s.remoteId || (UUID.test(s.id || '') ? s.id : null);
  }
  function rpcClient() { return window.SupabaseClient && window.SupabaseClient.isConfigured ? window.SupabaseClient.client : null; }

  function close() { const el = document.getElementById('rp-share'); if (el) el.remove(); }

  function sheet(inner) {
    close();
    const el = document.createElement('div');
    el.id = 'rp-share';
    el.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center;font-family:inherit;';
    el.innerHTML = `<div style="width:100%;max-width:440px;background:#fff;color:#111827;border-radius:20px 20px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.2);">${inner}</div>`;
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    document.body.appendChild(el);
    return el;
  }

  const ScheduleShare = {
    async open(scheduleId) {
      const s = findSchedule(scheduleId);
      if (!s) return toast('일정을 찾을 수 없습니다.');
      if (s.isSecret) return toast('비공개 일정은 공유할 수 없습니다.');
      const rid = remoteId(s);
      if (!rid) return toast('서버에 저장된 일정만 공유할 수 있어요. 잠시 후 다시 시도해 주세요.');
      const c = rpcClient();
      if (!c) return toast('서버에 연결되어 있어야 공유할 수 있어요.');

      sheet('<div style="padding:24px 0;text-align:center;color:#6b7280;font-size:15px;">공유 링크를 만드는 중…</div>');
      const { data, error } = await c.rpc('create_schedule_share', { p_schedule: rid });
      if (error || !data || !data.token) { close(); return toast('링크를 만들지 못했어요: ' + ((error && error.message) || '알 수 없는 오류')); }
      const url = BASE + data.token;
      const exp = new Date(data.expires_at);
      const expTxt = isNaN(exp) ? '' : `${exp.getMonth() + 1}월 ${exp.getDate()}일 0시`;
      const when = [s.date ? s.date.slice(5).replace('-', '/') : '', s.startTime || ''].filter(Boolean).join(' ');
      const msg = `[로드플래너 일정 공유]\n${s.title || '일정'}${s.artistName ? ' · ' + s.artistName : ''}\n${when}${s.location ? ' · ' + s.location : ''}\n${url}`;

      const el = sheet(`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-size:18px;font-weight:800;">일정 공유 링크</div>
          <button type="button" data-a="close" style="border:0;background:#f1f5f9;border-radius:10px;padding:6px 10px;font-size:14px;font-weight:700;color:#475569;cursor:pointer;">닫기</button>
        </div>
        <div style="font-size:13.5px;color:#6b7280;line-height:1.5;margin-bottom:12px;">메이크업·스타일리스트·기사님께 보내 주세요. 앱 설치 없이 시간·장소·길안내·담당 매니저 연락처만 보입니다.<br>${expTxt ? `<b style="color:#4f46e5">${esc(expTxt)}</b>까지 열리고, 그 뒤 자동으로 닫힙니다.` : ''}</div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:13px;color:#334155;word-break:break-all;margin-bottom:12px;">${esc(url)}</div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <button type="button" data-a="send" style="flex:1;height:46px;border:0;border-radius:12px;background:#4f46e5;color:#fff;font-size:15px;font-weight:800;cursor:pointer;">보내기 (카톡 등)</button>
          <button type="button" data-a="copy" style="flex:1;height:46px;border:1px solid #c7d2fe;border-radius:12px;background:#eef2ff;color:#4338ca;font-size:15px;font-weight:800;cursor:pointer;">링크 복사</button>
        </div>
        <button type="button" data-a="revoke" style="width:100%;height:40px;border:0;border-radius:10px;background:transparent;color:#dc2626;font-size:13.5px;font-weight:700;cursor:pointer;">이 일정의 공유 링크 끊기</button>`);

      el.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (!a) return;
        if (a === 'close') return close();
        if (a === 'copy') {
          try { await navigator.clipboard.writeText(msg); toast('링크와 일정 요약을 복사했어요. 카톡에 붙여 넣으세요.'); }
          catch (err) { prompt('아래 내용을 길게 눌러 복사하세요', msg); }
          return;
        }
        if (a === 'send') {
          if (navigator.share) { try { await navigator.share({ title: '로드플래너 일정 공유', text: msg.replace(url, '').trim(), url }); } catch (err) { } return; }
          try { await navigator.clipboard.writeText(msg); toast('이 기기는 바로 보내기를 지원하지 않아 복사했어요. 카톡에 붙여 넣으세요.'); } catch (err) { prompt('아래 내용을 복사하세요', msg); }
          return;
        }
        if (a === 'revoke') {
          if (!confirm('이 일정의 공유 링크를 끊을까요? 이미 보낸 링크도 더 이상 열리지 않습니다.')) return;
          const r = await c.rpc('revoke_schedule_shares', { p_schedule: rid });
          if (r.error) return toast('링크를 끊지 못했어요: ' + r.error.message);
          close(); toast('공유 링크를 끊었습니다.');
        }
      });
    }
  };
  window.ScheduleShare = ScheduleShare;
})();
