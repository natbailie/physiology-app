/**
 * The explainer's content shape, apart from the component that renders it.
 *
 * Every module's `content.ts` is pure data typed by `ExplainerContent`, and so is the tutor's
 * corpus reader — neither wants React, a CSS module or the module shell. Keeping the shape here
 * is what lets the React Native app import the same 45 content files: it has its own renderer,
 * and `ExplainerPanel.tsx` is a web component that cannot cross over.
 *
 * `ExplainerPanel.tsx` re-exports all of this, so `@/shared/components/ExplainerPanel/ExplainerPanel`
 * remains a valid import for everything that was already using it.
 */

/**
 * A scenario a section is talking about, offered as a button beside the prose that names it.
 *
 * Generic over the module's own preset union, so renaming a preset fails `tsc -b` rather than
 * rendering a button that quietly does nothing.
 */
export interface ExplainerDemo<TPreset extends string = string> {
  preset: TPreset;
  /** Button text. Defaults to the module's own label for that preset. */
  label?: string;
  /** Readout to watch once it loads, shown beside the button. */
  watch?: string;
}

export interface ExplainerSection<TPreset extends string = string> {
  /** A claim, not a topic — the same voice as the module title. */
  heading: string;
  paragraphs: string[];
  demos?: ExplainerDemo<TPreset>[];
}

export interface ExplainerContent<TPreset extends string = string> {
  title: string;
  /** Legacy flat prose. Replaced by `sections` as modules migrate. */
  paragraphs?: string[];
  sections?: ExplainerSection<TPreset>[];
}

/** Every paragraph in a module, whichever shape it is authored in. Used by the content test. */
export function paragraphsOf(content: ExplainerContent): string[] {
  return content.sections
    ? content.sections.flatMap((section) => section.paragraphs)
    : (content.paragraphs ?? []);
}
