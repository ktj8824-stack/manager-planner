import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Change the button text
html = html.replace('👥 매니저 계정/배정', '👥 매니저 관리')

# 2. Replace the modal-manager-management content
new_modal_content = """
    <!-- Manager Management Modal -->
    <div id="modal-manager-management" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>👥 매니저 관리</h3>
          <div id="mgr-modal-slot-badge" style="font-size:12px; background:#475569; padding:4px 8px; border-radius:4px; margin-left:10px;">슬롯: -/-</div>
          <button class="btn-close" data-close="#modal-manager-management">×</button>
        </div>
        <div class="modal-body">
          <form id="form-create-manager" style="margin-bottom: 20px; padding: 15px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 10px; font-size: 14px;">✨ 신규 매니저 계정 생성</h4>
            <div id="mgr-form-slot-warning" style="display:none; color: #ef4444; font-size: 12px; margin-bottom: 10px;">더 이상 매니저를 생성할 수 없습니다.</div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">이름</label>
                <input type="text" id="new-mgr-name" class="form-input" required>
              </div>
              <div class="form-group">
                <label class="form-label">연락처</label>
                <input type="text" id="new-mgr-phone" class="form-input" placeholder="010-0000-0000">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">이메일 아이디</label>
                <div style="display: flex; align-items: center; gap: 5px;">
                  <input type="text" id="new-mgr-email-id" class="form-input" required style="flex:1;">
                  <span id="new-mgr-email-domain" style="color:var(--text-main);">@star-ent.com</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">비밀번호</label>
                <input type="password" id="new-mgr-pw" class="form-input" required>
              </div>
            </div>
            <button type="submit" id="btn-submit-mgr-create" class="btn-primary" style="width:100%; margin-top: 10px;">새 매니저 생성</button>
          </form>

          <h4 style="margin-bottom: 10px; font-size: 14px;">등록된 매니저 목록</h4>
          <div id="manager-mgmt-list" style="display:flex; flex-direction:column; gap:10px;">
            <!-- Managers will be rendered here -->
          </div>
        </div>
      </div>
    </div>
"""

# Regex to replace the entire modal-manager-management block
html = re.sub(
    r'<!-- Manager Management Modal -->\s*<div id="modal-manager-management".*?</div>\s*</div>\s*</div>',
    new_modal_content.strip(),
    html,
    flags=re.DOTALL
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
