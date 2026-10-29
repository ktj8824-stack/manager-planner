import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Authorization comes from profiles, never JWT role claims or user_metadata.
type JsonObject = Record<string, unknown>;
type Caller = { id: string; company_id: string; role: string };
class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}
const MEMBER_ROLES = ["manager", "staff"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 16_384;

function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "INVALID_REQUEST", "Expected a JSON object.");
  }
  return value as JsonObject;
}
function onlyKeys(value: JsonObject, keys: string[]) {
  if (Object.keys(value).some((key) => !keys.includes(key))) {
    throw new HttpError(400, "INVALID_FIELDS", "Unknown or protected fields are not allowed.");
  }
}
function text(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new HttpError(400, "INVALID_FIELD", `Invalid ${label}.`);
  }
  return value.trim();
}
function email(value: unknown): string {
  const result = text(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) {
    throw new HttpError(400, "INVALID_EMAIL", "Invalid email.");
  }
  return result;
}
function password(value: unknown): string {
  if (typeof value !== "string" || value.length < 8 || value.length > 128 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new HttpError(400, "INVALID_PASSWORD", "Password must contain 8 to 128 characters without control characters.");
  }
  return value; // Never trim or log passwords.
}
function phone(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  return text(value, "phone", 40);
}
// 새 방식 비밀키(SUPABASE_SECRET_KEYS, JSON {"default":"sb_secret_..."})를 우선 사용하고,
// 없을 때만 옛 SUPABASE_SERVICE_ROLE_KEY 를 씁니다. 키 값은 로그/응답에 절대 내보내지 않습니다.
function secretKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, unknown>;
      const picked = keys["default"] ?? Object.values(keys)[0];
      if (typeof picked === "string" && picked) return picked;
    } catch { /* 형식이 틀리면 옛 변수로 시도 */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;
}
function config() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = secretKey();
  const configuredOrigins = Deno.env.get("MANAGE_USERS_ALLOWED_ORIGINS");
  if (!url || !serviceKey || !configuredOrigins) {
    throw new HttpError(500, "CONFIGURATION_ERROR", "Server configuration is incomplete.");
  }
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch {
    throw new HttpError(500, "CONFIGURATION_ERROR", "Invalid server configuration.");
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
    throw new HttpError(500, "CONFIGURATION_ERROR", "Invalid server configuration.");
  }
  const origins = new Set(configuredOrigins.split(",").map((entry) => entry.trim()).filter(Boolean));
  if (!origins.size) throw new HttpError(500, "CONFIGURATION_ERROR", "No allowed origins configured.");
  for (const origin of origins) {
    let parsed: URL;
    try { parsed = new URL(origin); } catch {
      throw new HttpError(500, "CONFIGURATION_ERROR", "Invalid allowed origin configuration.");
    }
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin || parsed.username || parsed.password) {
      throw new HttpError(500, "CONFIGURATION_ERROR", "Allowed origins must be exact HTTP(S) origins, not wildcards or paths.");
    }
  }
  return { url, serviceKey, origins };
}
async function readBody(req: Request): Promise<JsonObject> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new HttpError(415, "UNSUPPORTED_MEDIA_TYPE", "Use application/json.");
  }
  if (!req.body) throw new HttpError(400, "INVALID_JSON", "JSON body is required.");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new HttpError(413, "BODY_TOO_LARGE", "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch {
    throw new HttpError(400, "INVALID_JSON", "Invalid JSON body.");
  }
  return object(parsed);
}
function authFailure(error: { status?: number; code?: string }): HttpError {
  if (["email_exists", "user_already_exists", "email_address_conflict"].includes(error.code ?? "")) {
    return new HttpError(409, "EMAIL_UNAVAILABLE", "This email is unavailable. No existing account was changed.");
  }
  if ((error.status ?? 500) >= 500) {
    return new HttpError(502, "AUTH_SERVICE_ERROR", "Authentication service failed.");
  }
  return new HttpError(422, "AUTH_UPDATE_REJECTED", "Authentication service rejected the account data.");
}
async function callerProfile(db: SupabaseClient, userId: string): Promise<Caller> {
  const { data, error } = await db.from("profiles").select("id, role, company_id").eq("id", userId).maybeSingle();
  if (error) throw new HttpError(500, "PROFILE_READ_FAILED", "Could not verify caller permissions.");
  if (!data || !["ceo", "hq_admin"].includes(data.role) || typeof data.company_id !== "string" || !UUID.test(data.company_id)) {
    throw new HttpError(403, "FORBIDDEN", "A company CEO or HQ administrator is required.");
  }
  return data as Caller;
}
async function targetProfile(db: SupabaseClient, id: string, caller: Caller) {
  const { data, error } = await db.from("profiles").select("id, email, name, phone, role, company_id")
    .eq("id", id).eq("company_id", caller.company_id).in("role", MEMBER_ROLES).maybeSingle();
  if (error) throw new HttpError(500, "PROFILE_READ_FAILED", "Could not verify target permissions.");
  if (!data) throw new HttpError(404, "TARGET_NOT_FOUND", "A manager or staff member in your company was not found.");
  return data;
}
async function createMember(db: SupabaseClient, caller: Caller, body: JsonObject, requestId: string) {
  onlyKeys(body, ["action", "email", "password", "name", "role", "phone"]);
  const memberEmail = email(body.email);
  const memberPassword = password(body.password);
  const memberName = text(body.name, "name", 100);
  const memberPhone = phone(body.phone);
  if (body.role !== "manager" && body.role !== "staff") {
    throw new HttpError(400, "INVALID_ROLE", "Only manager and staff roles may be created.");
  }
  const currentCaller = await callerProfile(db, caller.id);
  if (currentCaller.company_id !== caller.company_id) throw new HttpError(403, "CALLER_CHANGED", "Caller company changed. Start a new request.");
  // createUser only: never search Auth by email, reuse a user, or reset its password.
  const { data, error } = await db.auth.admin.createUser({
    email: memberEmail, password: memberPassword, email_confirm: true,
    user_metadata: { name: memberName, phone: memberPhone },
  });
  if (error) throw authFailure(error);
  const created = data.user;
  if (!created) throw new HttpError(502, "AUTH_SERVICE_ERROR", "Authentication service did not return a user.");
  try {
    // The auth trigger may already have inserted an indie_manager profile.
    // Upsert ONLY by the newly created Auth UUID, never by email.
    const { data: profile, error: profileError } = await db.from("profiles").upsert({
      id: created.id, email: created.email ?? memberEmail, name: memberName,
      role: body.role, phone: memberPhone, company_id: caller.company_id,
      auth_provider: "email", updated_at: new Date().toISOString(),
    }, { onConflict: "id" }).select("id, email, role, company_id").single();
    if (profileError || !profile || profile.id !== created.id || profile.role !== body.role || profile.company_id !== caller.company_id) {
      throw new HttpError(500, "PROFILE_CREATE_FAILED", "Could not provision the company profile.");
    }
  } catch (failure) {
    // Compensation is limited to the Auth account this request just created.
    try {
      const { error: cleanupError } = await db.auth.admin.deleteUser(created.id, false);
      if (cleanupError) throw cleanupError;
    } catch {
      console.error("manage-users cleanup failed", { requestId, userId: created.id });
      throw new HttpError(500, "CLEANUP_FAILED", "Account provisioning failed and cleanup requires trusted administrator attention. Do not retry blindly.");
    }
    throw failure;
  }
  return { user: { id: created.id, email: created.email ?? memberEmail } };
}
async function updateMember(db: SupabaseClient, caller: Caller, body: JsonObject, requestId: string) {
  onlyKeys(body, ["action", "id", "data"]);
  if (typeof body.id !== "string" || !UUID.test(body.id)) throw new HttpError(400, "INVALID_ID", "Invalid user id.");
  const fields = object(body.data);
  onlyKeys(fields, ["name", "phone", "email", "password"]);
  if (!Object.keys(fields).length) throw new HttpError(400, "EMPTY_UPDATE", "At least one update field is required.");
  const profilePatch: JsonObject = { updated_at: new Date().toISOString() };
  const authPatch: { email?: string; password?: string; email_confirm?: boolean } = {};
  if ("name" in fields) profilePatch.name = text(fields.name, "name", 100);
  if ("phone" in fields) profilePatch.phone = phone(fields.phone);
  if ("email" in fields) authPatch.email = email(fields.email);
  if ("password" in fields) authPatch.password = password(fields.password);
  const currentCaller = await callerProfile(db, caller.id);
  if (currentCaller.company_id !== caller.company_id) throw new HttpError(403, "CALLER_CHANGED", "Caller company changed. Start a new request.");
  const target = await targetProfile(db, body.id, currentCaller);
  // An unchanged address must not alter its verification state.
  if (authPatch.email === target.email?.toLowerCase()) delete authPatch.email;
  if (authPatch.email) authPatch.email_confirm = true;
  let authChanged = false;
  if (Object.keys(authPatch).length) {
    const { data, error } = await db.auth.admin.updateUserById(target.id, authPatch);
    if (error) throw authFailure(error);
    authChanged = true;
    if (!data.user || data.user.id !== target.id || (authPatch.email && data.user.email?.toLowerCase() !== authPatch.email)) {
      console.error("manage-users Auth update needs reconciliation", { requestId, userId: target.id });
      throw new HttpError(500, "UPDATE_PARTIAL", "Authentication changed but the result could not be verified. Trusted reconciliation is required.");
    }
    if (authPatch.email) profilePatch.email = data.user.email;
  }
  try {
    // Repeat tenant and permitted-role predicates on the actual profile write.
    const { data, error } = await db.from("profiles").update(profilePatch).eq("id", target.id)
      .eq("company_id", caller.company_id).in("role", MEMBER_ROLES).select("id").maybeSingle();
    if (error) throw new HttpError(500, "PROFILE_UPDATE_FAILED", "Could not update the company profile.");
    if (!data) throw new HttpError(404, "TARGET_NOT_FOUND", "The permitted target no longer exists.");
  } catch (failure) {
    if (authChanged) {
      // Auth and Postgres are separate transactions. Old passwords are not readable;
      // never claim rollback or reset another password to compensate.
      console.error("manage-users partial update", { requestId, userId: target.id });
      throw new HttpError(500, "UPDATE_PARTIAL", "Authentication changed but the profile was not updated. Trusted reconciliation is required; do not retry blindly.");
    }
    throw failure;
  }
  return { success: true };
}

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin", "X-Content-Type-Options": "nosniff" });
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
  try {
    const settings = config();
    const origin = req.headers.get("origin");
    if (origin !== null && !settings.origins.has(origin)) throw new HttpError(403, "ORIGIN_FORBIDDEN", "Origin is not allowed.");
    if (origin) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
      headers.set("Access-Control-Max-Age", "600");
    }
    if (req.method === "OPTIONS") {
      if (req.headers.get("access-control-request-method") && req.headers.get("access-control-request-method") !== "POST") {
        throw new HttpError(405, "METHOD_NOT_ALLOWED", "Only POST is allowed.");
      }
      const requestedHeaders = (req.headers.get("access-control-request-headers") ?? "").toLowerCase().split(",").map((h) => h.trim()).filter(Boolean);
      if (requestedHeaders.some((h) => !["authorization", "apikey", "content-type", "x-client-info"].includes(h))) {
        throw new HttpError(403, "HEADERS_FORBIDDEN", "Requested headers are not allowed.");
      }
      return new Response(null, { status: 204, headers });
    }
    if (req.method !== "POST") {
      headers.set("Allow", "POST, OPTIONS");
      throw new HttpError(405, "METHOD_NOT_ALLOWED", "Only POST is allowed.");
    }
    const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
    if (!match) throw new HttpError(401, "UNAUTHORIZED", "A user access token is required.");
    const db = createClient(settings.url, settings.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    // Validate JWT with Auth, not decoding. Never replace the admin client's
    // service-role Authorization with the untrusted caller JWT.
    const { data: authData, error: authError } = await db.auth.getUser(match[1]);
    if (authError || !authData.user) {
      if (authError && (authError.status ?? 0) >= 500) throw new HttpError(503, "AUTH_UNAVAILABLE", "Could not validate authentication.");
      throw new HttpError(401, "UNAUTHORIZED", "User access token is invalid or expired.");
    }
    const caller = await callerProfile(db, authData.user.id);
    const body = await readBody(req);
    if (body.action === "create") return json(await createMember(db, caller, body, requestId), 201);
    if (body.action === "update") return json(await updateMember(db, caller, body, requestId));
    throw new HttpError(400, "INVALID_ACTION", "Action must be create or update.");
  } catch (failure) {
    const error = failure instanceof HttpError ? failure : new HttpError(500, "INTERNAL_ERROR", "An internal server error occurred.");
    if (!(failure instanceof HttpError)) console.error("manage-users internal failure", { requestId });
    return json({ error: { code: error.code, message: error.message }, request_id: requestId }, error.status);
  }
});
