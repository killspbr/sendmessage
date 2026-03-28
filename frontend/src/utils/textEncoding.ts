export function normalizeDisplayText(value: string | null | undefined) {
  const rawValue = String(value || '')
  if (!rawValue) return ''

  if (!/[ÃÂâ€™â€œâ€]/.test(rawValue)) {
    return rawValue
  }

  try {
    const latin1Bytes = Uint8Array.from(rawValue.split('').map((char) => char.charCodeAt(0) & 0xff))
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(latin1Bytes)
    if (decoded && !decoded.includes('\uFFFD')) {
      return decoded
    }
  } catch {
    // noop
  }

  return rawValue
}
