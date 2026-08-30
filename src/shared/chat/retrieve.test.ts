import { describe, expect, it } from 'vitest';
import type { Chunk } from './corpus';
import { buildIndex, retrieve, tokenise } from './retrieve';

const CHUNKS: Chunk[] = [
  {
    id: 'content:adrenalCortex:0',
    moduleId: 'adrenalCortex',
    route: '#adrenalCortex',
    title: 'Adrenal cortex — Aldosterone defends volume, not sodium concentration',
    text: 'Aldosterone acts on the principal cell of the collecting duct, adding sodium channels and pumps. Sodium is reabsorbed and water follows it, so the plasma sodium concentration barely moves while the volume rises.',
  },
  {
    id: 'content:renalTubular:0',
    moduleId: 'renalTubular',
    route: '#renalTubular',
    title: 'Renal tubular transport — The proximal tubule does the bulk of the work',
    text: 'Two thirds of the filtered sodium is reabsorbed before the filtrate reaches the loop of Henle, isosmotically, so the fluid arriving at the loop is the same concentration as plasma.',
  },
  {
    id: 'question:cardiacElectro:q1',
    moduleId: 'cardiacElectro',
    route: '#cardiacElectro',
    title: 'Cardiac electrophysiology — A patient is given a beta-blocker',
    text: 'Blocking beta-1 receptors slows the funny current, so the sinus node depolarises more slowly and the heart rate falls.',
  },
  {
    id: 'glossary:wedge pressure',
    title: 'wedge pressure (PCWP)',
    text: 'The pressure measured with a balloon-tipped catheter wedged in a pulmonary artery branch, standing in for left atrial pressure and therefore for left ventricular preload.',
  },
  {
    id: 'drug:loop-diuretics',
    moduleId: 'renalTubular',
    route: '#medications/loop-diuretics',
    title: 'Loop diuretics (Furosemide, bumetanide)',
    text: 'Inhibit the sodium-potassium-two-chloride cotransporter in the thick ascending limb, abolishing the medullary concentration gradient and producing the largest diuresis of any class.',
  },
];

const INDEX = buildIndex(CHUNKS);

describe('tokenise', () => {
  it('drops filler but keeps the domain nouns', () => {
    expect(tokenise('What does aldosterone do to the sodium?')).toEqual(['aldosterone', 'sodium']);
  });

  it('joins a plural to its singular', () => {
    expect(tokenise('kidneys')).toEqual(tokenise('kidney'));
  });

  it('keeps short symbols that carry the whole question', () => {
    // pH and O2 are more informative than any word around them.
    expect(tokenise('how is pH defended')).toContain('ph');
    expect(tokenise('O2 delivery')).toContain('o2');
  });

  it('does not amputate a word that merely ends in a double s', () => {
    expect(tokenise('across')).toEqual(['across']);
  });
});

describe('retrieve', () => {
  it('finds the chunk the question is about', () => {
    const results = retrieve(INDEX, 'why does aldosterone hold onto sodium');
    expect(results[0]?.id).toBe('content:adrenalCortex:0');
  });

  it('prefers a chunk titled for the term over one that merely mentions it', () => {
    // Both talk about sodium reabsorption; only one is *about* aldosterone.
    const results = retrieve(INDEX, 'aldosterone');
    expect(results[0]?.moduleId).toBe('adrenalCortex');
  });

  it('reaches the glossary for a bare piece of jargon', () => {
    expect(retrieve(INDEX, 'what is the wedge pressure')[0]?.id).toBe('glossary:wedge pressure');
  });

  it('reaches the formulary for a drug question', () => {
    expect(retrieve(INDEX, 'how does furosemide work')[0]?.id).toBe('drug:loop-diuretics');
  });

  it('returns nothing at all when the corpus does not cover the question', () => {
    // The empty list is what lets the tutor say so, rather than being handed the six
    // least-irrelevant paragraphs in the app and reasoning from them.
    expect(retrieve(INDEX, 'photosynthesis chlorophyll')).toEqual([]);
  });

  it('breaks a near-tie toward the module the learner is looking at', () => {
    const anywhere = retrieve(INDEX, 'sodium reabsorbed');
    const onRenal = retrieve(INDEX, 'sodium reabsorbed', { moduleId: 'renalTubular' });

    expect(anywhere[0]?.moduleId).toBe('adrenalCortex');
    expect(onRenal[0]?.moduleId).toBe('renalTubular');
  });

  it('honours the limit', () => {
    expect(retrieve(INDEX, 'sodium pressure heart', { limit: 2 })).toHaveLength(2);
  });

  it('ranks the same way twice', () => {
    expect(retrieve(INDEX, 'sodium')).toEqual(retrieve(INDEX, 'sodium'));
  });
});
