// AI 비서 서버 함수: 로그인 · 하루 한도 · 지난 날짜 · 주소 붙이기 · 주변 검색 실제 결과만
// + 변경은 propose_update · 중복 되묻기 · 넓은 장소 되묻기 · 크레딧 부족 운영 알림 · 한자/[Note/카드 0개 다시 받기 · 프롬프트 캐시
import { handle, calendarTable, TOOLS, systemBlocks, checkSchedule, checkUpdate, replyProblem, cleanReply, claudeErrorKind } from '../../supabase/functions/roadplanner-ai/index.ts';

const env: Record<string, string> = { SUPABASE_URL: 'https://buddy.test', SUPABASE_SERVICE_ROLE_KEY: 'svc', ANTHROPIC_API_KEY: 'k', MANAGER_KAKAO_REST_KEY: 'kk' };
let payStatus: any = { company: { active: false }, proUntil: null };
const usedBy: Record<string, number> = {}; let used = 0; let claudeTurn = 0; const sent: any[] = [];
let script: any[] = []; let claudeFail: string | null = null; const opsCalls: any[] = [];
const f = async (url: string, init: any = {}) => {
  const J = (b: any, s = 200) => new Response(JSON.stringify(b), { status: s });
  if (url.includes('/auth/v1/user')) return init.headers.Authorization === 'Bearer good' ? J({ id: '11111111-1111-1111-1111-111111111111' }) : J({}, 401);
  if (url.includes('/functions/v1/payments')) return J(payStatus);
  if (url.includes('/functions/v1/ops-alert')) { opsCalls.push({ key: init.headers['x-alert-key'], body: JSON.parse(init.body) }); return J({ ok: true }); }
  if (url.includes('rp_settings')) return J([{ value: 'opskey-1234567890-abcdefgh' }]);
  if (url.includes('rp_ai_try_use')) { const b = JSON.parse(init.body); const n = used >= 999 ? 999 : (usedBy[b.p_kind] = (usedBy[b.p_kind] || 0) + 1); return J(n > b.p_limit ? -1 : b.p_limit - n); }
  if (url.includes('dapi.kakao.com')) {
    const q = new URL(url).searchParams;
    if (q.get('category_group_code')) return J({ documents: [{ id: 'p1', place_name: '상암 국밥', category_name: '음식점 > 한식 > 국밥', road_address_name: '서울 마포구 1', phone: '02-1', place_url: 'https://place.map.kakao.com/p1', distance: '230', x: '126.9', y: '37.5' }] });
    return J({ documents: [{ id: 'v1', place_name: 'KBS 신관', road_address_name: '서울 영등포구 여의공원로 13', x: '126.92', y: '37.52' }] });
  }
  if (url.includes('api.anthropic.com')) {
    sent.push(JSON.parse(init.body));
    if (claudeFail) return J({ type: 'error', error: { type: 'invalid_request_error', message: claudeFail } }, 400);
    return J(script[claudeTurn++] || { content: [{ type: 'text', text: '끝' }], stop_reason: 'end_turn' });
  }
  return J({}, 404);
};
const NOW = Date.UTC(2026, 10, 6, 15, 30); // 한국 시간 2026-11-07(토) 00:30 고정
const H = (body: any, token = 'good') => handle(req(body, token), env, f as any, NOW);
const req = (body: any, token = 'good') => new Request('https://x', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
const upcoming = [
  { idx: 0, date: '2026-11-08', weekday: '일', start: '19:00', end: '21:00', title: '뮤직뱅크 사전녹화', artist: '루나스', place: 'KBS 신관 공개홀' },
  { idx: 1, date: '2026-11-14', weekday: '토', start: '18:00', end: '', title: '한양대 축제', artist: '루나스', place: '한양대학교' },
];
const ctx = { today: '2026-11-07', weekday: '토', now: '00:30', role: 'hq_admin', upcoming };
const tu = (id: string, name: string, input: any) => ({ content: [{ type: 'tool_use', id, name, input }], stop_reason: 'tool_use' });
const say = (text: string) => ({ content: [{ type: 'text', text }], stop_reason: 'end_turn' });
const reset = (s: any[]) => { claudeTurn = 0; sent.length = 0; script = s; };
const out: any = {};

out.noLogin = (await H({ message: 'hi' }, 'bad')).status;

// 1) 지난 날짜 거름 → 다시 → 주소 붙임, 모델·날짜표·캐시
reset([
  tu('t1', 'propose_schedule', { title: '화보 촬영', date: '2026-11-01', start: '14:00', place: '청담 스튜디오' }),
  tu('t2', 'propose_schedule', { title: '화보 촬영', date: '2026-11-09', start: '14:00', place: 'KBS 신관', category: 'shooting' }),
  say('아래 카드에서 확인해 주세요.'),
]);
let r = await (await H({ message: '월요일 2시 화보', context: ctx })).json();
out.pastRejected = JSON.stringify(sent[1].messages).includes('이미 지난 날짜');
out.addr = r.actions[0]?.found?.addr; out.remaining = r.remaining;
out.model = sent[0].model;
out.dateTable = sent[0].system[1].text.includes('2026-11-08(일) 내일');
out.cache = sent[0].system[0].cache_control?.type === 'ephemeral' && !sent[0].system[1].cache_control && TOOLS[TOOLS.length - 1].cache_control?.type === 'ephemeral';

// 2) 변경: propose_update → 'update' 카드 (전 값 포함), 새 스케줄 아님
reset([tu('u1', 'propose_update', { idx: 0, new_start: '18:30', reason: '30분 당겨짐' }), say('아래 카드에서 확인해 주세요.')]);
r = await (await H({ message: '내일 뮤뱅 사녹 7시 말고 6시 반으로 당겨졌어', context: ctx })).json();
out.update = r.actions.length === 1 && r.actions[0].type === 'update' && r.actions[0].before.start === '19:00' && r.actions[0].new_start === '18:30';

// 3) 변경을 새 스케줄로 만들려 하면 서버가 중복으로 막음 → AI가 propose_update로 바꿈
reset([
  tu('d1', 'propose_schedule', { title: '뮤직뱅크 사전녹화', date: '2026-11-08', start: '18:30', place: 'KBS 신관', artist: '루나스' }),
  tu('d2', 'propose_update', { idx: 0, new_start: '18:30' }),
  say('아래 카드에서 확인해 주세요.'),
]);
r = await (await H({ message: '뮤뱅 6시 반', context: ctx })).json();
out.dupBlocked = JSON.stringify(sent[1].messages).includes('이미 스케줄이 있습니다 (idx 0');
out.dupThenUpdate = r.actions.map((a: any) => a.type).join(',');

// 4) 넓은 장소 이름 → 되묻게 함 (search_nearby도)
out.ambSchedule = /건물이 여러 곳/.test(checkSchedule({ title: '촬영', date: '2026-11-09', start: '15:00', place: 'SBS' }, ctx, false) || '');
out.ambOkWithHall = checkSchedule({ title: '인기가요', date: '2026-11-09', start: '07:00', place: 'SBS 등촌동 공개홀' }, ctx, false);
reset([tu('n0', 'search_nearby', { near: 'MBC', kind: 'food' }), say('MBC 상암 신사옥과 일산 드림센터 중 어디 근처인가요?')]);
r = await (await H({ message: 'MBC 근처 밥집', context: ctx })).json();
out.ambNearby = JSON.stringify(sent[1].messages).includes('건물이 여러 곳') && r.places.length === 0;

// 5) 변경 검사
out.updBadIdx = !!checkUpdate({ idx: 9, new_start: '10:00' }, ctx);
out.updSame = /같습니다/.test(checkUpdate({ idx: 0, new_start: '19:00' }, ctx) || '');
out.updCancelMix = !!checkUpdate({ idx: 1, cancel: true, new_start: '10:00' }, ctx);
out.updCancelOk = checkUpdate({ idx: 1, cancel: true }, ctx);

// 6) 주변 검색: 실제 결과만
reset([tu('n1', 'search_nearby', { near: 'KBS 신관', kind: 'food', keyword: '국밥' }), say('**상암 국밥**이 230m 거리예요.')]);
r = await (await H({ message: 'KBS 근처 밥집', context: ctx })).json();
out.places = r.places.map((p: any) => p.name + ' ' + p.distance_m).join(',');

// 7) 한자·[Note → 한 번 다시 받기
reset([say('내일 일정은 鄭 [Note: test] 입니다'), say('내일 일정은 오후 7시 뮤직뱅크 사전녹화예요.')]);
r = await (await H({ message: '내일 일정?', context: ctx })).json();
out.hanjaRetry = sent.length === 2 && r.reply === '내일 일정은 오후 7시 뮤직뱅크 사전녹화예요.';

// 8) '카드'라고 했는데 제안 0개 → 다시 묻기 → 도구 씀
reset([say('아래 카드에서 확인해 주세요.'), tu('c1', 'propose_schedule', { title: '한양대 축제 리허설', date: '2026-11-13', start: '15:00', place: '한양대학교 노천극장' }), say('아래 카드에서 확인해 주세요.')]);
r = await (await H({ message: '금요일 3시 한양대 리허설', context: ctx })).json();
out.cardRetry = sent.length === 3 && r.actions.length === 1 && JSON.stringify(sent[1].messages).includes('받아들여진 제안이 없어');
out.cleanFallback = cleanReply('아래 카드에서 확인해 주세요.', 0).startsWith('다시 한 번');
out.cleanStrip = cleanReply('좋아요 [Note: x] 鄭 끝', 1);
out.replyOk = replyProblem('오후 2시예요.', 0);

// 9) 사진 → 비전 모델
reset([]);
r = await (await H({ message: '사진', image: { media_type: 'image/jpeg', data: 'AAAA' }, context: ctx })).json();
out.visionModel = sent[0].model; out.imageSent = sent[0].messages.at(-1).content[0].type;

// 10) 크레딧 부족 → 사용자에겐 일반 안내, 운영자 알림 호출
reset([]); claudeFail = 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.';
const cr = await H({ message: '안녕', context: ctx });
const cj = await cr.json();
out.credit = cr.status + ' ' + cj.message.slice(0, 10) + ' ops=' + opsCalls.length + ' ' + (opsCalls[0]?.body.kind || '') + ' key=' + (opsCalls[0]?.key ? 'yes' : 'no');
out.errKind = [claudeErrorKind('Claude 400 Your credit balance is too low'), claudeErrorKind('Claude 401 invalid x-api-key'), claudeErrorKind('Claude 529 overloaded')].join(',');
claudeFail = null;

usedBy.chat = 0; usedBy.image = 0;
// 폰이 틀린 날짜(어제)를 보내도 서버가 한국 날짜로 판단
reset([tu('w1', 'propose_schedule', { title: '촬영', date: '2026-11-06', start: '15:00', place: '청담 스튜디오' }), say('날짜를 확인해 주세요.')]);
await (await H({ message: '어제 3시 촬영', context: { ...ctx, today: '2026-11-05', now: '10:00' } })).json();
out.serverDate = JSON.stringify(sent[1].messages).includes('이미 지난 날짜') && sent[0].system[1].text.includes('2026-11-07 (토) 00:30');
// 한자 고치려 다시 받을 때 카드가 이미 있으면 글만 (tool_choice none) → 카드 1장
reset([tu('h1', 'propose_schedule', { title: '화보 촬영', date: '2026-11-09', start: '14:00', place: '청담 스튜디오' }), say('아래 카드 확인 鄭'), say('아래 카드에서 확인해 주세요.')]);
r = await (await H({ message: '월요일 2시 청담 화보', context: ctx })).json();
out.noDupCard = r.actions.length === 1 && sent.length === 3 && sent[2].tool_choice?.type === 'none' && !sent[0].tool_choice;

used = 999;
const lim = await H({ message: '또', context: ctx });
out.limit = lim.status + ' ' + (await lim.json()).message.slice(0, 12);
// 개인 매니저 무료: 하루 3번, 안내에 월 2만원
used = 0; usedBy.chat = 0; payStatus = { company: null, proUntil: null };
const probe = await (await H({ probe: true })).json();
let st = 0; for (let i = 0; i < 4; i++) { reset([say('네')]); st = (await H({ message: '안녕', context: ctx })).status; }
const il = await (await H({ message: '또', context: ctx })).json();
out.indie = `${probe.indie}/${probe.paid} ${st} ${il.message.includes('2만원')}`;
payStatus = { company: null, proUntil: '2099-01-01T00:00:00Z' };
out.indiePaid = (await (await H({ probe: true })).json()).paid;
out.cal = calendarTable('2026-11-07').split('\n')[0];
out.noUndefined = ['2026-11-08', '2026-11-09', '2026-11-11', '2026-11-14'].every(d => !calendarTable(d).includes('undefined'));
out.rulesStable = systemBlocks(ctx)[0].text === systemBlocks({ ...ctx, today: '2026-12-01' })[0].text;
console.log(JSON.stringify(out));
