/* 관리자 화면 알림: 브라우저 기본 alert() 팝업 대신 화면 아래에 잠깐 떴다 사라지는 알림을 보여줍니다.
   (alert 는 화면을 멈추게 하지만 이 알림은 멈추지 않습니다) */
(function () {
  'use strict';
  if (window.__notifyInstalled) return; window.__notifyInstalled = true;
  const css = `
  .np-wrap{position:fixed;left:0;right:0;bottom:24px;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:100000;pointer-events:none;padding:0 12px}
  .np-toast{pointer-events:auto;max-width:min(520px,100%);background:#1f2937;color:#fff;border-radius:12px;padding:12px 16px;font:600 14px/1.5 system-ui,-apple-system,'Malgun Gothic',sans-serif;white-space:pre-wrap;box-shadow:0 8px 28px rgba(0,0,0,.28);border-left:5px solid #6366f1;opacity:0;transform:translateY(12px);transition:opacity .2s,transform .2s;cursor:pointer}
  .np-toast.show{opacity:1;transform:none}
  .np-toast.ok{border-left-color:#10b981}.np-toast.warn{border-left-color:#f59e0b}.np-toast.err{border-left-color:#ef4444}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  let wrap;
  function show(msg) {
    const text = String(msg ?? '').trim(); if (!text) return;
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'np-wrap'; wrap.setAttribute('role', 'status'); wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    const kind = /^(✅|✨|🎉)/.test(text) ? 'ok' : /^(⚠️|🔒)/.test(text) ? 'warn' : /^❌|실패|오류|못했|없습니다|해주세요|입력/.test(text) ? 'err' : '';
    const t = document.createElement('div'); t.className = 'np-toast ' + kind; t.textContent = text;
    wrap.appendChild(t); requestAnimationFrame(() => t.classList.add('show'));
    const close = () => { t.classList.remove('show'); setTimeout(() => t.remove(), 220); };
    t.addEventListener('click', close);
    setTimeout(close, Math.min(9000, 3200 + text.length * 60));
    while (wrap.children.length > 4) wrap.firstChild.remove();
  }
  window.notify = show;
  window.alert = show;
})();
