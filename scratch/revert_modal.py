import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_modal_content = """
    <!-- Manager Management Modal -->
    <div id="modal-manager-management" class="modal-overlay">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3 style="display: flex; align-items: center; gap: 8px;">👥 현장 매니저 계정 & 담당 아티스트 배정</h3>
          <div id="mgr-modal-slot-badge" style="font-size:12px; background:var(--bg-card); color:var(--text-main); padding:4px 8px; border-radius:4px; margin-left:10px;">슬롯: -/-</div>
          <button class="btn-close" data-close="modal-manager-management">×</button>
        </div>
        <div class="modal-body">
          
          <div style="background:var(--bg-card); border-radius:var(--radius-md); padding:15px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-color);">
            <div style="font-size:13px; color:var(--text-main);">💡 각 매니저에게 소속 아티스트를 배정하면, 매니저 로그인 시 배정된 아티스트 일정만 격리됩니다.</div>
            <button class="btn-secondary" style="padding:6px 12px; font-size:12px; border-color:var(--primary-light);">💳 슬롯 추가</button>
          </div>

          <div id="manager-mgmt-list" style="display:flex; flex-direction:column; gap:10px; margin-bottom: 30px;">
            <!-- Managers will be rendered here -->
          </div>

          <form id="form-create-manager" style="margin-bottom: 10px;">
            <h4 style="margin-bottom: 15px; font-size: 15px; display:flex; align-items:center; gap:5px;">➕ 신규 매니저 계정 생성</h4>
            <div id="mgr-form-slot-warning" style="display:none; color: #ef4444; font-size: 12px; margin-bottom: 10px;">더 이상 매니저를 생성할 수 없습니다.</div>
            
            <div class="form-row">
              <div class="form-group">
                <input type="text" id="new-mgr-name" class="form-input" placeholder="이름" required>
              </div>
              <div class="form-group" style="display: flex; align-items: center; gap: 5px;">
                <input type="text" id="new-mgr-email-id" class="form-input" placeholder="아이디" required style="flex:1;">
                <span id="new-mgr-email-domain" style="color:var(--text-main); font-size:13px; white-space:nowrap;">@star-ent.com</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <input type="password" id="new-mgr-pw" class="form-input" placeholder="비밀번호" required>
              </div>
              <div class="form-group">
                <input type="text" id="new-mgr-phone" class="form-input" placeholder="연락처">
              </div>
            </div>
            
            <div style="display:flex; justify-content:flex-end; margin-top: 15px;">
              <button type="submit" id="btn-submit-mgr-create" class="btn-primary">매니저 계정 생성</button>
            </div>
          </form>

        </div>
        <div style="padding: 15px 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
          <button type="button" class="btn-secondary" data-close="modal-manager-management" style="padding: 8px 24px;">닫기</button>
        </div>
      </div>
    </div>
"""

# Replace the modal-manager-management block
html = re.sub(
    r'<!-- Manager Management Modal -->\s*<div id="modal-manager-management".*?(<!-- Noti Form -->|<script)',
    new_modal_content.strip() + '\n\n    \\1',
    html,
    flags=re.DOTALL
)

# Also fix ALL other `data-close="#` to `data-close="`
html = html.replace('data-close="#', 'data-close="')

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
