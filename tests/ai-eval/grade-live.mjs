// 배포된 roadplanner-ai의 실제 응답 채점 (run.mjs와 같은 기준)
//   node tests/ai-eval/grade-live.mjs 응답.json   ← [{n, status, reply, actions, places}] (n = cases 번호, 1부터)
import fs from 'node:fs';
const { cases } = JSON.parse(fs.readFileSync(new URL('./cases.json', import.meta.url)));
const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const want = { propose_schedule: 'schedule', propose_update: 'update' };
let pass = 0;
for (const r of rows.sort((a, b) => a.n - b.n)) {
  const c = cases[r.n - 1], bad = [], text = r.reply || '', acts = r.actions || [];
  if (r.status !== 200) bad.push('HTTP ' + r.status);
  if (/[㐀-鿿]|\[\s*Note/i.test(text)) bad.push('한자/Note 남음');
  if (/카드/.test(text) && !acts.length) bad.push("'카드'라 했는데 제안 없음");
  if (c.replyAny && !c.replyAny.some(h => text.includes(h))) bad.push(`답에 ${c.replyAny.join('/')} 없음`);
  if (c.replyAll && !c.replyAll.every(h => text.includes(h))) bad.push(`답에 ${c.replyAll.join(', ')} 모두 있어야 함`);
  if (c.tool === null) {
    if (acts.length) bad.push(`제안하면 안 됨 (${acts[0].type})`);
    if (c.ask && !/[?？]|요[.!]?\s*$|까요/.test(text)) bad.push('되묻지 않음');
    if (c.refuse && !/스케줄|이동|돕|알려 드릴 수|어렵|개인|사생활/.test(text)) bad.push('거절하지 않음');
  } else if (c.tool === 'search_nearby') {
    if (!(r.places || []).length) bad.push('장소 결과 없음');
    if (c.expect.kind === 'parking' && !(r.places || []).some(p => /주차/.test(p.name + p.category))) bad.push('주차장 아님');
  } else {
    const mine = acts.filter(a => a.type === want[c.tool]);
    if (!mine.length) bad.push(`${c.tool} 안 씀 (받은 것: ${acts.map(a => a.type).join(',') || '없음'})`);
    else for (const [k, v] of Object.entries(c.expect || {})) {
      const a = mine[0];
      if (k.endsWith('~')) { const f = k.slice(0, -1); if (!String(a[f] || '').includes(v)) bad.push(`${f}=${a[f]} (기대: ${v} 포함)`); }
      else if (JSON.stringify(a[k]) !== JSON.stringify(v)) bad.push(`${k}=${JSON.stringify(a[k])} (기대: ${JSON.stringify(v)})`);
    }
    if (c.tool === 'propose_update' && acts.some(a => a.type === 'schedule')) bad.push('변경인데 새 스케줄도 만듦');
  }
  if (!bad.length) pass++;
  console.log(`${bad.length ? '✗' : '✓'} ${String(r.n).padStart(2)}. ${c.say}`);
  if (bad.length) console.log(`     ${bad.join(' / ')}\n     → ${acts.length ? JSON.stringify(acts.map(({ found, before, ...a }) => a)) + ' ' : ''}${text.replace(/\n/g, ' ').slice(0, 160)}`);
}
console.log(`\n${pass}/${rows.length} 통과`);
