/* =========================================
   RoadPlanner — API Module
   (Kakao Local & TMAP Route/Place Integration)

   카카오 REST 키와 티맵 앱키는 코드에 넣지 않습니다.
   모든 장소 검색·경로 조회는 Supabase 서버 함수(manager-planner-route)가 대신 호출합니다.
   - 함수 위치: 버디플래너 Supabase 프로젝트 / 소스: supabase/functions/manager-planner-route
   - 키는 Supabase Secrets의 MANAGER_KAKAO_REST_KEY, MANAGER_TMAP_APP_KEY 에만 있습니다.
   ========================================= */

const RouteProxy = {
  URL: 'https://iaccdqcthhtvvetmbryr.supabase.co/functions/v1/manager-planner-route',
  // 버디플래너 프로젝트의 공개(anon) 키: 브라우저에 공개돼도 되는 키이며, 함수 호출 권한 확인에만 쓰입니다.
  ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2NkcWN0aGh0dnZldG1icnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MzM1MDksImV4cCI6MjEwOTAwOTUwOX0.WUuGsdr-mG0gEqhEFQTS0ew8Kr6uy9l7PZ6pXe5zbRM',

  /** service 와 값을 보내면 원래 API의 JSON을 돌려받음. 실패하면 null */
  async call(service, params = {}, timeoutMs = 8000) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    try {
      const res = await fetch(this.URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.ANON, apikey: this.ANON },
        body: JSON.stringify({ service, ...params }),
        signal: ctrl ? ctrl.signal : undefined
      });
      if (!res.ok) { console.warn(`경로 서버 함수 실패 [${service}] ${res.status}`); return null; }
      return await res.json();
    } catch (e) {
      console.warn(`경로 서버 함수 연결 실패 [${service}]`, e && e.name === 'AbortError' ? '시간 초과' : e);
      return null;
    } finally { if (timer) clearTimeout(timer); }
  }
};

function _tmapPoiList(data) {
  const pois = data && data.searchPoiInfo && data.searchPoiInfo.pois && data.searchPoiInfo.pois.poi;
  return Array.isArray(pois) ? pois : [];
}

const KakaoAPI = {
  // 카카오내비 바로 실행용 JavaScript 키 (공개용 키: 카카오 콘솔에 등록한 사이트 도메인에서만 동작). 비어 있으면 카카오맵 길찾기로 연다.
  JS_KEY: '5729341d219d8cb6f0a189fa86c91456',

  /**
   * "MBC 상암 신사옥 (서울 마포구 성암로 267)" 같은 장소 글자 → 좌표 {x, y, name}
   * 이름과 주소를 나눠 동시에 찾고 먼저 나온 결과를 씀 (괄호가 섞인 긴 문장은 그대로 검색하면 안 나옴)
   */
  splitPlace(s) {
    const str = String(s || '').replace(/\s+/g, ' ').trim();
    const m = str.match(/^(.*?)\s*[(\[]([^()\[\]]+)[)\]]\s*$/);
    const looksAddr = (v) => /(시|도|구|군|읍|면|동|리|로|길)\s*\d|\d+(-\d+)?\s*$/.test(v) && /(시|도|구|군)\s/.test(v + ' ');
    if (m && m[1].trim() && looksAddr(m[2])) return { name: m[1].trim(), addr: m[2].trim() };
    if (looksAddr(str)) return { name: '', addr: str };
    return { name: m && m[1].trim() ? m[1].trim() : str, addr: '' };
  },
  _geoCache: {},
  async geocode(text) {
    const raw = String(text || '').trim();
    if (!raw) return null;
    if (this._geoCache[raw]) return this._geoCache[raw];
    const parts = this.splitPlace(raw);
    const queries = [...new Set([parts.addr, parts.name, raw].filter(Boolean))];
    const find = async (q) => {
      const docs = await this.searchPlace(q);
      const d = Array.isArray(docs) && docs[0];
      if (!d || !d.x || !d.y) throw new Error('none');
      return { x: Number(d.x), y: Number(d.y), name: parts.name || d.place_name || raw };
    };
    try {
      const pt = await Promise.any(queries.map(find));
      this._geoCache[raw] = pt;
      return pt;
    } catch (e) { return null; }
  },

  /** 카카오 로컬 장소/주소 검색 (키워드 → 없으면 주소) */
  async searchPlace(keyword) {
    const q = String(keyword || '').trim();
    this.lastSearchFailed = false;
    if (!q) return [];
    const kw = await RouteProxy.call('kakao_keyword', { query: q });
    if (kw && Array.isArray(kw.documents) && kw.documents.length > 0) return kw.documents;
    const ad = await RouteProxy.call('kakao_address', { query: q });
    if (ad && Array.isArray(ad.documents) && ad.documents.length > 0) {
      return ad.documents.map(d => ({
        id: d.address_name,
        place_name: d.address_name,
        address_name: (d.road_address && d.road_address.address_name) || (d.address && d.address.address_name) || d.address_name,
        x: d.x,
        y: d.y
      }));
    }
    // 두 검색이 모두 응답 자체를 못 받았으면 '0건'이 아니라 '고장' (화면에서 다른 문구로 알림)
    if (!kw && !ad) this.lastSearchFailed = true;
    return [];
  },

  /**
   * 카카오모빌리티 실시간 자동차 길찾기 → 소요 시간(분)
   * @param startX 출발 경도, startY 출발 위도, endX 도착 경도, endY 도착 위도
   */
  async getRouteTime(startX, startY, endX, endY) {
    if (!startX || !startY || !endX || !endY) return null;
    const data = await RouteProxy.call('kakao_directions', { sx: startX, sy: startY, ex: endX, ey: endY });
    const route = data && Array.isArray(data.routes) && data.routes[0];
    if (route && route.result_code === 0 && route.summary && route.summary.duration !== undefined) {
      const min = Math.ceil(route.summary.duration / 60);
      console.log(`⚡ [KakaoMobility] 실시간 자동차 소요시간: ${min}분 (${(route.summary.distance / 1000).toFixed(1)}km)`);
      return min;
    }
    return null;
  }
};

const TmapAPI = {
  /** 티맵 장소 검색 (카카오 결과와 같은 모양으로 변환) */
  async searchPlace(keyword) {
    const q = String(keyword || '').trim();
    if (!q) return [];
    const data = await RouteProxy.call('tmap_pois', { keyword: q });
    return _tmapPoiList(data).map(p => ({
      id: p.id,
      place_name: p.name,
      address_name: [p.upperAddrName, p.middleAddrName, p.lowerAddrName, p.detailAddrName].filter(Boolean).join(' '),
      y: p.noorLat || p.frontLat,
      x: p.noorLon || p.frontLon
    }));
  },

  /** 티맵 자동차 경로 → 소요 시간(분) */
  async getRouteTime(startX, startY, endX, endY) {
    if (!startX || !startY || !endX || !endY) return null;
    const data = await RouteProxy.call('tmap_route', { sx: startX, sy: startY, ex: endX, ey: endY });
    const f = data && Array.isArray(data.features) && data.features[0];
    return f && f.properties && f.properties.totalTime !== undefined ? Math.ceil(f.properties.totalTime / 60) : null;
  },

  /**
   * 티맵 타임머신: '그 날짜·그 시각'의 예측 교통으로 소요 시간(분)
   * @param at 'YYYY-MM-DDTHH:MM' (한국 시간) / mode 'arrive' = 그 시각에 도착 (기본), 'depart' = 그 시각에 출발
   */
  async getRouteTimeAt(startX, startY, endX, endY, at, mode = 'arrive') {
    if (!startX || !startY || !endX || !endY || !at) return null;
    const data = await RouteProxy.call('tmap_route_at', { sx: startX, sy: startY, ex: endX, ey: endY, at, mode }, 10000);
    const f = data && Array.isArray(data.features) && data.features[0];
    const sec = f && f.properties && Number(f.properties.totalTime);
    return sec > 0 ? Math.ceil(sec / 60) : null;
  },

  /** 현장 주변 편의시설(약국/편의점/카페/병원 등) 검색 */
  async searchNearbyConvenience(lat, lng, keyword = '편의점', radius = 2) {
    if (!lat || !lng) return [];
    const data = await RouteProxy.call('tmap_pois_near', { keyword, lat, lng, radius });
    return _tmapPoiList(data).map(p => ({
      id: p.id,
      place_name: p.name,
      address_name: [p.upperAddrName, p.middleAddrName, p.lowerAddrName, p.detailAddrName].filter(Boolean).join(' '),
      tel: p.telNo || '',
      category: p.lowerBizName || p.upperBizName || '',
      y: p.noorLat || p.frontLat,
      x: p.noorLon || p.frontLon,
      distance: p.radius
    }));
  }
};

// 카카오내비 SDK: JavaScript 키가 있을 때만 미리 불러 둔다 (버튼을 눌렀을 때 바로 열리도록)
(function () {
  try {
    if (typeof window === 'undefined' || !KakaoAPI.JS_KEY || window.Kakao) return;
    const s = document.createElement('script');
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => { try { if (!window.Kakao.isInitialized()) window.Kakao.init(KakaoAPI.JS_KEY); } catch (e) { } };
    document.head.appendChild(s);
  } catch (e) { }
})();
