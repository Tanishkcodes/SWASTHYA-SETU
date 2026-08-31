/**
 * Secure Cryptographic Utilities for Password Hashing & AES-GCM Encryption
 * Uses native Web Crypto API (SubtleCrypto) - Zero external dependencies
 */

const SECRET_SALT = 'SwasthyaSetu_SecureStaffAuth_Salt_2026';
const ENC_KEY_STRING = 'SwasthyaSetu_HospitalMaster_EncryptionKey_2026';

/**
 * Derives an AES-GCM crypto key from a passphrase
 */
async function getDerivedKey(passphrase) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase || ENC_KEY_STRING),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SECRET_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Hash password securely with PBKDF2-SHA256 + Salt
 * Returns hex representation: "pbkdf2:salt_hex:hash_hex"
 */
export async function hashPassword(plainPassword, saltHex = null) {
  const enc = new TextEncoder();
  const salt = saltHex
    ? hexToUint8Array(saltHex)
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(plainPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const derivedHash = uint8ArrayToHex(new Uint8Array(derivedBits));
  const saltString = uint8ArrayToHex(salt);
  return `pbkdf2:${saltString}:${derivedHash}`;
}

/**
 * Verify a plain password against a stored PBKDF2 hash
 */
export async function verifyPassword(plainPassword, storedHash) {
  if (!storedHash || !plainPassword) return false;

  // Handle plain text compatibility fallback if legacy account
  if (!storedHash.startsWith('pbkdf2:')) {
    return plainPassword === storedHash;
  }

  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;

  const saltHex = parts[1];
  const expectedHashHex = parts[2];

  const computed = await hashPassword(plainPassword, saltHex);
  const computedHashHex = computed.split(':')[2];

  return computedHashHex === expectedHashHex;
}

/**
 * Encrypt a text payload with AES-256-GCM
 * Returns hex string formatted as "iv_hex:encrypted_hex"
 */
export async function encryptText(plainText) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getDerivedKey(ENC_KEY_STRING);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  return `${uint8ArrayToHex(iv)}:${uint8ArrayToHex(new Uint8Array(cipherBuffer))}`;
}

/**
 * Decrypt an AES-256-GCM encrypted payload
 */
export async function decryptText(encryptedPayload) {
  if (!encryptedPayload || !encryptedPayload.includes(':')) return encryptedPayload;
  try {
    const [ivHex, cipherHex] = encryptedPayload.split(':');
    const iv = hexToUint8Array(ivHex);
    const cipherBytes = hexToUint8Array(cipherHex);
    const key = await getDerivedKey(ENC_KEY_STRING);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption error:', err);
    return null;
  }
}

// Helpers
function uint8ArrayToHex(uint8Array) {
  return Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToUint8Array(hexString) {
  const matches = hexString.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * Validate password strength policy: min 8 characters with letters and numbers
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password cannot be empty.' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  return { isValid: true, message: '' };
}
