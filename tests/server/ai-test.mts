// AI 비서 서버 함수: 로그인 확인 · 하루 한도 · 지난 날짜 거르기 · 장소 주소 붙이기 · 주변 검색은 실제 결과만
import { handle, calendarTable } from '../../supabase/functions/roadplanner-ai/index.ts';

const env: Record<string, string> = { SUPABASE_URL: 'https://buddy.test', SUPABASE_SERVICE_ROLE_KEY: 'svc', ANTHROPIC_API_KEY: 'k', MANAGER_KAKAO_REST_KEY: 'kk' };
const usedBy: Record<string, number> = {}; let used = 0; let claudeTurn = 0; const sent: any[] = [];
let script: any[] = [];
const f = async (url: string, init: any = {}) => {
  const J = (b: any, s = 200) => new Response(JSON.stringify(b), { status: s });
  if (url.includes('/auth/v1/user')) return init.headers.Authorization === 'Bearer good' ? J({ id: '11111111-1111-1111-1111-111111111111' }) : J({}, 401);
  if (url.includes('/functions/v1/payments')) return J({ company: { active: false }, proUntil: null });
  if (url.includes('rp_ai_try_use')) { const b = JSON.parse(init.body); const n = used >= 999 ? 999 : (usedBy[b.p_kind] = (usedBy[b.p_kind] || 0) + 1); return J(n > b.p_limit ? -1 : b.p_limit - n); }
  if (url.includes('dapi.kakao.com')) {
    const q = new URL(url).searchParams;
    if (q.get('category_group_code')) return J({ documents: [{ id: 'p1', place_name: '상암 국밥', category_name: '음식점 > 한식 > 국밥', road_address_name: '서울 마포구 1', phone: '02-1', place_url: 'https://place.map.kakao.com/p1', distance: '230', x: '126.9', y: '37.5' }] });
    return J({ documents: [{ id: 'v1', place_name: 'KBS 신관', road_address_name: '서울 영등포구 여의공원로 13', x: '126.92', y: '37.52' }] });
  }
  if (url.includes('api.anthropic.com')) { sent.push(JSON.parse(init.body)); return J(script[claudeTurn++] || { content: [{ type: 'text', text: '끝' }], stop_reason: 'end_turn' }); }
  return J({}, 404);
};
const req = (body: any, token = 'good') => new Request('https://x', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
const ctx = { today: '2026-11-07', weekday: '토', now: '00:30', upcoming: [] };
const out: any = {};

out.noLogin = (await handle(req({ message: 'hi' }, 'bad'), env, f as any)).status;

script = [
  { content: [{ type: 'tool_use', id: 't1', name: 'propose_schedule', input: { title: '뮤직뱅크 사전녹화', date: '2026-11-01', start: '14:00', place: 'KBS 신관' } }], stop_reason: 'tool_use' },
  { content: [{ type: 'tool_use', id: 't2', name: 'propose_schedule', input: { title: '뮤직뱅크 사전녹화', date: '2026-11-08', start: '14:00', place: 'KBS 신관', category: 'music_show' } }], stop_reason: 'tool_use' },
  { content: [{ type: 'text', text: '아래 카드에서 확인해 주세요.' }], stop_reason: 'end_turn' },
];
let r = await (await handle(req({ message: '내일 2시 KBS 뮤뱅 사녹', context: ctx }), env, f as any)).json();
out.pastRejected = JSON.stringify(sent[1].messages).includes('이미 지난 날짜');
out.actions = r.actions.length; out.addr = r.actions[0].found?.addr; out.reply = r.reply; out.remaining = r.remaining;
out.model = sent[0].model; out.dateTable = sent[0].system.includes('2026-11-08(일) 내일');

claudeTurn = 0; sent.length = 0;
script = [
  { content: [{ type: 'tool_use', id: 'n1', name: 'search_nearby', input: { near: 'KBS 신관', kind: 'food', keyword: '국밥' } }], stop_reason: 'tool_use' },
  { content: [{ type: 'text', text: '**상암 국밥**이 230m 거리예요.' }], stop_reason: 'end_turn' },
];
r = await (await handle(req({ message: 'KBS 근처 밥집', context: ctx }), env, f as any)).json();
out.places = r.places.map((p: any) => p.name + ' ' + p.distance_m).join(',');

claudeTurn = 0; sent.length = 0; script = [];
r = await (await handle(req({ message: '사진', image: { media_type: 'image/jpeg', data: 'AAAA' }, context: ctx }), env, f as any)).json();
out.visionModel = sent[0].model; out.imageSent = sent[0].messages.at(-1).content[0].type;

used = 999;
const lim = await handle(req({ message: '또', context: ctx }), env, f as any);
out.limit = lim.status + ' ' + (await lim.json()).message.slice(0, 12);
out.cal = calendarTable('2026-11-07').split('\n')[0];
console.log(JSON.stringify(out));
