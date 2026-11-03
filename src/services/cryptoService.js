// ─── CipherChat Crypto Service ───────────────────────────────────────────────
// All cryptographic operations using browser-native Web Crypto API only.
// Algorithm: ECDH P-256 key exchange + HKDF-SHA256 key derivation + AES-GCM-256 encryption

const ECDH_PARAMS = { name: 'ECDH', namedCurve: 'P-256' };
const AES_PARAMS = { name: 'AES-GCM', length: 256 };
const HKDF_INFO = new TextEncoder().encode('CipherChat-v1');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64ToBuf(b64) {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

// ─── Key Generation ──────────────────────────────────────────────────────────

export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(ECDH_PARAMS, true, ['deriveKey', 'deriveBits']);
  return keyPair; // { publicKey, privateKey }
}

export async function exportPublicKey(publicKey) {
  const raw = await crypto.subtle.exportKey('raw', publicKey);
  return bufToB64(raw);
}

export async function importPublicKey(b64) {
  const raw = b64ToBuf(b64);
  return crypto.subtle.importKey('raw', raw, ECDH_PARAMS, true, []);
}

export async function exportPrivateKey(privateKey) {
  const jwk = await crypto.subtle.exportKey('jwk', privateKey);
  return JSON.stringify(jwk);
}

export async function importPrivateKey(jwkStr) {
  const jwk = JSON.parse(jwkStr);
  return crypto.subtle.importKey('jwk', jwk, ECDH_PARAMS, true, ['deriveKey', 'deriveBits']);
}

// ─── Key Agreement ───────────────────────────────────────────────────────────

export async function deriveSharedSecret(privateKey, peerPublicKey) {
  return crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    256
  );
}

// ─── Key Derivation ──────────────────────────────────────────────────────────

export async function deriveEncryptionKey(sharedSecret, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: typeof salt === 'string' ? b64ToBuf(salt) : salt,
      info: HKDF_INFO,
    },
    baseKey,
    AES_PARAMS,
    false,
    ['encrypt', 'decrypt']
  );
}

// ─── Encryption / Decryption ─────────────────────────────────────────────────

export async function encryptMessage(encryptionKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    encoded
  );

  return {
    ciphertext: bufToB64(ciphertext),
    iv: bufToB64(iv.buffer),
  };
}

export async function decryptMessage(encryptionKey, ciphertext, iv) {
  const ciphertextBuf = b64ToBuf(ciphertext);
  const ivBuf = b64ToBuf(iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuf) },
    encryptionKey,
    ciphertextBuf
  );

  return new TextDecoder().decode(decrypted);
}

// ─── Salt / Fingerprint ──────────────────────────────────────────────────────

export function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufToB64(salt.buffer);
}

export async function computeFingerprint(publicKey) {
  const raw = await crypto.subtle.exportKey('raw', publicKey);
  const hash = await crypto.subtle.digest('SHA-256', raw);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase()
    .match(/.{1,5}/g)
    .join(' ');
}

// ─── Full Session Setup ──────────────────────────────────────────────────────

export async function setupEncryptionSession() {
  // Generate key pairs for both local user and simulated peer
  const myKeyPair = await generateKeyPair();
  const peerKeyPair = await generateKeyPair();

  // Derive shared secret (ECDH)
  const sharedSecret = await deriveSharedSecret(myKeyPair.privateKey, peerKeyPair.publicKey);

  // Generate salt and derive AES key
  const salt = generateSalt();
  const encryptionKey = await deriveEncryptionKey(sharedSecret, salt);

  // Compute fingerprints
  const myFingerprint = await computeFingerprint(myKeyPair.publicKey);
  const peerFingerprint = await computeFingerprint(peerKeyPair.publicKey);

  // Export keys for storage
  const myPublicKeyB64 = await exportPublicKey(myKeyPair.publicKey);
  const myPrivateKeyJwk = await exportPrivateKey(myKeyPair.privateKey);
  const peerPublicKeyB64 = await exportPublicKey(peerKeyPair.publicKey);
  const peerPrivateKeyJwk = await exportPrivateKey(peerKeyPair.privateKey);

  return {
    encryptionKey,
    salt,
    myFingerprint,
    peerFingerprint,
    exportedKeys: {
      myPublicKey: myPublicKeyB64,
      myPrivateKey: myPrivateKeyJwk,
      peerPublicKey: peerPublicKeyB64,
      peerPrivateKey: peerPrivateKeyJwk,
    }
  };
}

export async function restoreEncryptionSession(exportedKeys, salt) {
  const myPrivateKey = await importPrivateKey(exportedKeys.myPrivateKey);
  const peerPublicKey = await importPublicKey(exportedKeys.peerPublicKey);

  const sharedSecret = await deriveSharedSecret(myPrivateKey, peerPublicKey);
  const encryptionKey = await deriveEncryptionKey(sharedSecret, salt);

  const myPublicKey = await importPublicKey(exportedKeys.myPublicKey);
  const myFingerprint = await computeFingerprint(myPublicKey);
  const peerPublicKeyObj = await importPublicKey(exportedKeys.peerPublicKey);
  const peerFingerprint = await computeFingerprint(peerPublicKeyObj);

  return { encryptionKey, myFingerprint, peerFingerprint };
}
