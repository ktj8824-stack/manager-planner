from bs4 import BeautifulSoup
import re

with open('c:/Users/giga/Downloads/influ/매니저플래너/admin.html', 'r', encoding='utf-8', errors='replace') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
tags_to_fix = []
for tag in soup.find_all(string=True):
    text = tag.strip()
    if '\ufffd' in text or '?' in text:
        parent = tag.parent
        if parent:
            tag_id = parent.get('id', '')
            tag_class = ' '.join(parent.get('class', []))
            print(f"<{parent.name} id='{tag_id}' class='{tag_class}'> {repr(text)}")
