import { defineConfig, type Plugin } from 'vitest/config'
// `vitest/config` re-exports defineConfig but not the env helpers, so loadEnv comes from vite.
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import {
  BLOCKED_MESSAGE,
  ENDPOINT,
  MAX_REQUEST_BYTES,
  framePayload,
  geminiRequestBody,
  parseRequest,
  readFrame,
  splitFrames,
  upstreamMessage,
} from './supabase/functions/_shared/gemini.ts'

/**
 * The tutor, on the dev server.
 *
 * Production goes through the Supabase edge function, which needs a deploy. This is the same
 * request against the same shared module, served from the dev server, so the tutor works locally
 * the moment there is a key in `.env.local` — no CLI, no dashboard, no deploy. Both callers import
 * `_shared/gemini.ts`, so a working answer here is evidence about the deployed one.
 *
 * `apply: 'serve'` means it cannot reach a build. The key is read through `loadEnv` with an empty
 * prefix so it picks up `GEMINI_API_KEY`, which is deliberately NOT `VITE_`-prefixed: anything
 * with that prefix is compiled into the bundle every learner downloads. It is never passed to
 * `define`, and never leaves this Node process.
 *
 * No auth check and no rate limit, deliberately. This is bound to localhost, serves one developer,
 * and spends only your own free-tier quota — none of which is true of the edge function, so do not
 * copy the omission there. `DEV_MESSAGE_CAP` is a runaway guard, not an access control.
 */
function tutorDevRoute(mode: string): Plugin {
  const key = loadEnv(mode, process.cwd(), '').GEMINI_API_KEY
  let sent = 0

  /** Per dev-server process. A loop that fires the tutor in a cycle should stop, not keep going. */
  const DEV_MESSAGE_CAP = 200

  return {
    name: 'tutor-dev-route',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (request, response) => {
        const json = (status: number, message: string): void => {
          response.statusCode = status
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ message }))
        }

        if (request.method !== 'POST') return json(405, 'Method not allowed.')

        // Named in as many words, because "the tutor is unavailable" would send you looking for a
        // bug when the answer is one line in a file.
        if (!key) {
          return json(500, 'No GEMINI_API_KEY in .env.local — add it (no VITE_ prefix) and restart the dev server.')
        }
        if (sent >= DEV_MESSAGE_CAP) {
          return json(429, `Dev tutor cap of ${DEV_MESSAGE_CAP} messages reached. Restart the dev server to reset it.`)
        }

        let raw = ''
        for await (const chunk of request) {
          raw += chunk
          if (raw.length > MAX_REQUEST_BYTES) return json(413, 'That conversation is too long. Start a new one.')
        }

        let parsed
        try {
          parsed = parseRequest(JSON.parse(raw))
        } catch {
          parsed = null
        }
        if (!parsed) return json(400, 'Malformed request.')

        sent += 1

        let upstream: Response
        try {
          upstream = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // In a header rather than the query string, so the key stays out of request logs.
              'x-goog-api-key': key,
            },
            body: JSON.stringify(geminiRequestBody(parsed)),
          })
        } catch (error) {
          server.config.logger.error(`[tutor] upstream unreachable: ${String(error)}`)
          return json(502, 'The tutor could not be reached just now. Try again in a moment.')
        }

        if (!upstream.ok || !upstream.body) {
          const body = (await upstream.json().catch(() => null)) as { error?: { status?: string } } | null
          return json(502, upstreamMessage(upstream.status, body?.error?.status))
        }

        response.statusCode = 200
        response.setHeader('Content-Type', 'text/event-stream')
        response.setHeader('Cache-Control', 'no-cache')

        const send = (frame: Record<string, unknown>): void => {
          response.write(`data: ${JSON.stringify(frame)}\n\n`)
        }

        const decoder = new TextDecoder()
        const reader = upstream.body.getReader()
        let buffer = ''
        let blocked = false

        try {
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Gemini's frames are SSE too, but its own shape and CRLF-separated — see splitFrames.
            const split = splitFrames(buffer)
            buffer = split.rest

            for (const frame of split.frames) {
              const payload = framePayload(frame)
              if (!payload) continue

              const read = readFrame(payload)
              for (const text of read.text) send({ type: 'text', text })
              if (read.blocked) blocked = true
            }
          }

          if (blocked) send({ type: 'error', message: BLOCKED_MESSAGE })
          else send({ type: 'done' })
        } catch (error) {
          server.config.logger.error(`[tutor] stream failed: ${String(error)}`)
          send({ type: 'error', message: 'The tutor stopped part way through. Try again in a moment.' })
        } finally {
          response.end()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tutorDevRoute(mode)],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // Background-task worktrees are full checkouts of this repo; without this every
    // test runs once per worktree and failures appear duplicated.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/worktrees/**'],
    // `moduleRegistry.test.ts` reads index.css through `?raw` to check the accent custom
    // properties the registry names actually exist. Vitest stubs CSS to an empty string by
    // default, which made that assertion pass on nothing; scoped here so CSS *modules* — which
    // component tests expect as proxies — keep their default handling.
    css: { include: [/index\.css/] },
    /**
     * The engine tests simulate real spans of physiology — a whole gestation, a paroxysm, a
     * suppression test — so several legitimately run for seconds. The 5s default left the
     * slowest of them about 200ms of headroom on this machine, which is no headroom at all:
     * they passed locally and timed out on CI's smaller runner, reporting a slow box as a
     * physiology failure. Raised so the suite fails for the reason it should.
     */
    testTimeout: 30_000,
    environment: 'node',
    globals: false,
  },
}))
