// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ModulePage } from './ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { useModuleShell } from '@/shared/context/moduleShell';

afterEach(cleanup);

// ResizeObserver is not in jsdom, and ModulePage observes its own header to publish --topbar-h.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', NoopResizeObserver);
// jsdom implements neither, and LabAnchor calls both when a demo button reveals the lab.
vi.stubGlobal('scrollTo', vi.fn());
if (!window.matchMedia) vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));

const SLOTS = {
  moduleId: 'shockStates',
  title: 'Shock States',
  subtitle: 'four ways to fail',
  presets: <div data-testid="presets" />,
  diagram: <div data-testid="diagram" />,
  readouts: <div data-testid="readouts" />,
  controls: <div data-testid="controls" />,
  explainer: <div data-testid="explainer" />,
  footnote: 'a footnote',
};

describe('ModulePage', () => {
  /**
   * 48 of the 51 modules have no patients. They still get three tabs: the Lab, the Questions
   * they pass as `questions`, and Lessons. The absence of `clinic` is the only switch.
   */
  describe('without a clinic', () => {
    it('offers a Lab and a Lessons tab, and nothing else', () => {
      render(<ModulePage {...SLOTS} />);
      expect(screen.getByRole('button', { name: 'Lab' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Lessons' })).toBeDefined();
      expect(screen.queryByRole('button', { name: 'Patients' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Questions' })).toBeNull();
    });

    it('offers a Questions tab once the page passes its practice as questions', () => {
      render(<ModulePage {...SLOTS} questions={<div data-testid="questionset" />} />);
      expect(screen.getByRole('button', { name: 'Lab' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Questions' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Lessons' })).toBeDefined();
      expect(screen.queryByRole('button', { name: 'Patients' })).toBeNull();
    });

    it('holds practice on the Questions tab, not in the lab', () => {
      render(<ModulePage {...SLOTS} questions={<div data-testid="practice" />} />);
      expect(screen.getByTestId('diagram').closest('[hidden]')).toBeNull();
      expect(screen.getByTestId('presets').closest('[hidden]')).toBeNull();
      // Practice moved off the lab with the tab split: opening on the lab shows the
      // instrument alone, and the questions wait one tab over.
      expect(screen.getByTestId('practice').closest('[hidden]')).not.toBeNull();
      expect(screen.getByTestId('explainer').closest('[hidden]')).not.toBeNull();
    });

    it('shows the questions on their own tab', () => {
      render(<ModulePage {...SLOTS} questions={<div data-testid="practice" />} />);
      fireEvent.click(screen.getByRole('button', { name: 'Questions' }));
      expect(screen.getByTestId('practice').closest('[hidden]')).toBeNull();
      expect(screen.getByTestId('diagram').closest('[hidden]')).not.toBeNull();
    });

    /**
     * The proof that 48 module pages need no tab state of their own. They pass no `activeTab`,
     * so ModulePage holds it itself and the strip works without a line of their own.
     */
    it('moves between tabs on its own when the page does not control it', () => {
      render(<ModulePage {...SLOTS} />);
      fireEvent.click(screen.getByRole('button', { name: 'Lessons' }));
      expect(screen.getByTestId('explainer').closest('[hidden]')).toBeNull();
      expect(screen.getByTestId('diagram').closest('[hidden]')).not.toBeNull();
    });
  });

  describe('with a clinic', () => {
    const tabbed = { ...SLOTS, clinic: <div data-testid="clinic" />, caseHeader: <div data-testid="bedside" /> };

    it('offers both tabs as pressed-state buttons', () => {
      render(<ModulePage {...tabbed} onTabChange={() => {}} activeTab="lab" />);
      expect(screen.getByRole('button', { name: 'Lab' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: 'Patients' }).getAttribute('aria-pressed')).toBe('false');
    });

    it('reports a tab change rather than owning the state', () => {
      const onTabChange = vi.fn();
      render(<ModulePage {...tabbed} activeTab="lab" onTabChange={onTabChange} />);
      fireEvent.click(screen.getByRole('button', { name: 'Patients' }));
      expect(onTabChange).toHaveBeenCalledWith('clinic');
    });

    it('shows the lab and hides the clinic on the lab tab', () => {
      render(<ModulePage {...tabbed} onTabChange={() => {}} activeTab="lab" />);
      expect(screen.getByTestId('diagram').closest('[hidden]')).toBeNull();
      expect(screen.getByTestId('clinic').closest('[hidden]')).not.toBeNull();
    });

    /**
     * Hidden, never unmounted. Every ReadoutItem registers its tile with the tutor, and the
     * registry clears the live state once the last one goes — so unmounting the lab here would
     * blind the tutor on the tab where a learner is most likely to ask what a number means.
     */
    it('keeps the lab mounted while the clinic is showing', () => {
      render(<ModulePage {...tabbed} onTabChange={() => {}} activeTab="clinic" />);
      expect(screen.getByTestId('diagram')).toBeDefined();
      expect(screen.getByTestId('readouts')).toBeDefined();
      expect(screen.getByTestId('controls')).toBeDefined();
      expect(screen.getByTestId('diagram').closest('[hidden]')).not.toBeNull();
    });

    it('takes the hidden lab out of the tab order', () => {
      const { container } = render(<ModulePage {...tabbed} onTabChange={() => {}} activeTab="clinic" />);
      const lab = screen.getByTestId('diagram').closest('section')!;
      expect(lab.hasAttribute('inert')).toBe(true);
      expect(container.querySelector('[data-testid="clinic"]')!.closest('section')!.hasAttribute('inert')).toBe(false);
    });

    /**
     * The preset bar and the bedside banner are lab chrome: scenario control for a simulator
     * that is not on screen, and a caption for sliders nobody can see.
     */
    it('withdraws the presets and the bedside banner on the clinic tab', () => {
      render(<ModulePage {...tabbed} onTabChange={() => {}} activeTab="clinic" />);
      // Hidden, never unmounted — see the demo-button test below.
      expect(screen.getByTestId('presets').closest('[hidden]')).not.toBeNull();
      expect(screen.queryByTestId('bedside')).toBeNull();
    });

    it('shows the bedside banner on the lab tab', () => {
      render(<ModulePage {...tabbed} onTabChange={() => {}} activeTab="lab" />);
      expect(screen.getByTestId('bedside')).toBeDefined();
    });

    /**
     * Only one QuizPanel may be mounted at a time: each installs a window keydown listener
     * while a question is open, and two would answer the same keypress twice, writing twice
     * into the persisted review ladder.
     */
    describe('with a questions set as well', () => {
      const three = { ...tabbed, questions: <div data-testid="questionset" /> };

      it('offers all three tabs', () => {
        render(<ModulePage {...three} onTabChange={() => {}} activeTab="questions" />);
        expect(screen.getByRole('button', { name: 'Questions' }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: 'Patients' }).getAttribute('aria-pressed')).toBe('false');
        expect(screen.getByRole('button', { name: 'Lab' }).getAttribute('aria-pressed')).toBe('false');
      });

      /**
       * The line that breaks silently if the union is merely widened. With two tabs `!showLab`
       * meant "the clinic"; on a third tab that is still false, so the clinic would sit visible
       * underneath the questions — it compiles, and it ships a page with two panels on it.
       */
      it('hides the clinic on the questions tab, not just on the lab', () => {
        render(<ModulePage {...three} onTabChange={() => {}} activeTab="questions" />);
        expect(screen.getByTestId('clinic').closest('[hidden]')).not.toBeNull();
        expect(screen.getByTestId('questionset').closest('[hidden]')).toBeNull();
        expect(screen.getByTestId('diagram').closest('[hidden]')).not.toBeNull();
      });

      it('keeps every section mounted whichever tab is showing', () => {
        render(<ModulePage {...three} onTabChange={() => {}} activeTab="questions" />);
        expect(screen.getByTestId('diagram')).toBeDefined();
        expect(screen.getByTestId('clinic')).toBeDefined();
      });

      it('withdraws the presets and the bedside banner on the questions tab', () => {
        render(<ModulePage {...three} onTabChange={() => {}} activeTab="questions" />);
        expect(screen.getByTestId('presets').closest('[hidden]')).not.toBeNull();
        expect(screen.queryByTestId('bedside')).toBeNull();
      });
    });

    /** A module whose beds claim every question shows two tabs, not three with an empty one. */
    it('offers no Questions tab when there is no question set', () => {
      render(<ModulePage {...tabbed} onTabChange={() => {}} activeTab="clinic" />);
      expect(screen.queryByRole('button', { name: 'Questions' })).toBeNull();
    });

    it('offers no header practice button, because practice is a tab away', () => {
      render(<ModulePage {...tabbed} onTabChange={() => {}} activeTab="lab" />);
      expect(screen.queryByRole('button', { name: /practise/i })).toBeNull();
    });
  });

  /**
   * The integration nothing in this repo covered, and the one that would have caught a real
   * regression: the explainer's 415 "show me" buttons take their TEXT from the scenario labels
   * PresetBar registers with the shell. Only four of those demos set a label of their own, so
   * unmounting the bar off the Lab tab would have rendered 411 of them as nothing at all.
   *
   * `ExplainerPanel.test.tsx` documents that failure mode but cannot catch it — it builds its own
   * provider and never mounts this component. This is where the two meet.
   */
  describe('the explainer’s scenario buttons, through a real preset bar', () => {
    const live = {
      ...SLOTS,
      presets: (
        <PresetBar
          order={['normal', 'blocked'] as const}
          labels={{ normal: 'Normal', blocked: 'Blocked' }}
          onApply={() => {}}
          onReset={() => {}}
        />
      ),
      explainer: (
        <ExplainerPanel
          content={{
            title: 'A claim',
            sections: [{ heading: 'One', paragraphs: ['Some prose.'], demos: [{ preset: 'blocked' }] }],
          }}
        />
      ),
    };

    it('still labels them on the Lessons tab, where the preset bar is hidden', () => {
      render(<ModulePage {...live} />);
      fireEvent.click(screen.getByRole('button', { name: 'Lessons' }));
      const demo = screen.getByRole('button', { name: /Blocked/ });
      expect(demo).toBeDefined();
      expect((demo as HTMLButtonElement).disabled).toBe(false);
    });
  });

  /**
   * A demo button is a promise that you can watch the scenario it names. From a tab of its own
   * that means switching tabs, not just scrolling — and the scroll has to wait for the switch to
   * commit, because `getBoundingClientRect()` on a `display: none` element is an all-zero rect.
   */
  describe('revealLab', () => {
    function Reveal() {
      const { revealLab } = useModuleShell();
      return (
        <button type="button" onClick={revealLab}>
          reveal
        </button>
      );
    }

    it('brings the lab back from another tab', () => {
      render(<ModulePage {...SLOTS} explainer={<Reveal />} />);
      fireEvent.click(screen.getByRole('button', { name: 'Lessons' }));
      expect(screen.getByTestId('diagram').closest('[hidden]')).not.toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'reveal' }));
      expect(screen.getByTestId('diagram').closest('[hidden]')).toBeNull();
    });
  });
});
