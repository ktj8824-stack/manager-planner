/* =========================================
   작은 입력 창 (매니저 앱·본사 웹 같이 씀)
   휴대폰 기본 입력창(prompt) 대신 앱 안에서 뜨는 창.
     const v = await Ask.text({ title, desc, value, placeholder, kind, multiline, okLabel, max });
       → 입력한 글(string) 또는 취소하면 null
       kind: 'tel' | 'number' | 'text'
     Ask.copy(title, text) → 복사가 막힌 기기에서 글을 보여 주고 [복사]
   ========================================= */
(function () {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = `
  .ask-back{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:100002;display:flex;align-items:flex-end;justify-content:center}
  @media(min-width:700px){.ask-back{align-items:center}}
  .ask{background:#fff;width:100%;max-width:440px;border-radius:18px 18px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.15);font-family:inherit;box-sizing:border-box;text-align:left}
  @media(min-width:700px){.ask{border-radius:16px}}
  .ask h3{margin:0 0 6px;font-size:17px;font-weight:700;color:#14161A;line-height:1.4;word-break:keep-all}
  .ask p{margin:0 0 12px;font-size:14px;color:#5B616E;line-height:1.55;word-break:keep-all;white-space:pre-line}
  .ask input,.ask textarea{width:100%;box-sizing:border-box;border:1px solid #D5D8DF;border-radius:12px;padding:12px;font-size:16px;line-height:1.5;font-family:inherit;color:#14161A;background:#fff}
  .ask input{height:50px}
  .ask textarea{min-height:120px;resize:vertical}
  .ask input:focus,.ask textarea:focus{outline:2px solid #3B45C4;outline-offset:1px;border-color:#3B45C4}
  .ask-err{min-height:18px;margin:6px 2px 0;font-size:13px;color:#B42318}
  .ask-b{display:flex;gap:8px;margin-top:8px}
  .ask-b button{flex:1;min-height:48px;border-radius:12px;font-size:15.5px;font-weight:700;cursor:pointer;font-family:inherit}
  .ask-x{background:#F1F2F4;border:0;color:#334155}
  .ask-ok{background:#3B45C4;border:0;color:#fff}
  .ask-ok.danger{background:#B42318}`;

  const Ask = {
    _style() { if (!document.getElementById('ask-style')) { const st = document.createElement('style'); st.id = 'ask-style'; st.textContent = CSS; document.head.appendChild(st); } },
    close() { document.getElementById('ask-back')?.remove(); },

    /** 글 한 줄(또는 여러 줄) 받기. validate(v) 가 글을 돌려주면 그 글을 빨갛게 보여 주고 닫지 않음 */
    text(o) {
      o = o || {};
      this._style(); this.close();
      return new Promise((resolve) => {
        const back = document.createElement('div');
        back.className = 'ask-back'; back.id = 'ask-back';
        const attrs = `id="ask-in" aria-label="${esc(o.title || '입력')}" placeholder="${esc(o.placeholder || '')}" maxlength="${Number(o.max) || 500}"`;
        back.innerHTML = `<div class="ask" role="dialog" aria-modal="true" aria-label="${esc(o.title || '입력')}">
          <h3>${esc(o.title || '')}</h3>
          ${o.desc ? `<p>${esc(o.desc)}</p>` : ''}
          ${o.multiline ? `<textarea ${attrs}${o.readonly ? ' readonly' : ''}>${esc(o.value || '')}</textarea>`
            : `<input ${attrs} type="${o.kind === 'tel' ? 'tel' : 'text'}" inputmode="${o.kind === 'tel' ? 'tel' : o.kind === 'number' ? 'numeric' : 'text'}" autocomplete="off" value="${esc(o.value || '')}">`}
          <div class="ask-err" id="ask-err" role="alert"></div>
          <div class="ask-b">
            <button type="button" class="ask-x" data-a="x">${esc(o.cancelLabel || '취소')}</button>
            <button type="button" class="ask-ok${o.danger ? ' danger' : ''}" data-a="ok">${esc(o.okLabel || '저장')}</button>
          </div></div>`;
        document.body.appendChild(back);
        const input = back.querySelector('#ask-in');
        const done = (v) => { back.remove(); resolve(v); };
        const ok = async () => {
          const v = input.value;
          if (o.onOk) { try { await o.onOk(v, back); } catch (e) { } return; }
          const bad = typeof o.validate === 'function' ? o.validate(v) : '';
          if (bad) { back.querySelector('#ask-err').textContent = bad; input.focus(); return; }
          done(v);
        };
        back.addEventListener('click', (e) => {
          if (e.target === back) return done(null);
          const a = e.target.closest('[data-a]')?.dataset.a;
          if (a === 'x') done(null);
          if (a === 'ok') ok();
        });
        back.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') { e.stopPropagation(); done(null); }
          if (e.key === 'Enter' && !e.isComposing && !o.multiline) { e.preventDefault(); ok(); }
        });
        setTimeout(() => { try { input.focus(); if (o.readonly || o.select) input.select(); } catch (e) { } }, 60);
      });
    },

    /** 자동 복사가 막힌 기기: 글을 보여 주고 [복사] */
    copy(title, text) {
      return this.text({
        title: title || '아래 내용을 복사해 주세요', value: text, multiline: true, readonly: true, okLabel: '복사', cancelLabel: '닫기',
        onOk: async (v, back) => {
          const ta = back.querySelector('#ask-in');
          let okay = false;
          try { await navigator.clipboard.writeText(v); okay = true; } catch (e) { try { ta.select(); okay = document.execCommand('copy'); } catch (e2) { } }
          back.querySelector('#ask-err').textContent = okay ? '복사했어요.' : '글을 길게 눌러 복사해 주세요.';
          back.querySelector('#ask-err').style.color = okay ? '#1F7A4C' : '#B42318';
        },
      });
    },
  };
  window.Ask = Ask;
})();
