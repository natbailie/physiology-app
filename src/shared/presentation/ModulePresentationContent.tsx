import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ModulePresentation, PresentationContext, ShowContext } from './types';
import { DiagramView } from './web/DiagramView';
import { getDiagramClasses } from './web/diagramClasses';
import { ControlRailView } from './web/ControlRailView';
import { ReadoutGridView } from './web/ReadoutGridView';
import { TrendsView } from './web/TrendsView';

/**
 * The schema delivered as four slot nodes, matching the four slot props `ModulePage` asks for —
 * diagram, readouts, charts, controls. A page passes each straight into the matching slot.
 */
export interface PresentationSlots {
  diagram: ReactNode;
  readouts: ReactNode;
  charts: ReactNode;
  controls: ReactNode;
}

function showCtxOf<State, Derived, Inputs>(ctx: PresentationContext<State, Derived, Inputs, unknown>): ShowContext<State, Derived, Inputs> {
  return { state: ctx.state, derived: ctx.derived, inputs: ctx.inputs };
}

/**
 * Build the four slot elements for a module's presentation. `classes` is resolved once per
 * module id and shared by every frame in the slot, so the equivalence test sees one consistent
 * stylesheet instance across the whole diagram.
 */
export function usePresentationSlots<State, Derived, Inputs, History>(
  moduleId: string,
  presentation: ModulePresentation<State, Derived, Inputs, History>,
  ctx: PresentationContext<State, Derived, Inputs, History>,
  inputs: Inputs,
  onChange: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void,
): PresentationSlots {
  const classes = useMemo(() => getDiagramClasses(moduleId), [moduleId]);
  const showCtx = showCtxOf(ctx);

  const diagram = useMemo(
    () => presentation.diagram.map((frame, i) => <DiagramView key={frame.key ?? i} frame={frame} classes={classes} />),
    [presentation, classes],
  );

  const readouts = <ReadoutGridView readouts={presentation.readouts} ctx={showCtx} />;
  const charts = (
    <TrendsView charts={presentation.charts} history={ctx.history} baselineHistory={ctx.baselineHistory} ctx={{ derived: showCtx.derived }} />
  );
  const controls = <ControlRailView controls={presentation.controls} inputs={inputs} onChange={onChange} />;

  return { diagram, readouts, charts, controls };
}

/**
 * Render the whole presentation as one flat fragment (diagram, readouts, charts, controls in
 * page order) — the equivalent of the legacy page for the equivalence test and for modules that
 * do not use `ModulePage`'s slot split. */
export function ModulePresentationContent<State, Derived, Inputs, History>(props: {
  moduleId: string;
  presentation: ModulePresentation<State, Derived, Inputs, History>;
  ctx: PresentationContext<State, Derived, Inputs, History>;
  inputs: Inputs;
  onChange: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;
}) {
  const slots = usePresentationSlots(props.moduleId, props.presentation, props.ctx, props.inputs, props.onChange);
  return (
    <>
      {slots.diagram}
      {slots.readouts}
      {slots.charts}
      {slots.controls}
    </>
  );
}
