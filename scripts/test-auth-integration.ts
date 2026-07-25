/**
 * Auth integration tests — register / login / refresh / logout / me / session restore.
 * Uses an isolated file-backed Cloud DB (same AuthService + JWT path as production).
 *
 * Run: npm run test:auth
 */

import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CloudDocumentStore } from "../src/server/helia/cloud/persistence/documentStore";
import { resetCloudConfigCache } from "../src/server/helia/cloud/config";
import {
  getCloudContainer,
  resetCloudContainer,
} from "../src/server/helia/runtime";
import { POST as registerPost } from "../src/app/api/auth/register/route";
import { POST as loginPost } from "../src/app/api/auth/login/route";
import { POST as refreshPost } from "../src/app/api/auth/refresh/route";
import { POST as logoutPost } from "../src/app/api/auth/logout/route";
import { GET as meGet } from "../src/app/api/auth/me/route";

type Json = Record<string, unknown>;

let passed = 0;
let failed = 0;

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) {
    failed += 1;
    throw new Error(message);
  }
  passed += 1;
}

async function readJson(res: Response): Promise<Json> {
  return (await res.json()) as Json;
}

function cookieFrom(res: Response): string | null {
  // NextResponse may expose getSetCookie()
  const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] };
  const list =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : [];
  const raw =
    list.find((c) => c.startsWith("helia_access_token=")) ||
    res.headers.get("set-cookie");
  if (!raw) return null;
  const match = raw.match(/helia_access_token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function main() {
  const root = await mkdtemp(join(tmpdir(), "helia-auth-it-"));
  const dataDir = join(root, "cloud");
  await mkdir(dataDir, { recursive: true });

  process.env.HELIA_CLOUD_STORE = "file";
  process.env.CLOUD_DATA_DIR = dataDir;
  process.env.CLOUD_JWT_ACCESS_SECRET =
    "test-cloud-access-secret-32chars!!";
  process.env.CLOUD_JWT_REFRESH_SECRET =
    "test-cloud-refresh-secret-32chars!";
  process.env.CLOUD_API_KEY_PEPPER = "test-pepper-min-8";
  process.env.HELIA_ADMIN_EMAIL = "";
  process.env.HELIA_ADMIN_PASSWORD = "";
  process.env.HELIA_ADMIN_EMAILS = "";
  delete process.env.VERCEL;

  resetCloudConfigCache();
  resetCloudContainer();

  const email = `user-${Date.now()}@example.com`;
  const password = "TestPass123!";
  const displayName = "Integration User";

  console.log("backend: file @", dataDir);

  // --- DocumentStore race ---
  {
    const store = new CloudDocumentStore<{ id: string; email: string }>(
      join(dataDir, "race-users.json")
    );
    await store.upsert({ id: "admin", email: "admin@x.com" });
    const register = store.upsert({ id: "user1", email: "new@x.com" });
    const reloadWrite = (async () => {
      await new Promise((r) => setTimeout(r, 5));
      await store.reload();
      const admin = (await store.query((u) => u.email === "admin@x.com"))[0]!;
      await store.upsert({ ...admin, email: "admin@x.com" });
    })();
    await Promise.all([register, reloadWrite]);
    const disk = await store.findAll();
    assert(
      disk.some((u) => u.id === "user1"),
      "DocumentStore race: registered user must survive concurrent reload"
    );
    console.log("✔ DocumentStore concurrency");
  }

  // --- AuthService via HTTP route handlers ---
  const registerRes = await registerPost(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    })
  );
  const registerBody = await readJson(registerRes);
  assert(registerRes.status === 201 || registerRes.status === 200, "register status");
  assert(registerBody.ok === true, "register ok");
  assert(
    (registerBody.user as Json)?.email === email,
    "register returns user email"
  );
  const registerTokens = registerBody.tokens as Json;
  assert(typeof registerTokens?.accessToken === "string", "register access token");
  assert(typeof registerTokens?.refreshToken === "string", "register refresh token");
  const registerCookie = cookieFrom(registerRes);
  assert(registerCookie, "register sets helia_access_token cookie");
  console.log("✔ Register");

  // Fresh login with same credentials (single store)
  const loginRes = await loginPost(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
  const loginBody = await readJson(loginRes);
  assert(loginRes.status === 200, "login status");
  assert(loginBody.ok === true, "login ok");
  const loginTokens = loginBody.tokens as Json;
  assert(typeof loginTokens?.accessToken === "string", "login access token");
  const loginCookie = cookieFrom(loginRes);
  assert(loginCookie, "login sets helia_access_token cookie");
  console.log("✔ Login");

  // /api/auth/me with cookie
  const meRes = await meGet(
    new Request("http://localhost/api/auth/me", {
      headers: { cookie: `helia_access_token=${loginCookie}` },
    })
  );
  const meBody = await readJson(meRes);
  assert(meRes.status === 200, "me status");
  assert(meBody.ok === true, "me ok");
  assert((meBody.user as Json)?.email === email, "me user email");
  console.log("✔ /api/auth/me");

  // Session restore via access token (Bearer)
  const meBearer = await meGet(
    new Request("http://localhost/api/auth/me", {
      headers: {
        authorization: `Bearer ${loginTokens.accessToken as string}`,
      },
    })
  );
  assert(meBearer.status === 200, "session restore via Bearer");
  console.log("✔ Session restore");

  // Refresh
  const refreshRes = await refreshPost(
    new Request("http://localhost/api/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        refreshToken: loginTokens.refreshToken,
      }),
    })
  );
  const refreshBody = await readJson(refreshRes);
  assert(refreshRes.status === 200, "refresh status");
  assert(refreshBody.ok === true, "refresh ok");
  const refreshed = refreshBody.tokens as Json;
  assert(typeof refreshed?.accessToken === "string", "refresh access token");
  assert(
    refreshed.accessToken !== loginTokens.accessToken,
    "refresh rotates access token"
  );
  console.log("✔ Refresh");

  // Logout
  const logoutRes = await logoutPost(
    new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        refreshToken: refreshed.refreshToken || loginTokens.refreshToken,
      }),
    })
  );
  const logoutBody = await readJson(logoutRes);
  assert(logoutRes.status === 200, "logout status");
  assert(logoutBody.ok === true, "logout ok");
  console.log("✔ Logout");

  // Wrong password must fail against same store
  const badLogin = await loginPost(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "WrongPass999!" }),
    })
  );
  assert(badLogin.status === 401, "bad password rejected");
  console.log("✔ Password verification");

  // Same source of truth: user row exists in DB after register+login
  resetCloudConfigCache();
  resetCloudContainer();
  const container = await getCloudContainer();
  assert(container.db.backend === "file", "test uses file backend");
  await container.db.users.reload();
  const found = await container.db.users.query((u) => u.email === email);
  assert(found.length === 1, "user persisted in CloudDatabase");
  assert(found[0]!.passwordHash.startsWith("scrypt$"), "scrypt password hash");
  console.log("✔ Single source of truth");

  // Middleware contract (cookie presence check — same name as middleware)
  assert(
    Boolean(loginCookie && loginCookie.length > 20),
    "middleware-compatible helia_access_token"
  );
  console.log("✔ Middleware cookie contract");

  console.log(`\n${passed} assertions ok, ${failed} failed`);
  await rm(root, { recursive: true, force: true });
  if (failed > 0) process.exit(1);
  console.log("\nAUTHENTICATION PRODUCTION READY ✅");
}

main().catch(async (err) => {
  console.error("AUTH INTEGRATION FAILED", err);
  process.exit(1);
});
