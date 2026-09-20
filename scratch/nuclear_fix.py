import re

with open('css/admin.css', 'r', encoding='utf-8') as f:
    css = f.read()

force_css = '''
/* --- NUCLEAR LAYOUT FIX --- */
body {
    width: 100vw !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
}
.app-container {
    width: 100vw !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
}
.hq-main {
    flex: 1 !important;
    min-width: calc(100vw - 280px) !important;
    width: calc(100vw - 280px) !important;
    max-width: calc(100vw - 280px) !important;
}
.hq-main > * {
    width: 100% !important;
    min-width: 100% !important;
}
.header-title-group h2 {
    white-space: nowrap !important;
}
'''

if '/* --- NUCLEAR LAYOUT FIX --- */' not in css:
    css += force_css

with open('css/admin.css', 'w', encoding='utf-8') as f:
    f.write(css)
