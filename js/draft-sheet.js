/* =========================================
   현장 담당자 문자 초안 창 (매니저 앱·본사 웹 같이 씀)
   - 상황 칩(출발했어요 · N분 늦어요 · 도착했어요 / 시간 변경 · 취소)을 고르면 문장이 바뀜
   - 고친 뒤 [복사] 또는 [문자 보내기](휴대폰 문자 앱이 열림, 보내기는 사람이 직접)
   - 문장은 js/learn.js 의 Drafts 가 만듦
   ========================================= */
(function () {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = `
  .ds-back{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:100000;display:flex;align-items:flex-end;justify-content:center}
  @media(min-width:700px){.ds-back{align-items:center}}
  .ds{background:#fff;width:100%;max-width:480px;border-radius:18px 18px 0 0;padding:18px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.15);font-family:inherit}
  @media(min-width:700px){.ds{border-radius:16px}}
  .ds h3{margin:0 0 4px;font-size:17px;font-weight:800;color:#14161A}
  .ds p.ds-to{margin:0 0 12px;font-size:13.5px;color:#5B616E}
  .ds-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
  .ds-chips button{border:1px solid #D5D9F7;background:#fff;color:#2B338F;border-radius:999px;padding:7px 12px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit}
  .ds-chips button.on{background:#3B45C4;border-color:#3B45C4;color:#fff}
  .ds textarea{width:100%;box-sizing:border-box;min-height:150px;border:1px solid #E2E8F0;border-radius:12px;padding:12px;font-size:15px;line-height:1.55;font-family:inherit;resize:vertical;color:#14161A}
  .ds-note{font-size:12.5px;color:#5B616E;margin:6px 2px 12px}
  .ds-b{display:flex;gap:8px}
  .ds-b button,.ds-b a{flex:1;min-height:46px;border-radius:12px;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer;font-family:inherit}
  .ds-x{background:#F1F2F4;border:0;color:#334155}
  .ds-c{background:#fff;border:1.5px solid #3B45C4;color:#3B45C4}
  .ds-s{background:#3B45C4;border:0;color:#fff}`;

  const DraftSheet = {
    /** opts: { title, to, phone, options:[{label, text}], pick } */
    open(opts) {
      if (!document.getElementById('ds-style')) { const st = document.createElement('style'); st.id = 'ds-style'; st.textContent = CSS; document.head.appendChild(st); }
      this.close();
      const o = opts || {};
      const list = (o.options || []).filter(x => x && x.text);
      if (!list.length) return;
      let cur = Math.min(Math.max(0, o.pick || 0), list.length - 1);
      const back = document.createElement('div');
      back.className = 'ds-back'; back.id = 'ds-back';
      back.innerHTML = `<div class="ds" role="dialog" aria-label="문자 초안">
        <h3>${esc(o.title || '현장 담당자에게 보낼 문자')}</h3>
        ${o.to ? `<p class="ds-to">받는 분: ${esc(o.to)}</p>` : ''}
        ${list.length > 1 ? `<div class="ds-chips">${list.map((x, i) => `<button type="button" data-i="${i}" class="${i === cur ? 'on' : ''}">${esc(x.label)}</button>`).join('')}</div>` : ''}
        <textarea id="ds-text" aria-label="보낼 문장">${esc(list[cur].text)}</textarea>
        <div class="ds-note">보내기 전에 고쳐도 돼요. ${o.phone ? '[문자 보내기]를 누르면 문자 앱이 열려요.' : '연락처가 없어서 복사해서 보내 주세요.'}</div>
        <div class="ds-b">
          <button type="button" class="ds-x" data-act="x">닫기</button>
          <button type="button" class="ds-c" data-act="c">복사</button>
          ${o.phone ? `<a class="ds-s" data-act="s" href="#">문자 보내기</a>` : ''}
        </div></div>`;
      document.body.appendChild(back);
      const ta = back.querySelector('#ds-text');
      back.addEventListener('click', async (e) => {
        if (e.target === back) return this.close();
        const chip = e.target.closest('.ds-chips button');
        if (chip) {
          cur = Number(chip.dataset.i);
          back.querySelectorAll('.ds-chips button').forEach(b => b.classList.toggle('on', b === chip));
          ta.value = list[cur].text;
          return;
        }
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'x') this.close();
        if (act === 'c') {
          try { await navigator.clipboard.writeText(ta.value); } catch (err) { ta.select(); try { document.execCommand('copy'); } catch (e2) { } }
          this._toast('문장을 복사했어요.');
        }
        if (act === 's') {
          e.preventDefault();
          location.href = Drafts.smsUrl(o.phone, ta.value);
          this.close();
        }
      });
    },
    close() { document.getElementById('ds-back')?.remove(); },
    _toast(m) { if (window.U && U.toast) U.toast(m); else if (window.Admin && Admin.toast) Admin.toast(m); else { const t = document.createElement('div'); t.textContent = m; t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#14161A;color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;z-index:100001'; document.body.appendChild(t); setTimeout(() => t.remove(), 1800); } },

    _profile(s) {
      let mgr = '';
      try { mgr = s.managerName || localStorage.getItem('bp_user_name') || ''; } catch (e) { }
      return { artist: s.isSecret ? '' : (s.artistName || ''), manager: mgr };
    },
    _sch(id) { try { return (window.hqStore?.getSchedules?.() || []).find(x => x.id === id) || null; } catch (e) { return null; } },

    /** 매니저 앱: 지금 할 일 카드 · 지연 예상 창에서 */
    forSchedule(id, lateMin) {
      const s = this._sch(id);
      if (!s) return;
      const p = this._profile(s);
      const late = Number(lateMin) || 0;
      const opts = [{ label: '출발했어요', text: Drafts.depart(s, '', p) }];
      [10, 20, 30].forEach(m => opts.push({ label: `${m}분 늦어요`, text: Drafts.late(s, m, p) }));
      if (late && ![10, 20, 30].includes(late)) opts.splice(1, 0, { label: `${late}분 늦어요`, text: Drafts.late(s, late, p) });
      opts.push({ label: '도착했어요', text: Drafts.arrive(s, p) });
      // 늦는 분(late)과 같은 칩을 고름 (20·30분이면 '10분 늦어요'가 골라지던 문제)
      const pick = late ? Math.max(0, opts.findIndex(o => o.label === `${late}분 늦어요`)) : 0;
      this.open({ to: `${s.contactName || '현장 담당자'}${s.contactPhone ? ' · ' + s.contactPhone : ''}`, phone: s.contactPhone, options: opts, pick });
    },

    /** 본사 웹: 시간을 바꾸거나 취소했을 때 (현장 담당자 연락처가 있는 일정만) */
    afterHqChange(prev, next, deleted) {
      try {
        const s = next || prev;
        if (!s || !prev || !(s.contactName || s.contactPhone)) return false;
        const p = this._profile(s);
        const cancel = deleted || (['취소', 'cancelled'].includes(s.status) && !['취소', 'cancelled'].includes(prev.status));
        const moved = !cancel && next && (prev.date !== next.date || String(prev.startTime).slice(0, 5) !== String(next.startTime).slice(0, 5));
        if (!cancel && !moved) return false;
        const text = cancel ? Drafts.cancel(prev, p) : Drafts.change(next, { date: prev.date, start: String(prev.startTime).slice(0, 5) }, { date: next.date, start: String(next.startTime).slice(0, 5) }, p);
        this.open({ title: cancel ? '일정 취소 — 현장 담당자에게 보낼 문자' : '시간 변경 — 현장 담당자에게 보낼 문자', to: `${s.contactName || '현장 담당자'}${s.contactPhone ? ' · ' + s.contactPhone : ''}`, phone: s.contactPhone, options: [{ label: cancel ? '취소 안내' : '변경 요청', text }] });
        return true;
      } catch (e) { return false; }
    },
  };
  window.DraftSheet = DraftSheet;
})();
