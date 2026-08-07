// Pure text-matching helpers for the Smart Billing Assistant.
// No mongoose imports — kept dependency-free so models and services can
// both use it without creating import cycles.

// Common Bengali/Hindi -> English food/market terms. When a product name
// in the catalog is a transliteration of a spoken word ("chaal" vs "Rice")
// these give the matcher a second chance via the alias pipeline.
const TRANSLITERATION_MAP = {
  chaal: 'rice',
  chawal: 'rice',
  chini: 'sugar',
  chin: 'sugar',
  dudh: 'milk',
  dhoodh: 'milk',
  aata: 'flour',
  atta: 'flour',
  maida: 'flour',
  tel: 'oil',
  tael: 'oil',
  dal: 'pulses',
  dhal: 'pulses',
  dim: 'egg',
  anda: 'egg',
  andha: 'egg',
  aloo: 'potato',
  alu: 'potato',
  pyaaz: 'onion',
  piaj: 'onion',
  adrak: 'ginger',
  lahsun: 'garlic',
  nimbu: 'lemon',
  dhaniya: 'coriander',
  haldi: 'turmeric',
  mirchi: 'chilli',
  namak: 'salt',
  paneer: 'paneer',
  ghee: 'ghee',
  sabun: 'soap',
  shampoo: 'shampoo',
  paste: 'toothpaste',
  manjan: 'toothpaste',
  kulfi: 'icecream',
  icecream: 'icecream',
  maggi: 'maggi',
  cola: 'coke',
  coke: 'coke',
  '2minute': 'maggi',
};

export const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['"`]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const TRANSLIT_KEYS = new Map(
  Object.entries(TRANSLITERATION_MAP).map(([k, v]) => [normalize(k), v])
);

// "one kilo sugar" -> "1 kilo sugar" so quantity words are usable as tokens.
export const resolveNumberWords = (value) => {
  const NUM_WORDS = {
    one: '1', two: '2', three: '3', four: '4', five: '5', six: '6',
    seven: '7', eight: '8', nine: '9', ten: '10', ek: '1', do: '2',
    teen: '3', char: '4', panch: '5', chhah: '6', saat: '7', aath: '8',
    nau: '9', das: '10', duto: '2', tinto: '3', chaar: '4',
  };
  return String(value || '')
    .toLowerCase()
    .replace(/\b[a-z]+\b/g, (word) => NUM_WORDS[word] || word);
};

export const tokenize = (value) => resolveNumberWords(normalize(value)).split(/\s+/).filter(Boolean);

// Canonical search keys for the index: the name plus every alias plus the
// transliteration of the name. Stored on the document and matched with $in.
export const buildSearchKeys = (name, aliases = []) => {
  const keys = new Set();
  const nameKey = normalize(name);
  if (nameKey) keys.add(nameKey);
  for (const alias of aliases || []) {
    const aliasKey = normalize(alias);
    if (aliasKey) keys.add(aliasKey);
    if (TRANSLIT_KEYS.has(aliasKey)) keys.add(TRANSLIT_KEYS.get(aliasKey));
  }
  if (TRANSLIT_KEYS.has(nameKey)) keys.add(TRANSLIT_KEYS.get(nameKey));
  return [...keys];
};

// Classic Levenshtein with early exit for long strings.
export const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (Math.abs(a.length - b.length) > Math.max(1, Math.floor(Math.max(a.length, b.length) / 4))) {
    return Infinity;
  }
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0];
    prev[0] = i;
    let rowMin = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(prev[j] + 1, prev[j - 1] + 1, prevDiag + cost);
      prevDiag = prev[j];
      prev[j] = next;
      if (next < rowMin) rowMin = next;
    }
    if (rowMin > Math.max(1, Math.floor(a.length / 4))) return Infinity;
  }
  return prev[b.length];
};

const maxFuzzyDistance = (length) => Math.max(1, Math.floor(length / 4));

const UNIT_WORDS = new Set([
  'kg', 'kgs', 'g', 'gram', 'grams', 'kilo', 'liter', 'litre', 'litres', 'l',
  'ml', 'pack', 'packs', 'packet', 'packets', 'pkt', 'piece', 'pieces', 'pcs',
  'pc', 'dozen', 'bottle', 'bottles', 'bag', 'bags', 'box', 'boxes', 'tin',
  'gallon', 'bundle', 'half', 'quarter',
]);

// "one kilo sugar" / "2 Maggi" / "half kg atta" -> core phrase "sugar" etc.
// Strips leading quantity and unit words; returns the stripped core.
export const coreQueryOf = (value) => {
  const words = resolveNumberWords(value)
    .replace(/\b(and|of)\b/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  let i = 0;
  while (i < words.length) {
    const w = words[i];
    if (/^\d+$/.test(w) || UNIT_WORDS.has(w)) {
      i += 1;
      continue;
    }
    break;
  }
  const core = words.slice(i).join(' ').trim();
  return core || words.join(' ');
};

// Score a single candidate name/alias against a normalized query.
// Returns a score (higher = better) or 0 when there is no meaningful match.
export const scoreMatch = (query, candidateKey) => {
  if (!query || !candidateKey) return 0;
  if (query === candidateKey) return 100;
  if (candidateKey.startsWith(query)) return 70 + Math.min(10, query.length);
  if (query.startsWith(candidateKey) && candidateKey.length >= 3) return 65;
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const candidateTokens = candidateKey.split(/\s+/).filter(Boolean);
    const matchedTokens = tokens.filter((t) => candidateTokens.some((ct) => ct === t)).length;
    if (matchedTokens === tokens.length && matchedTokens > 1) return 80;
  }
  if (candidateKey.includes(query) && query.length >= 3) return 50;
  const distance = levenshtein(query, candidateKey);
  if (distance <= maxFuzzyDistance(candidateKey.length) && candidateKey.length >= 3) {
    return 60 - distance * 5;
  }
  return 0;
};

// Best-match resolution for one extracted item name against the catalog.
// Returns { product, score, via } — product fields are the match details.
export const resolveBestMatch = (query, catalog) => {
  if (!query || !catalog || catalog.length === 0) return null;
  const q = normalize(query);
  if (!q) return null;
  const core = coreQueryOf(query);

  let best = null;
  let secondBest = null;

  for (const product of catalog) {
    let bestVia = null;
    let bestScore = 0;

    const nameScore = Math.max(scoreMatch(q, product.normalizedName), scoreMatch(core, product.normalizedName));
    if (nameScore > bestScore) {
      bestScore = nameScore;
      bestVia = 'name';
    }

    for (const alias of product.normalizedAliases || []) {
      const aliasScore = Math.max(scoreMatch(q, alias), scoreMatch(core, alias));
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        bestVia = 'alias';
      }
    }

    const translit = TRANSLIT_KEYS.get(q) || TRANSLIT_KEYS.get(core);
    if (translit) {
      const translitScore = scoreMatch(translit, product.normalizedName);
      if (translitScore > bestScore) {
        bestScore = translitScore;
        bestVia = 'translit';
      }
    }

    if (bestScore === 0) continue;

    const entry = { product, score: bestScore, via: bestVia };
    if (!best || entry.score > best.score) {
      secondBest = best;
      best = entry;
    } else if (!secondBest || entry.score > secondBest.score) {
      secondBest = entry;
    }
  }

  if (!best || best.score < 40) return null;
  // Near-tie: two equally strong candidates means the name is ambiguous
  // (duplicate products). Return both so the caller can ask for clarification.
  if (secondBest && secondBest.score >= best.score - 2) {
    return { ...best, ambiguous: true, candidates: [best, secondBest] };
  }
  return { ...best, ambiguous: false, candidates: [best] };
};
