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
 * Generate a unique 8-character alphanumeric referral code
 * @param {string} username - User's username
 * @param {string} fullname - User's full name (fallback if username is empty)
 * @returns {string} 8-character alphanumeric code in uppercase
 */
export function generateReferralCode(username, fullname) {
  // Use username, fallback to fullname, default to "USER"
  let base = username || fullname || 'USER';

  // Remove spaces and special characters, convert to uppercase
  base = base.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // If 8 chars or longer, slice to 8
  if (base.length >= 8) {
    return base.slice(0, 8);
  }

  // If shorter than 8, pad with random digits
  const remainingLength = 8 - base.length;
  let digits = '';
  for (let i = 0; i < remainingLength; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }

  return base + digits;
}
