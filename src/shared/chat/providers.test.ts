import { describe, expect, it } from 'vitest';
import {
  PERSONA,
  chatCompletionsBody,
  framePayload,
  mistral,
  readChatCompletionFrame,
  splitFrames,
  upstreamError,
} from '../../../supabase/functions/_shared/gemini.ts';

/**
 * The OpenAI-style adapter Mistral (and Groq, Cerebras, OpenRouter) goes through.
 *
 * Fixtures are the real wire shape: LF-separated `data:` frames, a role-only opening delta, and a
 * bare `[DONE]` to close — which is not JSON, and must be skipped rather than treated as an error.
 */

const STREAM = [
  'data: {"id":"1","object":"chat.completion.chunk","model":"mistral-small-latest","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}',
  'data: {"id":"1","object":"chat.completion.chunk","model":"mistral-small-latest","choices":[{"index":0,"delta":{"content":"ADH inserts "},"finish_reason":null}]}',
  'data: {"id":"1","object":"chat.completion.chunk","model":"mistral-small-latest","choices":[{"index":0,"delta":{"content":"aquaporin-2."},"finish_reason":"stop"}]}',
  'data: [DONE]',
  '',
].join('\n\n');

function textOf(stream: string): string {
  const { frames } = splitFrames(stream);
  return frames
    .map(framePayload)
    .filter((payload): payload is string => payload !== null)
    .flatMap((payload) => readChatCompletionFrame(payload).text)
    .join('');
}

describe('reading a chat-completions stream', () => {
  it('joins the deltas and ignores the empty opener and [DONE]', () => {
    expect(textOf(STREAM)).toBe('ADH inserts aquaporin-2.');
  });

  it('strips markdown bold, even when the asterisks are split across frames', () => {
    const split = [
      'data: {"choices":[{"delta":{"content":"The *"},"finish_reason":null}]}',
      'data: {"choices":[{"delta":{"content":"*HPA axis**"},"finish_reason":null}]}',
      'data: {"choices":[{"delta":{"content":" module"},"finish_reason":"stop"}]}',
      '',
    ].join('\n\n');
    expect(textOf(split)).toBe('The HPA axis module');
  });

  it('flags a content filter as blocked', () => {
    const read = readChatCompletionFrame('{"choices":[{"delta":{},"finish_reason":"content_filter"}]}');
    expect(read).toEqual({ text: [], blocked: true });
  });

  it('shrugs off a frame that is not JSON', () => {
    expect(readChatCompletionFrame('not json')).toEqual({ text: [], blocked: false });
  });
});

describe('the chat-completions request', () => {
  const body = chatCompletionsBody(
    {
      messages: [
        { role: 'user', content: 'what does ADH do' },
        { role: 'assistant', content: 'It concentrates urine.' },
        { role: 'user', content: 'how?' },
      ],
      context: { catalogue: '#renalTubular — Renal tubular', excerpts: [] },
    },
    'mistral-small-latest',
  ) as { model: string; stream: boolean; messages: { role: string; content: string }[] };

  it('streams, with the persona as the system message', () => {
    expect(body.model).toBe('mistral-small-latest');
    expect(body.stream).toBe(true);
    expect(body.messages[0]).toEqual({ role: 'system', content: PERSONA });
  });

  it('keeps the history and puts the context on the last turn only', () => {
    expect(body.messages.map((message) => message.role)).toEqual(['system', 'user', 'assistant', 'user']);
    expect(body.messages[1]!.content).toBe('what does ADH do');
    expect(body.messages[3]!.content).toContain('<MODULES>');
    expect(body.messages[3]!.content.endsWith('how?')).toBe(true);
  });

  it('sends the key as a bearer token', () => {
    expect(mistral.headers('abc').Authorization).toBe('Bearer abc');
    expect(mistral.endpoint('mistral-small-latest')).toBe('https://api.mistral.ai/v1/chat/completions');
  });
});

describe('reading a Mistral rejection', () => {
  it('finds the message at the top level, where Mistral puts it', () => {
    expect(upstreamError({ object: 'error', message: 'Unauthorized', type: 'invalid_request' })?.message).toBe(
      'Unauthorized',
    );
  });
});
