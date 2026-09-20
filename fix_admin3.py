import re

with open('c:/Users/giga/Downloads/influ/매니저플래너/admin.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('id="new-artist-emoji"', 'id="new-artist-image"')
text = re.sub(r'class="section-title">.*?<', 'class="section-title">🌟 아티스트 목록<', text)
text = re.sub(r'<h3>.*?매니저.*?</h3>', '<h3>매니저 설정</h3>', text)

with open('c:/Users/giga/Downloads/influ/매니저플래너/admin.html', 'w', encoding='utf-8') as f:
    f.write(text)
