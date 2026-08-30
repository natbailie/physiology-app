import { describe, expect, it } from 'vitest';
import { MODULES } from '@/home/moduleRegistry';
import { loadCorpus } from './corpus';
import { buildIndex, retrieve } from './retrieve';

const corpus = await loadCorpus();
const index = buildIndex(corpus);

const simulators = MODULES.filter((module) => module.status === 'available' && module.kind !== 'reference');

describe('the corpus', () => {
  it('covers every available simulator', () => {
    // The glob is the thing that can silently stop matching. Nothing would break if it did —
    // the tutor would just quietly know less — which is why this is asserted rather than trusted.
    const covered = new Set(corpus.map((chunk) => chunk.moduleId).filter(Boolean));
    const missing = simulators.filter((module) => !covered.has(module.id)).map((module) => module.id);

    expect(missing).toEqual([]);
  });

  it('carries explainer prose and question explanations for every module', () => {
    const withContent = new Set(
      corpus.filter((chunk) => chunk.id.startsWith('content:')).map((chunk) => chunk.moduleId),
    );
    const withQuestions = new Set(
      corpus.filter((chunk) => chunk.id.startsWith('question:')).map((chunk) => chunk.moduleId),
    );

    for (const module of simulators) {
      expect(withContent.has(module.id), `${module.id} has no explainer chunks`).toBe(true);
      expect(withQuestions.has(module.id), `${module.id} has no question chunks`).toBe(true);
    }
  });

  it('carries the glossary, the formulary and the formula sheet', () => {
    const kinds = new Set(corpus.map((chunk) => chunk.id.split(':')[0]));
    expect(kinds).toContain('glossary');
    expect(kinds).toContain('drug');
    expect(kinds).toContain('formula');
  });

  it('gives every chunk a unique id and some text to retrieve', () => {
    expect(new Set(corpus.map((chunk) => chunk.id)).size).toBe(corpus.length);
    expect(corpus.every((chunk) => chunk.text.trim().length > 0)).toBe(true);
    expect(corpus.every((chunk) => chunk.title.trim().length > 0)).toBe(true);
  });

  it('sends a learner somewhere real when it cites a route', () => {
    const routed = corpus.filter((chunk) => chunk.route !== undefined);
    expect(routed.every((chunk) => chunk.route!.startsWith('#'))).toBe(true);
    expect(routed.length).toBeGreaterThan(corpus.length / 2);
  });
});

describe('retrieval over the real corpus', () => {
  it.each([
    ['why does a pulmonary embolism raise dead space', 'respiratoryMechanics'],
    ['how does insulin move glucose into cells', 'glucoseRegulation'],
    ['explain the Frank-Starling curve', 'venousReturn'],
    ['which zone of the adrenal cortex makes aldosterone', 'adrenalCortex'],
  ])('answers "%s" from the right module', (query, moduleId) => {
    const hits = retrieve(index, query, { limit: 6 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.map((chunk) => chunk.moduleId)).toContain(moduleId);
  });

  it('reaches the glossary for a bare piece of jargon', () => {
    expect(retrieve(index, 'what is the wedge pressure')[0]?.id).toBe('glossary:wedge pressure');
  });

  it('returns nothing for a question the app does not cover', () => {
    expect(retrieve(index, 'chlorophyll photosynthesis thylakoid')).toEqual([]);
  });
});
