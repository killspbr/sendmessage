import { webcrypto as crypto } from 'node:crypto';

async function sha256(data) {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function run() {
  const password = 'Smile123!';
  const stored = 'sha256:3a8777fd57255fa2a196706115cea9a1:7c0c01763321d8d3fc16969420526bc0d299dd3413ab0317a3122a6dc2abdfc17';
  
  const parts = stored.split(':');
  const saltHex = parts[1];
  const expectedHash = parts[2];
  
  const saltMatches = saltHex.match(/.{1,2}/g);
  const salt = new Uint8Array(saltMatches.map((b) => parseInt(b, 16)));
  
  const computed = await sha256(new TextEncoder().encode(salt.join(',') + password));
  
  console.log('Computed:', computed);
  console.log('Expected:', expectedHash);
  console.log('Match:', computed === expectedHash);
}

run();
