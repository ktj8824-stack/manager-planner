import re

with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_hidden_fields = '''
          <input type="checkbox" id="form-shop-needed" style="display:none;">
          <div id="shop-fields" style="display:none;"></div>
          <input type="hidden" id="form-shop-name">
          <input type="number" id="form-shop-duration" style="display:none;" value="90">
          <input type="hidden" id="form-shop-address">
          <input type="hidden" id="form-departure-place">
'''

# Find the existing hidden fields block and inject these
html = html.replace('<!-- Hidden fields required by admin.js to prevent crashes -->', '<!-- Hidden fields required by admin.js to prevent crashes -->\n' + new_hidden_fields)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
