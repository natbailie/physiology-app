/**
 * Which chunks to put in front of the model for a given question.
 *
 * Plain IDF-weighted term overlap, hand-written for the same reason the charts are: a vector
 * index would mean an embedding model, a build step and a runtime dependency, and none of that
 * earns its place against a corpus of a few thousand short, densely-termed chunks. Physiology
 * prose is full of rare, load-bearing nouns — "aldosterone", "wedge", "reticulocyte" — which is
 * exactly the case term matching is good at.
 *
 * Pure and dependency-free, so the ranking can be tested against real queries.
 */

import type { Chunk } from './corpus';

/**
 * Words carrying no retrieval signal.
 *
 * Deliberately short. A long stopword list starts eating domain terms — "pressure" and "volume"
 * look like filler and are not.
 */
const STOPWORDS = new Set([
  'a', 'about', 'after', 'all', 'also', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been',
  'being', 'between', 'but', 'by', 'can', 'do', 'does', 'doing', 'for', 'from', 'get', 'gets',
  'happen', 'happens', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just',
  'me', 'more', 'most', 'my', 'no', 'not', 'of', 'on', 'one', 'only', 'or', 'other', 'out',
  'over', 'she', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'those', 'to', 'under', 'up', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'why', 'will', 'with', 'work', 'would', 'you', 'your',
]);

/**
 * Words to match on.
 *
 * The only stemming is a trailing plural, which is enough to join "kidneys" to "kidney" without
 * the false merges a real stemmer makes (it would fold "arterial" onto "artery" and, less
 * happily, "lysis" onto "lysi"). Two-letter tokens are dropped except where they are the term —
 * pH, K, Na and O2 all carry more signal than most words in the sentence.
 */
export function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+/²-]+/g, ' ')
    .split(' ')
    // Stemmed before the stopword filter, so one entry catches both "work" and "works".
    .map((word) => (word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word))
    .filter((word) => word.length > 0 && !STOPWORDS.has(word));
}

export interface RetrievalIndex {
  chunks: readonly Chunk[];
  /** Inverse document frequency per term, so a rare noun outweighs a common one. */
  idf: Map<string, number>;
  titleTerms: string[][];
  bodyTerms: Set<string>[];
}

export function buildIndex(chunks: readonly Chunk[]): RetrievalIndex {
  const titleTerms = chunks.map((chunk) => tokenise(chunk.title));
  const bodyTerms = chunks.map((chunk, index) => new Set([...titleTerms[index]!, ...tokenise(chunk.text)]));

  const documentCount = new Map<string, number>();
  for (const terms of bodyTerms) {
    for (const term of terms) documentCount.set(term, (documentCount.get(term) ?? 0) + 1);
  }

  const idf = new Map<string, number>();
  for (const [term, count] of documentCount) {
    idf.set(term, Math.log((chunks.length + 1) / (count + 1)) + 1);
  }

  return { chunks, idf, titleTerms, bodyTerms };
}

/** A title hit means the chunk is *about* the term, not merely mentions it. */
const TITLE_WEIGHT = 1.6;
/** The module a learner is looking at right now is the likeliest thing they are asking about. */
const CURRENT_MODULE_WEIGHT = 1.3;

export interface RetrieveOptions {
  /** The module the learner is on, if any. */
  moduleId?: string;
  limit?: number;
}

/**
 * The best chunks for a query, best first.
 *
 * Scores nothing at zero overlap, so an off-topic question returns an empty list rather than the
 * six least-irrelevant paragraphs in the app — which is what lets the tutor say the material does
 * not cover something instead of confabulating around whatever it was handed.
 */
export function retrieve(
  index: RetrievalIndex,
  query: string,
  { moduleId, limit = 6 }: RetrieveOptions = {},
): Chunk[] {
  const queryTerms = new Set(tokenise(query));
  if (queryTerms.size === 0) return [];

  const scored: { chunk: Chunk; score: number }[] = [];

  index.chunks.forEach((chunk, position) => {
    const body = index.bodyTerms[position]!;
    const title = new Set(index.titleTerms[position]!);

    let score = 0;
    for (const term of queryTerms) {
      if (!body.has(term)) continue;
      const weight = index.idf.get(term) ?? 1;
      score += title.has(term) ? weight * TITLE_WEIGHT : weight;
    }

    if (score === 0) return;
    if (moduleId && chunk.moduleId === moduleId) score *= CURRENT_MODULE_WEIGHT;

    scored.push({ chunk, score });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, limit)
    .map((entry) => entry.chunk);
}
