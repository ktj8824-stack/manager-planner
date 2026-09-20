const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

const missingScheduleFields = `
<div style="display:none;" id="missing-schedule-fields">
  <input type="hidden" id="form-sch-id">
  <input type="text" id="form-title">
  <select id="form-artist"></select>
  <select id="form-category"></select>
  <input type="date" id="form-date">
  <input type="time" id="form-start-time">
  <input type="time" id="form-end-time">
  <select id="form-manager"></select>
  <select id="form-vehicle"></select>
  <input type="text" id="form-location">
  <input type="checkbox" id="form-shop-needed">
  <div id="shop-fields">
    <input type="text" id="form-shop-name">
    <input type="number" id="form-shop-duration">
    <input type="text" id="form-shop-address">
  </div>
  <input type="text" id="form-departure-place">
  <select id="form-status"></select>
  <input type="checkbox" id="form-is-secret">
  <input type="text" id="form-outfit">
  <textarea id="form-notes"></textarea>
</div>
`;

const missingDetailModal = `
<div id="modal-schedule-detail" class="modal-overlay" style="display:none;">
  <div class="modal-content">
    <div id="detail-body-content"></div>
    <button id="btn-edit-schedule">Edit</button>
    <button id="btn-delete-schedule">Delete</button>
  </div>
</div>
`;

const missingManagerModal = `
<form id="form-create-manager" style="display:none;">
  <input type="text" id="new-mgr-name">
  <input type="text" id="new-mgr-email-id">
  <span id="new-mgr-email-domain">@star.hq</span>
  <input type="password" id="new-mgr-pw">
  <input type="text" id="new-mgr-phone">
</form>
`;

const missingMisc = `
<div id="hover-schedule-popover" style="display:none;"></div>
<div id="kpi-hover-popover" style="display:none;"></div>
<button id="btn-inner-add-artist" style="display:none;"></button>
`;

const roleMisc = `
<div id="hq-role-switcher-badge" style="display:none;">
  <span id="hq-role-badge-icon"></span>
  <span id="hq-role-badge-text"></span>
</div>
<span id="hq-brand-title" style="display:none;"></span>
<div id="modal-role-selector" style="display:none;"><div id="role-selector-list"></div></div>
`;

const sendMsgMisc = `
<form id="form-send-message" style="display:none;">
  <select id="msg-target-manager"></select>
  <input type="text" id="msg-title">
  <textarea id="msg-content"></textarea>
  <input type="checkbox" id="msg-is-urgent">
</form>
<div id="modal-send-message" style="display:none;"></div>
`;

const careInfo = `
<div style="display:none;">
  <input id="care-allergies">
  <input id="care-beverages">
  <input id="care-vehicle">
  <input id="care-emergency">
  <input id="care-contacts">
</div>
`;

const managerMgmt = `
<div style="display:none;">
  <div id="mgr-modal-slot-badge"></div>
  <div id="mgr-form-slot-warning"></div>
  <button id="btn-submit-mgr-create"></button>
  <div id="manager-mgmt-list"></div>
</div>
`;

const subscriptionMisc = `
<div id="modal-company-subscription" style="display:none;">
  <span id="sub-badge-text"></span>
  <div id="sub-company-name"></div>
  <div id="sub-biz-info"></div>
  <div id="sub-monthly-total"></div>
  <div id="sub-slot-progress-text"></div>
  <div id="sub-slot-progress-bar"></div>
  <div id="sub-additional-slot-count"></div>
  <div id="sub-calc-additional-fee"></div>
  <div id="sub-calc-total-fee"></div>
</div>
`;

const supabaseMisc = `
<div id="modal-supabase-config" style="display:none;">
  <input id="cfg-supabase-url">
  <input id="cfg-supabase-key">
  <div id="supabase-status-badge"></div>
  <div id="supabase-status-dot"></div>
  <div id="supabase-status-text"></div>
</div>
`;

// Replace `modal-schedule-title` with `schedule-form-title`
html = html.replace('id="modal-schedule-title"', 'id="schedule-form-title"');

// Insert all missing elements right before </body>
html = html.replace('</body>', 
  missingScheduleFields + 
  missingDetailModal + 
  missingManagerModal + 
  missingMisc + 
  roleMisc + 
  sendMsgMisc + 
  careInfo + 
  managerMgmt + 
  subscriptionMisc + 
  supabaseMisc + 
  '\\n</body>'
);

fs.writeFileSync('admin.html', html);
console.log('Restored missing modals and fields!');
