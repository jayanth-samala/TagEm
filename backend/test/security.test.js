import test from "node:test";
import assert from "node:assert/strict";
import { canAccessPrivateResource, isResourceOwner } from "../utils/authorization.js";
import { isStrongPassword, cleanString, isPositiveInteger } from "../utils/validation.js";
import { csrfProtection } from "../middleware/csrf.js";
import { adminAuth } from "../middleware/adminAuth.js";

function responseDouble() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("ownership uses the authenticated user id", () => {
  assert.equal(isResourceOwner({ id: 7 }, "7"), true);
  assert.equal(isResourceOwner({ id: 7 }, 8), false);
});

test("only owners and admins access private resources", () => {
  assert.equal(canAccessPrivateResource({ id: 7, is_admin: false }, 7), true);
  assert.equal(canAccessPrivateResource({ id: 7, is_admin: false }, 8), false);
  assert.equal(canAccessPrivateResource({ id: 7, is_admin: true }, 8), true);
});

test("password and primitive validation reject unsafe input", () => {
  assert.equal(isStrongPassword("weakpassword"), false);
  assert.equal(isStrongPassword("StrongPassword1!"), true);
  assert.equal(cleanString("  hello  ", { max: 10 }), "hello");
  assert.equal(isPositiveInteger("12"), true);
  assert.equal(isPositiveInteger("-1"), false);
});

test("CSRF middleware rejects mismatched tokens", () => {
  const req = { method: "POST", headers: { cookie: "tagem_csrf=expected" }, get: () => "wrong" };
  const res = responseDouble();
  csrfProtection(req, res, () => assert.fail("next should not run"));
  assert.equal(res.statusCode, 403);
});

test("CSRF middleware accepts matching tokens", () => {
  const req = { method: "POST", headers: { cookie: "tagem_csrf=expected" }, get: () => "expected" };
  const res = responseDouble();
  let called = false;
  csrfProtection(req, res, () => { called = true; });
  assert.equal(called, true);
});

test("admin middleware enforces server-side role", async () => {
  const denied = responseDouble();
  await adminAuth({ user: { is_admin: false } }, denied, () => assert.fail("next should not run"));
  assert.equal(denied.statusCode, 403);

  let called = false;
  await adminAuth({ user: { is_admin: true } }, responseDouble(), () => { called = true; });
  assert.equal(called, true);
});
