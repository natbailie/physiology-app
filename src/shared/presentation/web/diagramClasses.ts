import text from '@/shared/styles/diagramText.module.css';
import glucoseClasses from '@/modules/glucoseRegulation/components/Diagram.module.css';
import cardiorenalClasses from '@/modules/cardiorenal/components/Diagram.module.css';
import respiratoryClasses from '@/modules/respiratory/components/Diagram.module.css';

/** Every diagram class the schema may ask for. The shared text keys resolve to the shared
 * diagramText sheet; module-owned keys resolve by direct read of the module's own CSS-module
 * object — the exact `styles.x` access the hand-written component made, so the hashed class
 * string is byte-identical to legacy. Keys default to the shared sheet and fall through as
 * `undefined` where no shared sheet has one (a module that never draws organ X simply has no
 * value for it). */
export interface ResolvedDiagramClasses {
  label: string;
  anatomy: string;
  anatomyStrong: string;
  pathLabel: string;
  caption: string;
  organLabel: string;
  valueLabel: string;
  tickLabel: string;
  alarm: string;
  axis: string;
  verdict: string;
  pancreasShape: string;
  betaIslet: string;
  alphaIslet: string;
  isletLabel: string;
  liverShape: string;
  glycogenFill: string;
  heart: string;
  heartShape: string;
  kidneyShape: string;
  urineFlow: string;
  trachea: string;
  lungs: string;
  lungShape: string;
  alveolus: string;
  alveolusMismatched: string;
  plotAxis: string;
  plotGrid: string;
  axisLabel: string;
  isopleth: string;
  isoplethLabel: string;
  bufferLine: string;
  normalPoint: string;
  regionLabel: string;
  trail: string;
  baselineTrail: string;
  livePoint: string;
  verdictMixed: string;
}

type ClassKey = keyof ResolvedDiagramClasses;

/** The shared diagramText sheet fills the text keys; everything else has no shared default.
 * Per-module reads (below) overlay the keys each module owns. */
const shared: Partial<ResolvedDiagramClasses> = {
  label: text.label!,
  anatomy: text.anatomy!,
  anatomyStrong: text.anatomyStrong!,
  pathLabel: text.pathLabel!,
  caption: text.caption!,
  organLabel: text.organLabel!,
  valueLabel: text.valueLabel!,
  tickLabel: text.tickLabel!,
  alarm: text.alarm!,
  axis: text.axis!,
  verdict: text.verdict!,
};

/** The class keys each module diagram owns, resolved by direct read of the module's own CSS.
 * Reading the key is what materialises the proxy's hashed class name, exactly as the legacy
 * component's `styles.x` did — spreading a CSS-module object copies nothing, which is why each
 * owned key is named explicitly rather than merged. */
const MODULE_CLASS_KEYS: Record<string, ClassKey[]> = {
  glucoseRegulation: [
    'pathLabel',
    'organLabel',
    'pancreasShape',
    'betaIslet',
    'alphaIslet',
    'isletLabel',
    'liverShape',
    'glycogenFill',
  ],
  cardiorenal: ['pathLabel', 'organLabel', 'heart', 'heartShape', 'kidneyShape', 'urineFlow'],
  respiratory: [
    'organLabel',
    'pathLabel',
    'kidneyShape',
    'trachea',
    'lungs',
    'lungShape',
    'alveolus',
    'alveolusMismatched',
    'plotAxis',
    'plotGrid',
    'axisLabel',
    'isopleth',
    'isoplethLabel',
    'bufferLine',
    'normalPoint',
    'regionLabel',
    'trail',
    'baselineTrail',
    'livePoint',
    'verdict',
    'verdictMixed',
  ],
};

const MODULE_STYLES: Record<string, Record<string, string>> = {
  glucoseRegulation: glucoseClasses,
  cardiorenal: cardiorenalClasses,
  respiratory: respiratoryClasses,
};

const CACHE = new Map<string, ResolvedDiagramClasses>();

/** Module CSS wins where a module owns a key (its composed `pathLabel` differs from the shared
 * one by the composes line); the shared sheet fills every text key. Cache per module id. */
export function getDiagramClasses(moduleId: string): ResolvedDiagramClasses {
  const cached = CACHE.get(moduleId);
  if (cached) return cached;
  const base: ResolvedDiagramClasses = { ...shared } as ResolvedDiagramClasses;
  const keys = MODULE_CLASS_KEYS[moduleId];
  if (keys) {
    const styles = MODULE_STYLES[moduleId]!;
    for (const key of keys) (base as unknown as Record<string, string>)[key] = styles[key]!;
  }
  CACHE.set(moduleId, base);
  return base;
}