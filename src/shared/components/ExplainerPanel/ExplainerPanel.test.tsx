// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ModuleShellProvider, useModuleShell } from '@/shared/context/moduleShell';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { ExplainerPanel, type ExplainerContent } from './ExplainerPanel';

afterEach(cleanup);

const PARAGRAPHS = [
  'The first paragraph explains the mechanism.',
  'The second adds the clinical payoff.',
];

const CONTENT: ExplainerContent = {
  title: 'How the mechanism actually works',
  paragraphs: PARAGRAPHS,
};

type Preset = 'normal' | 'blocked';

const LABELS: Record<Preset, string> = { normal: 'Normal', blocked: 'Blocked' };

const SECTIONED: ExplainerContent<Preset> = {
  title: 'How the mechanism actually works',
  sections: [
    {
      heading: 'The block does not subtract, it accumulates',
      paragraphs: ['A section paragraph carrying the first claim.'],
      demos: [{ preset: 'blocked', watch: 'the precursor' }],
    },
    {
      heading: 'Treatment suppresses the drive rather than replacing the product',
      paragraphs: ['A second section paragraph.', 'And a third, in the same section.'],
    },
    {
      heading: 'A demo naming a scenario nobody registered',
      paragraphs: ['A section whose demo cannot be honoured.'],
      // Cast: the point of the case is a preset the bar does not offer.
      demos: [{ preset: 'ghost' as Preset }],
    },
  ],
};

/** A module page in miniature: the provider, a preset bar that registers itself, the panel. */
function Harness({
  content,
  disabled = false,
  onApply = () => {},
}: {
  content: ExplainerContent<Preset>;
  disabled?: boolean;
  onApply?: (name: Preset) => void;
}) {
  return (
    <ModuleShellProvider blinded={false}>
      <PresetBar
        order={['normal', 'blocked'] as const}
        labels={LABELS}
        onApply={onApply}
        onReset={() => {}}
        disabled={disabled}
      />
      <ExplainerPanel content={content as ExplainerContent} />
    </ModuleShellProvider>
  );
}

describe('ExplainerPanel', () => {
  it('opens by default, so a module does not present as unexplained sliders', () => {
    const { container } = render(<ExplainerPanel content={CONTENT} />);
    expect(container.querySelector('details')?.open).toBe(true);
    expect(screen.getByText(PARAGRAPHS[0]!)).toBeTruthy();
  });

  it('collapses when asked', () => {
    // Practice sessions collapse it: several explainers state outright what a predict-then-run
    // question is asking the learner to work out.
    const { container } = render(<ExplainerPanel content={CONTENT} startCollapsed />);
    expect(container.querySelector('details')?.open).toBe(false);
  });

  it('renders every paragraph and the title', () => {
    render(<ExplainerPanel content={CONTENT} />);
    expect(screen.getByText(CONTENT.title)).toBeTruthy();
    for (const paragraph of PARAGRAPHS) {
      expect(screen.getByText(paragraph)).toBeTruthy();
    }
  });
});

describe('ExplainerPanel sections', () => {
  it('renders every heading and paragraph', () => {
    render(<Harness content={SECTIONED} />);
    for (const section of SECTIONED.sections!) {
      expect(screen.getByText(section.heading)).toBeTruthy();
      for (const paragraph of section.paragraphs) {
        expect(screen.getByText(paragraph)).toBeTruthy();
      }
    }
  });

  it('opens folded, so the headings read as a contents page', () => {
    render(<Harness content={SECTIONED} />);
    // `details[class*=...]` rather than `[class*="card"]`: the latter also matches
    // `.cardSummary` and `.cardBody`, and would pass vacuously at three times the count.
    const cards = document.querySelectorAll('details[class*="card"]');
    expect(cards.length).toBe(SECTIONED.sections!.length);
    for (const card of cards) expect((card as HTMLDetailsElement).open).toBe(false);
  });

  it('opens one card without disturbing the others', () => {
    render(<Harness content={SECTIONED} />);
    const cards = [...document.querySelectorAll('details[class*="card"]')] as HTMLDetailsElement[];
    fireEvent.click(cards[1]!.querySelector('summary')!);
    expect(cards.map((c) => c.open)).toEqual([false, true, false]);
  });

  it('loads the scenario a section names', () => {
    const onApply = vi.fn();
    render(<Harness content={SECTIONED} onApply={onApply} />);
    // The bar's own button and the demo button share the label, so take the one in the panel.
    const demo = screen.getByText('watch the precursor').closest('[class*="demo"]')!;
    fireEvent.click(demo.querySelector('button')!);
    expect(onApply).toHaveBeenCalledWith('blocked');
  });

  it('stays inert while a pattern question locks the preset bar', () => {
    // Loading a different scenario mid-question silently replaces the one being asked about —
    // the bug PresetBar's `disabled` exists to prevent.
    const onApply = vi.fn();
    render(<Harness content={SECTIONED} onApply={onApply} disabled />);
    const demo = screen.getByText('watch the precursor').closest('[class*="demo"]')!;
    const button = demo.querySelector('button')!;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('renders nothing for a scenario no preset bar offers', () => {
    render(<Harness content={SECTIONED} />);
    // Two demo buttons would exist if the ghost preset rendered; only the real one does.
    const inPanel = document.querySelectorAll('[class*="demoButton"]');
    expect(inPanel.length).toBe(1);
  });

  it('offers nothing at all on a page with no preset bar', () => {
    render(
      <ModuleShellProvider blinded={false}>
        <ExplainerPanel content={SECTIONED as ExplainerContent} />
      </ModuleShellProvider>,
    );
    expect(document.querySelectorAll('[class*="demoButton"]').length).toBe(0);
  });
});

describe('module shell scenarios', () => {
  it('unregisters when the preset bar unmounts', () => {
    function Probe() {
      const { scenarioLabels } = useModuleShell();
      return <span data-testid="labels">{scenarioLabels ? Object.keys(scenarioLabels).join(',') : 'none'}</span>;
    }
    function App({ withBar }: { withBar: boolean }) {
      return (
        <ModuleShellProvider blinded={false}>
          {withBar && (
            <PresetBar order={['normal'] as const} labels={LABELS} onApply={() => {}} onReset={() => {}} />
          )}
          <Probe />
        </ModuleShellProvider>
      );
    }
    const { rerender } = render(<App withBar />);
    expect(screen.getByTestId('labels').textContent).toBe('normal,blocked');
    rerender(<App withBar={false} />);
    expect(screen.getByTestId('labels').textContent).toBe('none');
  });

  /**
   * The panel shuts itself the moment practice starts, because several sections state the answer
   * and some carry a demo button that would load the scenario being asked about. On the Lessons
   * tab that leaves a title and a chevron, which reads as a broken page unless it says why.
   *
   * The note must sit OUTSIDE the `<details>`: anything inside a closed one that is not the
   * `<summary>` is not rendered at all, so a note placed there would be invisible in exactly the
   * state it exists to explain. That was the first version of this, found by looking at it.
   */
  describe('while a question has it closed', () => {
    it('says why it is shut, from OUTSIDE the details element', () => {
      render(<ExplainerPanel content={SECTIONED} startCollapsed />);
      const note = screen.getByText(/Closed while a question is open/);

      // The structural half is the assertion that matters, and it has to be made this way:
      // jsdom renders the children of a closed <details> exactly as it renders an open one, so
      // `getByText` alone would pass with the note buried inside — invisible in the one state it
      // exists to explain, which is how the first version of this shipped.
      expect(note.closest('details')).toBeNull();
    });

    it('says nothing of the sort when it is open', () => {
      render(<ExplainerPanel content={SECTIONED} />);
      expect(screen.queryByText(/Closed while a question is open/)).toBeNull();
    });
  });
});
