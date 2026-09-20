import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

hidden_fields = '''
          <!-- Hidden fields required by admin.js to prevent crashes -->
          <input type="hidden" id="form-date">
          <input type="hidden" id="form-vehicle">
          <input type="hidden" id="form-notes">
          <input type="hidden" id="form-status">
          <input type="checkbox" id="form-is-secret" style="display:none;">
'''

# Insert the hidden fields right after <form id="form-schedule">
html = html.replace('<form id="form-schedule">', f'<form id="form-schedule">\n{hidden_fields}')

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
