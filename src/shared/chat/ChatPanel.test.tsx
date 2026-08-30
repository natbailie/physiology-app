// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * Whether Supabase is "configured", and what the corpus contains, is whatever these mocks say —
 * never what a developer's .env.local happens to hold. Vitest loads env files, so without the
 * mock these tests would take the network path on any machine with real credentials. The same
 * hazard `AuthContext.test.tsx` documents.
 */
const mockState = vi.hoisted(() => ({ token: 'test-token' as string | null }));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: mockState.token ? { access_token: mockState.token } : null } }),
    },
  },
}));

vi.mock('@/home/useModuleProgress', () => ({
  useModuleProgress: () => ({ progress: {}, totals: {}, weakSpots: [] }),
}));

vi.mock('./corpus', () => ({
  loadCorpus: () =>
    Promise.resolve([
      {
        id: 'content:respiratory:0',
        moduleId: 'respiratory',
        route: '#respiratory',
        title: 'Respiratory — Carbon dioxide sets the pH',
        text: 'Ventilation clears carbon dioxide, and carbon dioxide is an acid in solution.',
      },
    ]),
}));

import { ChatPanel } from './ChatPanel';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  mockState.token = 'test-token';
});

/** An SSE body, delivered in the frames a real stream would arrive in. */
function sseResponse(frames: Record<string, unknown>[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      controller.close();
    },
  });
  return { ok: true, body } as unknown as Response;
}

function errorResponse(status: number, message: string): Response {
  return {
    ok: false,
    status,
    body: null,
    json: () => Promise.resolve({ message }),
  } as unknown as Response;
}

function ask(question: string): void {
  fireEvent.change(screen.getByLabelText('Your question'), { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
}

describe('ChatPanel', () => {
  it('offers a way in before anything has been asked', () => {
    render(<ChatPanel onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'What should I revise next?' })).toBeTruthy();
  });

  it('shows the answer as it streams in, not only once it is finished', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          sseResponse([
            { type: 'text', text: 'Ventilation clears carbon dioxide. ' },
            { type: 'text', text: 'That is why hyperventilation raises pH.' },
            { type: 'done' },
          ]),
        ),
      ),
    );

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('why does hyperventilation raise pH'));

    await waitFor(() =>
      expect(
        screen.getByText('Ventilation clears carbon dioxide. That is why hyperventilation raises pH.'),
      ).toBeTruthy(),
    );
  });

  it('sends the retrieved excerpts and the learner`s question', async () => {
    // Typed parameters, so `mock.calls[0][1]` is a RequestInit rather than never.
    const fetchMock = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve(sseResponse([{ type: 'text', text: 'ok' }, { type: 'done' }])),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<ChatPanel moduleId="respiratory" onClose={() => {}} />);
    await act(async () => ask('how does carbon dioxide change the pH'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body.messages.at(-1).content).toBe('how does carbon dioxide change the pH');
    expect(body.context.excerpts[0].title).toContain('Carbon dioxide sets the pH');
    expect(body.context.currentModule).toBe('Respiratory & Acid-Base');
    // The catalogue is what lets the tutor point a learner at a module by route.
    expect(body.context.catalogue).toContain('#respiratory');
  });

  it('says what the daily cap is rather than failing silently', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(errorResponse(429, 'You have used all 25 tutor messages for today.'))),
    );

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('anything'));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('You have used all 25 tutor messages for today.'),
    );
  });

  it('tells a learner whose session has expired to sign in again', async () => {
    // Production only. In dev the tutor is a route on the dev server itself, with nothing to
    // authenticate against — so the check has to be exercised with DEV off, or the test would be
    // asserting a branch the test runner never enters.
    vi.stubEnv('DEV', false);
    mockState.token = null;
    vi.stubGlobal('fetch', vi.fn());

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('anything'));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Sign in again'));
  });

  it('needs no session at all on the dev route', async () => {
    // The whole point of the dev route: the tutor answers locally with a key in .env.local and
    // no Supabase deploy, so requiring a signed-in learner would defeat it.
    const fetchMock = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve(sseResponse([{ type: 'text', text: 'ok' }, { type: 'done' }])),
    );
    vi.stubEnv('DEV', true);
    mockState.token = null;
    vi.stubGlobal('fetch', fetchMock);

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('how does carbon dioxide change the pH'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/chat');
    // No bearer token, and no anon key: neither means anything to a localhost route.
    expect(fetchMock.mock.calls[0]![1].headers).not.toHaveProperty('Authorization');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('goes to the edge function in production', async () => {
    const fetchMock = vi.fn((_url: string, _init: RequestInit) =>
      Promise.resolve(sseResponse([{ type: 'text', text: 'ok' }, { type: 'done' }])),
    );
    vi.stubEnv('DEV', false);
    vi.stubGlobal('fetch', fetchMock);

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('how does carbon dioxide change the pH'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/functions/v1/chat');
    expect(fetchMock.mock.calls[0]![1].headers).toHaveProperty('Authorization');
  });

  it('surfaces an error the model itself reported mid-stream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(sseResponse([{ type: 'error', message: 'The tutor could not answer just now.' }])),
      ),
    );

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('anything'));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });

  it('falls back to the app`s own writing when the tutor cannot be reached', async () => {
    // The undeployed-function case from the screenshot. A learner must not be left with an error
    // and nothing else when the app already holds a good answer.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('how does carbon dioxide change the pH'));

    await waitFor(() => expect(screen.getByText(/From the app/)).toBeTruthy());
    expect(
      screen.getByText(/Ventilation clears carbon dioxide, and carbon dioxide is an acid in solution./),
    ).toBeTruthy();
  });

  it('says something human when the fetch itself fails, not "Failed to fetch"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('how does carbon dioxide change the pH'));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('could not be reached'));
    expect(screen.getByRole('alert').textContent).not.toContain('Failed to fetch');
  });

  it('links the fallback passage back to its module', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('how does carbon dioxide change the pH'));

    await waitFor(() => expect(screen.getByText(/From the app/)).toBeTruthy());
    const link = screen.getByRole('link', { name: 'Respiratory — Carbon dioxide sets the pH' });
    expect(link.getAttribute('href')).toBe('#respiratory');
  });

  it('shows the banner alone when the corpus has nothing to offer', async () => {
    // No honest fallback exists for a question the app does not cover, and inventing a vague one
    // would be worse than the error on its own.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('chlorophyll photosynthesis thylakoid'));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.queryByText(/From the app/)).toBeNull();
  });

  it('falls back after the daily cap too, not only on a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(errorResponse(429, 'You have used all 25 tutor messages for today.'))),
    );

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('how does carbon dioxide change the pH'));

    await waitFor(() => expect(screen.getByText(/From the app/)).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toContain('all 25 tutor messages');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ChatPanel onClose={onClose} />);

    fireEvent.keyDown(screen.getByLabelText('Physiology tutor'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('says it is working in words, not only with a moving dot', async () => {
    // `index.css` stops all animation under prefers-reduced-motion, so a spinner alone says
    // nothing to those readers.
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));

    render(<ChatPanel onClose={() => {}} />);
    await act(async () => ask('anything'));

    await waitFor(() => expect(screen.getByText('Thinking…')).toBeTruthy());
  });
});
