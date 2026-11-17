// 11/17 아침 점검에서 나온 문제 고친 것 확인
//   R7 출국: 해외 투어/출국은 비행기 2시간 30분 전 공항 도착으로 계산 (보통 일정은 그대로 10분 전)
//   R8 시간 수정 뒤 '바뀐 시간' 전후 비교
//   R9 우천 취소: 지우지 않고 '취소됨으로 남기기' → 동선에서 빠지고 일정표엔 '취소됨'으로 남음 · 다시 살리기
//   경비 음수 안내 · 긴급 보고 둘러보기 안내 · 로그인 빈칸 안내 · 로드비서 잠긴 버튼 안내 · 본사 로드톡 알림 세로 상자
const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  const R = {};

  // 로그인 빈칸
  await p.evaluate(() => Login.setTab('b2b')); await p.waitForTimeout(200);
  await p.click('#form-supabase-login button[type="submit"]'); await p.waitForTimeout(200);
  R.loginEmpty = await p.evaluate(() => { const e = document.getElementById('login-auth-error'); return e.textContent + '|' + (e.offsetParent ? 'shown' : 'hidden'); });
  await p.fill('#login-email', 'abc'); await p.click('#form-supabase-login button[type="submit"]'); await p.waitForTimeout(200);
  R.loginBad = await p.evaluate(() => document.getElementById('login-auth-error').textContent);

  await p.evaluate(() => Login.setTab('b2c')); await p.waitForTimeout(200);
  await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__toasts = []; U.toast = (m) => window.__toasts.push(m); });

  // R7 출국 동선
  R.r7 = await p.evaluate(() => {
    const st = (s) => { const tl = hqStore.generateAutoTimeline(s); const main = tl.find(x => /분 전\(/.test(x.desc || '')); return main ? main.desc.match(/(\d+)분 전\((\d\d:\d\d)\)/).slice(1).join('@') : ''; };
    return {
      overseas: st({ title: '출국 (도쿄 공연)', category: 'overseas', date: '2026-11-18', startTime: '07:00', endTime: '09:00', location: '인천국제공항 제1터미널' }),
      airportWord: st({ title: '김포공항 국제선 출국', category: 'event', date: '2026-11-18', startTime: '12:00', location: '김포국제공항' }),
      pickup: st({ title: '공항 입국 마중', category: 'event', date: '2026-11-18', startTime: '12:00', location: '인천국제공항' }),
      normal: st({ title: '뮤직뱅크', category: 'music_show', date: '2026-11-18', startTime: '14:00', location: 'KBS 신관' }),
    };
  });

  // R8 바뀐 시간
  R.r8 = await p.evaluate(() => Home.timeDiff(
    { date: '2026-11-17', startTime: '13:00', endTime: '19:00', timeline: [{ label: '[기상·준비] 기상', time: '10:30' }, { label: '[현장 이동] 숙소 출발', time: '11:30' }] },
    { date: '2026-11-17', startTime: '14:00', endTime: '20:00', timeline: [{ label: '[기상·준비] 기상', time: '11:30' }, { label: '[현장 이동] 숙소 출발', time: '12:30' }] }));

  // R9 취소됨으로 남기기
  await p.evaluate(() => {
    const today = new Date(); const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    window.__ymd = ymd;
    const list = hqStore.getSchedules(); list.push({ id: 'sch_rain1', title: '한강 야외 버스킹', date: ymd, startTime: '12:00', endTime: '14:00', category: 'event', location: '여의도 한강공원', status: '예정', artistId: 'ALL', timeline: [] });
    hqStore.saveSchedules(list);
    window.__upd = null; const orig = hqStore.updateSchedule.bind(hqStore);
    hqStore.updateSchedule = async (id, patch) => { window.__upd = { id, patch }; const all = hqStore.getSchedules(); const s = all.find(x => x.id === id); Object.assign(s, patch); hqStore.saveSchedules(all); return s; };
    window.__del = 0; hqStore.deleteSchedule = async () => { window.__del++; };
    Home.deleteScheduleFromApp('sch_rain1');
  });
  await p.waitForSelector('#ask-back .ask-extra', { timeout: 4000 });
  R.r9dialog = await p.evaluate(() => [...document.querySelectorAll('#ask-back button')].map(x => x.textContent.trim()).join('|'));
  await p.click('#ask-back .ask-extra');
  await p.waitForSelector('#ask-in', { timeout: 4000 });
  await p.fill('#ask-in', '우천 취소'); await p.click('#ask-back .ask-ok'); await p.waitForTimeout(400);
  R.r9 = await p.evaluate(() => {
    const [y, m, d] = window.__ymd.split('-').map(Number);
    return {
      status: window.__upd?.patch?.status, note: /^\[취소 \d+\/\d+ \d\d:\d\d\] 우천 취소$/.test(window.__upd?.patch?.notes || ''), deleted: window.__del,
      inRoute: State.getHQSchedulesForDate(y, m - 1, d).some(s => s.id === 'sch_rain1'),
      inList: State.getSchedulesForDate(y, m - 1, d).some(s => s.id === 'sch_rain1' && s.status === '취소'),
      toast: window.__toasts.slice(-1)[0],
    };
  });
  await p.evaluate(() => { Home.deleteScheduleFromApp('sch_rain1'); });
  await p.waitForSelector('#ask-back .ask-extra', { timeout: 4000 });
  R.r9again = await p.evaluate(() => document.querySelector('#ask-back .ask-extra').textContent.trim());
  await p.click('#ask-back .ask-extra'); await p.waitForTimeout(300);
  R.r9revive = await p.evaluate(() => window.__upd?.patch?.status);

  // 긴급 보고 (둘러보기)
  R.sos = await p.evaluate(() => { window.__toasts = []; Sos.st.type = '사고'; Sos.st.stage = 'confirm'; Sos.send(); return window.__toasts.join('|'); });

  // 경비 음수
  R.exp = await p.evaluate(() => { window.__toasts = []; Expenses.openForm(); const el = document.getElementById('exp-amount'); el.value = '-5000'; el.dispatchEvent(new Event('input')); return { v: el.value, t: window.__toasts.join('|') }; });
  await p.evaluate(() => App.closeModal && App.closeModal());

  // 로드비서 잠긴 버튼
  R.ai = await p.evaluate(() => { window.__toasts = []; const h = RoadAI.chipsHTML(); RoadAI.pickPhoto(); RoadAI.ask('내일 일정'); return { disabled: /\sdisabled[\s>]/.test(h), toasts: window.__toasts }; });

  // 본사 로드톡 알림 (CSS)
  const css = fs.readFileSync(path.join(__dirname, '../../css/admin-v2.css'), 'utf8');
  R.toastCss = /\.chat-toast \{ top: auto !important;/.test(css);

  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
