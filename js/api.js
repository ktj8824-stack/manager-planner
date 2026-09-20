/* =========================================
   ManagerPlanner v2 — API Module
   (Kakao Local & TMAP Route/Place Integration)
   ========================================= */

const KakaoAPI = {
  // 카카오 REST API 키
  REST_API_KEY: '0584e867024205fde01e6e0bee9f05f4',

  /**
   * 카카오 로컬 API 장소 검색 (키워드)
   * API 키가 없으면 기본 주요 거점(COURSES/VENUES)에서 검색합니다.
   */
  async searchPlace(keyword) {
    if (!keyword || keyword.trim() === '') return [];

    // Fallback: API 키가 없거나 실패 시 기본 거점 데이터(Mock) 반환
    const fallbackList = (typeof COURSES !== 'undefined') ? COURSES : [];

    if (!this.REST_API_KEY) {
      console.log('API 키가 없어 기본 데이터에서 검색합니다:', keyword);
      return fallbackList.filter(c => U.matchCho(c.name, keyword) || U.matchCho(c.region, keyword)).map(c => ({
        id: c.id,
        place_name: c.name,
        address_name: c.addr || c.region,
        x: c.lng,
        y: c.lat
      }));
    }

    try {
      let searchQuery = keyword.trim();
      const searchUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `KakaoAK ${this.REST_API_KEY}`
        }
      });

      if (!response.ok) {
        console.warn(`카카오 API 요청 실패 [${response.status}], 기본 데이터 검색으로 전환합니다.`);
        return fallbackList.filter(c => U.matchCho(c.name, keyword) || U.matchCho(c.region, keyword)).map(c => ({
          id: c.id,
          place_name: c.name,
          address_name: c.addr || c.region,
          x: c.lng,
          y: c.lat
        }));
      }

      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('카카오 장소 검색 오류:', error);
      return fallbackList.filter(c => U.matchCho(c.name, keyword) || U.matchCho(c.region, keyword)).map(c => ({
        id: c.id,
        place_name: c.name,
        address_name: c.addr || c.region,
        x: c.lng,
        y: c.lat
      }));
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
