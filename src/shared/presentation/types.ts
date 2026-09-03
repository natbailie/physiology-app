/**
 * Module presentation as data.
 *
 * A module's learner-facing interface on the web is a page built by hand — a diagram component,
 * a readout grid, a slider stack, chart components. None of that survives contact with Metro and
 * Hermes: JSX is React's, CSS modules are the bundler's, and the native app needs the same
 * presentation without either.
 *
 * So a module's presentation lives here, as plain data plus small pure functions — the same
 * contract the engines already follow (CLAUDE.md: "Engines stay pure"). A module exports a
 * `buildPresentation(context)` returning a `ModulePresentation`:
 *
 *   - `diagram`   — a scene graph for the SVG drawing,
 *   - `controls`  — specs for the slider stack,
 *   - `readouts`  — specs for the readout tile grid,
 *   - `charts`    — specs for the trend charts.
 *
 * The web app renders it through `@/shared/presentation`, reusing the same shared components and
 * the same stylesheet classes the hand-written pages used, so rendering the schema reproduces the
 * web diagram pixel-for-pixel; the native app renders the same data through its own renderer.
 *
 * The scene graph mirrors the hand-written SVG it replaces: the same primitives (paths, circles,
 * rects, text, clips, markers), the shared idioms (vessels, hormone axes) and the organs. Node
 * `cls` values are semantic keys — "organ", "pathLabel", "isletLabel" — resolved by each renderer
 * against its platform's own stylesheet, so the data never imports CSS.
 */

/** A CSS custom property name, without the leading dashes — "glucose", not "--glucose". */
export type ColorToken = string;

/** CSS custom properties set on an element (the engine's `--activation`, `--flow-speed`, ...). */
export type StyleVars = Readonly<Record<string, number | string>>;

/* --- Diagram scene graph -------------------------------------------- */

export interface MarkerNode {
  type: 'marker';
  id: string;
  colorToken: ColorToken;
}

/** A clip region with a single path, reused by organ composites (the liver's glycogen fill). */
export interface ClipNode {
  type: 'clipPath';
  id: string;
  children: readonly PathNode[];
}

/** The animated vessel: a faint static path plus a dashed flow overlay. */
export interface VesselNode {
  type: 'vessel';
  path: string;
  colorToken: ColorToken;
  speed: number;
  /** Calibre as a multiple of normal — how a resistance change is drawn rather than read. */
  width?: number;
}

/** The dashed, glowing hormonal feedback pathway with its label. */
export interface AxisNode {
  type: 'axis';
  path: string;
  colorToken: ColorToken;
  label: string;
  labelX: number;
  labelY: number;
  activation: number;
  /** A marker id declared in the frame's defs — the arrowhead for this pathway. */
  markerId: string;
  /** Tighter dotted dash, for an inhibitory/negative-feedback pathway. */
  inhibitory?: boolean;
}

/** A named organ drawn by the renderer's own registry, fed by `params` the way the old
 * organ components were fed by props. */
export interface OrganNode {
  type: 'organ';
  name: OrganName;
  x: number;
  y: number;
  params: Readonly<Record<string, number>>;
}

export type OrganName =
  | 'pancreas'
  | 'liver'
  | 'heart'
  | 'kidneys'
  | 'lungs'
  | 'renalCompensation';

export interface GroupNode {
  type: 'group';
  cls?: string;
  transform?: string;
  styleVars?: StyleVars;
  children: readonly SceneNode[];
}

export interface PathNode {
  type: 'path';
  d: string;
  cls?: string;
  /** Stroke colour. */
  colorToken?: ColorToken;
  fill?: ColorToken | 'none';
  strokeWidth?: number;
  /** A marker id declared in the frame's defs. */
  markerEnd?: string;
  clipPathId?: string;
  styleVars?: StyleVars;
}

export interface CircleNode {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  cls?: string;
  fill?: ColorToken;
  styleVars?: StyleVars;
}

export interface RectNode {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  cls?: string;
  fill?: ColorToken;
  clipPathId?: string;
  styleVars?: StyleVars;
}

export interface LineNode {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cls?: string;
  colorToken?: ColorToken;
}

export interface TextNode {
  type: 'text';
  x: number;
  y: number;
  text: string;
  cls?: string;
  /** `text-anchor`. */
  anchor?: 'start' | 'middle' | 'end';
  /** `fill`. */
  colorToken?: ColorToken;
  opacity?: number;
  styleVars?: StyleVars;
}

export type SceneNode =
  | GroupNode
  | PathNode
  | CircleNode
  | RectNode
  | LineNode
  | TextNode
  | VesselNode
  | AxisNode
  | OrganNode;

export interface FrameNode {
  type: 'frame';
  /** For the key React needs between multiple frames of one diagram slot. */
  key?: string;
  viewBox: [number, number, number, number];
  ariaLabel: string;
  defs?: readonly (MarkerNode | ClipNode)[];
  children: readonly SceneNode[];
}

/* --- Controls ------------------------------------------------------- */

/** How a slider value is displayed; replaces the old per-module `formatValue` functions. */
export type SliderFormat = 'decimal' | 'percent';

export interface SliderControlSpec<Inputs> {
  kind: 'slider';
  label: string;
  /** The input this slider writes. */
  key: string & keyof Inputs;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: SliderFormat;
}

/** A labelled radio group for inputs that are genuinely categorical — the "kind of acid" a
 * metabolic load brings, an ECG lead, a rhythm. */
export interface ToggleControlSpec<Inputs> {
  kind: 'toggle';
  label: string;
  /** The input this group writes. */
  key: string & keyof Inputs;
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Overrides the shared accent for the selected option. */
  colorToken?: ColorToken;
}

export type ControlSpec<Inputs> = SliderControlSpec<Inputs> | ToggleControlSpec<Inputs>;

/* --- Readouts ------------------------------------------------------- */

export interface ReadoutContext<State, Derived, Inputs> {
  state: State;
  derived: Derived;
  inputs: Inputs;
}

export interface ReadoutSpec<State, Derived, Inputs> {
  label: string;
  /** The value shown, already formatted by the module (the "42" of "42 mg/dL"). */
  value: (ctx: ReadoutContext<State, Derived, Inputs>) => string;
  unit?: string;
  colorToken?: ColorToken;
  /** The secondary line: a status, a hint, a comparison. */
  secondary?: (ctx: ReadoutContext<State, Derived, Inputs>) => string | undefined;
  /** The slider position this reading answers to, for the "slider: 110" disclosure. */
  setPoint?: (ctx: ReadoutContext<State, Derived, Inputs>) => number | undefined;
  wide?: boolean;
  /** Names the pattern the model has settled into; withheld during a pattern question. */
  revealsPattern?: boolean;
}

/* --- Charts --------------------------------------------------------- */

export interface ChartContext<Derived> {
  derived: Derived;
}

export interface SparklineSpec<History> {
  kind: 'sparkline';
  label: string;
  unit?: string;
  colorToken: ColorToken;
  domainMin: number;
  domainMax: number;
  data: (points: readonly History[]) => number[];
  secondaryLabel?: string;
  secondaryColorToken?: ColorToken;
  secondaryData?: (points: readonly History[]) => number[];
}

/** A reference curve with a live position dot — the O2-Hb dissociation curve. */
export interface OdCurveSpec<Derived> {
  kind: 'od-curve';
  curveFn: (x: number) => number;
  currentX: (ctx: ChartContext<Derived>) => number;
  currentY: (ctx: ChartContext<Derived>) => number;
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel: string;
  yLabel: string;
  colorToken: ColorToken;
}

export type ChartSpec<History, Derived> = SparklineSpec<History> | OdCurveSpec<Derived>;

/* --- The whole presentation ---------------------------------------- */

export interface ModulePresentation<State, Derived, Inputs, History> {
  diagram: readonly FrameNode[];
  controls: ReadonlyArray<ControlSpec<Inputs>>;
  readouts: ReadonlyArray<ReadoutSpec<State, Derived, Inputs>>;
  charts: ReadonlyArray<ChartSpec<History, Derived>>;
}

/** The context a module's presentation builder reads — one settled/reactive frame plus history. */
export interface PresentationContext<State, Derived, Inputs, History> {
  state: State;
  derived: Derived;
  inputs: Inputs;
  history: readonly History[];
  baselineHistory: readonly History[] | null;
}

/** The per-session derived context readouts/charts compute from — already derived by the loop. */
export interface ShowContext<State, Derived, Inputs> {
  state: State;
  derived: Derived;
  inputs: Inputs;
}