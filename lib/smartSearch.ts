// Smart AI Fuzzy Search Engine with Phonetic & Typo Tolerance for StayBuddy

const STOP_WORDS = new Set([
  'hotel', 'hotels', 'resort', 'resorts', 'inn', 'stay', 'stays',
  'grand', 'palace', 'international', 'suites', 'suite', 'lodge',
  'the', 'by', 'at', 'in', 'and', '&'
]);

export function cleanText(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTokens(str: string): string[] {
  return cleanText(str).split(/\s+/).filter(Boolean);
}

export function getSignificantTokens(str: string): string[] {
  const tokens = getTokens(str);
  const sig = tokens.filter(t => !STOP_WORDS.has(t));
  return sig.length > 0 ? sig : tokens;
}

export function normalizePhonetics(s: string): string {
  return s
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/ph/g, 'f')
    .replace(/gh/g, 'g')
    .replace(/kh/g, 'k')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/y/g, 'i')
    .replace(/z/g, 's')
    .replace(/ck/g, 'k')
    .replace(/(.)\1+/g, '$1'); // collapse duplicate consecutive letters
}

export function getConsonantSkeleton(s: string): string {
  return normalizePhonetics(s).replace(/[^a-z]/g, '').replace(/[aeiou]/g, '');
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const m: number[][] = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

/**
 * Computes AI fuzzy similarity score between a user query and a target name (0 - 100).
 * Matches across:
 * - Exact and substring match
 * - Stop-word stripped core tokens (e.g. "galadhari hotel" -> "galadhari")
 * - Phonetic normalization ("galadhari" <-> "galadari", "vybrant" <-> "vibrant")
 * - Consonant skeleton ("gldr" <-> "gldr" for "galadhri" / "galadhari")
 * - Typo tolerance (Levenshtein distance <= 2)
 */
export function calculateSmartScore(query: string, target: string): number {
  const qClean = cleanText(query);
  const tClean = cleanText(target);
  if (!qClean || !tClean) return 0;

  // 1. Exact match
  if (tClean === qClean) return 100;

  // 2. Direct substring
  if (tClean.includes(qClean)) return 95;
  if (qClean.includes(tClean)) return 90;

  const qSig = getSignificantTokens(query);
  const tSig = getSignificantTokens(target);
  const qSigJoined = qSig.join('');
  const tSigJoined = tSig.join('');

  // 3. Significant joined tokens substring
  if (tSigJoined.includes(qSigJoined) || qSigJoined.includes(tSigJoined)) return 88;

  // 4. Phonetic normalization
  const qPh = normalizePhonetics(qSigJoined);
  const tPh = normalizePhonetics(tSigJoined);
  if (qPh === tPh) return 86;
  if (tPh.includes(qPh) || qPh.includes(tPh)) return 83;

  // 5. Consonant skeleton
  const qSkel = getConsonantSkeleton(qSigJoined);
  const tSkel = getConsonantSkeleton(tSigJoined);
  if (qSkel && tSkel && (qSkel === tSkel || tSkel.includes(qSkel) || qSkel.includes(tSkel))) return 80;

  // 6. Token-level fuzzy cross matching
  let maxTokenScore = 0;
  for (const qt of qSig) {
    const qtPh = normalizePhonetics(qt);
    const qtSkel = getConsonantSkeleton(qt);

    for (const tt of tSig) {
      if (qt === tt) {
        maxTokenScore = Math.max(maxTokenScore, 78);
        continue;
      }
      const ttPh = normalizePhonetics(tt);
      if (qtPh === ttPh) {
        maxTokenScore = Math.max(maxTokenScore, 76);
        continue;
      }

      const dist = levenshteinDistance(qtPh, ttPh);
      const maxLen = Math.max(qt.length, tt.length);
      if (dist <= 1 && maxLen >= 3) {
        maxTokenScore = Math.max(maxTokenScore, 74);
      } else if (dist <= 2 && maxLen >= 5) {
        maxTokenScore = Math.max(maxTokenScore, 68);
      } else if (qtSkel && qtSkel.length >= 3 && qtSkel === getConsonantSkeleton(tt)) {
        maxTokenScore = Math.max(maxTokenScore, 65);
      }
    }
  }

  return maxTokenScore;
}

