import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove missingManagerModal dummy
html = re.sub(
    r'<form id="form-create-manager" style="display:none;">.*?</form>',
    '',
    html,
    flags=re.DOTALL
)

# Remove managerMgmt dummy
html = re.sub(
    r'<div style="display:none;">\s*<div id="mgr-modal-slot-badge"></div>\s*<div id="mgr-form-slot-warning"></div>\s*<button id="btn-submit-mgr-create"></button>\s*<div id="manager-mgmt-list"></div>\s*</div>',
    '',
    html,
    flags=re.DOTALL
)

# Also fix the email input layout to perfectly match Image 2
email_input_old = '''<div class="form-group" style="display: flex; align-items: center; gap: 5px;">
                <input type="text" id="new-mgr-email-id" class="form-input" placeholder="아이디" required style="flex:1;">
                <span id="new-mgr-email-domain" style="color:var(--text-main); font-size:13px; white-space:nowrap;">@star-ent.com</span>
              </div>'''

email_input_new = '''<div class="form-group" style="position: relative;">
                <input type="text" id="new-mgr-email-id" class="form-input" placeholder="아이디" required style="width: 100%; padding-right: 100px;">
                <span id="new-mgr-email-domain" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--text-500); font-size: 13px;">@star-ent.com</span>
              </div>'''

html = html.replace(email_input_old, email_input_new)

# Update button to perfectly match Image 2
btn_old = '<button type="submit" id="btn-submit-mgr-create" class="btn-primary">매니저 계정 생성</button>'
btn_new = '<button type="submit" id="btn-submit-mgr-create" class="btn-primary" style="padding: 10px 20px; font-size: 13px; border-radius: 20px;">매니저 계정 생성</button>'
html = html.replace(btn_old, btn_new)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
