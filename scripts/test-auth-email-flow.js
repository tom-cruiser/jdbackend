/* eslint-disable no-console */
const API_BASE = process.env.API_BASE || "http://localhost:3001/api";
const VERIFICATION_TOKEN_ENV = process.env.VERIFICATION_TOKEN || "";
const RESET_TOKEN_ENV = process.env.RESET_TOKEN || "";

function randomEmail() {
  const now = Date.now();
  return `flow-test-${now}@example.com`;
}

function randomPassword(prefix = "Pass") {
  return `${prefix}!${Math.random().toString(36).slice(2, 10)}A1`;
}

async function parseJson(res) {
  const body = await res.json().catch(() => ({}));
  return body;
}

async function run() {
  const email = randomEmail();
  const initialPassword = randomPassword("Init");
  const newPassword = randomPassword("Reset");

  console.log("Auth flow integration test");
  console.log("API:", API_BASE);
  console.log("Email:", email);

  // 1) Register
  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: initialPassword,
      full_name: "Flow Test User",
      phone: null,
    }),
  });
  const registerBody = await parseJson(registerRes);
  if (!registerRes.ok || !registerBody.success) {
    throw new Error(`Register failed: ${JSON.stringify(registerBody)}`);
  }
  const verificationLink = registerBody?.data?.verification_link;
  let verificationToken = VERIFICATION_TOKEN_ENV;
  if (verificationLink) {
    verificationToken = new URL(verificationLink).searchParams.get("token") || "";
  }
  if (!verificationToken) {
    throw new Error(
      "Missing verification token. Provide VERIFICATION_TOKEN env var, or run backend in non-production mode that returns verification_link."
    );
  }
  console.log("1) Register: OK");

  // 2) Login should fail before verification
  const loginBeforeRes = await fetch(`${API_BASE}/auth/local-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: initialPassword }),
  });
  const loginBeforeBody = await parseJson(loginBeforeRes);
  if (loginBeforeRes.status !== 403) {
    throw new Error(`Expected 403 before verification, got ${loginBeforeRes.status} ${JSON.stringify(loginBeforeBody)}`);
  }
  console.log("2) Login before verification blocked: OK");

  // 3) Confirm email
  const confirmRes = await fetch(`${API_BASE}/auth/confirm-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: verificationToken }),
  });
  const confirmBody = await parseJson(confirmRes);
  if (!confirmRes.ok || !confirmBody.success) {
    throw new Error(`Confirm email failed: ${JSON.stringify(confirmBody)}`);
  }
  console.log("3) Confirm email: OK");

  // 4) Login with initial password should now pass
  const loginAfterRes = await fetch(`${API_BASE}/auth/local-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: initialPassword }),
  });
  const loginAfterBody = await parseJson(loginAfterRes);
  if (!loginAfterRes.ok || !loginAfterBody.success || !loginAfterBody?.data?.token) {
    throw new Error(`Login after verification failed: ${JSON.stringify(loginAfterBody)}`);
  }
  console.log("4) Login after verification: OK");

  // 5) Request reset password
  const resetReqRes = await fetch(`${API_BASE}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const resetReqBody = await parseJson(resetReqRes);
  if (!resetReqRes.ok || !resetReqBody.success) {
    throw new Error(`Request reset failed: ${JSON.stringify(resetReqBody)}`);
  }
  const resetLink = resetReqBody?.data?.reset_link;
  let resetToken = RESET_TOKEN_ENV;
  if (resetLink) {
    resetToken = new URL(resetLink).searchParams.get("token") || "";
  }
  if (!resetToken) {
    throw new Error(
      "Missing reset token. Provide RESET_TOKEN env var, or run backend in non-production mode that returns reset_link."
    );
  }
  console.log("5) Request password reset: OK");

  // 6) Reset password
  const resetRes = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, password: newPassword }),
  });
  const resetBody = await parseJson(resetRes);
  if (!resetRes.ok || !resetBody.success) {
    throw new Error(`Reset password failed: ${JSON.stringify(resetBody)}`);
  }
  console.log("6) Reset password: OK");

  // 7) Old password should fail
  const oldPassLoginRes = await fetch(`${API_BASE}/auth/local-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: initialPassword }),
  });
  if (oldPassLoginRes.ok) {
    const body = await parseJson(oldPassLoginRes);
    throw new Error(`Old password unexpectedly worked: ${JSON.stringify(body)}`);
  }
  console.log("7) Old password rejected: OK");

  // 8) New password should pass
  const newPassLoginRes = await fetch(`${API_BASE}/auth/local-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: newPassword }),
  });
  const newPassLoginBody = await parseJson(newPassLoginRes);
  if (!newPassLoginRes.ok || !newPassLoginBody.success) {
    throw new Error(`New password login failed: ${JSON.stringify(newPassLoginBody)}`);
  }
  console.log("8) New password login: OK");

  console.log("\nAll checks passed.");
}

run().catch((err) => {
  console.error("\nIntegration flow failed:", err.message);
  process.exit(1);
});
