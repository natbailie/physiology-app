import { describe, expect, it } from 'vitest';
import { MODULE_QUESTION_IDS, questionIdsFor } from './moduleQuestionIds';
import { MODULES } from './moduleRegistry';

const SIMULATORS = MODULES.filter((module) => module.kind !== 'reference');

/**
 * These guard a glob. Nothing here would throw if the pattern stopped matching — the counts
 * would simply come back zero and every module would look unstudied — so the failure has to be
 * asserted rather than waited for.
 */
describe('module question index', () => {
  it('finds a question set for every simulator in the registry', () => {
    const missing = SIMULATORS.filter((module) => questionIdsFor(module.id).length === 0).map((m) => m.id);
    expect(missing.join(', '), `modules with no questions discovered: ${missing.join(', ')}`).toBe('');
  });

  it('discovers no module the registry does not list', () => {
    const registered = new Set(MODULES.map((module) => module.id));
    const stray = Object.keys(MODULE_QUESTION_IDS).filter((id) => !registered.has(id));
    expect(stray.join(', ')).toBe('');
  });

  it('gives every question within a module a unique id', () => {
    for (const [moduleId, ids] of Object.entries(MODULE_QUESTION_IDS)) {
      expect(new Set(ids).size, `${moduleId} has duplicate question ids`).toBe(ids.length);
    }
  });

  it('returns an empty list for a module that does not exist, rather than throwing', () => {
    expect(questionIdsFor('notAModule')).toEqual([]);
  });
});
