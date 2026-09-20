import re

with open('css/admin.css', 'r', encoding='utf-8') as f:
    css = f.read()

force_css = '''
.hq-main > * {
    width: 100% !important;
    max-width: 100% !important;
}
'''
if force_css not in css:
    css += force_css

with open('css/admin.css', 'w', encoding='utf-8') as f:
    f.write(css)
