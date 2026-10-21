const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DB_FILE = path.join(__dirname, "notes.db");
const OLD_JSON_FILE = path.join(__dirname, "data", "notes.json");
const SESSION_DAYS = 7;
const RESET_MINUTES = 60;

const db = new DatabaseSync(DB_FILE);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL,
    last_edited TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS note_tags (
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag     TEXT    NOT NULL,
    PRIMARY KEY (note_id, tag)
  );
`);

// Migration: older databases have no user_id on notes.
// Those notes are claimed by the first account that registers.
const notesColumns = db.prepare("PRAGMA table_info(notes)").all();
if (!notesColumns.some((c) => c.name === "user_id")) {
  db.exec(
    "ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE",
  );
}
db.exec("CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id)");

/* ---------- helpers ---------- */

// DB row (snake_case, 0/1) -> API shape (camelCase, boolean, tags array)
function toNote(row, tags) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    lastEdited: row.last_edited,
  };
}

// Runs fn inside a transaction: everything succeeds, or nothing is saved.
function transaction(fn) {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/* ================= notes (always scoped to one user) ================= */

const selectNotes = db.prepare(
  "SELECT * FROM notes WHERE user_id = ? ORDER BY last_edited DESC, id DESC",
);
const selectNote = db.prepare(
  "SELECT * FROM notes WHERE id = ? AND user_id = ?",
);
const selectAllTags = db.prepare(
  `SELECT t.note_id, t.tag FROM note_tags t
   JOIN notes n ON n.id = t.note_id
   WHERE n.user_id = ? ORDER BY t.tag`,
);
const selectTagsForNote = db.prepare(
  "SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag",
);

const insertNote = db.prepare(
  "INSERT INTO notes (user_id, title, content, is_archived, created_at, last_edited) VALUES (?, ?, ?, ?, ?, ?)",
);
const updateNoteRow = db.prepare(
  "UPDATE notes SET title = ?, content = ?, is_archived = ?, last_edited = ? WHERE id = ? AND user_id = ?",
);
const deleteNoteRow = db.prepare(
  "DELETE FROM notes WHERE id = ? AND user_id = ?",
);

const insertTag = db.prepare(
  "INSERT OR IGNORE INTO note_tags (note_id, tag) VALUES (?, ?)",
);
const deleteTagsForNote = db.prepare("DELETE FROM note_tags WHERE note_id = ?");

function getAllNotes(userId) {
  const tagsByNote = new Map();
  for (const { note_id, tag } of selectAllTags.all(userId)) {
    if (!tagsByNote.has(note_id)) tagsByNote.set(note_id, []);
    tagsByNote.get(note_id).push(tag);
  }
  return selectNotes
    .all(userId)
    .map((row) => toNote(row, tagsByNote.get(row.id) ?? []));
}

// Returns null if the note doesn't exist OR belongs to someone else.
function getNote(userId, id) {
  const row = selectNote.get(id, userId);
  if (!row) return null;
  return toNote(
    row,
    selectTagsForNote.all(id).map((r) => r.tag),
  );
}

function createNote(userId, { title, content, tags, isArchived }) {
  const now = new Date().toISOString();
  const id = transaction(() => {
    const result = insertNote.run(
      userId,
      title,
      content,
      isArchived ? 1 : 0,
      now,
      now,
    );
    const newId = Number(result.lastInsertRowid);
    for (const tag of tags) insertTag.run(newId, tag);
    return newId;
  });
  return getNote(userId, id);
}

// `changes` may contain any of: title, content, tags, isArchived
function updateNote(userId, id, changes) {
  const current = getNote(userId, id);
  if (!current) return null;

  const contentChanged = ["title", "content", "tags"].some(
    (key) => key in changes,
  );
  const next = { ...current, ...changes };

  transaction(() => {
    updateNoteRow.run(
      next.title,
      next.content,
      next.isArchived ? 1 : 0,
      contentChanged ? new Date().toISOString() : current.lastEdited,
      id,
      userId,
    );
    if ("tags" in changes) {
      deleteTagsForNote.run(id);
      for (const tag of changes.tags) insertTag.run(id, tag);
    }
  });
  return getNote(userId, id);
}

function deleteNote(userId, id) {
  return deleteNoteRow.run(id, userId).changes > 0;
}

/* ============================== users ============================== */

const insertUser = db.prepare(
  "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
);
const selectUserByEmail = db.prepare("SELECT * FROM users WHERE email = ?");
const selectUserById = db.prepare("SELECT * FROM users WHERE id = ?");
const updateUserPassword = db.prepare(
  "UPDATE users SET password_hash = ? WHERE id = ?",
);
const countUsers = db.prepare("SELECT COUNT(*) AS count FROM users");
const claimOrphanNotes = db.prepare(
  "UPDATE notes SET user_id = ? WHERE user_id IS NULL",
);

function createUser(email, passwordHash) {
  return transaction(() => {
    const isFirstUser = countUsers.get().count === 0;
    const result = insertUser.run(
      email,
      passwordHash,
      new Date().toISOString(),
    );
    const id = Number(result.lastInsertRowid);
    if (isFirstUser) claimOrphanNotes.run(id);
    return { id, email };
  });
}

const getUserByEmail = (email) => selectUserByEmail.get(email) ?? null;
const getUserById = (id) => selectUserById.get(id) ?? null;
const setPasswordHash = (id, hash) => updateUserPassword.run(hash, id);

/* ============================= sessions ============================= */

// Only a SHA-256 of the token is stored, so a leaked database
// can't be used to log in as someone.
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const insertSession = db.prepare(
  "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
);
const selectUserBySession = db.prepare(
  `SELECT u.id, u.email FROM sessions s
   JOIN users u ON u.id = s.user_id
   WHERE s.token_hash = ? AND s.expires_at > ?`,
);
const deleteSessionRow = db.prepare(
  "DELETE FROM sessions WHERE token_hash = ?",
);
const deleteOtherSessionRows = db.prepare(
  "DELETE FROM sessions WHERE user_id = ? AND token_hash != ?",
);
const deleteExpiredSessions = db.prepare(
  "DELETE FROM sessions WHERE expires_at <= ?",
);

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  );

  deleteExpiredSessions.run(now.toISOString());
  insertSession.run(
    hashToken(token),
    userId,
    now.toISOString(),
    expiresAt.toISOString(),
  );
  return { token, expiresAt };
}

const getUserBySession = (token) =>
  selectUserBySession.get(hashToken(token), new Date().toISOString()) ?? null;
const deleteSession = (token) => deleteSessionRow.run(hashToken(token));
const deleteOtherSessions = (userId, keepToken) =>
  deleteOtherSessionRows.run(userId, hashToken(keepToken));

/* ========================= password reset ========================= */

const insertReset = db.prepare(
  "INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
);
const selectValidReset = db.prepare(
  "SELECT user_id FROM password_resets WHERE token_hash = ? AND expires_at > ?",
);
const deleteResetsForUser = db.prepare(
  "DELETE FROM password_resets WHERE user_id = ?",
);
const deleteExpiredResets = db.prepare(
  "DELETE FROM password_resets WHERE expires_at <= ?",
);
const deleteSessionsForUser = db.prepare(
  "DELETE FROM sessions WHERE user_id = ?",
);

// Creates a one-time token. Only its hash is stored, same idea as sessions.
// Asking again invalidates the previous link.
function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_MINUTES * 60 * 1000);

  transaction(() => {
    deleteExpiredResets.run(now.toISOString());
    deleteResetsForUser.run(userId);
    insertReset.run(hashToken(token), userId, expiresAt.toISOString());
  });
  return token;
}

// Returns true if the token was valid. A used token is deleted, so it works once,
// and every session of that user is ended (they must log in with the new password).
function resetPasswordWithToken(token, newPasswordHash) {
  return transaction(() => {
    const row = selectValidReset.get(
      hashToken(token),
      new Date().toISOString(),
    );
    if (!row) return false;
    updateUserPassword.run(newPasswordHash, row.user_id);
    deleteResetsForUser.run(row.user_id);
    deleteSessionsForUser.run(row.user_id);
    return true;
  });
}

/* ------- first run only: import notes from the old JSON file ------- */

(function importOldJson() {
  const hasData =
    countUsers.get().count > 0 ||
    db.prepare("SELECT COUNT(*) AS count FROM notes").get().count > 0;
  if (hasData) return;

  let old;
  try {
    old = JSON.parse(fs.readFileSync(OLD_JSON_FILE, "utf8"));
  } catch {
    return;
  }

  console.log(
    `Importing ${old.length} notes from data/notes.json (the first account will own them)`,
  );
  transaction(() => {
    for (const note of old) {
      const now = new Date().toISOString();
      const result = insertNote.run(
        null,
        note.title,
        note.content,
        note.isArchived ? 1 : 0,
        note.createdAt ?? now,
        note.lastEdited ?? now,
      );
      for (const tag of note.tags ?? [])
        insertTag.run(Number(result.lastInsertRowid), tag);
    }
  });
})();

module.exports = {
  getAllNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  createUser,
  getUserByEmail,
  getUserById,
  setPasswordHash,
  createSession,
  getUserBySession,
  deleteSession,
  deleteOtherSessions,
  createResetToken,
  resetPasswordWithToken,
};
