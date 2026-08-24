import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import pool from "../config/db.js";
import adminRoutes from "../routes/adminRoutes.js";
import connectionRoutes from "../routes/connectionRoutes.js";
import jobsRoutes from "../routes/jobsRoutes.js";
import postsRoutes from "../routes/postsRouter.js";
import userRoutes from "../routes/userRoutes.js";
import { validateJwtSecret } from "../config/securityEnvironment.js";
import { up as connectionIntegrityMigration } from "../migrations/1782400000000_connectionIntegrity.js";

async function request(app, path, options = {}) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}${path}`, options);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function routeApp(router, user = { id: 1, is_admin: false }) {
  const app = express();
  app.use(express.json({ limit: "100kb" }));
  app.use((req, res, next) => {
    req.user = user;
    next();
  });
  app.use(router);
  return app;
}

test("admin HTTP route cannot modify another administrator", async () => {
  const originalQuery = pool.query;
  let mutationAttempted = false;
  pool.query = async (sql) => {
    if (String(sql).includes("SELECT is_admin FROM users")) return { rows: [{ is_admin: true }] };
    if (String(sql).includes("SELECT id, is_admin FROM users")) return { rows: [{ id: 2, is_admin: true }] };
    mutationAttempted = true;
    return { rows: [] };
  };
  try {
    const response = await request(routeApp(adminRoutes, { id: 1, is_admin: true }), "/users/2", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Changed" }),
    });
    assert.equal(response.status, 403);
    assert.equal(mutationAttempted, false);
  } finally {
    pool.query = originalQuery;
  }
});

test("admin HTTP route ignores attempts to grant administrator status", async () => {
  const originalQuery = pool.query;
  let updateSql = "";
  let updateParameters = [];
  pool.query = async (sql, parameters = []) => {
    const text = String(sql);
    if (text.includes("SELECT is_admin FROM users")) return { rows: [{ is_admin: true }] };
    if (text.includes("SELECT id, is_admin FROM users")) return { rows: [{ id: 2, is_admin: false }] };
    updateSql = text;
    updateParameters = parameters;
    return { rows: [{ id: 2, name: "User", is_admin: false }] };
  };
  try {
    const response = await request(routeApp(adminRoutes, { id: 1, is_admin: true }), "/users/2", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "User", email: "user@example.com", is_admin: true }),
    });
    assert.equal(response.status, 200);
    assert.match(updateSql, /AND is_admin = false/);
    assert.equal(updateParameters.includes(true), false);
  } finally {
    pool.query = originalQuery;
  }
});

test("job HTTP route rejects oversized recipient arrays before database work", async () => {
  const originalConnect = pool.connect;
  let connected = false;
  pool.connect = async () => {
    connected = true;
    throw new Error("Database should not be reached");
  };
  try {
    const response = await request(routeApp(jobsRoutes), "/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Role",
        company: "Company",
        location: "Remote",
        description: "Description",
        selectedUserIds: Array.from({ length: 101 }, (_, index) => index + 2),
        selectedTagTypes: [],
      }),
    });
    assert.equal(response.status, 400);
    assert.equal(connected, false);
  } finally {
    pool.connect = originalConnect;
  }
});

test("job HTTP route expands recipients with one set-based query", async () => {
  const originalConnect = pool.connect;
  const queries = [];
  const client = {
    async query(sql, parameters = []) {
      queries.push({ sql: String(sql), parameters });
      if (String(sql).includes("INSERT INTO jobs")) return { rows: [{ id: 10 }] };
      return { rows: [] };
    },
    release() {},
  };
  pool.connect = async () => client;
  try {
    const response = await request(routeApp(jobsRoutes), "/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Role",
        company: "Company",
        location: "Remote",
        description: "Description",
        selectedUserIds: [2, 2, 3],
        selectedTagTypes: ["Friend", "Friend"],
      }),
    });
    assert.equal(response.status, 201);
    const audienceQuery = queries.find(({ sql }) => sql.includes("requested_recipients"));
    assert.ok(audienceQuery);
    assert.deepEqual(audienceQuery.parameters[1], [2, 3]);
    assert.deepEqual(audienceQuery.parameters[3], ["Friend"]);
    assert.equal(queries.filter(({ sql }) => sql.includes("requested_recipients")).length, 1);
  } finally {
    pool.connect = originalConnect;
  }
});

test("post HTTP route rejects malformed and nested reply parents", async () => {
  const originalQuery = pool.query;
  let queryCount = 0;
  pool.query = async (sql) => {
    queryCount += 1;
    assert.match(String(sql), /parent_post_id IS NULL/);
    return { rows: [] };
  };
  try {
    const app = routeApp(postsRoutes);
    const malformed = await request(app, "/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Reply", parent_post_id: "invalid" }),
    });
    assert.equal(malformed.status, 400);
    assert.equal(queryCount, 0);

    const nested = await request(app, "/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Reply", parent_post_id: 99 }),
    });
    assert.equal(nested.status, 404);
    assert.equal(queryCount, 1);
  } finally {
    pool.query = originalQuery;
  }
});

test("post deletion is limited to the authenticated owner", async () => {
  const originalQuery = pool.query;
  let deleteQuery;
  pool.query = async (sql, parameters = []) => {
    deleteQuery = { sql: String(sql), parameters };
    return { rows: [] };
  };
  try {
    const response = await request(routeApp(postsRoutes, { id: 7, is_admin: false }), "/42", {
      method: "DELETE",
    });
    assert.equal(response.status, 404);
    assert.match(deleteQuery.sql, /user_id = \$2/);
    assert.match(deleteQuery.sql, /parent_post_id IS NULL/);
    assert.deepEqual(deleteQuery.parameters, [42, 7]);
  } finally {
    pool.query = originalQuery;
  }
});

test("liking an already-liked post removes the authenticated user's like", async () => {
  const originalConnect = pool.connect;
  const queries = [];
  const client = {
    async query(sql, parameters = []) {
      const text = String(sql);
      queries.push({ sql: text, parameters });
      if (text.includes("DELETE FROM post_likes")) return { rows: [{ post_id: 42 }] };
      if (text.includes("UPDATE posts")) return { rows: [{ id: 42, likes_count: 0 }] };
      return { rows: [] };
    },
    release() {},
  };
  pool.connect = async () => client;
  try {
    const response = await request(routeApp(postsRoutes, { id: 7, is_admin: false }), "/42/like", {
      method: "PUT",
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.liked_by_user, false);
    assert.equal(body.likes_count, 0);
    assert.ok(queries.some(({ sql, parameters }) =>
      sql.includes("DELETE FROM post_likes") && parameters[0] === 42 && parameters[1] === 7
    ));
    assert.equal(queries.some(({ sql }) => sql.includes("INSERT INTO post_likes")), false);
    assert.ok(queries.some(({ sql }) => sql === "COMMIT"));
  } finally {
    pool.connect = originalConnect;
  }
});

test("connection HTTP route rejects an existing pending pair", async () => {
  const originalQuery = pool.query;
  pool.query = async () => ({ rows: [] });
  try {
    const response = await request(routeApp(connectionRoutes), "/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: 2 }),
    });
    assert.equal(response.status, 409);
  } finally {
    pool.query = originalQuery;
  }
});

test("production JWT secrets must be present, non-placeholder, and at least 32 bytes", () => {
  assert.throws(() => validateJwtSecret(undefined, { production: true }), /required/);
  assert.throws(() => validateJwtSecret("short-secret", { production: true }), /32 random bytes/);
  assert.throws(() => validateJwtSecret("replace-with-at-least-32-random-bytes", { production: true }), /32 random bytes/);
  assert.equal(validateJwtSecret("f8a4c13055ef4ee0a8dacb9ab2761660", { production: true }).length, 32);
});

test("connection migration deduplicates data before enforcing pair uniqueness", () => {
  const operations = [];
  const pgm = {
    sql(statement) { operations.push(["sql", statement]); },
    addConstraint(table, name, definition) { operations.push(["constraint", table, name, definition]); },
  };
  connectionIntegrityMigration(pgm);
  const sql = operations.filter(([kind]) => kind === "sql").map(([, statement]) => statement).join("\n");
  assert.match(sql, /DELETE FROM connections newer/);
  assert.match(sql, /CREATE UNIQUE INDEX connection_requests_unique_pending_pair/);
  assert.ok(operations.some((operation) => operation[2] === "connections_unique_pair"));
  assert.ok(operations.some((operation) => operation[2] === "connections_canonical_pair"));
});

test("account deletion HTTP route deletes only the authenticated user", async () => {
  const originalConnect = pool.connect;
  const queries = [];
  const client = {
    async query(sql, parameters = []) {
      const text = String(sql);
      queries.push({ sql: text, parameters });
      if (text.includes("SELECT \"profilePicUrl\"")) {
        return { rows: [{ profilePicUrl: null, resumeattached: null }] };
      }
      if (text.includes("DELETE FROM users")) return { rows: [{ id: 7 }] };
      return { rows: [] };
    },
    release() {},
  };
  pool.connect = async () => client;
  try {
    const response = await request(routeApp(userRoutes, { id: 7, is_admin: false }), "/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 999 }),
    });
    assert.equal(response.status, 200);
    const deleteQuery = queries.find(({ sql }) => sql.includes("DELETE FROM users"));
    assert.ok(deleteQuery);
    assert.deepEqual(deleteQuery.parameters, [7]);
    assert.ok(queries.some(({ sql }) => sql === "COMMIT"));
  } finally {
    pool.connect = originalConnect;
  }
});
