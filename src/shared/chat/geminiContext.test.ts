import { describe, expect, it } from 'vitest';
import { contextBlock, parseRequest } from '../../../supabase/functions/_shared/gemini.ts';

/**
 * The server half of the context contract.
 *
 * `systemPrompt.ts` and this module describe the same object twice — once for the client that
 * builds it, once for the function that validates and fences it — because the shared file must
 * stay plain data that both Deno and the Node typecheck can read. Two descriptions can drift, so
 * a field added on one side and forgotten on the other is exactly what these catch: an unvalidated
 * field is silently dropped, and the tutor goes back to answering without it having been told why.
 */

const minimal = { messages: [{ role: 'user', content: 'why is my MAP falling?' }], context: { catalogue: '#cardiorenal — Cardiorenal', excerpts: [] } };

describe('parseRequest', () => {
  it('keeps the live reading', () => {
    const parsed = parseRequest({ ...minimal, context: { ...minimal.context, liveState: '- MAP: 41 mmHg' } });

    expect(parsed?.context.liveState).toBe('- MAP: 41 mmHg');
  });

  /** Same guard the other optional fields get: anything not a string is simply not there. */
  it('drops a live reading that is not a string', () => {
    const parsed = parseRequest({ ...minimal, context: { ...minimal.context, liveState: { map: 41 } } });

    expect(parsed?.context.liveState).toBeUndefined();
  });
});

describe('contextBlock', () => {
  it('fences the reading like every other block', () => {
    const block = contextBlock({
      catalogue: '#cardiorenal — Cardiorenal',
      excerpts: [],
      currentModule: 'Cardiorenal',
      liveState: '- MAP: 41 mmHg',
    });

    expect(block).toContain('<READING>\n- MAP: 41 mmHg\n</READING>');
  });

  /** No module open is no block, not an empty one. */
  it('omits the reading when there is none', () => {
    const block = contextBlock({ catalogue: '#cardiorenal — Cardiorenal', excerpts: [] });

    expect(block).not.toContain('<READING>');
  });
});
