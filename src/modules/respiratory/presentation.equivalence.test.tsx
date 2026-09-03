// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ModuleShellProvider } from '@/shared/context/moduleShell';
import { RespiratoryDiagram } from './components/RespiratoryDiagram';
import { DavenportDiagram } from './components/DavenportDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { buildRespiratoryPresentation } from './presentation';
import { getDiagramClasses } from '@/shared/presentation/web/diagramClasses';
import { DiagramView } from '@/shared/presentation/web/DiagramView';
import { ReadoutGridView } from '@/shared/presentation/web/ReadoutGridView';
import { ControlRailView } from '@/shared/presentation/web/ControlRailView';
import type { RespDerived, RespHistoryPoint, RespInputs, RespState } from './engine/types';

afterEach(cleanup);

/* React serialises attributes in the order the author wrote them, which differs between hand-written
 * components even within one module, and stamps labels with a positional useId suffix (`_r_0_` vs
 * `_r_8_`) that depends on render history. Neither order nor that suffix is part of the DOM we own, so
 * canonicalise before comparing: sort each tag's attributes and neutralise the useId, while still
 * asserting structure, classes, styles, geometry and text. */
function canonicalize(html: string): string {
  const noReactIds = html.replace(/_r_[a-z0-9]+_/g, '_r_<id>_');
  return noReactIds.replace(/(<[a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][\w:.-]*="[^"]*")*)(\/?>)/g, (_m, tag: string, attrs: string, close: string) => {
    const entries = [...attrs.matchAll(/([a-zA-Z_:][\w:.-]*)="([^"]*)"/g)].map((m) => `${m[1]}="${m[2]}"`).sort();
    return `${tag}${entries.length ? ` ${entries.join(' ')}` : ''}${close}`;
  });
}

const state: RespState = {
  plasmaHCO3: 24,
  simTimeSeconds: 900,
  chemoreceptorDrive: 0.1,
  acuteBufferDrive: 0,
  bufferOffsetMEqL: 0,
  renalCompensationDrive: 0,
  renalOffsetMEqL: 0,
  airwayObstruction: 0,
  metabolicAcidBurdenMEqL: 0,
};

const derived: RespDerived = {
  effectiveMinuteVentilation: 100,
  alveolarVentilationFraction: 0.95,
  paCO2: 40,
  paO2: 100,
  aaGradient: 6,
  saO2: 98,
  plasmaHCO3: 24,
  pH: 7.4,
  anionGapMEqL: 12,
  deltaRatio: 0,
  expectedPaCO2Range: null,
  expectedHCO3Range: null,
  interpretation: {
    primary: 'normal',
    compensation: 'none expected',
    isMixed: false,
    secondary: null,
    label: 'Normal',
    short: 'Normal',
    detail: 'No primary disorder',
  },
  chemoreceptorDrive: 0.1,
  acuteBufferDrive: 0,
  renalCompensationDrive: 0,
  airwayObstruction: 0,
  vqMismatch: 0,
  metabolicAcidLoad: 0,
  acidType: 'anionGap',
  renalCompensationCapacity: 1,
};

const inputs: RespInputs = {
  minuteVentilation: 100,
  vqMismatch: 0,
  fiO2: 0.21,
  co2Production: 100,
  metabolicAcidLoad: 0,
  acidType: 'anionGap',
  renalCompensationCapacity: 1,
};

const history: RespHistoryPoint[] = [
  { t: 0, pH: 7.3, paCO2: 55, saO2: 92, plasmaHCO3: 26 },
  { t: 60, pH: 7.35, paCO2: 50, saO2: 94, plasmaHCO3: 27.5 },
  { t: 120, pH: 7.38, paCO2: 46, saO2: 95, plasmaHCO3: 28 },
];

describe('respiratory presentation equivalence', () => {
  it('renders the schema anatomy diagram to the same DOM as the legacy diagram', () => {
    const classes = getDiagramClasses('respiratory');
    const presentation = buildRespiratoryPresentation({ state, derived, inputs, history, baselineHistory: null });
    const frame = presentation.diagram[0]!;

    const legacy = render(
      <ModuleShellProvider blinded={false}>
        <RespiratoryDiagram derived={derived} />
      </ModuleShellProvider>,
    ).container.querySelector('svg[aria-label*="lungs"]');

    const schema = render(
      <ModuleShellProvider blinded={false}>
        <DiagramView frame={frame} classes={classes} />
      </ModuleShellProvider>,
    ).container.querySelector('svg[aria-label*="lungs"]');

    expect(canonicalize(schema?.outerHTML ?? '')).toBe(canonicalize(legacy?.outerHTML ?? ''));
  });

  it('renders the schema Davenport diagram to the same DOM as the legacy diagram', () => {
    const classes = getDiagramClasses('respiratory');
    const presentation = buildRespiratoryPresentation({ state, derived, inputs, history, baselineHistory: history.slice(0, 2) });
    const frame = presentation.diagram[1]!;

    const legacy = render(
      <ModuleShellProvider blinded={false}>
        <DavenportDiagram derived={derived} history={history} baselineHistory={history.slice(0, 2)} />
      </ModuleShellProvider>,
    ).container.querySelector('svg[aria-label*="Davenport"]');

    const schema = render(
      <ModuleShellProvider blinded={false}>
        <DiagramView frame={frame} classes={classes} />
      </ModuleShellProvider>,
    ).container.querySelector('svg[aria-label*="Davenport"]');

    expect(canonicalize(schema?.outerHTML ?? '')).toBe(canonicalize(legacy?.outerHTML ?? ''));
  });

  it('renders the schema readouts to the same DOM as the legacy panel', () => {
    const presentation = buildRespiratoryPresentation({ state, derived, inputs, history, baselineHistory: null });
    const readoutCtx = { state, derived, inputs };

    const legacy = render(
      <ModuleShellProvider blinded={false}>
        <ReadoutPanel derived={derived} inputs={inputs} />
      </ModuleShellProvider>,
    ).container.querySelector('.grid, [class*="grid"]');

    const schema = render(
      <ModuleShellProvider blinded={false}>
        <ReadoutGridView readouts={presentation.readouts} ctx={readoutCtx} />
      </ModuleShellProvider>,
    ).container.querySelector('.grid, [class*="grid"]');

    expect(canonicalize(schema?.outerHTML ?? '')).toBe(canonicalize(legacy?.outerHTML ?? ''));
  });

  it('renders the schema control rail to the same DOM as the legacy panel', () => {
    const presentation = buildRespiratoryPresentation({ state, derived, inputs, history, baselineHistory: null });
    const onChange = () => {};

    const legacy = render(
      <ModuleShellProvider blinded={false}>
        <ControlPanel inputs={inputs} onChange={onChange} />
      </ModuleShellProvider>,
    ).container.querySelector('[class*="rail"]');

    const schema = render(
      <ModuleShellProvider blinded={false}>
        <ControlRailView controls={presentation.controls} inputs={inputs} onChange={onChange} />
      </ModuleShellProvider>,
    ).container.querySelector('[class*="rail"]');

    expect(canonicalize(schema?.outerHTML ?? '')).toBe(canonicalize(legacy?.outerHTML ?? ''));
  });
});