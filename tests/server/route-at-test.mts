import { handle } from '../../supabase/functions/manager-planner-route/index.ts';
const calls: any[] = [];
const fakeFetch = async (url: string, init: any) => { calls.push({ url, m: init?.method, body: init?.body }); return new Response(JSON.stringify({ features: [{ properties: { totalTime: 1860 } }] }), { status: 200 }); };
const env = { KAKAO_REST_KEY: 'K', TMAP_APP_KEY: 'T' };
const req = (body: any) => new Request('https://x/f', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://ktj8824-stack.github.io', 'x-forwarded-for': '9.9.9.9' }, body: JSON.stringify(body) });
const now = Date.parse('2026-11-04T09:00:00Z');
const base = { service: 'tmap_route_at', sx: 127.03, sy: 37.52, ex: 126.89, ey: 37.58 };
for (const b of [{ ...base, at: '2026-11-07T18:50', mode: 'arrive' }, { ...base, at: '2026-11-07T18:50', mode: 'depart' }, { ...base, at: '2025-01-01T10:00' }, { ...base, at: 'bad' }]) {
  const r = await handle(req(b), env as any, fakeFetch as any, now);
  console.log(r.status, (await r.text()).slice(0, 80));
}
console.log(JSON.stringify(calls, null, 1).slice(0, 900));
