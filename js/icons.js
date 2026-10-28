/*
 * icons.js — 화면의 컬러 이모지를 같은 의미의 선(line) 아이콘으로 자동 교체합니다.
 *
 *  - 화면(DOM)에 나타난 글자 중 이모지만 바꾸므로, 저장된 데이터와 기존 코드는 그대로 둡니다.
 *  - 아이콘 색은 주변 글자 색(currentColor)을 따라가서 라이트/다크 모드에 모두 맞습니다.
 *  - 아이콘을 넣을 수 없는 곳(option, textarea, 입력칸 안내문, 알림창, 탭 제목)은 이모지만 제거합니다.
 *  - ★ ☆ ✓ ✕ → ↔ 같은 단색 글자 기호는 그대로 둡니다.
 *  - 아이콘 모양은 Lucide(MIT 라이선스) 스타일을 따릅니다.
 */
(function () {
  'use strict';
  if (window.__iconsLoaded) return;
  window.__iconsLoaded = true;

  // 24x24, stroke 기반 아이콘 경로
  var P = {
    film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    siren: '<path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/><path d="M21 12h1M2 12h1M12 2v1M4.93 4.93l.7.7M19.07 4.93l-.7.7M12 12v6"/>',
    car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    bus: '<path d="M8 6v6M16 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    spark: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    crown: '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.3l4.28-3.67a.5.5 0 0 1 .8.52l-2.84 10.25a1 1 0 0 1-.96.73H5.81a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.67a1 1 0 0 0 1.52-.3z"/><path d="M5 21h14"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    brush: '<path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    call: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pushpin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
    xc: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
    bank: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2 3 7h18z"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
    coffee: '<path d="M10 2v2M14 2v2M6 2v2M16 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    flask: '<path d="M10 2v7.53a2 2 0 0 1-.21.9L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.07-10.13a2 2 0 0 1-.21-.9V2M8.5 2h7M7 16h10"/>',
    tv: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    tent: '<path d="M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20"/>',
    brief: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    head: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
    laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    sprout: '<path d="M7 20h10M10 20c5.5-2.5.8-6.4 3-10M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8zM14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    signal: '<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    map: '<path d="M14.11 5.55a2 2 0 0 0 1.78 0l3.66-1.83A1 1 0 0 1 21 4.62v12.76a1 1 0 0 1-.55.89l-4.55 2.28a2 2 0 0 1-1.79 0l-4.21-2.1a2 2 0 0 0-1.79 0l-3.66 1.83A1 1 0 0 1 3 19.38V6.62a1 1 0 0 1 .55-.89l4.55-2.28a2 2 0 0 1 1.79 0z"/><path d="M15 5.76v15M9 3.24v15"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    hospital: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>',
    bot: '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    note: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
    traffic: '<rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="7" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="17" r="1"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>'
  };

  // 이모지 → 아이콘 이름 / { dot: 색 } / 글자 / '' (제거)
  var MAP = {
    '🎬': 'film', '🎥': 'film', '✅': 'check', '✔': 'check', '☑': 'check', '⚠': 'alert', '🚨': 'siren',
    '🚗': 'car', '🚙': 'car', '🚕': 'car', '🚐': 'bus', '🚌': 'bus', '📍': 'pin', '🗺': 'map',
    '⏰': 'clock', '🕒': 'clock', '⏱': 'clock', '⌚': 'clock', '⏳': 'hourglass', '📅': 'cal', '🗓': 'cal', '📆': 'cal',
    '👤': 'user', '👔': 'user', '👗': 'user', '👥': 'users', '🔒': 'lock', '🔐': 'lock', '🏢': 'building',
    '📢': 'mega', '📣': 'mega', '⚡': 'zap', '✨': 'spark', '🎉': 'spark', '🌟': 'star', '⭐': 'star',
    '👑': 'crown', '🏁': 'flag', '💄': 'brush', '🎨': 'brush', '💳': 'card', '📱': 'phone', '📞': 'call',
    '📌': 'pushpin', '❌': 'xc', '❎': 'xc', '🔥': 'flame', '💬': 'msg', '💡': 'bulb', '🏦': 'bank',
    '🎤': 'mic', '🎙': 'mic', '☕': 'coffee', '🔍': 'search', '🛡': 'shield', '⚙': 'gear', '💾': 'save',
    '🧪': 'flask', '📺': 'tv', '📸': 'camera', '🎪': 'tent', '🎡': 'tent', '💼': 'brief', '🎒': 'brief',
    '🎧': 'head', '🔔': 'bell', '📋': 'clip', '💊': 'pill', '🏠': 'home', '💇': 'scissors', '✂': 'scissors',
    '💻': 'laptop', '🚪': 'logout', '☁': 'cloud', '📧': 'mail', '💌': 'mail', '🎸': 'music', '🎵': 'music',
    '✈': 'plane', '🌱': 'sprout', '🌾': 'sprout', '📶': 'signal', '📡': 'signal', '✏': 'pencil', '🗑': 'trash',
    '📏': 'ruler', '☀': 'sun', '🚫': 'ban', '🏥': 'hospital', '🤖': 'bot', '🔧': 'wrench', '📝': 'note',
    '🚦': 'traffic', '⏸': 'pause', '🆔': 'mail',
    // 음식: 모두 식사(수저) 아이콘
    '🍲': 'food', '🥪': 'food', '🥩': 'food', '🍱': 'food', '🍽': 'food', '🥘': 'food', '🍖': 'food', '🍷': 'food',
    '🥬': 'food', '🍗': 'food', '🍙': 'food', '🍜': 'food', '🍏': 'food',
    // 색 점
    '🟡': { dot: '#f5b301' }, '🟢': { dot: '#22c55e' }, '🔵': { dot: '#3b82f6' }, '🔴': { dot: '#ef4444' }, '🔷': { dot: '#3b82f6' },
    // 글자로 대체 / 제거
    '➡': '→', '⬅': '←', '⬆': '↑', '⬇': '↓',
    '🎭': 'spark', '👏': '', '🧤': '', '🧺': '', '👍': '', '🙏': '', '😊': '', '🎁': 'spark'
  };

  // 그대로 두는 단색 기호
  var KEEP = '★☆✓✕✗✘➔➜☰↔↗→←↑↓';

  var EMOJI_RE = /(?:[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{2B00}-\u{2BFF}]|[\u{23E9}-\u{23FF}]|[⌚⌛])(?:️|⃣)?(?:‍(?:[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}])️?)*/gu;
  var HAS_EMOJI = new RegExp(EMOJI_RE.source, 'u');
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, TITLE: 1, NOSCRIPT: 1, CODE: 0 };

  function key(e) { return e.replace(/[️⃣]/g, '').split('‍')[0]; }

  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[name] + '</svg>';
  }
  function dotSvg(color) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="' + color + '"/></svg>';
  }

  // 글자만 필요한 곳용: 이모지 제거(기호 글자는 유지)
  function strip(str) {
    return String(str).replace(EMOJI_RE, function (m) {
      var k = key(m);
      if (KEEP.indexOf(k) !== -1) return m;
      if (!(k in MAP)) return m;              // 목록에 없는 이모지는 그대로 둔다
      var v = MAP[k];
      return (typeof v === 'string' && v && !P[v]) ? v : '';
    });
  }
  window.Icons = { svg: svg, strip: strip, names: Object.keys(P) };

  function makeIcon(m) {
    var k = key(m);
    if (KEEP.indexOf(k) !== -1) return null;
    if (!(k in MAP)) return null;            // 목록에 없는 이모지는 그대로 둔다
    var v = MAP[k];
    var span = document.createElement('span');
    span.className = 'ic';
    span.setAttribute('aria-hidden', 'true');
    if (v && typeof v === 'object' && v.dot) span.innerHTML = dotSvg(v.dot);
    else if (typeof v === 'string' && P[v]) span.innerHTML = svg(v);
    else if (typeof v === 'string' && v) return document.createTextNode(v);
    else return document.createTextNode('');
    return span;
  }

  function inSkipped(node) {
    for (var el = node.parentNode; el && el.nodeType === 1; el = el.parentNode) {
      if (SKIP_TAGS[el.tagName] === 1) return true;
      if (el.isContentEditable) return true;
    }
    return false;
  }
  function inNoHtml(node) {
    // option, svg 안에서는 HTML 아이콘을 넣을 수 없으므로 제거만 한다
    for (var el = node.parentNode; el && el.nodeType === 1; el = el.parentNode) {
      if (el.tagName === 'OPTION' || el.tagName === 'OPTGROUP' || el.namespaceURI === 'http://www.w3.org/2000/svg') return true;
    }
    return false;
  }

  function handleText(node) {
    var text = node.nodeValue;
    if (!text || !node.parentNode || !HAS_EMOJI.test(text) || inSkipped(node)) return;
    if (inNoHtml(node)) { node.nodeValue = strip(text).replace(/^\s+/, ''); return; }
    var frag = document.createDocumentFragment(), last = 0, m;
    EMOJI_RE.lastIndex = 0;
    while ((m = EMOJI_RE.exec(text))) {
      var icon = makeIcon(m[0]);
      if (icon === null) continue; // 유지 기호
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      frag.appendChild(icon);
      last = m.index + m[0].length;
    }
    if (last === 0) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function handleAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (v && HAS_EMOJI.test(v)) el.setAttribute(ATTRS[i], strip(v).replace(/^\s+/, ''));
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { handleText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && (root.classList.contains('ic') || SKIP_TAGS[root.tagName] === 1)) return;
    var list = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = tw.nextNode())) { if (n.nodeValue && HAS_EMOJI.test(n.nodeValue)) list.push(n); }
    for (var i = 0; i < list.length; i++) handleText(list[i]);
    if (root.nodeType === 1) {
      handleAttrs(root);
      var els = root.querySelectorAll('[placeholder],[title],[aria-label],[alt]');
      for (var j = 0; j < els.length; j++) handleAttrs(els[j]);
    }
  }

  function injectStyle() {
    if (document.getElementById('icons-style')) return;
    var s = document.createElement('style');
    s.id = 'icons-style';
    s.textContent = '.ic{display:inline-flex;align-items:center;justify-content:center;width:1.1em;height:1.1em;vertical-align:-0.2em;flex:none;line-height:1}' +
      '.ic svg{width:100%;height:100%;display:block}';
    (document.head || document.documentElement).appendChild(s);
  }

  function fixTitle() { if (document.title && HAS_EMOJI.test(document.title)) document.title = strip(document.title).replace(/^\s+/, ''); }

  // 알림창은 아이콘을 넣을 수 없으므로 이모지만 제거
  ['alert', 'confirm', 'prompt'].forEach(function (fn) {
    var orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function (msg) {
      var a = Array.prototype.slice.call(arguments);
      if (typeof a[0] === 'string') a[0] = strip(a[0]).replace(/^\s+/, '');
      return orig.apply(window, a);
    };
  });

  injectStyle();
  var obs = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.type === 'characterData') { handleText(r.target); continue; }
      if (r.type === 'attributes') { handleAttrs(r.target); continue; }
      for (var j = 0; j < r.addedNodes.length; j++) walk(r.addedNodes[j]);
    }
    fixTitle();
  });
  function start() {
    injectStyle();
    walk(document.body || document.documentElement);
    fixTitle();
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // DOMContentLoaded 전에도 감시를 시작해 깜빡임(이모지가 잠깐 보이는 현상)을 줄임
  if (document.readyState === 'loading') obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
