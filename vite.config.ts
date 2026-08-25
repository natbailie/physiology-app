import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
})
