import re
with open('c:/Users/giga/Downloads/influ/매니저플래너/js/admin.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace emoji property access with image
text = re.sub(r"document\.getElementById\('new-artist-emoji'\)\.value \|\| '✨'", "document.getElementById('new-artist-image').value || ''", text)
text = re.sub(r"document\.getElementById\('new-artist-emoji'\)\.value = art\.emoji \|\| '✨';", "document.getElementById('new-artist-image').value = art.image || '';", text)

# Replace the rendered emoji with an image tag. Using string replace to avoid regex issues with complex backticks
old_html = r"""<div class="artist-avatar" style="background:${art.color}">${art.emoji || '✨'}</div>"""
new_html = r"""<div class="artist-avatar" style="background:${art.color}; overflow:hidden; display:flex; align-items:center; justify-content:center;">${art.image ? `<img src="${art.image}" style="width:100%;height:100%;object-fit:cover;">` : (art.emoji || '✨')}</div>"""
text = text.replace(old_html, new_html)

old_html2 = r"""<div style="width:36px; height:36px; border-radius:8px; background:${art.color}; display:flex; align-items:center; justify-content:center; font-size:18px;">
              ${art.emoji || '✨'}
            </div>"""
new_html2 = r"""<div style="width:36px; height:36px; border-radius:8px; background:${art.color}; display:flex; align-items:center; justify-content:center; font-size:18px; overflow:hidden;">
              ${art.image ? `<img src="${art.image}" style="width:100%;height:100%;object-fit:cover;">` : (art.emoji || '✨')}
            </div>"""
text = text.replace(old_html2, new_html2)

# Also fix the object creation
text = text.replace("emoji: document.getElementById('new-artist-image').value || ''", "image: document.getElementById('new-artist-image').value || ''")
# The previous multi_replace had a minor error if it matched twice. Just brute force replace:
text = text.replace("emoji: document.getElementById('new-artist-emoji').value || '✨'", "image: document.getElementById('new-artist-image').value || ''")

with open('c:/Users/giga/Downloads/influ/매니저플래너/js/admin.js', 'w', encoding='utf-8') as f:
    f.write(text)
