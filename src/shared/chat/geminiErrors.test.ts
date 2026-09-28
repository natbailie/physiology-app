import { describe, expect, it } from 'vitest';
import {
  CHAIN,
  FALLBACK_MODEL,
  MODEL,
  callModel,
  gemini,
  mistral,
  type ChatRequest,
  isRetryable,
  retryDelayMs,
  upstreamMessage,
  type UpstreamResponse,
} from '../../../supabase/functions/_shared/gemini.ts';

/**
 * How the tutor reads Google's rejections.
 *
 * The fixtures are the real shapes. `streamGenerateContent` wraps its error in an array, and the
 * free tier's per-minute throttle is a 429 that clears in seconds — reading it as "today's
 * allowance is gone" told learners to come back tomorrow for something that would have worked
 * on the next try.
 */

const perMinute = [
  {
    error: {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
      message: 'Quota exceeded for metric: generate_content_free_tier_requests, limit: 5',
      details: [
        {
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: [{ quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' }],
        },
        { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3.758204504s' },
      ],
    },
  },
];

const perDay = [
  {
    error: {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
      details: [
        {
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }],
        },
      ],
    },
  },
];

describe('reading a rejection', () => {
  it('reads the retry delay out of the array-wrapped streaming error', () => {
    expect(retryDelayMs(perMinute)).toBe(3759);
  });

  it('has no delay when Google gave none', () => {
    expect(retryDelayMs(null)).toBeNull();
  });

  it('retries a per-minute throttle and an overload, not a spent daily quota', () => {
    expect(isRetryable(429, perMinute)).toBe(true);
    expect(isRetryable(503, null)).toBe(true);
    expect(isRetryable(429, perDay)).toBe(false);
    expect(isRetryable(404, null)).toBe(false);
  });

  it('tells a throttled learner to wait seconds, not a day', () => {
    expect(upstreamMessage(429, perMinute)).toMatch(/few seconds/);
    expect(upstreamMessage(429, perDay)).toMatch(/tomorrow/);
  });
});

function reply(status: number, body: unknown = null): UpstreamResponse {
  const response: UpstreamResponse = {
    ok: status === 200,
    status,
    json: () => Promise.resolve(body),
    clone: () => response,
  };
  return response;
}

const request: ChatRequest = {
  messages: [{ role: 'user', content: 'what does ADH do' }],
  context: { catalogue: '#renalTubular — Renal tubular', excerpts: [] },
};

// Named through the providers: `secrets.test.ts` rightly refuses the literal key names under src/.
const MISTRAL_ONLY = { [mistral.keyName]: 'm' };
const GEMINI_ONLY = { [gemini.keyName]: 'g' };
const BOTH = { ...MISTRAL_ONLY, ...GEMINI_ONLY };

describe('callModel', () => {
  /** Records which provider/model was asked, and answers from a script. */
  function scripted(...statuses: [number, unknown?][]) {
    const asked: string[] = [];
    const post = (url: string, _headers: Record<string, string>, body: string) => {
      const model = (JSON.parse(body) as { model?: string }).model ?? /models\/([^:]+):/.exec(url)![1]!;
      asked.push(model);
      const [status, payload] = statuses.shift() ?? [500];
      return Promise.resolve(reply(status, payload));
    };
    return { asked, post };
  }

  const models = CHAIN.map((entry) => entry.model);
  const [first, second] = models;

  it('asks Mistral first and stops there when it answers', async () => {
    const { asked, post } = scripted([200]);
    const answered = await callModel(BOTH, request, post);
    expect(answered?.provider.id).toBe('mistral');
    expect(asked).toEqual([first]);
  });

  it('skips a provider with no key', async () => {
    const { asked, post } = scripted([200]);
    const answered = await callModel(GEMINI_ONLY, request, post);
    expect(answered?.provider.id).toBe('gemini');
    expect(asked).toEqual([MODEL]);
  });

  it('answers nothing when no key is set at all', async () => {
    const { post } = scripted();
    expect(await callModel({}, request, post)).toBeNull();
  });

  it('tries the smaller Mistral model before leaving Mistral', async () => {
    const { asked, post } = scripted([429], [200]);
    const answered = await callModel(BOTH, request, post);
    expect(answered?.provider.id).toBe('mistral');
    expect(asked).toEqual([first, second]);
  });

  it('falls back to Gemini when Mistral is throttled or refuses the key', async () => {
    for (const status of [429, 401]) {
      const { asked, post } = scripted([status], [status], [200]);
      const answered = await callModel(BOTH, request, post);
      expect(answered?.provider.id).toBe('gemini');
      expect(asked).toEqual([first, second, MODEL]);
    }
  });

  it('falls through the whole chain, then stops on a spent daily quota', async () => {
    const { asked, post } = scripted([503], [503], [429, perDay], [429, perDay]);
    expect((await callModel(BOTH, request, post))?.response.status).toBe(429);
    expect(asked).toEqual(models);
    expect(models.at(-1)).toBe(FALLBACK_MODEL);
  });

  it('passes a request the last entry rejects straight back rather than masking it', async () => {
    const { asked, post } = scripted([400]);
    expect((await callModel(GEMINI_ONLY, request, post))?.response.status).toBe(400);
    expect(asked).toEqual([MODEL]);
  });
});
