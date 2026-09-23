import text from '@/shared/styles/diagramText.module.css';
import anatomy from '@/shared/styles/anatomy.module.css';
import cardiorenalClasses from '@/modules/cardiorenal/components/Diagram.module.css';
import respiratoryClasses from '@/modules/respiratory/components/Diagram.module.css';
import inflammationClasses from '@/modules/inflammation/components/Diagram.module.css';
import renalTubularClasses from '@/modules/renalTubular/components/Diagram.module.css';
import visionClasses from '@/modules/vision/components/Diagram.module.css';

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
  /** Cardiorenal's dashed urine stream — the one organ-adjacent class a module still owns. */
  urineFlow: string;
  glycogenFill: string;
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
  /* The shared anatomy animations. Global rather than per-module, because unlike `.chamber` or
   * `.canal` these mean exactly one thing wherever they appear: a heart beats and a lung
   * breathes, and a module that draws either wants the same motion the last one did. */
  beat: string;
  beatVolume: string;
  breathe: string;
  leader: string;
  /* Module-owned keys for the three schema diagrams that carry their own stylesheet.
   *
   * `resolveClass` returns `undefined` for a key no module registers, and a schema node that
   * states no `fill`, `stroke` or `colorToken` then renders with no paint at all — which is what
   * made these unsafe to convert. Registering the key list is the precondition for pointing a page
   * at `slots.diagram`: the phone already carries hand-ported tables for all three
   * (`physiology-native/src/engine/<id>/diagramClasses.ts`), and these resolve the same names
   * against the same stylesheets the hand-written components were reading. Names repeat across
   * modules on purpose — `sideTick` is a tick in vision and a tick in vestibular — which is why
   * they are resolved per module rather than merged. */
  insultBacteria: string;
  insultCrystal: string;
  insultForeign: string;
  macrophageDot: string;
  monoBar: string;
  neutBar: string;
  neutrophilDot: string;
  pusBar: string;
  pusPool: string;
  tissue: string;
  aquaporinArrow: string;
  cortexDivider: string;
  medullaLabel: string;
  osmolalityMarker: string;
  osmolalityValue: string;
  segmentLabel: string;
  tubuleSegment: string;
  chiasm: string;
  cortex: string;
  eyeOutline: string;
  fibreLeftField: string;
  fibreRightField: string;
  fieldFrame: string;
  fieldLetter: string;
  iris: string;
  lesionLabel: string;
  lesionMark: string;
  lgn: string;
  pupil: string;
  sideTick: string;
  torchBeam: string;
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
  beat: anatomy.beat!,
  beatVolume: anatomy.beatVolume!,
  breathe: anatomy.breathe!,
  leader: anatomy.leader!,
};

/** The class keys each module diagram owns, resolved by direct read of the module's own CSS.
 * Reading the key is what materialises the proxy's hashed class name, exactly as the legacy
 * component's `styles.x` did — spreading a CSS-module object copies nothing, which is why each
 * owned key is named explicitly rather than merged. */
const MODULE_CLASS_KEYS: Record<string, ClassKey[]> = {
  cardiorenal: ['urineFlow'],
  inflammation: ['insultBacteria', 'insultCrystal', 'insultForeign', 'macrophageDot', 'monoBar', 'neutBar', 'neutrophilDot', 'pusBar', 'pusPool', 'tissue'],
  renalTubular: ['aquaporinArrow', 'cortexDivider', 'medullaLabel', 'osmolalityMarker', 'osmolalityValue', 'segmentLabel', 'tubuleSegment'],
  vision: ['chiasm', 'cortex', 'eyeOutline', 'fibreLeftField', 'fibreRightField', 'fieldFrame', 'fieldLetter', 'iris', 'lesionLabel', 'lesionMark', 'lgn', 'pupil', 'sideTick', 'torchBeam'],
  respiratory: [
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
  cardiorenal: cardiorenalClasses,
  inflammation: inflammationClasses,
  renalTubular: renalTubularClasses,
  vision: visionClasses,
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