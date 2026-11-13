// 이동 시간 학습 · 문자 초안 · 반복 날짜 (순수 계산)
const { Learn, Drafts, Repeat } = require('../../js/learn.js');
const mk = (date, depHm, min, extra = {}) => {
  const mv = new Date(`${date}T${depHm}:00+09:00`);
  return { id: date + depHm, date, location: 'MBC 상암 (서울 마포구 성암로 267)', departure: { place: '회사', address: '서울 강남구 압구정로79길 19' }, shop: { needed: false },
    timeline: [{ label: '[기상·준비] 집' }, { label: '[현장 이동] 회사 → MBC', movingAtIso: mv.toISOString(), doneAtIso: new Date(mv.getTime() + min * 60000).toISOString() }, { label: '[메인 일정] 녹화' }], ...extra };
};
const list = [mk('2026-11-02', '17:00', 70), mk('2026-11-03', '17:10', 80), mk('2026-11-04', '16:50', 75), mk('2026-11-05', '11:00', 40), mk('2026-11-06', '11:20', 42),
  mk('2026-11-07', '17:00', 400), { ...mk('2026-11-08', '17:00', 60), timeline: [{ label: '[현장 이동] x', movingAtIso: '2026-11-08T08:00:00Z' }] }];
console.log('samples:', Learn.samples(list).length);
const pm = Learn.travel(list, { from: { address: '서울 강남구 압구정로79길 19' }, to: '서울 마포구 성암로 267', at: '2026-11-20T17:00:00+09:00' });
console.log('pm:', JSON.stringify(pm));
const mid = Learn.travel(list, { from: '서울 강남구 압구정로79길 19', to: 'MBC 상암 (서울 마포구 성암로 267)', at: '2026-11-20T11:00:00+09:00' });
console.log('mid:', JSON.stringify(mid));
console.log('none:', Learn.travel(list, { from: '부산', to: 'MBC' }));
const s = { contactName: '김지훈 PD', location: 'KBS 신관 (서울 영등포구 여의공원로 13)', date: '2026-11-20', startTime: '14:00' };
const p = { artist: '루나스 (LUNAS)', manager: '김태현' };
console.log('late:', Drafts.late(s, 15, p).replace(/\n/g, ' / '));
console.log('change:', Drafts.change(s, { date: '2026-11-20', start: '14:00' }, { date: '2026-11-21', start: '15:00' }, p).replace(/\n/g, ' / '));
console.log('cancel:', Drafts.cancel(s, p).replace(/\n/g, ' / '));
console.log('sms:', Drafts.smsUrl('010-1234-5678', '안녕 & 하세요', 'iPhone'), Drafts.smsUrl('010-1234-5678', 'a', 'Android'));
console.log('weekly:', Repeat.dates('2026-11-13', 'weekly', 3).join(','));
console.log('weekdays:', Repeat.dates('2026-11-13', 'weekdays', 4).join(','));
console.log('biweekly:', Repeat.dates('2026-11-13', 'biweekly', 2).join(','));
console.log('monthly31:', Repeat.dates('2027-01-31', 'monthly', 3).join(','));
console.log('later:', Repeat.later([{ id: 'a', date: '2026-11-13', series: { id: 'S' } }, { id: 'b', date: '2026-11-20', series: { id: 'S' } }, { id: 'c', date: '2026-11-27', series: { id: 'S' }, status: '취소' }, { id: 'd', date: '2026-11-06', series: { id: 'S' } }], { id: 'a', date: '2026-11-13', series: { id: 'S' } }).map(x => x.id).join(','));
