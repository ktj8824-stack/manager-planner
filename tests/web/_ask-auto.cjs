// 시험용: 앱 안 확인 창(Ask.confirm / Ask.alert)이 뜨면 자동으로 [확인]을 누름.
// 예전에는 휴대폰 기본 창(confirm)이라 p.on('dialog', d => d.accept()) 로 처리했음.
// 물어본 첫 줄은 sessionStorage '__asks' 에 쌓임 → asked(page) 로 읽기.
async function autoAsk(page) {
  await page.addInitScript(() => {
    const tick = () => {
      const back = document.querySelector('#ask-back');
      if (!back || back.dataset.auto || back.querySelector('#ask-in')) return;   // 글 입력 창은 시험이 직접 채움
      back.dataset.auto = '1';
      try { const a = JSON.parse(sessionStorage.getItem('__asks') || '[]'); a.push((back.querySelector('h3') || {}).textContent || ''); sessionStorage.setItem('__asks', JSON.stringify(a)); } catch (e) { }
      const ok = back.querySelector('.ask-ok'); if (ok) ok.click();
    };
    const start = () => new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });
    if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start);
  });
}
const asked = (page) => page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem('__asks') || '[]'); } catch (e) { return []; } });
module.exports = { autoAsk, asked };
