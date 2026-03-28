const MOJIBAKE_PATTERN = /[\u00C3\u00C2\u00E2\u00CC\u00C8\u00D2\u00D9\u00C0\u00D5]/u
const REPLACEMENT_CHAR = '\uFFFD'

const COMMON_MOJIBAKE_REPLACEMENTS: Array<[string, string]> = [
  ['\u00C3\u00A1', '\u00E1'],
  ['\u00C3\u00A2', '\u00E2'],
  ['\u00C3\u00A3', '\u00E3'],
  ['\u00C3\u00A0', '\u00E0'],
  ['\u00C3\u00A4', '\u00E4'],
  ['\u00C3\u0081', '\u00C1'],
  ['\u00C3\u0082', '\u00C2'],
  ['\u00C3\u0083', '\u00C3'],
  ['\u00C3\u0080', '\u00C0'],
  ['\u00C3\u0084', '\u00C4'],
  ['\u00C3\u00A9', '\u00E9'],
  ['\u00C3\u00AA', '\u00EA'],
  ['\u00C3\u00A8', '\u00E8'],
  ['\u00C3\u00AB', '\u00EB'],
  ['\u00C3\u0089', '\u00C9'],
  ['\u00C3\u008A', '\u00CA'],
  ['\u00C3\u0088', '\u00C8'],
  ['\u00C3\u008B', '\u00CB'],
  ['\u00C3\u00AD', '\u00ED'],
  ['\u00C3\u00AC', '\u00EC'],
  ['\u00C3\u00AF', '\u00EF'],
  ['\u00C3\u008D', '\u00CD'],
  ['\u00C3\u008C', '\u00CC'],
  ['\u00C3\u008F', '\u00CF'],
  ['\u00C3\u00B3', '\u00F3'],
  ['\u00C3\u00B4', '\u00F4'],
  ['\u00C3\u00B5', '\u00F5'],
  ['\u00C3\u00B2', '\u00F2'],
  ['\u00C3\u00B6', '\u00F6'],
  ['\u00C3\u0093', '\u00D3'],
  ['\u00C3\u0094', '\u00D4'],
  ['\u00C3\u0095', '\u00D5'],
  ['\u00C3\u0092', '\u00D2'],
  ['\u00C3\u0096', '\u00D6'],
  ['\u00C3\u00BA', '\u00FA'],
  ['\u00C3\u00B9', '\u00F9'],
  ['\u00C3\u00BC', '\u00FC'],
  ['\u00C3\u009A', '\u00DA'],
  ['\u00C3\u0099', '\u00D9'],
  ['\u00C3\u009C', '\u00DC'],
  ['\u00C3\u00A7', '\u00E7'],
  ['\u00C3\u0087', '\u00C7'],
  ['\u00C3\u00B1', '\u00F1'],
  ['\u00C3\u0091', '\u00D1'],
  ['\u00E2\u20AC\u201C', '-'],
  ['\u00E2\u20AC\u201D', '-'],
  ['\u00E2\u20AC\u02DC', "'"],
  ['\u00E2\u20AC\u2122', "'"],
  ['\u00E2\u20AC\u0153', '"'],
  ['\u00E2\u20AC\u009D', '"'],
  ['\u00E2\u20AC\u00A6', '...'],
  ['\u00E2\u20AC\u00A2', '-'],
  ['\u00CC', '\u00ED'],
  ['\u00C8', '\u00E9'],
  ['\u00D2', '\u00F3'],
  ['\u00D9', '\u00FA'],
  ['\u00C0', '\u00E0'],
  ['\u00D5', '\u00F5'],
]

function countSuspiciousChars(value: string) {
  const mojibakeHits = value.match(/[\u00C3\u00C2\u00E2\u00CC\u00C8\u00D2\u00D9\u00C0\u00D5]/gu) || []
  const replacementHits = value.match(new RegExp(REPLACEMENT_CHAR, 'gu')) || []
  return mojibakeHits.length + replacementHits.length * 2
}

function applyCommonMojibakeReplacements(value: string) {
  return COMMON_MOJIBAKE_REPLACEMENTS.reduce(
    (currentValue, [from, to]) => currentValue.split(from).join(to),
    value
  )
}

function decodeUtf8FromAnsi(value: string) {
  const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff))
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

function pickBestCandidate(rawValue: string, candidates: string[]) {
  return candidates.reduce((bestValue, candidate) => {
    if (!candidate) return bestValue

    const normalizedCandidate = candidate.trim()
    if (!normalizedCandidate) return bestValue

    return countSuspiciousChars(normalizedCandidate) < countSuspiciousChars(bestValue)
      ? normalizedCandidate
      : bestValue
  }, rawValue.trim())
}

export function normalizeDisplayText(value: string | null | undefined) {
  const rawValue = String(value || '').trim()
  if (!rawValue) return ''

  const candidates = [rawValue, applyCommonMojibakeReplacements(rawValue)]

  if (MOJIBAKE_PATTERN.test(rawValue)) {
    try {
      const decodedUtf8 = decodeUtf8FromAnsi(rawValue)
      if (decodedUtf8 && !decodedUtf8.includes(REPLACEMENT_CHAR)) {
        candidates.push(decodedUtf8)
        candidates.push(applyCommonMojibakeReplacements(decodedUtf8))
      }
    } catch {
      // noop
    }
  }

  return pickBestCandidate(rawValue, candidates)
}
