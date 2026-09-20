import re

with open('css/admin.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Update main-header to allow wrapping and add gap
css = re.sub(
    r'\.main-header\s*\{[^}]*\}',
    '''.main-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
}''',
    css
)

# Find where .header-title-group h2 is defined and inject .header-title-group rule before it
title_group_css = '''.header-title-group {
    flex-shrink: 0;
    white-space: nowrap;
}

.header-title-group h2 {'''

if '.header-title-group {' not in css:
    css = css.replace('.header-title-group h2 {', title_group_css)

# Update header-actions to also allow wrap if necessary
css = re.sub(
    r'\.header-actions\s*\{[^}]*\}',
    '''.header-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
}''',
    css
)

with open('css/admin.css', 'w', encoding='utf-8') as f:
    f.write(css)
