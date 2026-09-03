// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ModuleShellProvider } from '@/shared/context/moduleShell';
import { GlucoseDiagram as LegacyGlucoseDiagram } from './components/GlucoseDiagram';
import { ReadoutPanel as LegacyReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel as LegacyControlPanel } from './components/ControlPanel';
import { buildGlucosePresentation } from './presentation';
import { getDiagramClasses } from '@/shared/presentation/web/diagramClasses';
import { DiagramView } from '@/shared/presentation/web/DiagramView';
import { ReadoutGridView } from '@/shared/presentation/web/ReadoutGridView';
import { ControlRailView } from '@/shared/presentation/web/ControlRailView';
import type { GlucoseDerived, GlucoseHistoryPoint, GlucoseInputs, GlucoseState } from './engine/types';

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

const derived: GlucoseDerived = {
  bloodGlucoseMgDl: 110,
  mealBolusRemaining: 20,
  exogenousInsulinBolus: 0,
  insulinLevel: 0.6,
  glucagonLevel: 0.3,
  counterRegulatoryDrive: 0.1,
  hepaticGlycogenReserve: 0.8,
  glucoseUptakeRate: 0.2,
  hepaticGlucoseOutputRate: 0.1,
  hypoglycemiaSeverity: 0,
  insulinSecretionCapacity: 1,
  insulinResistance: 0,
  glucagonSecretionCapacity: 1,
};

const inputs: GlucoseInputs = {
  mealCarbLoadGrams: 60,
  exogenousInsulinUnits: 6,
  insulinSecretionCapacity: 1,
  insulinResistance: 0,
  glucagonSecretionCapacity: 1,
};

const state: GlucoseState = {
  simTimeSeconds: 0,
  bloodGlucoseMgDl: 110,
  mealBolusRemaining: 20,
  exogenousInsulinBolus: 0,
  insulinLevel: 0.6,
  glucagonLevel: 0.3,
  counterRegulatoryDrive: 0.1,
  hepaticGlycogenReserve: 0.8,
};

const history: GlucoseHistoryPoint[] = [
  { t: 0, bloodGlucose: 90, insulin: 0.5, glucagon: 0.4 },
  { t: 60, bloodGlucose: 110, insulin: 0.6, glucagon: 0.3 },
];

describe('glucoseRegulation presentation equivalence', () => {
  it('renders the schema diagram to the same DOM as the legacy diagram', () => {
    const classes = getDiagramClasses('glucoseRegulation');
    const presentation = buildGlucosePresentation({ state, derived, inputs, history, baselineHistory: null });
    const frame = presentation.diagram[0]!;

    const legacy = render(
      <ModuleShellProvider blinded={false}>
        <LegacyGlucoseDiagram derived={derived} />
      </ModuleShellProvider>,
    ).container.querySelector('svg');

    const schema = render(
      <ModuleShellProvider blinded={false}>
        <DiagramView frame={frame} classes={classes} />
      </ModuleShellProvider>,
    ).container.querySelector('svg');

    expect(canonicalize(schema?.outerHTML ?? '')).toBe(canonicalize(legacy?.outerHTML ?? ''));
  });

  it('renders the schema readouts to the same DOM as the legacy panel', () => {
    const presentation = buildGlucosePresentation({ state, derived, inputs, history, baselineHistory: null });
    const readoutCtx = { state, derived, inputs };

    const legacy = render(
      <ModuleShellProvider blinded={false}>
        <LegacyReadoutPanel derived={derived} />
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
    const presentation = buildGlucosePresentation({ state, derived, inputs, history, baselineHistory: null });
    const onChange = () => {};

    const legacy = render(
      <ModuleShellProvider blinded={false}>
        <LegacyControlPanel inputs={inputs} onChange={onChange} />
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
