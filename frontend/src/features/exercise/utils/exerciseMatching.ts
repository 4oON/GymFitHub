import type { Exercise } from '@/shared/types';

const EXCLUDED_WORDS = new Set([
  'a', 'an', 'the', 'of', 'with', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'by',
  'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'exercise', 'workout', 'training', 'machine', 'barbell', 'dumbbell', 'cable', 'band',
  'smith', 'bodyweight',
]);

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9一-鿿]/g, '');
}

function tokenizeEnglish(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[\s\-/]+/)
    .map(normalizeWord)
    .filter(w => w.length >= 3 && !EXCLUDED_WORDS.has(w));
}

function expandSynonym(word: string): string[] {
  const synonyms: Record<string, string[]> = {
    press: ['bench', 'benchpress'],
    benchpress: ['press'],
    fly: ['flye', 'flyes', 'chestfly', 'chestflye'],
    flye: ['fly', 'flyes'],
    flyes: ['fly', 'flye'],
    chestfly: ['fly', 'flye'],
    chestflye: ['fly', 'flye'],
    curl: ['bicepcurl'],
    bicepcurl: ['curl'],
    squat: ['backsquat'],
    backsquat: ['squat'],
    row: ['bentoverrow', 'barbellrow', 'pendlayrow'],
    bentoverrow: ['row', 'barbellrow'],
    barbellrow: ['row', 'bentoverrow'],
    pendlayrow: ['row'],
    reverse: ['supinated', 'underhand'],
    supinated: ['reverse', 'underhand'],
    underhand: ['reverse', 'supinated'],
    pronated: ['overhand'],
    overhand: ['pronated'],
    grip: [], // low-information stop word
    alternating: ['singlearm', 'onearm'],
    singlearm: ['alternating', 'onearm'],
    onearm: ['alternating', 'singlearm'],
    neutral: ['hammer'],
    hammer: ['neutral'],
    wide: ['widegrip'],
    widegrip: ['wide'],
    close: ['closegrip', 'narrow'],
    closegrip: ['close', 'narrow'],
    narrow: ['close', 'closegrip'],
    romanian: ['rdl'],
    rdl: ['romanian'],
    lateralraise: ['sidelateral', 'sidelateralraise'],
    sidelateral: ['lateralraise'],
    sidelateralraise: ['lateralraise'],
    skullcrusher: ['tricepsextension', 'lyingtricepsextension'],
    tricepsextension: ['skullcrusher'],
    lyingtricepsextension: ['skullcrusher'],
    pullover: ['skullover'],
    skullover: ['pullover'],
  };
  return synonyms[word] || [];
}

function getWordSet(name: string): Set<string> {
  const words = tokenizeEnglish(name);
  const set = new Set(words);
  for (const w of words) {
    for (const syn of expandSynonym(w)) set.add(syn);
  }
  return set;
}

function chineseSubstrings(name: string, maxLen = 4): Set<string> {
  const subs = new Set<string>();
  const normalized = name.toLowerCase();
  for (let len = 2; len <= maxLen && len <= normalized.length; len++) {
    for (let i = 0; i <= normalized.length - len; i++) {
      subs.add(normalized.slice(i, i + len));
    }
  }
  return subs;
}

/** Smart fuzzy match between an AI exercise name and the user's exercise library. */
export function fuzzyMatchExercise(name: string, library: Exercise[]): Exercise | null {
  const normalized = name.toLowerCase().trim();
  if (!normalized || library.length === 0) return null;

  // 1. Exact match (English or Chinese)
  let match = library.find(
    e => e.name.toLowerCase() === normalized || e.nameZh?.toLowerCase() === normalized
  );
  if (match) return match;

  // 2. Contains match (bidirectional)
  match = library.find(e => {
    const en = e.name.toLowerCase();
    const zh = e.nameZh?.toLowerCase() || '';
    return en.includes(normalized) || normalized.includes(en) || zh.includes(normalized) || normalized.includes(zh);
  });
  if (match) return match;

  // 3. English word-set overlap (order independent) + synonyms
  const queryWords = getWordSet(normalized);
  if (queryWords.size > 0) {
    let bestMatch: Exercise | null = null;
    let bestScore = 0;

    for (const e of library) {
      const exWords = getWordSet(e.name);
      let overlap = 0;
      for (const qw of queryWords) {
        if (exWords.has(qw)) overlap += 1;
      }
      // Bonus if Chinese name also shares substring
      const zhSubs = chineseSubstrings(e.nameZh || '', 4);
      for (const qw of queryWords) {
        if (zhSubs.has(qw)) overlap += 2;
      }

      if (overlap > bestScore) {
        bestScore = overlap;
        bestMatch = e;
      }
    }

    // Require at least 2 overlapping meaningful words (or 1 if very short name)
    const minOverlap = queryWords.size === 1 ? 1 : 2;
    if (bestScore >= minOverlap) return bestMatch;
  }

  // 4. Multi-word overlap fallback for English names with 2+ words
  const nameWords = normalized.split(/\s+/).filter(w => w.length > 2);
  if (nameWords.length >= 2) {
    match = library.find(e => {
      const exWords = e.name.toLowerCase().split(/\s+/);
      const matchCount = nameWords.filter(nw => exWords.some(ew => ew.includes(nw) || nw.includes(ew))).length;
      return matchCount >= 2;
    });
    if (match) return match;
  }

  // 5. Chinese keyword fallback
  if (/[一-鿿]/.test(normalized)) {
    const subs = chineseSubstrings(normalized, 4);
    let bestMatch: Exercise | null = null;
    let bestScore = 0;

    for (const e of library) {
      const exNameZh = e.nameZh?.toLowerCase() || '';
      let score = 0;
      for (const sub of subs) {
        if (exNameZh.includes(sub)) score += 3;
        if (e.name.toLowerCase().includes(sub)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = e;
      }
    }

    if (bestScore >= 3) return bestMatch;
  }

  return null;
}
