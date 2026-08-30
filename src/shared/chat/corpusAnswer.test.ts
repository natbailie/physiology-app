import { describe, expect, it } from 'vitest';
import type { Chunk } from './corpus';
import { corpusAnswer } from './corpusAnswer';

const CHUNKS: Chunk[] = [
  {
    id: 'content:respiratory:0',
    moduleId: 'respiratory',
    route: '#respiratory',
    title: 'Respiratory — Carbon dioxide sets the pH',
    text: 'Ventilation clears carbon dioxide, and carbon dioxide is an acid in solution.',
  },
  {
    id: 'glossary:anion gap',
    title: 'anion gap',
    text: 'The difference between measured cations and measured anions.',
  },
  {
    id: 'drug:loop-diuretics',
    moduleId: 'renalTubular',
    route: '#medications/loop-diuretics',
    title: 'Loop diuretics (Furosemide, bumetanide)',
    text: 'Inhibit the sodium-potassium-two-chloride cotransporter in the thick ascending limb.',
  },
  {
    id: 'content:renalTubular:0',
    moduleId: 'renalTubular',
    route: '#renalTubular',
    title: 'Renal tubular transport — The proximal tubule does the bulk of the work',
    text: 'Two thirds of the filtered sodium is reabsorbed before the loop of Henle.',
  },
];

const REASON = 'The tutor could not be reached.';

describe('corpusAnswer', () => {
  it('says nothing when retrieval found nothing', () => {
    // No honest answer exists. A vague one would be worse than the error message alone.
    expect(corpusAnswer([], REASON)).toBeUndefined();
  });

  it('leads with why the tutor is silent', () => {
    expect(corpusAnswer(CHUNKS, REASON)?.content.startsWith(REASON)).toBe(true);
  });

  it('quotes the app`s own writing verbatim', () => {
    const answer = corpusAnswer(CHUNKS, REASON);

    expect(answer?.content).toContain('Ventilation clears carbon dioxide, and carbon dioxide is an acid in solution.');
    expect(answer?.content).toContain('Respiratory — Carbon dioxide sets the pH');
  });

  it('stops at three passages, however many were retrieved', () => {
    expect(corpusAnswer(CHUNKS, REASON)?.citations).toHaveLength(3);
  });

  it('cites where each passage came from, so the learner can go and read it', () => {
    const citations = corpusAnswer(CHUNKS, REASON)?.citations ?? [];

    expect(citations[0]).toEqual({
      title: 'Respiratory — Carbon dioxide sets the pH',
      route: '#respiratory',
    });
    // A glossary entry has no page of its own; it is cited without a link rather than a dead one.
    expect(citations[1]).toEqual({ title: 'anion gap' });
  });

  it('keeps the retrieved order rather than reranking', () => {
    // These are the chunks the tutor would have been reading, in the order it would have read
    // them. Reordering here would make the fallback disagree with the real answer.
    expect(corpusAnswer(CHUNKS, REASON)?.citations.map((citation) => citation.title)).toEqual([
      CHUNKS[0]!.title,
      CHUNKS[1]!.title,
      CHUNKS[2]!.title,
    ]);
  });
});
