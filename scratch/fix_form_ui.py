import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Define the precise, exact form layout
new_form = """
          <form id="form-create-manager" style="margin-top: 20px;">
            <h4 style="margin-bottom: 15px; font-size: 15px; display:flex; align-items:center; gap:5px; font-weight: 600;">➕ 신규 매니저 계정 생성</h4>
            <div id="mgr-form-slot-warning" style="display:none; color: #ef4444; font-size: 12px; margin-bottom: 10px;">더 이상 매니저를 생성할 수 없습니다.</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <input type="text" id="new-mgr-name" placeholder="이름" required style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-body, #f8fafc); font-size: 14px; outline: none; box-sizing: border-box;">
              
              <div style="position: relative;">
                <input type="text" id="new-mgr-email-id" placeholder="아이디" required style="width: 100%; padding: 12px 100px 12px 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-body, #f8fafc); font-size: 14px; outline: none; box-sizing: border-box;">
                <span id="new-mgr-email-domain" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 14px;">@star-ent.com</span>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
              <input type="password" id="new-mgr-pw" placeholder="비밀번호" required style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-body, #f8fafc); font-size: 14px; outline: none; box-sizing: border-box;">
              
              <input type="text" id="new-mgr-phone" placeholder="연락처" style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-body, #f8fafc); font-size: 14px; outline: none; box-sizing: border-box;">
            </div>
            
            <div style="display:flex; justify-content:flex-end;">
              <button type="submit" id="btn-submit-mgr-create" style="padding: 10px 24px; font-size: 14px; font-weight: 500; border-radius: 20px; background: #6366f1; color: white; border: none; cursor: pointer;">매니저 계정 생성</button>
            </div>
          </form>
"""

# Find the form-create-manager block and replace it
html = re.sub(
    r'<form id="form-create-manager".*?</form>',
    new_form.strip(),
    html,
    flags=re.DOTALL
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
