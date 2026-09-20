with open('admin.html', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('class="modal-overlay" style="display:none;"', 'class="modal-overlay"')
text = text.replace('class="modal-overlay" style="display: none;"', 'class="modal-overlay"')
with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(text)
