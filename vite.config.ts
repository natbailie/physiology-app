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
    environment: 'node',
    globals: false,
  },
})
