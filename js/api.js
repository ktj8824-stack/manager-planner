/* =========================================
   ManagerPlanner v2 — API Module
   (Kakao Local & TMAP Route/Place Integration)
   ========================================= */

const KakaoAPI = {
  // 카카오 REST API 키
  REST_API_KEY: '0584e867024205fde01e6e0bee9f05f4',

  /**
   * 카카오 로컬 API 장소/주소 검색 (키워드 및 도로명/지번)
   */
  async searchPlace(keyword) {
    if (!keyword || keyword.trim() === '') return [];

    const fallbackList = (typeof COURSES !== 'undefined') ? COURSES : [];

    if (!this.REST_API_KEY) {
      return fallbackList.filter(c => U.matchCho(c.name, keyword) || U.matchCho(c.region, keyword)).map(c => ({
        id: c.id,
        place_name: c.name,
        address_name: c.addr || c.region,
        x: c.lng,
        y: c.lat
      }));
    }

    try {
      const searchQuery = keyword.trim();
      // 1. 키워드 검색
      const searchUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: { 'Authorization': `KakaoAK ${this.REST_API_KEY}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.documents && data.documents.length > 0) {
          return data.documents;
        }
      }

      // 2. 키워드 결과가 없을 경우 주소 검색 API 시도
      const addrUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(searchQuery)}`;
      const addrRes = await fetch(addrUrl, {
        method: 'GET',
        headers: { 'Authorization': `KakaoAK ${this.REST_API_KEY}` }
      });

      if (addrRes.ok) {
        const addrData = await addrRes.json();
        if (addrData.documents && addrData.documents.length > 0) {
          return addrData.documents.map(d => ({
            id: d.address_name,
            place_name: d.address_name,
            address_name: d.road_address?.address_name || d.address?.address_name || d.address_name,
            x: d.x,
            y: d.y
          }));
        }
      }

      return [];
    } catch (error) {
      console.warn('카카오 장소/주소 검색 오류:', error);
      return [];
    }
  },

  /**
   * 🚗 카카오모빌리티 실시간 자동차 길찾기 API (실시간 교통 정체 100% 반영)
   * @param {number|string} startX 출발지 경도 (lng)
   * @param {number|string} startY 출발지 위도 (lat)
   * @param {number|string} endX 목적지 경도 (lng)
   * @param {number|string} endY 목적지 위도 (lat)
   * @returns {Promise<number|null>} 실시간 소요 시간 (분)
   */
  async getRouteTime(startX, startY, endX, endY) {
    if (!startX || !startY || !endX || !endY || !this.REST_API_KEY) return null;

    try {
      const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${startX},${startY}&destination=${endX},${endY}&priority=RECOMMEND&car_type=1`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `KakaoAK ${this.REST_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`카카오모빌리티 길찾기 요청 실패 [${response.status}]`);
        return null;
      }

      const data = await response.json();
      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        if (route.result_code === 0 && route.summary && route.summary.duration !== undefined) {
          const durationSec = route.summary.duration; // 초 단위
          const durationMin = Math.ceil(durationSec / 60); // 분 단위 올림
          console.log(`⚡ [KakaoMobility] 실시간 자동차 소요시간: ${durationMin}분 (${(route.summary.distance/1000).toFixed(1)}km, 실시간 정체 반영)`);
          return durationMin;
        }
      }
      return null;
    } catch (error) {
      console.warn('카카오모빌리티 길찾기 통신 오류:', error);
      return null;
    }
  }
};

const TmapAPI = {
  APP_KEY: 'aBQaawS7Sy5wtEfvogEbb8syJzjxNNFA4cr55qBO',

  async searchPlace(keyword) {
    if (!keyword || keyword.trim() === '') return [];

    try {
      const searchQuery = keyword.trim();
      const searchUrl = `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(searchQuery)}&resCoordType=WGS84GEO&reqCoordType=WGS84GEO&count=15&appKey=${TmapAPI.APP_KEY}`;
      
      const response = await fetch(searchUrl, {
        method: 'GET'
      });

      if (!response.ok) {
        console.warn(`티맵 API 요청 실패 [${response.status}]`);
        return [];
      }

      const data = await response.json();
      
      if (!data.searchPoiInfo || !data.searchPoiInfo.pois || !data.searchPoiInfo.pois.poi) {
        return [];
      }
      
      // 카카오/공통 포맷과 호환되도록 매핑
      return data.searchPoiInfo.pois.poi.map(p => {
        const addrParts = [p.upperAddrName, p.middleAddrName, p.lowerAddrName, p.detailAddrName].filter(Boolean);
        const addr = addrParts.join(' ');
        
        return {
          id: p.id,
          place_name: p.name,
          address_name: addr,
          y: p.noorLat || p.frontLat,
          x: p.noorLon || p.frontLon
        };
      });
    } catch (error) {
      console.error('티맵 장소 검색 오류:', error);
      return [];
    }
  },

  async getRouteTime(startX, startY, endX, endY) {
    if (!startX || !startY || !endX || !endY) return null;

    try {
      const qs = `version=1&startX=${startX}&startY=${startY}&endX=${endX}&endY=${endY}&reqCoordType=WGS84GEO&resCoordType=WGS84GEO&searchOption=0&trafficInfo=Y&appKey=${TmapAPI.APP_KEY}`;
      const response = await fetch('https://apis.openapi.sk.com/tmap/routes?' + qs, {
        method: 'GET'
      });

      if (!response.ok) {
        console.error("TMAP Route API HTTP Error:", response.status);
        return null;
      }

      const data = await response.json();
      if (data && data.features && data.features.length > 0) {
        const totalTimeSeconds = data.features[0].properties.totalTime;
        return Math.ceil(totalTimeSeconds / 60); // 분 단위 반환
      }
      return null;
    } catch (error) {
      console.error("TMAP Route API Fetch Error:", error);
      return null;
    }
  },

  // 현장 긴급 편의시설(약국/편의점/카페/병원 등) 주변 검색 지원
  async searchNearbyConvenience(lat, lng, keyword = '편의점', radius = 2) {
    if (!lat || !lng) return [];
    try {
      const searchUrl = `https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(keyword)}&centerLon=${lng}&centerLat=${lat}&radius=${radius}&resCoordType=WGS84GEO&reqCoordType=WGS84GEO&count=30&appKey=${TmapAPI.APP_KEY}`;
      
      const response = await fetch(searchUrl, { method: 'GET' });
      if (!response.ok) return [];

      const data = await response.json();
      if (!data.searchPoiInfo || !data.searchPoiInfo.pois || !data.searchPoiInfo.pois.poi) return [];
      
      return data.searchPoiInfo.pois.poi.map(p => {
        const addrParts = [p.upperAddrName, p.middleAddrName, p.lowerAddrName, p.detailAddrName].filter(Boolean);
        return {
          id: p.id,
          place_name: p.name,
          address_name: addrParts.join(' '),
          tel: p.telNo || '',
          category: p.lowerBizName || p.upperBizName || '',
          y: p.noorLat || p.frontLat,
          x: p.noorLon || p.frontLon,
          distance: p.radius
        };
      });
    } catch (error) {
      console.error('주변 편의시설 검색 오류:', error);
      return [];
    }
  }
};
