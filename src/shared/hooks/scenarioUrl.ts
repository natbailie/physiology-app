/**
 * Encoding a module's live scenario into the URL.
 *
 * The point is sharing: a student sends a friend the exact COPD patient they are looking at, and
 * a lecturer links a specific state from a slide. It is also the substrate for assignable
 * activities later, which is why the payload is versioned from the start.
 *
 * Two decisions shape the format:
 *
 * 1. Only inputs that DIFFER from the module's defaults are encoded. That keeps a typical link
 *    to a handful of characters, and — more importantly — it means adding a new input to a
 *    module does not invalidate every link anyone has already shared. Old links simply take the
 *    new input's default.
 * 2. Decoding never throws. A truncated, hand-edited or stale link falls back to defaults and
 *    loads the module, because a broken link that opens the right page is a far better outcome
 *    than a blank screen.
 */

const VERSION = 1;

export interface ScenarioPayload {
  /** Inputs that differ from the module's defaults. */
  inputs: Record<string, number | string | boolean>;
  /** The preset the learner last applied, if any — worth carrying for the label alone. */
  preset?: string;
}

/** URL-safe base64 without padding, which survives being pasted into chat clients. */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Values a scenario can carry. Anything else is dropped rather than serialised badly. */
function isEncodable(value: unknown): value is number | string | boolean {
  return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean';
}

/**
 * The difference between a module's live inputs and its defaults.
 *
 * Returns an empty object when nothing has been changed, which the caller uses to decide there
 * is nothing worth putting in a URL at all.
 */
export function diffFromDefaults<T extends object>(inputs: T, defaults: T): Record<string, number | string | boolean> {
  const diff: Record<string, number | string | boolean> = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (!isEncodable(value)) continue;
    if (Object.is(value, (defaults as Record<string, unknown>)[key])) continue;
    diff[key] = value;
  }
  return diff;
}

/** `#moduleId?s=<payload>`, or a bare `#moduleId` when nothing differs from the defaults. */
export function encodeScenario<T extends object>(moduleId: string, inputs: T, defaults: T, preset?: string): string {
  const changed = diffFromDefaults(inputs, defaults);
  if (Object.keys(changed).length === 0 && !preset) return `#${moduleId}`;

  const payload: ScenarioPayload & { v: number } = { v: VERSION, inputs: changed };
  if (preset) payload.preset = preset;
  return `#${moduleId}?s=${toBase64Url(JSON.stringify(payload))}`;
}

/**
 * Reads a scenario back out of a hash fragment.
 *
 * Null for anything it cannot make sense of — no payload, a payload from a future version, a
 * truncated string, valid base64 that is not JSON. The caller then shows the module at its
 * defaults, which is what a stale link deserves.
 */
export function decodeScenario(hash: string): ScenarioPayload | null {
  const query = hash.indexOf('?');
  if (query === -1) return null;

  const encoded = new URLSearchParams(hash.slice(query + 1)).get('s');
  if (!encoded) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as { v?: number; inputs?: unknown; preset?: unknown };
    if (parsed.v !== VERSION) return null;
    if (typeof parsed.inputs !== 'object' || parsed.inputs === null) return null;

    // Filter rather than trust: a hand-edited link must not be able to put an object or a
    // function into a module's inputs.
    const inputs: Record<string, number | string | boolean> = {};
    for (const [key, value] of Object.entries(parsed.inputs)) {
      if (isEncodable(value)) inputs[key] = value;
    }

    return { inputs, ...(typeof parsed.preset === 'string' ? { preset: parsed.preset } : {}) };
  } catch {
    return null;
  }
}

/** The module id from a hash, with any scenario payload stripped. */
export function routeIdFromHash(hash: string): string {
  const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const query = withoutHash.indexOf('?');
  return query === -1 ? withoutHash : withoutHash.slice(0, query);
}
