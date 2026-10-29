# manage-users

회사 CEO/HQ 관리자가 자기 회사의 `manager`/`staff` 계정을 생성·수정하는 Supabase Edge Function입니다. 이 디렉터리의 두 파일만 추가하며, 배포나 원격 요청은 수행하지 않았습니다.

## 보안 규칙

- `Authorization: Bearer <로그인 사용자의 access_token>` 필수. `auth.getUser(token)`으로 실제 사용자를 검증합니다. JWT를 단순 해석하거나 사용자 metadata의 role/company_id를 신뢰하지 않습니다.
- 서버가 `public.profiles`에서 호출자의 `role`과 `company_id`를 조회합니다. `ceo`/`hq_admin`이면서 회사 UUID가 있어야 합니다. 변조된 프로필이 없도록 기존 보안 migration의 프로필 권한/회사 변경 방지 trigger와 RLS를 먼저 적용해야 합니다.
- 생성 역할은 `manager`/`staff`만 허용합니다. 회사는 호출자 DB 프로필에서만 가져옵니다. 요청의 role/company_id 변경이나 추가 필드는 거부합니다.
- 수정은 대상 UUID, 호출자 회사, 대상 `manager`/`staff` 역할을 조회하고 프로필 쓰기에도 같은 조건을 적용합니다. CEO/HQ, 다른 회사 사용자, 개인 사용자는 수정할 수 없습니다.
- Auth 서비스 키는 새 방식 `SUPABASE_SECRET_KEYS`(JSON, `default` 키)를 우선 읽고, 없을 때만 옛 `SUPABASE_SERVICE_ROLE_KEY` 를 읽습니다. 브라우저 코드, 공개 환경 파일, 응답, 로그에 넣지 마세요. 호출자의 JWT로 서비스 클라이언트의 전역 Authorization을 덮어쓰지 않습니다.
- CORS는 환경변수의 정확한 origin allowlist만 반영합니다. `*`, `null`, URL 경로, 끝의 `/`는 허용하지 않습니다. Origin 없는 서버 요청은 사용자 JWT 검증을 통과해야 합니다. CORS는 인증/권한 검사를 대신하지 않습니다.
- 최대 JSON 본문 16 KiB, 비밀번호 8~128자(공백을 trim하지 않음), 이름 1~100자, 전화번호 최대 40자. 프로젝트의 더 엄격한 Auth 비밀번호 정책도 적용됩니다.

## 환경변수 및 수동 배포

관리자가 배포를 결정한 뒤 실행할 절차입니다. 아래 명령은 안내용이며 이번 작업에서는 실행하지 않았습니다.

1. 프로젝트에서 제공하는 서버 환경변수 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`가 함수 런타임에 있는지 확인합니다. 호스팅 Supabase에서는 보통 자동 주입됩니다. 비밀값을 소스에 작성하거나 출력하지 마세요.
2. 배포 환경에서 `MANAGE_USERS_ALLOWED_ORIGINS`를 설정합니다. 쉼표로 구분한 정확한 origin 목록입니다. 예: `https://planner.example.com,https://admin.example.com`. 개발 서버는 필요한 경우에만 `http://localhost:3000`처럼 정확한 포트를 별도로 추가합니다.
3. Supabase Auth에서 이메일 확인 요구 설정을 활성화하고 SMTP/메일 템플릿, redirect URL allowlist, 비밀번호 정책을 검토합니다.
4. `public.profiles`에 `id,email,name,role,phone,company_id,auth_provider,updated_at` 열이 있고 `id`는 PK, `company_id`는 companies FK인지 확인합니다. `profiles.id REFERENCES auth.users(id) ON DELETE CASCADE`가 필요합니다. 회원가입 trigger는 사용자 metadata에서 권한을 가져오지 않고 `indie_manager`/회사 NULL을 기본값으로 생성해야 합니다. 서비스 역할의 프로필 쓰기는 허용해야 합니다.
5. 관리자 셸에서 필요한 커스텀 환경변수를 설정하고 배포합니다. 프로젝트 식별자는 실제 대상 값으로 교체하세요. 서비스 키를 아래 명령에 넣지 마세요.

```powershell
supabase secrets set MANAGE_USERS_ALLOWED_ORIGINS="https://planner.example.com,https://admin.example.com" --project-ref <PROJECT_REF>
supabase functions deploy manage-users --project-ref <PROJECT_REF>
```

기본 gateway JWT 검증을 유지하고 `--no-verify-jwt`는 사용하지 마세요. 함수 내부의 `getUser` 검증도 유지합니다. 로컬 테스트는 서버 전용 환경 파일을 사용하고 Git에 커밋하지 않습니다. SDK import는 Deno 호환 HTTPS URL의 버전 고정 `@supabase/supabase-js@2.49.8`입니다. 최초 런타임 사용 시 모듈 다운로드가 필요하므로 여기서는 실행하지 않았습니다.

## 요청 및 응답

`POST`, `Content-Type: application/json`, 사용자 Bearer token을 사용합니다. `OPTIONS`는 허용된 origin의 preflight 용도입니다. Supabase 브라우저 SDK의 `functions.invoke('manage-users', { body })`를 사용할 수 있으며 로그인 세션의 사용자 token이 전달되어야 합니다. 브라우저에는 공개 publishable/anon 키만 사용합니다.

생성 요청:

```json
{
  "action": "create",
  "email": "member@example.com",
  "password": "<관리자가 안전하게 전달하는 초기 비밀번호>",
  "name": "매니저 이름",
  "role": "manager",
  "phone": "010-0000-0000"
}
```

`role`은 `manager` 또는 `staff`입니다. 전화번호는 생략하거나 null/빈 문자열로 둘 수 있습니다. 성공: HTTP 201, `{"user":{"id":"<UUID>","email":"member@example.com"}}`.

수정 요청:

```json
{
  "action": "update",
  "id": "<같은 회사 manager/staff UUID>",
  "data": {
    "name": "변경 이름",
    "phone": "010-1111-2222",
    "email": "new-member@example.com",
    "password": "<새 비밀번호>"
  }
}
```

`data`는 `name,phone,email,password` 중 필요한 필드만 하나 이상 보내세요. 빈 비밀번호는 허용하지 않으며 비밀번호 변경이 없으면 필드를 생략합니다. 전화번호 null/빈 문자열은 삭제입니다. 성공: HTTP 200, `{"success":true}`. `role`, `company_id`, metadata, 확인 플래그 등은 수정 불가입니다.

오류 형식: `{"error":{"code":"...","message":"..."},"request_id":"..."}`. 일반적으로 400 잘못된 입력, 401 인증 실패, 403 권한/origin 거부, 404 허용 대상 없음, 405 메서드 거부, 409 이메일 충돌, 413 본문 초과, 415 잘못된 Content-Type, 422 Auth 입력 거부, 500 내부/DB 실패, 502/503 Auth 장애입니다. 다른 회사 사용자 존재 여부를 구분해 공개하지 않습니다.

## 이메일 및 실패 처리 정책

- 기존 프런트엔드의 password 기반 생성 계약을 유지하되 `createUser`에는 반드시 `email_confirm:false`를 사용합니다. 기존 이메일 사용자를 찾아 비밀번호를 덮어쓰거나 다른 회사로 옮기는 동작은 없습니다. 이메일 충돌은 오류로 끝납니다.
- `createUser`는 확인 메일을 자동 발송하는 초대 흐름이 아닙니다. **계정 생성 성공을 이메일 확인/로그인 가능 상태로 간주하지 마세요.** 확인 요구 설정과 승인된 확인메일 흐름을 운영자가 준비해야 합니다. 제품 정책을 바꿀 수 있을 때는 초기 비밀번호 전달 대신 `inviteUserByEmail` 또는 검증된 초대/재설정 흐름으로 별도 전환하는 것을 권장합니다.
- 이메일 변경에도 `email_confirm:true`를 쓰지 않고 `false`를 지정합니다. Admin API 변경은 일반 사용자의 이메일 변경 확인 흐름과 같지 않으며 확인 메일 자동 발송을 보장하지 않습니다. 배포한 Auth 버전에서 기존 확인 사용자의 이메일 변경 상태/로그인 제한을 반드시 검증하고, 새 주소 소유권이 확인되기 전 확인된 주소로 취급하지 마세요. 필요하면 이메일 변경을 운영상 제한하고 확인 링크 기반 전용 흐름으로 분리하세요.
- 생성 시 Auth trigger가 먼저 프로필을 만든 경우 새 Auth UUID에 한해서 upsert합니다. 프로필 생성 실패 시 이 요청이 방금 만든 Auth 사용자만 hard delete하고 FK cascade로 프로필을 정리합니다. 삭제 실패는 `CLEANUP_FAILED`와 관리자 로그의 requestId/userId로 알리므로 신뢰된 관리자가 확인해야 합니다. 오류 원문이나 비밀번호/토큰은 기록하지 않습니다.
- Auth와 Postgres 변경은 하나의 트랜잭션이 아닙니다. 수정 중 Auth 변경 이후 프로필 실패는 `UPDATE_PARTIAL`로 명시합니다. 비밀번호를 복원했다고 주장하지 않으며 자동 재시도/임의 재설정을 하지 않습니다. 관리자가 Auth 사용자와 프로필을 대조하고 필요한 이메일/프로필 동기화 및 사용자 안내를 수행하세요.
- 신뢰된 Dashboard 관리자가 요청 도중 호출자/대상의 회사·권한을 이동하는 경쟁 상황은 외부 Auth API와 DB 사이의 원자성을 제공하지 않습니다. 계정 이동/권한 승격은 관리 기능을 잠시 중단하고 진행하세요. 엄격한 동시성 보장이 필요하면 DB 잠금/작업 큐 기반 서버 조정 계층을 별도로 설계해야 합니다.
- 서비스 역할로 동작하므로 본 함수의 권한 검사가 핵심입니다. 운영에서는 관리 요청 rate limit, 감사 로그 보관, 기존 세션 무효화 정책 및 비밀번호 변경 사용자 알림을 추가로 검토하세요.

## 최초 CEO/회사 부트스트랩: 신뢰된 Dashboard 전용

공개 회사 등록은 현재 비활성화되어 있습니다. 이 함수도 회사 생성, CEO/HQ 생성, 자기 승격을 제공하지 않습니다. 최초 부트스트랩은 공개 가입과 분리하여 Supabase 프로젝트 소유자/신뢰된 운영자만 Dashboard에서 수행합니다.

1. Auth에서 소유권이 확인된 CEO 대상 계정을 준비하고 실제 Auth UUID를 확인합니다. 이메일 확인은 소유권 확인/승인된 운영 정책에 따라 처리하며 임의 확인하지 않습니다.
2. Dashboard Table Editor/SQL Editor에서 `public.companies`에 승인된 회사를 생성하고 회사 UUID를 기록합니다.
3. 해당 Auth UUID의 `public.profiles` 행에서만 `role='ceo'`, `company_id=<승인된 회사 UUID>`를 지정합니다. 프로필이 없는 경우 신뢰된 Dashboard에서 같은 UUID와 필수 이메일/이름으로 작성합니다. 이메일만으로 대상을 선택하지 말고 UUID와 실제 소유자를 검증합니다.
4. 필요하다면 같은 신뢰된 절차로 승인된 HQ 계정에 `hq_admin`과 동일 회사 UUID를 부여합니다. 일반 회원 metadata/브라우저의 프로필 PATCH로 승격하지 않습니다.
5. 초기 CEO가 다시 로그인하여 관리 화면을 사용하도록 하고, 다른 회사/개인 사용자로 거부되는지 확인합니다. 공개 회사 등록 활성화는 별도 보안 설계/승인 작업입니다.

## 배포 전 수동 검증 체크리스트

- 허용 origin preflight 204, 비허용 origin 403 및 allow-origin 헤더 없음. wildcard/잘못된 origin 설정은 fail-closed.
- token 누락/만료/위조 401; 개인/manager/staff 또는 회사 없는 CEO/HQ 403; metadata의 가짜 role/company는 무시.
- 같은 회사 CEO/HQ의 manager/staff 생성만 성공; ceo/hq_admin/추가 company_id 요청은 400.
- 기존 이메일 생성은 실패하고 기존 사용자 비밀번호/회사/프로필이 바뀌지 않음.
- signup trigger가 있는 경우와 없는 경우 각각 새 UUID의 프로필 생성 성공, 회사/역할 일치, 이메일 미확인 상태 확인.
- 다른 회사, 개인, CEO/HQ 대상 수정은 404이며 Auth admin update가 실행되지 않음.
- 이름/전화 단독 수정 성공, 허용된 이메일/비밀번호 변경 성공, role/company_id/metadata 수정 거부.
- 프로필 생성 장애 시 새 Auth 사용자 삭제; 삭제 장애 시 CLEANUP_FAILED. Auth 수정 뒤 DB 장애 시 UPDATE_PARTIAL 및 관리자 복구 절차 확인.
- 이메일 생성/변경 시 승인된 확인 절차 전 로그인/소유권 제한이 실제 Auth 정책과 일치하는지 확인.

이번 작업에는 원격 호출, 실제 계정 생성, 실제 배포, 환경 비밀값 설정 또는 통합 실행 테스트가 포함되지 않습니다.


## Dashboard로 배포하기 (CLI 없이, 2026-10-29)

옛 API 키(anon/service_role)를 끈 프로젝트용입니다.

1. Supabase → **Edge Functions → Deploy a new function → Via Editor**. 이름은 정확히 `manage-users`.
2. `index.ts` 내용 전체를 붙여넣고 **Deploy**. **Verify JWT 는 켠 상태(기본값) 유지**.
3. **Edge Functions → Secrets** 에서 `MANAGE_USERS_ALLOWED_ORIGINS` 를 추가합니다.
   값은 사이트 주소(경로 없이, 끝에 `/` 없이)를 쉼표로 구분. 예: `https://ktj8824-stack.github.io`
   (`SUPABASE_URL`, `SUPABASE_SECRET_KEYS` 는 Supabase가 자동으로 넣어 줍니다. 이름이 `SUPABASE_` 로 시작하는 비밀값은 직접 만들 수 없습니다.)
4. **Authentication → Sign In / Providers → Email** 에서 *Confirm email* 이 켜져 있으면 이 함수로 만든 계정은 로그인할 수 없습니다.
   이 함수는 `email_confirm:false` 로 계정을 만들고 확인 메일을 보내지 않기 때문입니다.
   외부 가입을 꺼 둔 상태(관리자만 계정 생성)라면 *Confirm email* 을 끄는 것이 가장 간단합니다.
5. 관리자 화면 → 매니저 관리 → 새 매니저 추가로 시험하고, 만든 계정으로 로그인해 봅니다.
