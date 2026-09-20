import re
html = open('admin.html', encoding='utf8').read()
js = open('js/admin.js', encoding='utf8').read()
ids = re.findall(r"getElementById\(['"']([^'"']+)['"']\)", js)
missing = [i for i in ids if f'id="{i}"' not in html and f'id='{i}'' not in html]
print('Missing IDs in admin.html:', set(missing))
