// 로디(AI 비서) 말 알아듣기 평가 (실제 Claude 호출):
//   ANTHROPIC_API_KEY=sk-... node --experimental-strip-types --no-warnings tests/ai-eval/run.mjs
// 매니저가 실제로 할 법한 말 23개를 서버 함수와 같은 지시문·도구·서버 검사로 돌려 봅니다.
// 서버 검사(지난 날짜·중복·넓은 장소)에 걸리면 서버처럼 오류를 돌려주고 AI가 고치거나 되묻는지까지 봅니다 (최대 3번).
// 주변 검색은 카카오 대신 가짜 결과를 줍니다. 프롬프트를 고친 뒤 점수가 떨어지지 않는지 확인하는 용도 (Haiku 기준 몇십 원)
import fs from 'node:fs';
import { TOOLS, CHAT_MODEL, systemBlocks, checkSchedule, checkUpdate, replyProblem } from '../../supabase/functions/roadplanner-ai/index.ts';

const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error('ANTHROPIC_API_KEY 환경 변수가 필요해요'); process.exit(1); }
const only = process.argv[2] ? Number(process.argv[2]) : 0;   // 번호 하나만 돌리기
const { context: ctx, cases } = JSON.parse(fs.readFileSync(new URL('./cases.json', import.meta.url)));

async function claude(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: CHAT_MODEL, max_tokens: 900, system: systemBlocks(ctx), tools: TOOLS, messages })
  });
  const data = await res.json();
  if (!res.ok) { console.error('API 오류', data); process.exit(1); }
  return data;
}

/** 서버처럼 도구 결과를 돌려주며 끝까지 대화 → 받아들여진 제안·마지막 답 */
async function run(say) {
  const messages = [{ role: 'user', content: say }];
  const accepted = [], rejected = [];
  let text = '', cacheRead = 0;
  for (let round = 0; round < 3; round++) {
    const data = await claude(messages);
    cacheRead += data.usage?.cache_read_input_tokens || 0;
    const blocks = data.content || [];
    const said = blocks.filter(b => b.type === 'text').map(b => b.text).join(' ').trim();
    if (said) text = said;
    const uses = blocks.filter(b => b.type === 'tool_use');
    messages.push({ role: 'assistant', content: blocks });
    if (data.stop_reason !== 'tool_use' || !uses.length) break;
    const results = [];
    for (const u of uses) {
      const a = u.input || {};
      const problem = u.name === 'propose_schedule' ? checkSchedule(a, ctx, false) : u.name === 'propose_update' ? checkUpdate(a, ctx) : null;
      if (problem) { rejected.push({ name: u.name, input: a, problem }); results.push({ type: 'tool_result', tool_use_id: u.id, is_error: true, content: problem }); continue; }
      accepted.push({ name: u.name, input: a });
      const content = u.name === 'search_nearby'
        ? JSON.stringify({ near: a.near, places: [{ name: '시험 국밥', category: '국밥', address: '시험 주소 1', distance_m: 120 }, { name: '시험 공영주차장', category: '주차장', address: '시험 주소 2', distance_m: 200 }] })
        : '{"shown_to_user":true,"note":"확인 카드를 보여 줬습니다. 사용자가 버튼을 눌러야 저장됩니다."}';
      results.push({ type: 'tool_result', tool_use_id: u.id, content });
    }
    messages.push({ role: 'user', content: results });
  }
  return { accepted, rejected, text, cacheRead };
}

function check(c, r) {
  const bad = [];
  const proposals = r.accepted.filter(a => a.name !== 'search_nearby');
  const p = replyProblem(r.text, proposals.length);
  if (p) bad.push('답 안전장치에 걸림: ' + p.slice(0, 30));
  const has = (list, all) => (all ? list.every(h => r.text.includes(h)) : list.some(h => r.text.includes(h)));
  if (c.replyAny && !has(c.replyAny, false)) bad.push(`답에 ${c.replyAny.join('/')} 중 하나도 없음`);
  if (c.replyAll && !has(c.replyAll, true)) bad.push(`답에 ${c.replyAll.join(', ')} 모두 있어야 함`);
  if (c.tool === null) {
    if (proposals.length) bad.push(`제안하면 안 됨 (${proposals[0].name})`);
    if (c.ask && !/[?？]|요[.!]?\s*$|까요/.test(r.text)) bad.push('되묻지 않음');
    if (c.refuse && !/스케줄|이동|돕|알려 드릴 수|어렵|개인|사생활/.test(r.text)) bad.push('거절하지 않음');
    return bad;
  }
  const mine = r.accepted.filter(a => a.name === c.tool);
  if (!mine.length) return [...bad, `${c.tool} 안 씀${r.rejected.length ? ' (서버가 거절: ' + r.rejected.map(x => x.problem.slice(0, 40)).join(' / ') + ')' : ''}`];
  const a = mine[0].input;
  for (const [k, v] of Object.entries(c.expect || {})) {
    if (k.endsWith('~')) { const f = k.slice(0, -1); if (!String(a[f] || '').includes(v)) bad.push(`${f}=${a[f]} (기대: ${v} 포함)`); }
    else if (JSON.stringify(a[k]) !== JSON.stringify(v)) bad.push(`${k}=${JSON.stringify(a[k])} (기대: ${JSON.stringify(v)})`);
  }
  if (c.tool === 'propose_update' && r.accepted.some(x => x.name === 'propose_schedule')) bad.push('변경인데 새 스케줄도 만듦');
  return bad;
}

let pass = 0, total = 0, cached = 0;
for (const [n, c] of cases.entries()) {
  if (only && only !== n + 1) continue;
  total++;
  const r = await run(c.say);
  cached += r.cacheRead;
  const bad = check(c, r);
  if (!bad.length) pass++;
  console.log(`${bad.length ? '✗' : '✓'} ${String(n + 1).padStart(2)}. ${c.say}`);
  if (bad.length) console.log(`     ${bad.join(' / ')}\n     → ${r.accepted.length ? JSON.stringify(r.accepted.map(x => x.input)) + ' ' : ''}${r.text.slice(0, 140)}`);
}
console.log(`\n${pass}/${total} 통과 (캐시로 읽은 토큰 ${cached})`);
