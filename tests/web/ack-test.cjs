const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown','1')); await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(800);
  const out = await p.evaluate(async () => {
    const hq = window.hqStore, M = '0276e6a7-8868-4d07-b1ea-ffaf3c599815';
    const server = [];
    Object.assign(window.SupabaseClient, { isConfigured: true, currentUser: { id: M }, currentProfile: { role: 'ceo' },
      async createSchedule(r) { server.push({ ...r }); return { ...r }; }, async updateSchedule(id, r) { const s = server.find(x => x.id === id); Object.assign(s, r); return s; } });
    const d = new Date(); d.setDate(d.getDate() + 1); const ds = d.toISOString().slice(0, 10);
    const s = await hq.saveSchedule({ title: '컴백 팬사인회', artistName: '루나스', date: ds, startTime: '14:00', endTime: '17:00', managerId: M, location: '영등포 타임스퀘어' });
    await hq.addStatusLog(s.id, { label: '[일정 수정] 시작 13:00→14:00', managerName: '공진문 (본사)', ack: { need: true, managerId: M } });
    const R = { before: hq.getPendingAcks(M).length, state: hq.ackState(hq.getSchedules()[0]).pending };
    const host = document.createElement('div'); host.id = 'probe'; host.style.cssText = 'position:fixed;inset:0;background:#f2f2f7;padding:16px;z-index:99999;overflow:auto';
    host.innerHTML = Home.renderAckCards(); document.body.appendChild(host);
    R.cardText = host.innerText.replace(/\s+/g, ' ').slice(0, 160);
    await new Promise(r => setTimeout(r, 50));
    return R;
  });
  await p.screenshot({ path: require('os').tmpdir() + '/ack-card.png' });
  const out2 = await p.evaluate(async () => {
    const M = '0276e6a7-8868-4d07-b1ea-ffaf3c599815';
    const id = window.hqStore.getSchedules()[0].id;
    await window.hqStore.ackSchedule(id);
    const st = window.hqStore.ackState(window.hqStore.getSchedules()[0]);
    return { after: window.hqStore.getPendingAcks(M).length, responder: st.response && st.response.label, cards: Home.renderAckCards().length };
  });
  console.log(JSON.stringify(out), JSON.stringify(out2), 'errs', errs.slice(0, 3));
  await b.close();
})();
