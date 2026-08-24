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
    environment: 'node',
    globals: false,
  },
})
