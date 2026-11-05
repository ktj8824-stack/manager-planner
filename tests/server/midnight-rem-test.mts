import { stepDayOffsets } from '../../supabase/functions/reminders/logic.ts';
const tl = [{ time: '21:55', label: '[픽업 출발] 숙소 픽업' }, { time: '22:20', label: '[샵] 정샘물' }, { time: '00:20', label: '[현장 이동] 출발' }, { time: '01:00', label: '[메인 일정] 출국' }, { time: '03:00', label: '[현장 철수]' }];
console.log(JSON.stringify({ offs: stepDayOffsets(tl, '01:00'), late: stepDayOffsets([{ time: '22:00', label: '[메인 일정] 공연' }, { time: '01:30', label: '[현장 철수]' }], '22:00') }));
