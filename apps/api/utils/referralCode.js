/**
 * Deterministic 8-digit numeric fallback code derived from a MongoDB ObjectId.
 * Takes the last 8 hex chars of the id, interprets them as uint32, mods by 1e8,
 * and zero-pads to 8 digits. Stable for the same id across all calls.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string} 8-digit zero-padded numeric string
 */
export function generateFallbackCode(userId) {
  const hex = userId.toString().slice(-8);
  const num = parseInt(hex, 16) % 100_000_000;
  return num.toString().padStart(8, '0');
}

/**
 * Generate an 8-character alphanumeric referral code, seeded from the user's
 * username/name but never fully deterministic — two users sharing the same
 * first few characters (e.g. "johnsmith1" / "johnsmith2") must not collide on
 * referralCode's unique index. Always reserves at least 3 trailing characters
 * for randomness, regardless of base length.
 * @param {string} username - User's username
 * @param {string} fullname - User's full name (fallback if username is empty)
 * @returns {string} 8-character alphanumeric code in uppercase
 */
export function generateReferralCode(username, fullname) {
  // Use username, fallback to fullname, default to "USER"
  let base = username || fullname || 'USER';

  // Remove spaces and special characters, convert to uppercase
  base = base.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  const RANDOM_LENGTH = 3;
  const baseLength = 8 - RANDOM_LENGTH;
  base = base.slice(0, baseLength);

  const remainingLength = 8 - base.length;
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < remainingLength; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }

  return base + suffix;
}
