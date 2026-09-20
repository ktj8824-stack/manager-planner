import re

with open('js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the block that creates the confirm dialog in checkConflict
js = re.sub(
    r'const proceed = confirm\(.*?\);.*?if \(!proceed\) \{.*?return;.*?\}',
    'const proceed = true; // 무조건 저장 (confirm 생략)',
    js,
    flags=re.DOTALL
)

with open('js/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)
