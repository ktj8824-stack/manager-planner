/* =========================================
   RoadPlanner — 광고 (개인 매니저 무료만)
   - 회사 소속 매니저·대표, 유료 개인 매니저: 광고 없음
   - 무료 개인 매니저: ① 아래 메뉴 바로 위에 늘 떠 있는 띠 광고
                      ② 일정 등록·아티스트 등록·차량 저장·로드비서 답변 뒤 가끔 전면 광고 (3초 뒤 닫기)
   - 전면 광고는 너무 자주 안 뜨게: 3분에 한 번, 하루 최대 8번
   - 카카오 애드핏 광고 번호(DAN-…)를 넣으면 실제 광고, 비어 있으면 '광고 없이 쓰기' 안내(자체 광고)
   ========================================= */
const Ads = {
  // 카카오 애드핏에서 발급받은 광고 단위 번호 (사이트 등록 후 교체)
  UNIT_BANNER: '',   // 320×50 띠 광고
  UNIT_BOX: '',      // 300×250 전면 광고
  GAP_MS: 3 * 60 * 1000,
  DAY_MAX: 8,
  BANNER_H: 58,

  enabled() {
    try {
      if (typeof Plan === 'undefined' || !Plan.isIndie() || Plan.isPaid()) return false;
      if (State.screen === 'login' || State.screen === 'onboarding' || State.screen === 'upgrade') return false;
      return true;
    } catch (e) { return false; }
  },

  _adfit(unit, w, h) {
    return `<ins class="kakao_ad_area" style="display:none;" data-ad-unit="${esc(unit)}" data-ad-width="${w}" data-ad-height="${h}"></ins>`;
  },
  _loadAdfit() {
    if (this._scriptOn) { try { window.adfit && window.adfit.render && document.querySelectorAll('.kakao_ad_area').forEach(el => window.adfit.render(el)); } catch (e) { } return; }
    this._scriptOn = true;
    const s = document.createElement('script');
    s.async = true; s.src = 'https://t1.daumcdn.net/kas/static/ba.min.js';
    document.body.appendChild(s);
  },

  // 아래 띠 광고 켜기/끄기 (화면 바뀔 때마다 부름)
  sync() {
    const on = this.enabled();
    document.body.classList.toggle('ads-on', on);
    let bar = document.getElementById('ad-banner');
    if (!on) { if (bar) bar.remove(); return; }
    if (bar) return;
    bar = document.createElement('div');
    bar.id = 'ad-banner';
    bar.className = 'ad-banner';
    bar.setAttribute('role', 'complementary');
    bar.setAttribute('aria-label', '광고');
    bar.innerHTML = this.UNIT_BANNER
      ? `<span class="ad-tag">광고</span>${this._adfit(this.UNIT_BANNER, 320, 50)}`
      : `<span class="ad-tag">광고</span>
         <button type="button" class="ad-house" onclick="Ads.toUpgrade('banner')">
           <span class="ad-house-t"><b>광고 없이 로드플래너</b><small>아침 교통 재계산 · 자동 길안내 · 월 2만원</small></span>
           <span class="ad-house-go">보기</span>
         </button>`;
    document.body.appendChild(bar);
    if (this.UNIT_BANNER) this._loadAdfit();
  },

  _today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },   // 한국 날짜 (자정에 초기화)
  _log() {
    try { const d = JSON.parse(localStorage.getItem('rp_ad_log') || '{}'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; }
  },
  _canShow() {
    const log = this._log();
    const today = this._today();
    if (log.day !== today) return true;
    if ((log.n || 0) >= this.DAY_MAX) return false;
    return !log.at || Date.now() - log.at >= this.GAP_MS;
  },
  _mark() {
    const today = this._today();
    const log = this._log();
    const n = log.day === today ? (log.n || 0) + 1 : 1;
    try { localStorage.setItem('rp_ad_log', JSON.stringify({ day: today, n, at: Date.now() })); } catch (e) { }
  },

  // 전면 광고: 일정 등록 같은 일이 끝난 뒤 (reason은 기록용)
  moment(reason, force) {
    if (window.__noAds || !this.enabled() || document.getElementById('ad-full')) return false;
    if (!force && !this._canShow()) return false;
    this._mark();
    setTimeout(() => this._showFull(reason), 700);   // 저장 완료 알림을 먼저 보이고
    return true;
  },

  _showFull(reason) {
    if (document.getElementById('ad-full')) return;
    const box = document.createElement('div');
    box.id = 'ad-full';
    box.className = 'ad-full';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', '광고');
    box.dataset.reason = reason || '';
    box.innerHTML = `
      <div class="ad-full-card">
        <div class="ad-full-top"><span class="ad-tag">광고</span><button type="button" class="ad-close" disabled aria-label="광고 닫기">3초 뒤 닫기</button></div>
        <div class="ad-full-body">
          ${this.UNIT_BOX ? this._adfit(this.UNIT_BOX, 300, 250) : `
          <div class="ad-house-box">
            <img src="icon.svg" alt="" width="52" height="52">
            <b>광고 없이, 더 빠르게</b>
            <p>유료로 바꾸면 광고가 사라지고<br>아침 교통 재계산 · 차 타면 자동 길안내 · 아티스트 여러 명을 쓸 수 있어요.</p>
            <span class="ad-house-price">월 20,000원</span>
          </div>`}
        </div>
        <button type="button" class="ad-full-up" onclick="Ads.toUpgrade('full')">광고 없이 쓰기</button>
      </div>`;
    document.body.appendChild(box);
    if (this.UNIT_BOX) this._loadAdfit();
    const btn = box.querySelector('.ad-close');
    let left = 3;
    const tick = setInterval(() => {
      left--;
      if (left > 0) { btn.textContent = `${left}초 뒤 닫기`; return; }
      clearInterval(tick);
      btn.disabled = false; btn.textContent = '닫기 ✕';
      btn.focus();
    }, 1000);
    btn.addEventListener('click', () => { if (!btn.disabled) this.closeFull(); });
  },

  closeFull() { document.getElementById('ad-full')?.remove(); },

  toUpgrade() { this.closeFull(); try { App.navigate('upgrade'); } catch (e) { } },
};
window.Ads = Ads;
