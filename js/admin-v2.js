/* 본사 웹 · 시안 반영: 계정 칩(동그란 첫 글자 + '이름 대표'), 왼쪽 위 회사 첫 글자 */
(function () {
  const sync = () => {
    const nm = document.getElementById('header-user-name');
    const av = document.getElementById('header-user-av');
    if (nm) {
      const t = nm.textContent.trim();
      const short = t.replace(/님$/, '');
      if (short !== t) nm.textContent = short;
      if (av) av.textContent = (short.replace(/^\s+/, '')[0] || '대');
    }
    const brand = document.getElementById('hq-brand-title');
    const ini = document.getElementById('hq-brand-initial');
    if (brand && ini) {
      const b = brand.textContent.replace(/\s*SCHEDULER$/i, '').trim();
      ini.textContent = (b && b !== 'SCHEDULER' ? b[0] : 'R').toUpperCase();
    }
  };
  const start = () => {
    sync();
    ['header-user-name', 'hq-brand-title'].forEach(id => {
      const el = document.getElementById(id);
      if (el) new MutationObserver(sync).observe(el, { childList: true, characterData: true, subtree: true });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
