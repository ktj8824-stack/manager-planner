const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(800);
  const out = await p.evaluate(async () => {
    const R = {};
    const hq = window.hqStore;
    localStorage.setItem('admin_bp_user_email', 'ceo@kjm-ent.com'); localStorage.setItem('admin_bp_user_role', 'ceo');
    const server = { artists: [{ id: 'art_kjm_1', name: '루나스' }], vehicles: [], managers: [], schedules: [] };
    let failNext = null;
    const sc = window.SupabaseClient;
    Object.assign(sc, {
      isConfigured: true, currentUser: { id: 'u1' }, client: null, currentProfile: { role: 'ceo' },
      async createArtist(a) { if (failNext) { const e = failNext; failNext = null; throw e; } server.artists.push(a); return a; },
      async deleteArtist(id) { server.artists = server.artists.filter(a => a.id !== id); return true; },
      async getArtists() { return server.artists.slice(); }, async getVehicles() { return server.vehicles.slice(); },
      async getManagers() { return server.managers.slice(); }, async getSchedules() { return server.schedules.slice(); },
      async getAnnouncements() { return []; },
      async createSchedule(row) { if (failNext) { const e = failNext; failNext = null; throw e; } server.schedules.push({ ...row }); return { ...row }; },
      async updateSchedule(id, row) { const s = server.schedules.find(x => x.id === id); if (!s) { const e = new Error('0 rows'); e.code = 'PGRST116'; throw e; } Object.assign(s, row); return s; },
      async deleteSchedule(id) { server.schedules = server.schedules.filter(x => x.id !== id); return true; },
      async adminDeleteUser() { return { success: true }; },
    });
    await hq.syncFromSupabase();
    R.initialArtists = hq.getArtists().map(a => a.id).join(',');
    // 1. server failure → local unchanged
    failNext = Object.assign(new Error('network'), { code: '' });
    try { await hq.addArtist({ id: 'art_x', name: 'X' }); R.addFailThrew = false; } catch (e) { R.addFailThrew = true; }
    R.afterFail = hq.getArtists().map(a => a.id).join(',');
    // 2. success
    await hq.addArtist({ id: 'art_y', name: 'Y' });
    R.afterOk = hq.getArtists().map(a => a.id).join(',') + ' | server ' + server.artists.map(a => a.id).join(',');
    // 3. permanent rejection of a new schedule
    failNext = Object.assign(new Error('rls'), { code: '42501' });
    try { await hq.saveSchedule({ title: '거절될 일정', date: '2026-11-20', startTime: '10:00', endTime: '11:00', artistId: 'art_kjm_1' }); } catch (e) { R.permThrew = e.message.slice(0, 30); }
    await new Promise(r => setTimeout(r, 300));
    R.afterReject = { local: hq.getSchedules().length, pending: hq.getScheduleSyncState().pending, backup: JSON.parse(localStorage.getItem('HQ_LOCAL_ONLY_BACKUP_V1') || '[]').length };
    // 4. normal save goes to server
    await hq.saveSchedule({ title: '정상 일정', date: '2026-11-21', startTime: '10:00', endTime: '11:00', artistId: 'art_kjm_1' });
    R.normal = { local: hq.getSchedules().length, server: server.schedules.length, pending: hq.getScheduleSyncState().pending };
    // 5. orphan local schedule dropped on sync
    const key = hq.getUserStorageKey(HQ_STORAGE_KEYS.SCHEDULES);
    const list = JSON.parse(localStorage.getItem(key)); list.push({ id: 'sch_orphan', title: '옛 자료', date: '2026-11-22', startTime: '10:00', endTime: '11:00' }); localStorage.setItem(key, JSON.stringify(list));
    await hq.syncFromSupabase();
    R.orphan = { local: hq.getSchedules().map(s => s.title).join(','), backup: JSON.parse(localStorage.getItem('HQ_LOCAL_ONLY_BACKUP_V1') || '[]').map(s => s.title).join(',') };
    // 6. server-side deletion by another device → disappears after requestSync
    server.schedules = [];
    await hq.requestSync(0);
    R.remoteDelete = hq.getSchedules().length;
    // 7. no rerender event when nothing changed
    let n = []; const h = (e) => n.push(e.detail?.type); window.addEventListener('hq-store-change', h);
    await hq.syncFromSupabase(); window.removeEventListener('hq-store-change', h);
    R.eventsWhenUnchanged = n;
    R.badge = document.getElementById('sync-badge')?.style.display;
    return R;
  });
  console.log(JSON.stringify(out, null, 1)); console.log('errs', errs.slice(0, 3));
  await b.close();
})();
