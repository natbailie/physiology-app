import { clamp } from '@/shared/lib/math';
import type { ThermoDerived, ThermoHistoryPoint, ThermoInputs, ThermoInternalState } from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

type Ctx = PresentationContext<ThermoInternalState, ThermoDerived, ThermoInputs, ThermoHistoryPoint>;

/** Full ellipse outline as a path — the shared schema has no ellipse node, and the body
 * silhouette it stands in for is an ellipse. */
function ellipseOutline(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx},${(cy - ry).toFixed(1)} a${rx},${ry} 0 1,0 0,${(2 * ry).toFixed(1)} a${rx},${ry} 0 1,0 0,${(-2 * ry).toFixed(1)}`;
}

/** Project the set-point band down the gauge as temperature rises from 35 to 41 C. */
function gaugeYFromTemp(tempC: number): number {
  return 74 + clamp((41 - tempC) / 6, 0, 1) * 120;
}

/** Vertical position of the live core dot on the same gauge. */
function gaugeDot(tempC: number) {
  const x = 330 + clamp((tempC - 35) / 6, 0, 1) * 190;
  const y = 79 + clamp((41 - tempC) / 6, 0, 1) * 120;
  return { x, y };
}

function storageLabel(w: number): string {
  return `${w >= 0 ? '+' : ''}${w.toFixed(0)} W`;
}

export function buildThermoregulationPresentation(ctx: Ctx): ModulePresentation<ThermoInternalState, ThermoDerived, ThermoInputs, ThermoHistoryPoint> {
  const { derived } = ctx;

  const coreHeat = clamp((derived.coreTempC - 35) / 8, 0.1, 1);
  const shiverPct = clamp(derived.shiveringW / 500, 0, 1);
  const sweatPct = clamp(derived.sweatW / 850, 0, 1);
  const bandTop = gaugeYFromTemp(Math.max(derived.setPointC, derived.coreTempC));
  const dot = gaugeDot(derived.coreTempC);

  const dryArrow = derived.dryLossW;
  const evapArrow = derived.sweatW + 22;
  const dryShown = Math.abs(dryArrow) > 1;
  const evapShown = evapArrow > 1;

  const showEmergency =
    derived.feverRising || derived.classification.startsWith('hyperthermia') || derived.classification.startsWith('heat stroke');
  const emergencyText = derived.feverRising
    ? 'Rigors — the body is heating itself to a defended point'
    : 'Heat emergency — cooling now, not antipyretics';

  const body: FrameNode = {
    type: 'frame',
    viewBox: [0, 0, 560, 440],
    ariaLabel:
      'Body heat flows and the hypothalamic set point: core and skin temperature, metabolic production and dry/evaporative loss arrows, the set point vs core gauge, and the shivering and sweating effector bars',
    defs: [{ type: 'marker', id: 'heat-arrow', colorToken: 'text-dim' }],
    children: [
      { type: 'path', d: ellipseOutline(140, 150, 72, 98), colorToken: 'text-dim', strokeWidth: 2.5, fill: 'none' },
      {
        type: 'circle',
        cx: 140,
        cy: 150,
        r: 36 + (coreHeat - 0.5) * 12,
        fill: 'danger',
      },
      { type: 'text', x: 92, y: 52, text: `Core ${derived.coreTempC.toFixed(2)} °C · skin ${derived.skinTempC.toFixed(1)} °C`, cls: 'label' },

      { type: 'path', d: 'M60,150 L100,150', colorToken: 'nociception', strokeWidth: 3, fill: 'none', markerEnd: 'heat-arrow' },
      { type: 'text', x: 20, y: 140, text: `+${derived.metabolicHeatW.toFixed(0)} W`, cls: 'caption' },

      ...(dryShown
        ? [
            {
              type: 'path' as const,
              d: dryArrow >= 0 ? 'M214,110 L264,110' : 'M264,110 L214,110',
              colorToken: 'o2',
              strokeWidth: 3,
              fill: 'none',
              markerEnd: 'heat-arrow',
            },
          ]
        : []),
      { type: 'text', x: 216, y: 100, text: `dry ${dryArrow >= 0 ? '' : '+'}${Math.abs(dryArrow).toFixed(0)} W`, cls: 'caption' },

      ...(evapShown
        ? [{ type: 'path' as const, d: 'M214,190 L264,190', colorToken: 'o2', strokeWidth: 3, fill: 'none', markerEnd: 'heat-arrow' }]
        : []),
      { type: 'text', x: 218, y: 180, text: `evaporative ${evapArrow.toFixed(0)} W`, cls: 'caption' },

      { type: 'text', x: 330, y: 64, text: `Set point ${derived.setPointC.toFixed(1)} °C`, cls: 'label' },
      { type: 'rect', x: 330, y: bandTop, width: 190, height: 10, fill: 'warn' },
      { type: 'rect', x: 330, y: 74, width: 190, height: 130, fill: 'none', cls: 'axis' },
      { type: 'circle', cx: dot.x, cy: dot.y, r: 6, fill: 'danger' },

      { type: 'text', x: 330, y: 232, text: `Shivering ${derived.shiveringW.toFixed(0)} W`, cls: 'label' },
      { type: 'rect', x: 320, y: 240, width: 200, height: 16, fill: 'none', cls: 'axis' },
      { type: 'rect', x: 330, y: 240, width: 200 * shiverPct, height: 16, fill: 'sympathetic' },

      { type: 'text', x: 330, y: 286, text: `Sweating ${derived.sweatW.toFixed(0)} W`, cls: 'label' },
      { type: 'rect', x: 320, y: 294, width: 200, height: 16, fill: 'none', cls: 'axis' },
      { type: 'rect', x: 330, y: 294, width: 200 * sweatPct, height: 16, fill: 'o2' },

      {
        type: 'text',
        x: 44,
        y: 318,
        text: `storage ${storageLabel(derived.netStorageW)} · error ${derived.defenceErrorC >= 0 ? '+' : ''}${derived.defenceErrorC.toFixed(2)} °C vs point`,
        cls: 'caption',
      },
      ...(showEmergency && emergencyText
        ? [{ type: 'text' as const, x: 44, y: 338, text: emergencyText, cls: 'alarm' }]
        : []),
      { type: 'text', x: 44, y: 368, text: derived.classification, cls: 'verdict' },
      { type: 'text', x: 44, y: 388, text: derived.patternSummary, cls: 'caption' },
    ],
  };

  return {
    diagram: [body],
    controls: [
      { kind: 'slider', label: 'Ambient temperature', key: 'ambientTemperatureC', min: -20, max: 48, step: 1, unit: ' °C' },
      { kind: 'slider', label: 'Humidity', key: 'humidityPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Wind / wet clothing', key: 'windWetnessPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Metabolic rate', key: 'metabolicRateMultiplier', min: 1, max: 12, step: 0.1, unit: '× basal' },
      { kind: 'slider', label: 'Pyrogens', key: 'pyrogenLevel', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Sweating impairment', key: 'sweatImpairmentPct', min: 0, max: 100, step: 1, unit: '%' },
    ],
    readouts: [
      {
        label: 'Core temp',
        value: (c) => c.derived.coreTempC.toFixed(2),
        unit: '°C',
        secondary: (c) => (c.derived.coreTempC >= 39.4 ? 'dangerously high' : c.derived.coreTempC <= 35 ? 'hypothermic' : 'viable range'),
        colorToken: 'danger',
      },
      {
        label: 'Set point',
        value: (c) => c.derived.setPointC.toFixed(1),
        unit: '°C',
        secondary: (c) => (c.derived.setPointC >= 37.8 ? 'Raised — fever is defended' : 'normal defence target'),
        colorToken: 'warn',
      },
      {
        label: 'Shivering',
        value: (c) => c.derived.shiveringW.toFixed(0),
        unit: 'W',
        secondary: (c) => (c.derived.shiveringW > 50 ? 'producing extra heat' : 'quiet'),
        colorToken: 'sympathetic',
      },
      {
        label: 'Sweating',
        value: (c) => c.derived.sweatW.toFixed(0),
        unit: 'W',
        secondary: (c) => (c.derived.sweatW > 100 ? 'evaporative cooling engaged' : c.derived.sweatW < 5 ? 'idle' : 'mild'),
        colorToken: 'o2',
      },
      {
        label: 'Skin flow',
        value: (c) => (c.derived.skinFlowFactor * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.skinFlowFactor > 1.2 ? 'dilated — dumping heat' : c.derived.skinFlowFactor < 0.7 ? 'constricted — conserving heat' : 'baseline'),
        colorToken: 'artery',
      },
      {
        label: 'Net storage',
        value: (c) => `${c.derived.netStorageW >= 0 ? '+' : ''}${c.derived.netStorageW.toFixed(0)}`,
        unit: 'W',
        secondary: (c) =>
          Math.abs(c.derived.netStorageW) < 10 ? 'in balance' : c.derived.netStorageW > 0 ? 'Core is rising' : 'core is falling',
        colorToken: 'co2',
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        wide: true,
        revealsPattern: true,
      },
    ],
    charts: [
      { kind: 'sparkline', label: 'Core temperature', unit: '°C', colorToken: 'danger', domainMin: 28, domainMax: 42, data: (points) => points.map((p) => p.core) },
      { kind: 'sparkline', label: 'Set point', unit: '°C', colorToken: 'warn', domainMin: 36, domainMax: 41, data: (points) => points.map((p) => p.setPoint) },
      { kind: 'sparkline', label: 'Skin temperature', unit: '°C', colorToken: 'o2', domainMin: 10, domainMax: 40, data: (points) => points.map((p) => p.skin) },
    ],
  };
}
