/*
 * splash.js — 로드플래너 시작 화면 (앱·관리자 공용)
 *  - 길(로드)이 그려지고 차량 점이 달려가 목적지 핀에 도착하면 로고가 나타납니다. 약 2.2초.
 *  - 한 번 열면 같은 창(세션)에서는 다시 나오지 않습니다. 화면을 누르면 바로 건너뜁니다.
 *  - '동작 줄이기' 설정이 켜진 기기에서는 애니메이션 없이 짧게 보여 줍니다.
 *  - 화면 아래쪽의 앱 로딩을 막지 않습니다 (위에 덮었다가 사라짐).
 */
(function () {
  'use strict';
  try {
    if (sessionStorage.getItem('rp_splash_shown')) return;
    sessionStorage.setItem('rp_splash_shown', '1');
  } catch (e) { /* 저장소를 못 쓰면 매번 보여 줌 */ }

  var isAdmin = /admin|manager-planner-web/.test(location.pathname) || !!document.querySelector('meta[name="push-sw"]');
  var tagline = isAdmin ? '본사 관제 포털' : '매니저의 모든 길을 한 화면에';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = [
    '#rp-splash{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;flex-direction:column;',
    'background:radial-gradient(120% 90% at 50% 20%,#4338ca 0%,#312e81 45%,#1e1b4b 100%);color:#fff;',
    "font-family:-apple-system,BlinkMacSystemFont,'Pretendard Variable','Pretendard','Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif;",
    'transition:opacity .45s ease, transform .45s ease;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
    '#rp-splash.out{opacity:0;transform:scale(1.03);pointer-events:none;}',
    '#rp-splash svg{width:min(62vw,260px);height:auto;overflow:visible;}',
    '#rp-splash .rp-road{fill:none;stroke:rgba(255,255,255,.18);stroke-width:14;stroke-linecap:round;}',
    '#rp-splash .rp-line{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-dasharray:10 12;}',
    '#rp-splash .rp-draw{stroke-dasharray:var(--len);stroke-dashoffset:var(--len);animation:rpDraw 1.05s cubic-bezier(.65,0,.35,1) .1s forwards;}',
    '#rp-splash .rp-pin{transform-origin:220px 40px;transform:scale(0);animation:rpPop .35s cubic-bezier(.34,1.56,.64,1) 1.05s forwards;}',
    '#rp-splash .rp-start{opacity:0;animation:rpFade .25s ease .05s forwards;}',
    '#rp-splash .rp-word{margin-top:22px;font-size:30px;font-weight:800;letter-spacing:-.02em;opacity:0;transform:translateY(8px);animation:rpUp .45s ease 1.15s forwards;}',
    '#rp-splash .rp-word b{color:#a5b4fc;font-weight:800;}',
    '#rp-splash .rp-tag{margin-top:6px;font-size:14px;font-weight:500;color:rgba(255,255,255,.72);opacity:0;animation:rpFade .45s ease 1.35s forwards;}',
    '@keyframes rpDraw{to{stroke-dashoffset:0}}',
    '@keyframes rpPop{to{transform:scale(1)}}',
    '@keyframes rpFade{to{opacity:1}}',
    '@keyframes rpUp{to{opacity:1;transform:none}}',
    '#rp-splash.reduce *{animation-duration:.01s!important;animation-delay:0s!important;}'
  ].join('');

  // 길: 왼쪽 아래 출발점 → S자 → 오른쪽 위 목적지 핀
  var ROAD = 'M30 150 C 90 150, 80 95, 130 95 S 190 50, 220 52';
  var svg =
    '<svg viewBox="0 0 250 180" aria-hidden="true">' +
      '<path class="rp-road" d="' + ROAD + '"/>' +
      '<path class="rp-line rp-draw" id="rp-line" d="' + ROAD + '"/>' +
      '<circle class="rp-start" cx="30" cy="150" r="7" fill="#a5b4fc"/>' +
      '<circle r="8" fill="#fff" id="rp-car" style="filter:drop-shadow(0 0 6px rgba(165,180,252,.9))">' +
        (reduce ? '' : '<animateMotion dur="1.05s" begin="0.1s" fill="freeze" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".65 0 .35 1" path="' + ROAD + '"/>') +
      '</circle>' +
      '<g class="rp-pin"><path d="M220 8c-12 0-21 9-21 21 0 15 21 33 21 33s21-18 21-33c0-12-9-21-21-21z" fill="#22c55e"/><circle cx="220" cy="29" r="7" fill="#fff"/></g>' +
    '</svg>';

  function mount() {
    if (document.getElementById('rp-splash')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var el = document.createElement('div');
    el.id = 'rp-splash';
    el.setAttribute('role', 'presentation');
    if (reduce) el.className = 'reduce';
    el.innerHTML = svg + '<div class="rp-word">로드<b>플래너</b></div><div class="rp-tag">' + tagline + '</div>';
    document.body.appendChild(el);
    try {
      var line = el.querySelector('#rp-line');
      var len = Math.ceil(line.getTotalLength());
      line.style.setProperty('--len', len);
      line.style.strokeDasharray = len;
    } catch (e) { }
    if (reduce) { var car = el.querySelector('#rp-car'); car.setAttribute('cx', 220); car.setAttribute('cy', 52); }

    var done = false;
    function close() {
      if (done) return; done = true;
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); if (st.parentNode) st.parentNode.removeChild(st); }, 480);
    }
    el.addEventListener('click', close);
    setTimeout(close, reduce ? 700 : 2300);
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
