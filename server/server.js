const http = require("http");
const db = require("./db");
const auth = require("./auth");
const mail = require("./mail");

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = "http://localhost:5173";
const SESSION_COOKIE = "sid";

/* ---------- helpers ---------- */

function httpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendEmpty(res, status) {
  res.writeHead(status);
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(httpError(413, "Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(httpError(400, "Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function assertObject(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw httpError(400, "Body must be a JSON object");
  }
}

/* ---------- cookies & sessions ---------- */

function parseCookies(header = "") {
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(
      part.slice(index + 1).trim(),
    );
  }
  return cookies;
}

const getSessionToken = (req) =>
  parseCookies(req.headers.cookie)[SESSION_COOKIE];

// HttpOnly: JavaScript in the page can't read the cookie (protects against XSS theft).
// SameSite=Lax: the browser doesn't send it on cross-site requests (protects against CSRF).
// In production (HTTPS) also add "; Secure".
function setSessionCookie(res, token, expiresAt) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Expires=${expiresAt.toUTCString()}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
  );
}

function requireUser(req) {
  const token = getSessionToken(req);
  const user = token ? db.getUserBySession(token) : null;
  if (!user) throw httpError(401, "Not authenticated");
  return user;
}

/* ---------- validation ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordProblem(password) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long";
  return null;
}

function parseCredentials(body, { checkStrength }) {
  assertObject(body);
  const errors = {};

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) errors.email = "Email is required";
  else if (email.length > 254 || !EMAIL_RE.test(email))
    errors.email = "Enter a valid email address";

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) errors.password = "Password is required";
  else if (checkStrength && passwordProblem(password))
    errors.password = passwordProblem(password);
  else if (password.length > 128) errors.password = "Password is too long";

  if (Object.keys(errors).length > 0)
    throw httpError(400, Object.values(errors)[0], errors);
  return { email, password };
}

// Validates and cleans the note fields a client may send.
// requireAll = true  -> POST (title + content are required, defaults are filled in)
// requireAll = false -> PUT  (only validates the fields that were sent)
function parseNoteFields(body, { requireAll }) {
  assertObject(body);
  const errors = {};
  const out = {};

  if (requireAll || "title" in body) {
    if (typeof body.title !== "string" || !body.title.trim())
      errors.title = "Title is required";
    else out.title = body.title.trim();
  }

  if (requireAll || "content" in body) {
    if (typeof body.content !== "string" || !body.content.trim())
      errors.content = "Content is required";
    else out.content = body.content.trim();
  }

  if ("tags" in body) {
    if (
      !Array.isArray(body.tags) ||
      body.tags.some((t) => typeof t !== "string")
    ) {
      errors.tags = "Tags must be an array of strings";
    } else {
      out.tags = [...new Set(body.tags.map((t) => t.trim()).filter(Boolean))];
    }
  } else if (requireAll) {
    out.tags = [];
  }

  if ("isArchived" in body) {
    if (typeof body.isArchived !== "boolean")
      errors.isArchived = "isArchived must be true or false";
    else out.isArchived = body.isArchived;
  } else if (requireAll) {
    out.isArchived = false;
  }

  if (Object.keys(errors).length > 0)
    throw httpError(400, Object.values(errors)[0], errors);
  return out;
}

/* ---------- /api/auth/* ---------- */

async function handleAuth(req, res, action) {
  if (action === "register" && req.method === "POST") {
    const { email, password } = parseCredentials(await readBody(req), {
      checkStrength: true,
    });
    if (db.getUserByEmail(email))
      throw httpError(409, "An account with this email already exists");

    let user;
    try {
      user = db.createUser(email, await auth.hashPassword(password));
    } catch (err) {
      if (String(err.message).includes("UNIQUE")) {
        throw httpError(409, "An account with this email already exists");
      }
      throw err;
    }

    const { token, expiresAt } = db.createSession(user.id);
    setSessionCookie(res, token, expiresAt);
    return sendJson(res, 201, user);
  }

  if (action === "login" && req.method === "POST") {
    const { email, password } = parseCredentials(await readBody(req), {
      checkStrength: false,
    });
    const row = db.getUserByEmail(email);

    const passwordOk = await auth.verifyPassword(
      password,
      row ? row.password_hash : auth.DUMMY_HASH,
    );
    if (!row || !passwordOk) throw httpError(401, "Invalid email or password");

    const { token, expiresAt } = db.createSession(row.id);
    setSessionCookie(res, token, expiresAt);
    return sendJson(res, 200, { id: row.id, email: row.email });
  }

  if (action === "logout" && req.method === "POST") {
    const token = getSessionToken(req);
    if (token) db.deleteSession(token);
    clearSessionCookie(res);
    return sendEmpty(res, 204);
  }

  if (action === "forgot" && req.method === "POST") {
    const body = await readBody(req);
    assertObject(body);
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !EMAIL_RE.test(email))
      throw httpError(400, "Enter a valid email address");

    const row = db.getUserByEmail(email);
    if (row) {
      const token = db.createResetToken(row.id);
      mail.sendPasswordResetEmail(
        row.email,
        `${ALLOWED_ORIGIN}/reset-password?token=${token}`,
      );
    }
    // Same answer whether the email exists or not, so nobody can use this
    // form to find out which emails are registered.
    return sendEmpty(res, 204);
  }

  if (action === "reset" && req.method === "POST") {
    const body = await readBody(req);
    assertObject(body);
    const token = typeof body.token === "string" ? body.token : "";
    const next = typeof body.newPassword === "string" ? body.newPassword : "";

    const problem = passwordProblem(next);
    if (problem) throw httpError(400, problem, { newPassword: problem });

    const ok =
      token && db.resetPasswordWithToken(token, await auth.hashPassword(next));
    if (!ok) throw httpError(400, "This reset link is invalid or has expired.");
    return sendEmpty(res, 204);
  }

  if (action === "me" && req.method === "GET") {
    return sendJson(res, 200, requireUser(req));
  }

  if (action === "password" && req.method === "PUT") {
    const user = requireUser(req);
    const body = await readBody(req);
    assertObject(body);

    const current =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const next = typeof body.newPassword === "string" ? body.newPassword : "";

    const row = db.getUserById(user.id);
    if (!current || !(await auth.verifyPassword(current, row.password_hash))) {
      throw httpError(400, "Current password is incorrect", {
        currentPassword: "Current password is incorrect",
      });
    }
    const problem = passwordProblem(next);
    if (problem) throw httpError(400, problem, { newPassword: problem });
    if (next === current) {
      throw httpError(400, "New password must be different", {
        newPassword: "New password must be different",
      });
    }

    db.setPasswordHash(user.id, await auth.hashPassword(next));
    // log out every other device, keep this one
    db.deleteOtherSessions(user.id, getSessionToken(req));
    return sendEmpty(res, 204);
  }

  throw httpError(404, "Not found");
}

/* ---------- /api/notes/* ---------- */

async function handleNotes(req, res, idPart) {
  const user = requireUser(req);

  // /api/notes
  if (idPart === undefined) {
    if (req.method === "GET") {
      return sendJson(res, 200, db.getAllNotes(user.id));
    }
    if (req.method === "POST") {
      const fields = parseNoteFields(await readBody(req), { requireAll: true });
      return sendJson(res, 201, db.createNote(user.id, fields));
    }
    throw httpError(405, "Method not allowed");
  }

  // /api/notes/:id  (a note that belongs to someone else is a 404 too)
  const id = Number(idPart);
  const note = Number.isInteger(id) ? db.getNote(user.id, id) : null;
  if (!note) throw httpError(404, "Note not found");

  if (req.method === "GET") {
    return sendJson(res, 200, note);
  }
  if (req.method === "PUT") {
    const fields = parseNoteFields(await readBody(req), { requireAll: false });
    return sendJson(res, 200, db.updateNote(user.id, id, fields));
  }
  if (req.method === "DELETE") {
    db.deleteNote(user.id, id);
    return sendEmpty(res, 204);
  }
  throw httpError(405, "Method not allowed");
}

/* ---------- server ---------- */

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Credentials", "true"); // lets the browser send the cookie
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendEmpty(res, 204);
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const parts = pathname.split("/").filter(Boolean); // ['api', 'notes', '3']
  console.log(req.method, pathname);

  try {
    if (parts[0] !== "api" || parts.length > 3)
      throw httpError(404, "Not found");

    if (parts[1] === "auth") return await handleAuth(req, res, parts[2]);
    if (parts[1] === "notes") return await handleNotes(req, res, parts[2]);

    throw httpError(404, "Not found");
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    sendJson(res, status, {
      error: status === 500 ? "Internal server error" : err.message,
      details: err.details,
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
