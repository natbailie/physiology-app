import { describe, expect, it } from 'vitest';
import {
  framePayload,
  readFrame,
  splitFrames,
} from '../../../supabase/functions/_shared/gemini.ts';

/**
 * The bug these exist for.
 *
 * Google separates its SSE frames with CRLF — `\r\n\r\n`, never `\n\n`. Splitting on `\n\n`
 * matched nothing at all: the whole response accumulated in the buffer, no text was extracted,
 * and the stream closed having emitted only a `done`. No error, no answer, just an empty reply,
 * in both hosts at once. Nothing in the type system or the browser console pointed at it.
 */

/** A frame exactly as Google writes it, CRLF and all. */
function crlf(...frames: object[]): string {
  return frames.map((frame) => `data: ${JSON.stringify(frame)}\r\n\r\n`).join('');
}

const textFrame = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });

describe('splitFrames', () => {
  it('splits on CRLF, which is what Google actually sends', () => {
    const { frames, rest } = splitFrames(crlf(textFrame('one'), textFrame('two')));

    expect(frames).toHaveLength(2);
    expect(rest).toBe('');
  });

  it('still splits on bare LF, so a mock or another provider is not broken by the fix', () => {
    const { frames } = splitFrames('data: {"a":1}\n\ndata: {"a":2}\n\n');
    expect(frames).toHaveLength(2);
  });

  it('holds a partial frame back rather than parsing half of it', () => {
    // Chunk boundaries fall wherever the network puts them, routinely mid-JSON.
    const { frames, rest } = splitFrames('data: {"a":1}\r\n\r\ndata: {"b":2');

    expect(frames).toHaveLength(1);
    expect(rest).toBe('data: {"b":2');
  });

  it('carries a split-across-chunks frame through to the next read', () => {
    const first = splitFrames('data: {"candidates":[{"content":{"parts":[{"text":"hel');
    expect(first.frames).toEqual([]);

    const second = splitFrames(`${first.rest}lo"}]}}]}\r\n\r\n`);
    expect(second.frames).toHaveLength(1);
    expect(readFrame(framePayload(second.frames[0]!)!).text).toEqual(['hello']);
  });
});

describe('framePayload', () => {
  it('strips the data prefix and the trailing carriage return', () => {
    expect(framePayload('data: {"a":1}\r')).toBe('{"a":1}');
  });

  it('ignores a frame carrying no payload', () => {
    expect(framePayload('')).toBeNull();
    expect(framePayload('data: ')).toBeNull();
  });
});

describe('readFrame', () => {
  it('pulls the text out of a real Gemini frame', () => {
    const payload = JSON.stringify(textFrame('Renin raises aldosterone.'));
    expect(readFrame(payload).text).toEqual(['Renin raises aldosterone.']);
  });

  it('ignores the thoughtSignature that rides alongside the text', () => {
    // Current models return reasoning metadata in the same parts array. It is not an answer.
    const payload = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'ok', thoughtSignature: 'EtgECtUEARFN' }] } }],
    });
    expect(readFrame(payload).text).toEqual(['ok']);
  });

  it('reports a frame the safety filter stopped', () => {
    const payload = JSON.stringify({ candidates: [{ finishReason: 'SAFETY' }] });
    expect(readFrame(payload).blocked).toBe(true);
  });

  it('does not treat a normal finish as blocked', () => {
    const payload = JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'x' }] } }] });
    const read = readFrame(payload);

    expect(read.blocked).toBe(false);
    expect(read.text).toEqual(['x']);
  });

  it('survives a frame that is not JSON at all', () => {
    expect(readFrame('not json')).toEqual({ text: [], blocked: false });
  });
});

describe('a whole response, read the way the hosts read it', () => {
  it('recovers every word of a CRLF stream delivered in awkward chunks', () => {
    const wire = crlf(textFrame('Renin '), textFrame('raises '), textFrame('aldosterone.'));

    // Deliberately nothing like frame boundaries.
    const chunks = [wire.slice(0, 30), wire.slice(30, 95), wire.slice(95)];

    let buffer = '';
    const out: string[] = [];
    for (const chunk of chunks) {
      buffer += chunk;
      const split = splitFrames(buffer);
      buffer = split.rest;
      for (const frame of split.frames) {
        const payload = framePayload(frame);
        if (payload) out.push(...readFrame(payload).text);
      }
    }

    expect(out.join('')).toBe('Renin raises aldosterone.');
  });
});
