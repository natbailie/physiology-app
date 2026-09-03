import { useMemo } from 'react';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { OxygenDissociationCurve } from '@/shared/components/OxygenDissociationCurve/OxygenDissociationCurve';
import type { ChartSpec, ChartContext, OdCurveSpec, SparklineSpec } from '../types';

interface TrendsViewProps<History, Derived> {
  charts: readonly ChartSpec<History, Derived>[];
  history: readonly History[];
  baselineHistory: readonly History[] | null;
  ctx: ChartContext<Derived>;
}

function colorVar(token?: string): string | undefined {
  return token ? `var(--${token})` : undefined;
}

/** One sparkline from a spec: the memoisation the old pages put in line sits here instead. */
function SparklineView<History>({ spec, points, baselinePoints }: { spec: SparklineSpec<History>; points: readonly History[]; baselinePoints: readonly History[] | null }) {
  const data = useMemo(() => spec.data(points), [spec, points]);
  const baselineData = useMemo(() => (baselinePoints ? spec.data(baselinePoints) : null), [spec, baselinePoints]);
  const secondaryData = useMemo(() => (spec.secondaryData ? spec.secondaryData(points) : undefined), [spec, points]);
  const secondaryBaselineData = useMemo(
    () => (spec.secondaryData && baselinePoints ? spec.secondaryData(baselinePoints) : null),
    [spec, baselinePoints],
  );
  return (
    <Sparkline
      label={spec.label}
      unit={spec.unit}
      data={data}
      domainMin={spec.domainMin}
      domainMax={spec.domainMax}
      colorVar={colorVar(spec.colorToken) ?? ''}
      secondaryData={secondaryData}
      secondaryLabel={spec.secondaryLabel}
      secondaryColorVar={spec.secondaryColorToken ? colorVar(spec.secondaryColorToken) : undefined}
      baselineData={baselineData}
      secondaryBaselineData={secondaryBaselineData}
    />
  );
}

/** One reference-curve chart from a spec: sampled by the shared component, dot from the session. */
function OdCurveView<Derived>({ spec, ctx }: { spec: OdCurveSpec<Derived>; ctx: ChartContext<Derived> }) {
  return (
    <OxygenDissociationCurve
      curveFn={spec.curveFn}
      currentX={spec.currentX(ctx)}
      currentY={spec.currentY(ctx)}
      xDomain={spec.xDomain}
      yDomain={spec.yDomain}
      colorVar={colorVar(spec.colorToken) ?? ''}
      xLabel={spec.xLabel}
      yLabel={spec.yLabel}
    />
  );
}

/** The charts slot rendered from the module's chart specs, in the page's requested order. */
export function TrendsView<History, Derived>({ charts, history, baselineHistory, ctx }: TrendsViewProps<History, Derived>) {
  return (
    <>
      {charts.map((chart) => {
        if (chart.kind === 'sparkline') {
          return <SparklineView key={chart.label} spec={chart} points={history} baselinePoints={baselineHistory} />;
        }
        return <OdCurveView key={`${chart.xLabel}-${chart.yLabel}`} spec={chart} ctx={ctx} />;
      })}
    </>
  );
}