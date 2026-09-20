const fs = require('fs');
const path = require('path');

// Read files
const utilsJs = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
const dataJs = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const timelineJs = fs.readFileSync(path.join(__dirname, '../js/timeline.js'), 'utf8');
const homeJs = fs.readFileSync(path.join(__dirname, '../js/home.js'), 'utf8');

// Mock browser globals
global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.navigator = { clipboard: { writeText: async () => {} } };
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null
};

// Evaluate scripts
eval(utilsJs);
eval(dataJs);
eval(timelineJs);
eval(homeJs);

console.log('--- Testing State and Timeline ---');

// Mock schedule
const mockSchedule = {
  id: 'sch_test_1',
  artistName: '아이브',
  date: '2026-09-10',
  status: '예정',
  timeline: [
    { time: '08:00', label: '🚗 픽업 및 출발', done: false },
    { time: '09:00', label: '💄 샵 도착 (헤어/메이크업)', done: false },
    { time: '11:00', label: '🎬 현장 도착 및 대기', done: false },
    { time: '13:00', label: '🏁 메인 스케줄 시작', done: false }
  ]
};

State.schedules = [mockSchedule];
State.currentScheduleIdx = 0;
Timeline.schedIdx = 0;

console.log('Initial timeline steps:', Timeline.getTimelineSteps(mockSchedule));
console.log('Initial progress button:', Timeline.renderStatusProgress(mockSchedule));

// Test advanceStatus
Timeline.advanceStatus();
console.log('\nAfter 1st advanceStatus:');
console.log('Timeline step 0 done state:', mockSchedule.timeline[0].done);
console.log('Next progress button:', Timeline.renderStatusProgress(mockSchedule));

Timeline.advanceStatus();
console.log('\nAfter 2nd advanceStatus:');
console.log('Timeline step 1 done state:', mockSchedule.timeline[1].done);
console.log('Next progress button:', Timeline.renderStatusProgress(mockSchedule));

// Test Home.setHQRouteStatus
window.hqStore = {
  schedules: [mockSchedule],
  getSchedules: function() { return this.schedules; },
  updateSchedule: function(id, updates) {
    Object.assign(this.schedules.find(s => s.id === id), updates);
  }
};

console.log('\n--- Testing Home.setHQRouteStatus ---');
Home.updateRightTimeline = () => console.log('Home.updateRightTimeline called');
Home.setHQRouteStatus('sch_test_1', 2, '완료');
console.log('Step 2 done state:', mockSchedule.timeline[2].done);
console.log('Schedule overall status:', mockSchedule.status);

Home.setHQRouteStatus('sch_test_1', 3, '완료');
console.log('Step 3 done state:', mockSchedule.timeline[3].done);
console.log('Schedule overall status after all done:', mockSchedule.status);

console.log('\n--- TEST SUCCESSFUL ---');
