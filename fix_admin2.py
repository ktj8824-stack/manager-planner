import re

with open('c:/Users/giga/Downloads/influ/매니저플래너/admin.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'<button[^>]*id="btn-today"[^>]*>.*?</button>', '<button id="btn-today" class="btn-util">오늘</button>', text)
text = re.sub(r'<div class="calendar-day-header sunday">.*?</div>', '<div class="calendar-day-header sunday">일</div>', text)
text = re.sub(r'<div class="calendar-day-header saturday">.*?</div>', '<div class="calendar-day-header saturday">토</div>', text)

parts = text.split('<div class="calendar-day-header">')
if len(parts) == 6:
    text = parts[0] + '<div class="calendar-day-header">월</div>' + \
           parts[1].split('</div>', 1)[1] + '<div class="calendar-day-header">화</div>' + \
           parts[2].split('</div>', 1)[1] + '<div class="calendar-day-header">수</div>' + \
           parts[3].split('</div>', 1)[1] + '<div class="calendar-day-header">목</div>' + \
           parts[4].split('</div>', 1)[1] + '<div class="calendar-day-header">금</div>' + \
           parts[5].split('</div>', 1)[1]

# Re-add placeholders for input fields based on context
text = re.sub(r'id="new-artist-name"[^>]*>', 'id="new-artist-name" class="form-input" placeholder="예: 뉴웨이브, 한지민" />', text)
text = re.sub(r'id="new-artist-image"[^>]*>', 'id="new-artist-image" class="form-input" placeholder="https://example.com/photo.jpg" value="" />', text)

# Fix some missing labels or garbled text we missed
text = re.sub(r'<!--.*?-->', '', text) # remove any garbled comments just in case
text = re.sub(r'\?\?\?', '', text) # clean up some literal question marks if left outside tags

with open('c:/Users/giga/Downloads/influ/매니저플래너/admin.html', 'w', encoding='utf-8') as f:
    f.write(text)
