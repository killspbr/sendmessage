const { webcrypto: crypto } = require('crypto');

const SALT_LENGTH = 16;
const password = 'Smile123!';

function generateSalt() {
  const bytes = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(data) {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function run() {
  const salt = generateSalt();
  const hash = await sha256(new TextEncoder().encode(salt.join(',') + password));
  console.log(`sha256:${bytesToHex(salt)}:${hash}`);
}

run();
