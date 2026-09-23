// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useModuleTab } from './useModuleTab';
import type { ModuleTab } from '@/shared/components/ModulePage/ModulePage';

let unmount: (() => void) | null = null;

afterEach(() => {
  act(() => unmount?.());
  unmount = null;
});

function mount(patient: { id: string } | null) {
  const host = document.createElement('div');
  const root = createRoot(host);
  const ended = vi.fn();
  let current: [ModuleTab, (next: ModuleTab) => void] | null = null;

  function Probe() {
    current = useModuleTab(patient, ended);
    return null;
  }

  act(() => root.render(<Probe />));
  unmount = () => root.unmount();

  return {
    tab: () => current![0],
    go: (next: ModuleTab) => act(() => current![1](next)),
    ended,
  };
}

/** Flushes the microtask the hook defers `endSession` onto. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useModuleTab', () => {
  it('opens on the bed when the page was opened at one', () => {
    expect(mount({ id: 'amina' }).tab()).toBe('clinic');
  });

  it('opens on the lab when it was not', () => {
    expect(mount(null).tab()).toBe('lab');
  });

  it('does not end a session at mount', async () => {
    const h = mount({ id: 'amina' });
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  it('moves where it is told', () => {
    const h = mount(null);
    h.go('questions');
    expect(h.tab()).toBe('questions');
  });

  /**
   * Lab and Patients run the SAME question set, so a glance at the diagram mid-question must not
   * throw the session away — that is what the tabs are for.
   */
  it('does not end a session moving between the lab and the bedside', async () => {
    const h = mount({ id: 'amina' });
    h.go('lab');
    h.go('clinic');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  it('ends the session arriving at the questions from the bedside', async () => {
    const h = mount({ id: 'amina' });
    h.go('questions');
    await settle();
    expect(h.ended).toHaveBeenCalledOnce();
  });

  it('does not end a session leaving the questions for the lab', async () => {
    // The lab is transparent: a glance at the diagram mid-question must not throw the session
    // away, and the stabilised array plus the blinded shell state hold it until the return.
    const h = mount(null);
    h.go('questions');
    await settle();
    h.ended.mockClear();
    h.go('lab');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  it('does not end the session on the way back out of them', async () => {
    const h = mount(null);
    h.go('questions');
    await settle();
    h.ended.mockClear();
    h.go('clinic');
    await settle();
    expect(h.ended).toHaveBeenCalledOnce();
  });

  it('does nothing when told to move where it already is', async () => {
    const h = mount(null);
    h.go('questions');
    await settle();
    h.ended.mockClear();
    h.go('questions');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  /** Lessons runs the same set as the lab and the bedside, so crossing to it ends nothing. */
  it('does not end a session moving between the lab and the lessons', async () => {
    const h = mount(null);
    h.go('lessons');
    h.go('lab');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  it('does not end a session moving from the bedside to the lessons', async () => {
    const h = mount({ id: 'amina' });
    h.go('lessons');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  it('does not end a session leaving the questions for the lessons', async () => {
    // Lessons is transparent like the lab: reading the prose mid-question is what the tabs are
    // for, and the inert-guard on QuizPanel's shortcuts stops an off-screen commit.
    const h = mount(null);
    h.go('questions');
    await settle();
    h.ended.mockClear();
    h.go('lessons');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  it('does not end a session crossing from the lessons to the questions with no set behind', async () => {
    const h = mount(null);
    h.go('lessons');
    await settle();
    h.ended.mockClear();
    h.go('questions');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  it('ends the session arriving at the questions from the lab carrying a bedside set', async () => {
    const h = mount({ id: 'amina' });
    h.go('lab');
    await settle();
    h.go('questions');
    await settle();
    expect(h.ended).toHaveBeenCalledOnce();
  });

  it('does not end returning to the questions from the lab carrying their own set', async () => {
    const h = mount(null);
    h.go('questions');
    await settle();
    h.go('lab');
    await settle();
    h.ended.mockClear();
    h.go('questions');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
  });

  it('ends the session arriving at the bedside carrying a questions set', async () => {
    const h = mount({ id: 'amina' });
    h.go('questions');
    await settle();
    h.ended.mockClear();
    h.go('lab');
    await settle();
    expect(h.ended).not.toHaveBeenCalled();
    h.go('clinic');
    await settle();
    expect(h.ended).toHaveBeenCalledOnce();
  });
});
