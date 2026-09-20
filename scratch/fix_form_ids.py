import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix IDs in the actual schedule modal to match admin.js
replacements = {
    'id="schedule-id"': 'id="form-sch-id"',
    'id="sch-title"': 'id="form-title"',
    'id="sch-artist"': 'id="form-artist"',
    'id="sch-type"': 'id="form-category"',
    'id="sch-start"': 'id="form-start-time"',
    'id="sch-end"': 'id="form-end-time"',
    'id="sch-location"': 'id="form-location"',
    'id="sch-manager"': 'id="form-manager"'
}

for old, new in replacements.items():
    html = html.replace(old, new)

# Remove the hidden dummy fields that I appended earlier
html = re.sub(r'<div style="display:none;" id="missing-schedule-fields">.*?</div>', '', html, flags=re.DOTALL)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
