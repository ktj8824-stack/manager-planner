// =========================================
// 매니저플래너(로드플래너) — 장소 검색·경로 조회 서버 함수 (Supabase Edge Function)
// 앱 대신 카카오·티맵을 호출해서, API 키가 웹/앱 코드에 들어가지 않게 합니다.
// (구조는 마이플래너 supabase/functions/route 를 따름)
//
// 요청: POST { service, ...값 }
//   kakao_keyword    {query}            카카오 장소(키워드) 검색
//   kakao_address    {query}            카카오 주소 검색
//   kakao_directions {sx,sy,ex,ey}      카카오모빌리티 자동차 길찾기 (실시간 교통)
//   tmap_pois        {keyword}          티맵 장소 검색
//   tmap_pois_near   {keyword,lat,lng,radius}  티맵 주변 장소 검색 (radius km, 1~33)
//   tmap_route       {sx,sy,ex,ey}      티맵 자동차 경로
//   tmap_route_at    {sx,sy,ex,ey,at,mode}  티맵 타임머신 경로 — 그 날짜·시간의 예측 교통으로 계산
//                    at = 'YYYY-MM-DDTHH:MM' (한국 시간), mode = 'arrive'(그 시각 도착) | 'depart'(그 시각 출발)
// 응답: 원래 API의 JSON 그대로 (웹의 해석 코드가 같도록)
//
// 배포: 버디플래너 Supabase 프로젝트에 함수 이름 manager-planner-route (verify_jwt = true, anon 키로 호출)
// 비밀값 (Supabase 대시보드 > Edge Functions > Secrets) — MANAGER_ 접두사:
//   MANAGER_KAKAO_REST_KEY   카카오 REST API 키
//   MANAGER_TMAP_APP_KEY     티맵(SK open API) 앱키
//   (선택) MANAGER_ALLOWED_ORIGINS  허용할 웹 주소, 쉼표로 구분 (기본: https://ktj8824-stack.github.io)
// =========================================

type Env = { KAKAO_REST_KEY?: string; TMAP_APP_KEY?: string; ALLOWED_ORIGINS?: string };
type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

const DEFAULT_ORIGINS = "https://ktj8824-stack.github.io,http://localhost:8080,http://127.0.0.1:8080";
const GEO = "reqCoordType=WGS84GEO&resCoordType=WGS84GEO";
const RATE_PER_MIN = 90;          // 한 사용자(IP)당 1분 최대 호출
const CACHE_MS = 60_000;          // 같은 요청은 1분 동안 재사용 (비용 절약)
const rate = new Map<string, { n: number; t: number }>();
const cache = new Map<string, { at: number; body: string }>();

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  const h: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowed.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const okLng = (v: number) => Number.isFinite(v) && v > 123 && v < 133;   // 대한민국 근처만 허용 (남용 방지)
const okLat = (v: number) => Number.isFinite(v) && v > 32 && v < 40;
function coords(p: Record<string, unknown>) {
  const n = (k: string) => Number(p[k]);
  const c = { sx: n("sx"), sy: n("sy"), ex: n("ex"), ey: n("ey") };
  if (!okLng(c.sx) || !okLng(c.ex) || !okLat(c.sy) || !okLat(c.ey)) return null;
  return c;
}
function text(p: Record<string, unknown>, k: string, max = 60) { return String(p[k] ?? "").trim().slice(0, max); }

function limited(ip: string, now: number) {
  const r = rate.get(ip);
  if (!r || now - r.t > 60_000) { rate.set(ip, { n: 1, t: now }); if (rate.size > 5000) rate.clear(); return false; }
  r.n++;
  return r.n > RATE_PER_MIN;
}

export async function handle(req: Request, env: Env, fetchFn: Fetch = fetch, now = Date.now()): Promise<Response> {
  const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin, allowed);
  // 브라우저에서 온 요청은 허용한 주소만 (다른 사이트가 이 함수를 가져다 쓰지 못하게)
  if (origin && !allowed.includes(origin)) return json({ error: "허용되지 않은 주소" }, 403, cors);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST만 가능" }, 405, cors);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip, now)) return json({ error: "잠시 후 다시 시도해 주세요" }, 429, cors);

  let p: Record<string, unknown>;
  try { p = await req.json(); } catch { return json({ error: "잘못된 요청" }, 400, cors); }
  const service = String(p.service || "");
  const kakao = env.KAKAO_REST_KEY || "";
  const tmap = env.TMAP_APP_KEY || "";

  let url = "";
  let init: RequestInit = {};
  if (service === "kakao_keyword" || service === "kakao_address") {
    const q = text(p, "query");
    if (!q) return json({ error: "검색어 없음" }, 400, cors);
    url = service === "kakao_keyword"
      ? `https://dapi.kakao.com/v2/local/search/keyword.json?size=15&query=${encodeURIComponent(q)}`
      : `https://dapi.kakao.com/v2/local/search/address.json?size=10&query=${encodeURIComponent(q)}`;
    init = { headers: { Authorization: `KakaoAK ${kakao}` } };
  } else if (service === "kakao_directions") {
    const c = coords(p);
    if (!c) return json({ error: "좌표가 올바르지 않음" }, 400, cors);
    url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${c.sx},${c.sy}&destination=${c.ex},${c.ey}&priority=RECOMMEND&car_type=1`;
    init = { headers: { Authorization: `KakaoAK ${kakao}`, "Content-Type": "application/json" } };
  } else if (service === "tmap_pois") {
    const kw = text(p, "keyword");
    if (!kw) return json({ error: "검색어 없음" }, 400, cors);
    url = `https://apis.openapi.sk.com/tmap/pois?version=1&count=15&${GEO}&searchKeyword=${encodeURIComponent(kw)}`;
    init = { headers: { appKey: tmap } };
  } else if (service === "tmap_pois_near") {
    const kw = text(p, "keyword") || "편의점";
    const lat = Number(p.lat), lng = Number(p.lng);
    const radius = Math.min(33, Math.max(1, Math.round(Number(p.radius) || 2)));
    if (!okLat(lat) || !okLng(lng)) return json({ error: "좌표가 올바르지 않음" }, 400, cors);
    url = `https://apis.openapi.sk.com/tmap/pois?version=1&count=30&${GEO}&searchKeyword=${encodeURIComponent(kw)}&centerLon=${lng}&centerLat=${lat}&radius=${radius}`;
    init = { headers: { appKey: tmap } };
  } else if (service === "tmap_route") {
    const c = coords(p);
    if (!c) return json({ error: "좌표가 올바르지 않음" }, 400, cors);
    url = `https://apis.openapi.sk.com/tmap/routes?version=1&startX=${c.sx}&startY=${c.sy}&endX=${c.ex}&endY=${c.ey}&${GEO}&searchOption=0&trafficInfo=Y`;
    init = { headers: { appKey: tmap } };
  } else if (service === "tmap_route_at") {
    const c = coords(p);
    if (!c) return json({ error: "좌표가 올바르지 않음" }, 400, cors);
    const at = String(p.at || "");
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at)) return json({ error: "시간 형식 오류" }, 400, cors);
    const t0 = Date.parse(at + ":00+09:00");
    if (!Number.isFinite(t0) || t0 < now - 3600_000 || t0 > now + 400 * 86400_000) return json({ error: "예측할 수 없는 시간" }, 400, cors);
    // 티맵 규칙: predictionType 'departure' = 주어진 시각에 '도착'하려면 언제 출발? / 'arrival' = 주어진 시각에 '출발'하면 언제 도착?
    const predictionType = p.mode === "depart" ? "arrival" : "departure";
    url = `https://apis.openapi.sk.com/tmap/routes/prediction?version=1&${GEO}&sort=index`;
    init = {
      method: "POST",
      headers: { appKey: tmap, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ routesInfo: {
        departure: { name: "start", lon: String(c.sx), lat: String(c.sy) },
        destination: { name: "end", lon: String(c.ex), lat: String(c.ey) },
        predictionType, predictionTime: at + ":00+0900", searchOption: "00",
      } }),
    };
  } else {
    return json({ error: "지원하지 않는 요청" }, 400, cors);
  }
  if (service.startsWith("kakao") && !kakao) return json({ error: "카카오 키가 설정되지 않음" }, 503, cors);
  if (service.startsWith("tmap") && !tmap) return json({ error: "티맵 키가 설정되지 않음" }, 503, cors);

  const cacheKey = service + "|" + url + "|" + (typeof init.body === "string" ? init.body : "");
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_MS) return json(hit.body, 200, cors);

  try {
    const res = await fetchFn(url, init);
    if (res.status === 204) return json({}, 200, cors);   // 티맵: 검색 결과 없음
    const body = await res.text();
    if (res.ok) {
      cache.set(cacheKey, { at: now, body });
      if (cache.size > 500) cache.delete(cache.keys().next().value as string);
      return json(body, 200, cors);
    }
    // 키 오류 등 원래 서비스의 실패는 내용을 숨기고 상태만 알림
    console.warn("upstream", service, res.status, service === "tmap_route_at" ? body.slice(0, 300) : "");
    return json({ error: "외부 서비스 오류", status: res.status }, 502, cors);
  } catch (_e) {
    return json({ error: "외부 서비스에 연결하지 못함" }, 502, cors);
  }
}

// Supabase(Deno)에서 실행될 때만 서버 시작
// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno;
if (D && D.serve) {
  // 같은 프로젝트의 다른 앱(마이플래너 등)과 섞이지 않도록 MANAGER_ 접두사 비밀값만 읽음
  const env = (k: string) => D.env.get("MANAGER_" + k) || undefined;
  D.serve((req: Request) => handle(req, {
    KAKAO_REST_KEY: env("KAKAO_REST_KEY"),
    TMAP_APP_KEY: env("TMAP_APP_KEY"),
    ALLOWED_ORIGINS: env("ALLOWED_ORIGINS"),
  }));
}
