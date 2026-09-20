import re

with open('js/admin.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

def has_broken(line):
    return '\ufffd' in line

for i, line in enumerate(lines):
    if not has_broken(line):
        continue
    
    lineno = i + 1
    
    # Fix status checks - replace broken Korean status values
    if "sch.status ===" in line:
        line = re.sub(r"'[^']*\ufffd[^']*'", lambda m: fix_status_val(m.group(0)), line)
    
    # Fix any other broken single-char/short broken strings
    # Pattern: a broken string is '...? or ?...' - just short strings with ? chars
    # Replace any short single-quoted string with broken chars with empty string
    line = re.sub(r"'\s*[\ufffd?]+\s*'", "''", line)
    
    lines[i] = line

def fix_status_val(s):
    s_lower = s.lower()
    # Map based on length/context
    # '?대룞以? -> '이동중'  (3 chars broken)
    # '?듭쭊?? -> '미용실'  
    # '?꾨즺' -> '완료'
    if len(s) > 10:
        return "'이동중'"
    elif '쭊' in s or '듭' in s:
        return "'미용샵'"
    elif '즺' in s or '꾨' in s:
        return "'완료'"
    return s

with open('js/admin.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done")
