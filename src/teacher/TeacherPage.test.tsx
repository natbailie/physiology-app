// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { CohortStanding } from './aggregate';

const state = {
  role: 'teacher' as 'teacher' | 'student' | 'signedOut' | 'loading',
  cohorts: [{ id: 'c1', name: 'Year 2', join_code: 'PHYS2K4M', created_at: '2026-01-01' }],
  standing: null as CohortStanding | null,
};

vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, supabase: {} }));
vi.mock('./useTeacher', () => ({
  useRole: () => state.role,
  useCohorts: () => ({ cohorts: state.cohorts, loading: false, error: null, create: vi.fn(), reload: vi.fn() }),
  useCohortProgress: () => ({ standing: state.standing, loading: false, error: null }),
}));

const { TeacherPage } = await import('./TeacherPage');

afterEach(() => {
  cleanup();
  state.role = 'teacher';
  state.cohorts = [{ id: 'c1', name: 'Year 2', join_code: 'PHYS2K4M', created_at: '2026-01-01' }];
  state.standing = null;
});

describe('the class dashboard', () => {
  it('shows a teacher their join code, which is read aloud more often than copied', async () => {
    render(<TeacherPage />);
    await waitFor(() => expect(screen.getByText('PHYS2K4M')).toBeTruthy());
  });

  it('turns a student away without pretending the page does not exist', () => {
    state.role = 'student';
    render(<TeacherPage />);
    expect(screen.getByText(/for teaching accounts/)).toBeTruthy();
    expect(screen.queryByText('PHYS2K4M')).toBeNull();
  });

  it('stands aside entirely when the app is running local-only', async () => {
    vi.resetModules();
    vi.doMock('@/lib/supabase', () => ({ isSupabaseConfigured: false, supabase: null }));
    const { TeacherPage: LocalOnly } = await import('./TeacherPage');
    render(<LocalOnly />);
    expect(screen.getByText(/running local-only/)).toBeTruthy();
    vi.doUnmock('@/lib/supabase');
  });

  it('reports the class, and names no student anywhere on the page', async () => {
    state.standing = {
      students: 12,
      attempted: 240,
      modules: [
        { moduleId: 'respiratory', students: 12, attempted: 140, correct: 56, percent: 40, withheld: false },
        { moduleId: 'cardiorenal', students: 9, attempted: 100, correct: 88, percent: 88, withheld: false },
      ],
    };
    render(<TeacherPage />);
    await waitFor(() => expect(screen.getByText('40%')).toBeTruthy());
    expect(screen.getByText(/12 students/)).toBeTruthy();
    // The weakest module leads, because that is the reason to open the page.
    const rows = document.querySelectorAll('tbody tr');
    expect(rows[0]!.textContent).toMatch(/40%/);
  });

  it('shows a withheld module as withheld rather than as a score or a blank row', async () => {
    state.standing = {
      students: 6,
      attempted: 20,
      modules: [
        { moduleId: 'vestibular', students: 2, attempted: 20, correct: 4, percent: null, withheld: true },
      ],
    };
    render(<TeacherPage />);
    await waitFor(() => expect(screen.getByText('withheld')).toBeTruthy());
    expect(screen.queryByText(/%$/)).toBeNull();
  });

  it('tells the teacher why a figure is withheld, on the page rather than in a tooltip alone', async () => {
    state.standing = { students: 6, attempted: 20, modules: [] };
    render(<TeacherPage />);
    await waitFor(() => expect(screen.getByText(/at least five people|5 students before a score/)).toBeTruthy());
  });

  it('says what to do next when a class has joined but answered nothing', async () => {
    state.standing = { students: 0, attempted: 0, modules: [] };
    render(<TeacherPage />);
    await waitFor(() => expect(screen.getByText(/Share the join code/)).toBeTruthy());
  });
});

describe('the class picker keeps the promises its markup makes', () => {
  it('uses pressed buttons rather than an ARIA tablist it does not implement', () => {
    state.cohorts = [
      { id: 'c1', name: 'Year 2', join_code: 'PHYS2K4M', created_at: '2026-01-01' },
      { id: 'c2', name: 'Year 3', join_code: 'PHYS9QRT', created_at: '2026-01-02' },
    ];
    render(<TeacherPage />);
    // Announcing "tab" obliges arrow-key navigation and a labelled panel. This page has neither,
    // so the roles must stay off rather than promise a contract it does not honour.
    expect(document.querySelector('[role="tablist"]')).toBeNull();
    expect(document.querySelector('[role="tab"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Year 2', pressed: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Year 3', pressed: false })).toBeTruthy();
  });
});
