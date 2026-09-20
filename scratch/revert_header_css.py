import re

with open('css/admin.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Revert main-header
css = re.sub(
    r'\.main-header\s*\{[^}]*\}',
    '''.main-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
}''',
    css
)

# Revert header-title-group block
css = css.replace('''.header-title-group {
    flex-shrink: 0;
    white-space: nowrap;
}

.header-title-group h2 {''', '.header-title-group h2 {')

# Revert header-actions
css = re.sub(
    r'\.header-actions\s*\{[^}]*\}',
    '''.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}''',
    css
)

with open('css/admin.css', 'w', encoding='utf-8') as f:
    f.write(css)
