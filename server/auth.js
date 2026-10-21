const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// Stored format: "<salt hex>:<hash hex>". A fresh random salt per password
// means two users with the same password get different hashes.
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, keyHex] = stored.split(":");
  const expected = Buffer.from(keyHex, "hex");
  const key = await scrypt(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length,
  );
  return crypto.timingSafeEqual(key, expected); // constant-time comparison
}

// Used when the email doesn't exist, so a login attempt takes about the
// same time either way and doesn't reveal which emails are registered.
const DUMMY_HASH = `${"00".repeat(16)}:${"00".repeat(KEY_LENGTH)}`;

module.exports = { hashPassword, verifyPassword, DUMMY_HASH };
