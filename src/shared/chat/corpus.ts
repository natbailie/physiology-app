/**
 * Everything the app has already written down, as retrievable chunks.
 *
 * The tutor answers from the same prose a learner would find by navigating — module explainers,
 * question explanations, glossary definitions, drug mechanisms, formula notes. That is the whole
 * reason it can say "that is the Guyton curve, open Venous return" instead of producing a
 * plausible paragraph in someone else's voice. Roughly 105,000 words, all of it already held to a
 * quality floor by `src/modules/content.test.ts`.
 *
 * The module loaders are deliberately NOT eager, and the four static sources are dynamically
 * imported, for the reason `moduleQuestionIds.ts` documents at length: eagerly importing them
 * welds every module into whichever chunk imports this file. Nothing here is loaded until a
 * learner actually opens the chat panel, and a learner who never opens it pays nothing.
 *
 * Discovery is `modules/manifest.generated.ts` rather than an `import.meta.glob` so this file can
 * be shared with the React Native app, which has neither. The manifest is generated and re-globbed
 * by its own test, so it still cannot quietly stop covering a module.
 *
 * No `useSyncExternalStore` triple, unlike `moduleQuestionIds`. That file needs one because the
 * home grid renders synchronously and has to re-render when the index lands; the chat panel is
 * itself lazy and can simply await this.
 */

import { contentModules, questionModules } from '@/modules/manifest.generated';
import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export interface Chunk {
  /** Stable and unique — `content:respiratory:2`, `glossary:map`, `drug:beta-blockers`. */
  id: string;
  /** The simulator this came from, where there is one. Drives the current-module boost. */
  moduleId?: string;
  /** Where a learner goes to read more, e.g. `#respiratory`. Quoted back in answers. */
  route?: string;
  /** Retrieval weights title matches more heavily than body matches. */
  title: string;
  text: string;
}

/** The explainer export, found by shape — each module names its const differently. */
function explainerIn(exports: Record<string, unknown>): ExplainerContent | null {
  const found = Object.values(exports).find(
    (value): value is ExplainerContent =>
      typeof value === 'object' && value !== null && 'title' in value,
  );
  return found ?? null;
}

interface AuthoredQuestion {
  id: string;
  stem: string;
  explanation: string;
}

function isAuthoredQuestion(value: unknown): value is AuthoredQuestion {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AuthoredQuestion>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.stem === 'string' &&
    typeof candidate.explanation === 'string'
  );
}

/** The questions export, found by shape — the same duck-type `moduleQuestionIds` uses. */
function questionsIn(exports: Record<string, unknown>): AuthoredQuestion[] {
  const found = Object.values(exports).find(
    (value): value is AuthoredQuestion[] =>
      Array.isArray(value) && value.length > 0 && value.every(isAuthoredQuestion),
  );
  return found ?? [];
}

function explainerChunks(moduleId: string, content: ExplainerContent, moduleName: string): Chunk[] {
  const route = `#${moduleId}`;

  if (content.sections) {
    return content.sections.map((section, index) => ({
      id: `content:${moduleId}:${index}`,
      moduleId,
      route,
      title: `${moduleName} — ${section.heading}`,
      text: section.paragraphs.join('\n\n'),
    }));
  }

  // Legacy flat prose: one chunk for the module, since there are no headings to split on.
  return content.paragraphs?.length
    ? [
        {
          id: `content:${moduleId}:0`,
          moduleId,
          route,
          title: `${moduleName} — ${content.title}`,
          text: content.paragraphs.join('\n\n'),
        },
      ]
    : [];
}

async function moduleChunks(moduleNames: Map<string, string>): Promise<Chunk[]> {
  const chunks: Chunk[] = [];

  await Promise.all([
    ...Object.entries(contentModules).map(async ([moduleId, loader]) => {
      const content = explainerIn(await loader());
      if (!content) return;
      chunks.push(...explainerChunks(moduleId, content, moduleNames.get(moduleId) ?? moduleId));
    }),
    ...Object.entries(questionModules).map(async ([moduleId, loader]) => {
      const moduleName = moduleNames.get(moduleId) ?? moduleId;
      for (const question of questionsIn(await loader())) {
        chunks.push({
          id: `question:${moduleId}:${question.id}`,
          moduleId,
          route: `#${moduleId}`,
          // The stem is the question a learner would be asked; the explanation is the answer to
          // it. Keeping them in one chunk means a retrieved explanation always arrives with the
          // scenario it explains, which is what makes it readable out of context.
          title: `${moduleName} — ${question.stem}`,
          text: question.explanation,
        });
      }
    }),
  ]);

  return chunks;
}

async function referenceChunks(): Promise<Chunk[]> {
  const [{ GLOSSARY }, { MEDICATIONS }, { FORMULAS }] = await Promise.all([
    import('@/shared/glossary/terms'),
    import('@/medications/drugs'),
    import('@/reference/formulas'),
  ]);

  const glossary: Chunk[] = Object.entries(GLOSSARY).map(([label, entry]) => ({
    id: `glossary:${label}`,
    title: entry.expansion ? `${label} (${entry.expansion})` : label,
    text: entry.definition,
  }));

  const drugs: Chunk[] = MEDICATIONS.map((drugClass) => ({
    id: `drug:${drugClass.id}`,
    moduleId: drugClass.moduleId,
    route: `#medications/${drugClass.id}`,
    title: `${drugClass.className} (${drugClass.drugs.join(', ')})`,
    text: drugClass.mechanism,
  }));

  const formulas: Chunk[] = FORMULAS.map((formula) => ({
    id: `formula:${formula.id}`,
    moduleId: formula.moduleId,
    route: '#reference',
    title: formula.name,
    text: `${formula.formulaDisplay}\n\n${formula.explanation}`,
  }));

  return [...glossary, ...drugs, ...formulas];
}

let corpus: Promise<Chunk[]> | null = null;

/** Every chunk, built once and shared. Safe to call from anywhere, repeatedly. */
export function loadCorpus(): Promise<Chunk[]> {
  corpus ??= (async () => {
    const { MODULES } = await import('@/home/moduleRegistry');
    const moduleNames = new Map(MODULES.map((module) => [module.id, module.name]));

    const [fromModules, fromReference] = await Promise.all([
      moduleChunks(moduleNames),
      referenceChunks(),
    ]);

    // Sorted so the corpus — and therefore every IDF weight derived from it — is identical
    // between loads, whatever order the dynamic imports happen to resolve in.
    return [...fromModules, ...fromReference].sort((a, b) => a.id.localeCompare(b.id));
  })();

  return corpus;
}
