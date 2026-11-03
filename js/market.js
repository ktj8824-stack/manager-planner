// =========================================================
// 마켓 — BuddyPlanner 공용 마켓 서버에서 '매니저플래너'용 상품만 보여줍니다.
// (공개 publishable 키만 사용 · 읽기 전용)
// =========================================================
const Market = {
  APP_ID: 'managerplanner',
  URL: 'https://iaccdqcthhtvvetmbryr.supabase.co',
  KEY: 'sb_publishable_2aCvpHt1ANEtjLvu2aOQGA_fk6afbvA',
  CATEGORIES: [
    { k: 'all', n: '전체' }, { k: 'charge', n: '충전·전자' }, { k: 'car', n: '차량용품' },
    { k: 'travel', n: '이동·여행' }, { k: 'office', n: '사무' }, { k: 'life', n: '생활' }, { k: 'etc', n: '기타' }
  ],
  items: [], cat: 'all', loaded: false, error: false,

  async init() {
    this.render();
    if (this.loaded) return;
    try {
      const q = `select=id,category,brand,title,image_url,link,badge,ref_price,ref_price_at,rocket&apps=cs.%7B${this.APP_ID}%7D&order=sort.asc,id.asc`;
      const r = await fetch(`${this.URL}/rest/v1/market_products?${q}`, { headers: { apikey: this.KEY, Authorization: `Bearer ${this.KEY}` } });
      if (!r.ok) throw new Error(r.status);
      this.items = await r.json();
      this.loaded = true; this.error = false;
    } catch (e) { this.error = true; }
    this.render();
  },

  setCat(k) { this.cat = k; this.render(); },

  open(id) {
    const it = this.items.find(x => x.id === id);
    if (!it) return;
    try {
      const h = new URL(it.link).hostname;
      if (!/(^|\.)coupang\.com$/.test(h)) return;
    } catch (e) { return; }
    window.open(it.link, '_blank', 'noopener');
  },

  _date(s) { if (!s) return ''; const d = new Date(s); return `${d.getMonth() + 1}/${d.getDate()}`; },

  render() {
    const el = U.$('#screen-market');
    if (!el) return;
    const list = this.cat === 'all' ? this.items : this.items.filter(x => x.category === this.cat);
    const cats = this.CATEGORIES.filter(c => c.k === 'all' || this.items.some(x => x.category === c.k));
    let body;
    if (!this.loaded && !this.error) body = `<div class="mk-empty">불러오는 중…</div>`;
    else if (this.error) body = `<div class="mk-empty">상품을 불러오지 못했어요.<br>잠시 후 다시 시도해 주세요.</div>`;
    else if (!list.length) body = `<div class="mk-empty">준비 중인 상품이에요.<br>곧 매니저님께 필요한 상품을 채워둘게요.</div>`;
    else body = `<div class="mk-grid">${list.map(it => `
      <button class="mk-card" onclick="Market.open(${Number(it.id)})">
        <div class="mk-img-wrap"><img class="mk-img" src="${esc(it.image_url || '')}" alt="" loading="lazy">
          ${it.badge ? `<span class="mk-badge">${esc(it.badge)}</span>` : ''}</div>
        <div class="mk-info">
          ${it.brand ? `<div class="mk-brand">${esc(it.brand)}</div>` : ''}
          <div class="mk-title">${esc(it.title || '')}</div>
          ${it.ref_price ? `<div class="mk-price">${Number(it.ref_price).toLocaleString()}원</div>
            <div class="mk-note">${this._date(it.ref_price_at)} 기준 · 쿠팡에서 확인 ›</div>` : `<div class="mk-note">쿠팡에서 가격 확인 ›</div>`}
          ${it.rocket ? `<span class="mk-rocket">🚀 로켓배송</span>` : ''}
        </div>
      </button>`).join('')}</div>`;
    el.innerHTML = `
      <div class="screen-scroll"><div class="mk-wrap">
        <div class="mk-head"><div class="mk-h1">마켓</div><div class="mk-sub">현장에서 필요한 물건, 바로 주문하세요</div></div>
        <div class="mk-cats">${cats.map(c => `<button class="mk-cat ${c.k === this.cat ? 'on' : ''}" onclick="Market.setCat('${c.k}')">${c.n}</button>`).join('')}</div>
        ${body}
        <div class="mk-disc">이 마켓은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.<br>표시된 가격은 기준일의 참고 가격이며, 실제 가격은 쿠팡에서 확인해 주세요.</div>
      </div></div>`;
  }
};
