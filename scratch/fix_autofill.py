import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix email-id input
html = html.replace(
    '<input type="text" id="new-mgr-email-id" placeholder="아이디" required style="width: 100%; padding: 12px 100px 12px 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-body, #f8fafc); font-size: 14px; outline: none; box-sizing: border-box;">',
    '<input type="text" id="new-mgr-email-id" placeholder="아이디" required autocomplete="off" style="width: 100%; padding: 12px 100px 12px 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-body, #f8fafc); font-size: 14px; outline: none; box-sizing: border-box;">'
)

# Fix password input
html = html.replace(
    '<input type="password" id="new-mgr-pw" placeholder="비밀번호" required style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-body, #f8fafc); font-size: 14px; outline: none; box-sizing: border-box;">',
    '<input type="password" id="new-mgr-pw" placeholder="비밀번호" required autocomplete="new-password" style="width: 100%; padding: 12px 16px; border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; background: var(--bg-body, #f8fafc); font-size: 14px; outline: none; box-sizing: border-box;">'
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
