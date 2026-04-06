// Password hashing: SHA-256 with random salt via native Web Crypto API
// Cloudflare Workers compatible — no PBKDF2 importKey needed

const SALT_LENGTH = 16

function generateSalt(): Uint8Array {
  const bytes = new Uint8Array(SALT_LENGTH)
  crypto.getRandomValues(bytes)
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt()
  const hash = await sha256(new TextEncoder().encode(salt.join(',') + password))
  return `sha256:${bytesToHex(salt)}:${hash}`
}

export async function comparePassword(password: string, stored: string): Promise<boolean> {
  // Format: sha256:<salt_hex>:<hash_hex>
  const parts = stored.split(':')
  if (parts.length !== 3 || parts[0] !== 'sha256') {
    console.warn('[Passwd] Unknown or legacy hash format, cannot verify')
    return false
  }

  const saltHex = parts[1]
  const expectedHash = parts[2]
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))
  const computed = await sha256(new TextEncoder().encode(salt.join(',') + password))
  return computed === expectedHash
}
