import re

with open('js/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the conflict warning confirm with just logging or bypassing it
old_conflict_code = """
        // 🔹 배차/매니저 중복 충돌 검사
        if (window.hqStore && window.hqStore.checkConflict) {
          const conflictResult = window.hqStore.checkConflict(schData);
          if (conflictResult.hasConflict) {
            const warnMsgs = conflictResult.conflicts.map(c => {
              if (c.type === 'vehicle') {
                return `🚨 [${c.vehicleName}] 차량이 동일 시간대(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'에 이미 배정되어 있습니다.`;
              } else {
                return `🚨 [${c.managerName}] 매니저가 동일 시간대(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'에 이미 배정되어 있습니다.`;
              }
            }).join('\\n');
  
            const proceed = confirm(`⚠️ [배차/배정 중복 경고]\\n\\n${warnMsgs}\\n\\n동일 시간대 중복 배차가 발생합니다. 그래도 스케줄을 추가하시겠습니까?`);
            if (!proceed) {
              return; // 저장 취소
            }
          }
        }
"""

new_conflict_code = """
        // 🔹 배차/매니저 중복 충돌 검사 (무조건 저장하도록 경고창 생략)
        if (window.hqStore && window.hqStore.checkConflict) {
          const conflictResult = window.hqStore.checkConflict(schData);
          if (conflictResult.hasConflict) {
             console.log("중복 배차가 발생했지만 무조건 저장합니다.");
             // confirm 창 띄우지 않고 바로 통과
          }
        }
"""

js = js.replace(old_conflict_code.strip(), new_conflict_code.strip())

# If the exact string replace fails, use regex
if "무조건 저장하도록 경고창 생략" not in js:
    js = re.sub(
        r'// 🔹 배차/매니저 중복 충돌 검사.*?if \(!proceed\) \{\s*return; // 저장 취소\s*\}\s*\}\s*\}',
        new_conflict_code.strip(),
        js,
        flags=re.DOTALL
    )

with open('js/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)
