/*
 * splash.js — RoadPlanner 시작 화면 (앱·관리자 공용)
 *  - 밤길 위로 차가 헤드라이트를 켜고 길을 따라 달려 목적지 핀에 도착하면 RoadPlanner 로고가 나타납니다. 약 2.6초.
 *  - 한 번 열면 같은 창(세션)에서는 다시 나오지 않습니다. 화면을 누르면 바로 건너뜁니다.
 *  - '동작 줄이기' 설정이 켜진 기기에서는 애니메이션 없이 짧게 보여 줍니다.
 *  - 화면 아래쪽의 앱 로딩을 막지 않습니다 (위에 덮었다가 사라짐).
 *  - 로고 글꼴: Sora Bold (SIL Open Font License), "RoadPlanner" 글자만 잘라 넣음.
 */
(function () {
  'use strict';
  try {
    if (/[?&#]go=next\b|#next$/.test(location.href)) return; // 차 연결 자동 길안내는 바로
    if (sessionStorage.getItem('rp_splash_shown')) return;
    sessionStorage.setItem('rp_splash_shown', '1');
  } catch (e) { /* 저장소를 못 쓰면 매번 보여 줌 */ }

  var isAdmin = /admin|manager-planner-web/.test(location.pathname) || !!document.querySelector('meta[name="push-sw"]');
  var tagline = isAdmin ? '본사 웹' : '매니저의 모든 길을, 한 화면에';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FONT = 'data:font/woff;base64,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';

  var css = [
    "@font-face{font-family:'RPSora';src:url(" + FONT + ") format('woff');font-weight:700;font-display:block}",
    '#rp-splash{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;flex-direction:column;overflow:hidden;',
    'background:radial-gradient(120% 95% at 50% 10%,#3f37c9 0%,#2a2580 42%,#14123d 100%);color:#fff;',
    "font-family:-apple-system,BlinkMacSystemFont,'Pretendard','Pretendard','Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif;",
    'transition:opacity .45s ease, transform .45s ease;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
    '#rp-splash.out{opacity:0;transform:scale(1.04);pointer-events:none;}',
    '#rp-splash svg{width:min(88vw,440px);height:auto;overflow:visible;}',
    "#rp-splash .rp-word{margin-top:18px;font-family:'RPSora',-apple-system,system-ui,sans-serif;font-weight:700;font-size:clamp(40px,11vw,60px);letter-spacing:-.045em;line-height:1;}",
    '#rp-splash .rp-word span{display:inline-block;opacity:0;transform:translateY(24px);transition:opacity .35s ease,transform .45s cubic-bezier(.2,.8,.2,1);}',
    '#rp-splash .rp-word span.on{opacity:1;transform:none;}',
    '#rp-splash .rp-word .p{color:#B4BBF0;}',
    '#rp-splash .rp-tag{margin-top:14px;font-size:15px;font-weight:600;color:rgba(255,255,255,.8);opacity:0;transform:translateY(10px);transition:opacity .4s ease,transform .4s ease;}',
    '#rp-splash .rp-tag.on{opacity:1;transform:none;}',
    '#rp-pin{transform-origin:330px 70px;transform:scale(0);transition:transform .4s cubic-bezier(.34,1.56,.64,1);}',
    '#rp-pin.on{transform:scale(1);}'
  ].join('');

  // 길: 왼쪽 아래에서 S자로 오른쪽 위 목적지까지 (viewBox 360x200)
  var ROAD = 'M -20 160 C 60 160, 80 95, 150 95 S 240 140, 280 110 S 320 70, 330 70';
  var CAR = '<g id="rp-car">' +
      '<path d="M8 -3 L 70 -26 L 70 26 L 8 3 Z" fill="url(#rp-beam)"/>' +
      '<rect x="-12" y="-7" width="24" height="14" rx="4.5" fill="#E3E6FA"/>' +
      '<rect x="-10.5" y="-5.8" width="21" height="11.6" rx="3.4" fill="#3B45C4"/>' +
      '<rect x="2.5" y="-4.6" width="5.5" height="9.2" rx="1.8" fill="#1e1b4b"/>' +
      '<rect x="-5" y="-5.2" width="6" height="10.4" rx="1.5" fill="#4C57D6"/>' +
      '<circle cx="11.5" cy="-4" r="1.3" fill="#fffbe6"/><circle cx="11.5" cy="4" r="1.3" fill="#fffbe6"/>' +
      '<rect x="-13" y="-5.5" width="1.6" height="3" rx=".6" fill="#ef4444"/><rect x="-13" y="2.5" width="1.6" height="3" rx=".6" fill="#ef4444"/>' +
    '</g>';
  var svg =
    '<svg viewBox="0 0 360 200" aria-hidden="true">' +
      '<defs><radialGradient id="rp-beam" cx="0" cy=".5" r="1"><stop offset="0" stop-color="#fff7cc" stop-opacity=".7"/><stop offset="1" stop-color="#fff7cc" stop-opacity="0"/></radialGradient></defs>' +
      '<path d="' + ROAD + '" fill="none" stroke="#0b0a26" stroke-width="26" stroke-linecap="round"/>' +
      '<path id="rp-center" d="' + ROAD + '" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.6" stroke-dasharray="7 8"/>' +
      '<path id="rp-trail" d="' + ROAD + '" fill="none" stroke="#B4BBF0" stroke-width="3.5" stroke-linecap="round"/>' +
      '<g id="rp-pin"><ellipse cx="330" cy="72" rx="9" ry="3" fill="rgba(0,0,0,.35)"/><path d="M330 40c-9 0-15 6-15 15 0 11 15 15 15 15s15-4 15-15c0-9-6-15-15-15z" fill="#22c55e"/><circle cx="330" cy="54.5" r="5.2" fill="#fff"/></g>' +
      CAR +
    '</svg>';

  function mount() {
    if (document.getElementById('rp-splash')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var el = document.createElement('div');
    el.id = 'rp-splash';
    el.setAttribute('role', 'presentation');
    var word = 'RoadPlanner'.split('').map(function (c, i) { return '<span' + (i >= 4 ? ' class="p"' : '') + '>' + c + '</span>'; }).join('');
    el.innerHTML = svg + '<div class="rp-word" aria-label="RoadPlanner">' + word + '</div><div class="rp-tag">' + tagline + '</div>';
    document.body.appendChild(el);

    var road = el.querySelector('#rp-trail'), car = el.querySelector('#rp-car'), center = el.querySelector('#rp-center');
    var LEN = 0; try { LEN = road.getTotalLength(); } catch (e) { }
    road.style.strokeDasharray = LEN; road.style.strokeDashoffset = LEN;
    var END = 0.93;   // 핀 바로 앞에서 멈춤
    function place(k) {
      if (!LEN) return;
      var d = k * END * LEN, p1 = road.getPointAtLength(d), p2 = road.getPointAtLength(Math.min(LEN, d + 2));
      var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      car.setAttribute('transform', 'translate(' + p1.x + ' ' + p1.y + ') rotate(' + ang + ')');
      road.style.strokeDashoffset = LEN - d;
    }
    function reveal() {
      el.querySelector('#rp-pin').classList.add('on');
      el.querySelectorAll('.rp-word span').forEach(function (s, i) { setTimeout(function () { s.classList.add('on'); }, reduce ? 0 : 120 + i * 40); });
      setTimeout(function () { el.querySelector('.rp-tag').classList.add('on'); }, reduce ? 0 : 560);
    }

    var done = false;
    function close() {
      if (done) return; done = true;
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); if (st.parentNode) st.parentNode.removeChild(st); }, 480);
    }
    el.addEventListener('click', close);

    if (reduce || !LEN) { place(1); reveal(); setTimeout(close, 900); return; }
    var DRIVE = 1300, t0 = null, revealed = false;
    function ease(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function frame(ts) {
      if (done) return;
      if (t0 === null) t0 = ts;
      var e = ts - t0, k = Math.min(1, e / DRIVE);
      place(ease(k));
      center.style.strokeDashoffset = -e * 0.03;
      if (k >= 1 && !revealed) { revealed = true; reveal(); }
      if (e < 3000) requestAnimationFrame(frame);
    }
    place(0);
    requestAnimationFrame(frame);
    setTimeout(close, 2700);
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
