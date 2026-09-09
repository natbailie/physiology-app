import { clamp } from '@/shared/lib/math';
import type { VestibularDerived, VestibularHistoryPoint, VestibularInputs, VestibularInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const RESTING_RATE = 90;

type Ctx = PresentationContext<VestibularInternalState, VestibularDerived, VestibularInputs, VestibularHistoryPoint>;

export function buildVestibularPresentation(ctx: Ctx): ModulePresentation<VestibularInternalState, VestibularDerived, VestibularInputs, VestibularHistoryPoint> {
  const { derived } = ctx;

  const imbalance = clamp(derived.firingImbalanceSpikesPerSec / RESTING_RATE, -1, 1);
  const debris = clamp(derived.canalithDebris, 0, 1);
  const otolith = clamp(derived.otolithFunction, 0, 1);
  const slip = clamp(derived.slowPhaseVelocityDegPerSec / 40, -1, 1);
  const beamAngle = imbalance * 12;
  const rightDrive = clamp(derived.canalFiringRightSpikesPerSec / (RESTING_RATE * 2), 0, 1);
  const leftDrive = clamp(derived.canalFiringLeftSpikesPerSec / (RESTING_RATE * 2), 0, 1);

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel:
          'Both vestibular labyrinths with their three semicircular canals, ampullae and otolith organs, the resting firing rate of each horizontal canal, and the imbalance between the two sides that produces nystagmus',
        defs: [{ type: 'marker', id: 'vestArrow', colorToken: 'vestibular' }],
        children: [
          // ---- The push-pull beam ----
          { type: 'text', x: 280, y: 40, text: 'Push-pull between the two sides', cls: 'label', anchor: 'middle' },
          { type: 'line', x1: 280, y1: 58, x2: 280, y2: 94, cls: 'beamPivot' },
          {
            type: 'group',
            transform: `rotate(${beamAngle.toFixed(2)} 280 68)`,
            children: [
              { type: 'line', x1: 150, y1: 68, x2: 410, y2: 68, cls: 'beam' },
              { type: 'circle', cx: 150, cy: 68, r: 5, cls: 'beamEnd' },
              { type: 'circle', cx: 410, cy: 68, r: 5, cls: 'beamEnd' },
            ],
          },
          { type: 'text', x: 280, y: 106, text: `peripheral imbalance ${derived.firingImbalanceSpikesPerSec.toFixed(0)} spk/s`, cls: 'sideTick', anchor: 'middle' },
          { type: 'text', x: 280, y: 120, text: 'compensation does not level this — it stops the brain believing it', cls: 'sideTick', anchor: 'middle' },

          // ---- Right labyrinth ----
          {
            type: 'group',
            children: [
              // Horizontal canal
              { type: 'path', d: 'M86,186 C86,197.55 108.23,207 136,207 C163.77,207 186,197.55 186,186 C186,174.45 163.77,165 136,165 C108.23,165 86,174.45 86,186 Z', cls: 'canal' },
              // Anterior canal (rotated -52°)
              {
                type: 'group',
                transform: 'rotate(-52 136 186)',
                children: [
                  { type: 'path', d: 'M90,186 C90,196.99 110.79,206 136,206 C161.21,206 182,196.99 182,186 C182,175.01 161.21,166 136,166 C110.79,166 90,175.01 90,186 Z', cls: 'canal' },
                ],
              },
              // Posterior canal (rotated +52°, debris-sensitive)
              {
                type: 'group',
                transform: 'rotate(52 136 186)',
                children: [
                  { type: 'path', d: 'M90,186 C90,196.99 110.79,206 136,206 C161.21,206 182,196.99 182,186 C182,175.01 161.21,166 136,166 C110.79,166 90,175.01 90,186 Z', cls: 'canalPosterior', styleVars: { debris } },
                ],
              },
              // Canalith debris
              { type: 'circle', cx: 118, cy: 212, r: 2.6, cls: 'canalith', styleVars: debris > 0.05 ? { debris } : undefined },
              { type: 'circle', cx: 125, cy: 206, r: 2.6, cls: 'canalith', styleVars: debris > 0.05 ? { debris } : undefined },
              { type: 'circle', cx: 132, cy: 200, r: 2.6, cls: 'canalith', styleVars: debris > 0.05 ? { debris } : undefined },
              // Horizontal ampulla
              { type: 'circle', cx: 86, cy: 186, r: 11, cls: 'ampulla', styleVars: { drive: rightDrive } },
              { type: 'text', x: 86, y: 166, text: derived.canalFiringRightSpikesPerSec.toFixed(0), cls: 'rate', anchor: 'middle' },
              { type: 'text', x: 86, y: 150, text: 'spk/s', cls: 'sideTick', anchor: 'middle' },
              // Otoliths (utricle and saccule)
              { type: 'circle', cx: 136, cy: 182, r: 12, cls: 'otolith', styleVars: { otolith } },
              { type: 'circle', cx: 136, cy: 198, r: 9, cls: 'otolith', styleVars: { otolith } },
              { type: 'text', x: 136, y: 256, text: 'Right labyrinth', cls: 'anatomyStrong', anchor: 'middle' },
            ],
          },

          // ---- Left labyrinth ----
          {
            type: 'group',
            children: [
              // Horizontal canal
              { type: 'path', d: 'M374,186 C374,174.45 396.23,165 424,165 C451.77,165 474,174.45 474,186 C474,197.55 451.77,207 424,207 C396.23,207 374,197.55 374,186 Z', cls: 'canal' },
              // Anterior canal (rotated -52°)
              {
                type: 'group',
                transform: 'rotate(-52 424 186)',
                children: [
                  { type: 'path', d: 'M378,186 C378,175.01 398.79,166 424,166 C449.21,166 470,175.01 470,186 C470,196.99 449.21,206 424,206 C398.79,206 378,196.99 378,186 Z', cls: 'canal' },
                ],
              },
              // Posterior canal (rotated +52°, debris-sensitive)
              {
                type: 'group',
                transform: 'rotate(52 424 186)',
                children: [
                  { type: 'path', d: 'M378,186 C378,175.01 398.79,166 424,166 C449.21,166 470,175.01 470,186 C470,196.99 449.21,206 424,206 C398.79,206 378,196.99 378,186 Z', cls: 'canalPosterior', styleVars: { debris } },
                ],
              },
              // Canalith debris
              { type: 'circle', cx: 442, cy: 212, r: 2.6, cls: 'canalith', styleVars: debris > 0.05 ? { debris } : undefined },
              { type: 'circle', cx: 435, cy: 206, r: 2.6, cls: 'canalith', styleVars: debris > 0.05 ? { debris } : undefined },
              { type: 'circle', cx: 428, cy: 200, r: 2.6, cls: 'canalith', styleVars: debris > 0.05 ? { debris } : undefined },
              // Horizontal ampulla
              { type: 'circle', cx: 474, cy: 186, r: 11, cls: 'ampulla', styleVars: { drive: leftDrive } },
              { type: 'text', x: 474, y: 166, text: derived.canalFiringLeftSpikesPerSec.toFixed(0), cls: 'rate', anchor: 'middle' },
              { type: 'text', x: 474, y: 150, text: 'spk/s', cls: 'sideTick', anchor: 'middle' },
              // Otoliths
              { type: 'circle', cx: 424, cy: 182, r: 12, cls: 'otolith', styleVars: { otolith } },
              { type: 'circle', cx: 424, cy: 198, r: 9, cls: 'otolith', styleVars: { otolith } },
              { type: 'text', x: 424, y: 256, text: 'Left labyrinth', cls: 'anatomyStrong', anchor: 'middle' },
            ],
          },

          // ---- Vestibular nerves into the brainstem ----
          { type: 'path', d: 'M 186 200 C 226 216, 244 226, 250 238', cls: 'nerve', markerEnd: 'url(#vestArrow)' },
          { type: 'path', d: 'M 374 200 C 334 216, 316 226, 310 238', cls: 'nerve', markerEnd: 'url(#vestArrow)' },
          { type: 'rect', x: 246, y: 238, width: 68, height: 52, cls: 'brainstem' },
          { type: 'text', x: 280, y: 262, text: 'Brainstem', cls: 'anatomyStrong', anchor: 'middle' },
          // BELOW the brainstem box rather than inside it: the phrase is half as wide again as
          // the 68-unit box, so the box's own sides ran through it.
          { type: 'text', x: 280, y: 304, text: 'reads the difference', cls: 'sideTick', anchor: 'middle' },

          // ---- Nystagmus direction indicator ----
          { type: 'text', x: 20, y: 318, text: 'Nystagmus', cls: 'label' },
          { type: 'line', x1: 20, y1: 336, x2: 240, y2: 336, cls: 'slipTrack' },
          ...(Math.abs(slip) > 0.02
            ? [{ type: 'path' as const, d: `M 130 336 L ${(130 + slip * 100).toFixed(1)} 336`, cls: 'slipArrow', markerEnd: 'url(#vestArrow)' }]
            : []),
          { type: 'text', x: 20, y: 354, text: `slow phase ${derived.slowPhaseVelocityDegPerSec.toFixed(1)}°/s`, cls: 'sideTick' },

          // ---- Summary values ----
          { type: 'text', x: 300, y: 320, text: `VOR gain ${derived.vorGain.toFixed(2)}`, cls: 'caption' },
          { type: 'text', x: 300, y: 338, text: `head impulse ${derived.headImpulsePositive ? 'positive' : 'negative'}`, cls: 'caption' },
          { type: 'text', x: 300, y: 356, text: `vertigo ${derived.vertigoIntensityPct.toFixed(0)}% · Romberg ${derived.rombergUnsteadinessPct.toFixed(0)}%`, cls: 'caption' },
          { type: 'text', x: 300, y: 374, text: `compensation ${(derived.centralCompensation * 100).toFixed(0)}%`, cls: 'caption' },

          // ---- Classification and pattern summary ----
          { type: 'text', x: 20, y: 400, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 20, y: 422, text: derived.patternSummary, cls: 'label' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Head turn velocity', key: 'headTurnVelocityDegPerSec', min: -200, max: 200, step: 5, unit: ' °/s' },
      { kind: 'slider', label: 'Right canal function', key: 'rightCanalFunction', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Left canal function', key: 'leftCanalFunction', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Central compensation', key: 'centralCompensation', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Otolith function', key: 'otolithFunction', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Canalith debris (posterior)', key: 'canalithDebris', min: 0, max: 1, step: 1, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Irritative drive (left nerve)', key: 'irritativeDriveLeft', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
    ],
    readouts: [
      {
        label: 'Spontaneous nystagmus',
        value: (c) => c.derived.slowPhaseVelocityDegPerSec.toFixed(1),
        unit: '°/s',
        secondary: (c) =>
          Math.abs(c.derived.slowPhaseVelocityDegPerSec) < 2
            ? 'none'
            : `fast phases ${c.derived.slowPhaseVelocityDegPerSec > 0 ? 'rightward' : 'leftward'}`,
        colorToken: 'vestibular',
      },
      {
        label: 'Vertigo',
        value: (c) => c.derived.vertigoIntensityPct.toFixed(0),
        unit: '%',
        secondary: (c) =>
          c.derived.vertigoIntensityPct > 40 ? 'severe — uncompensated' : c.derived.vertigoIntensityPct > 10 ? 'present' : 'quiet',
        colorToken: 'danger',
      },
      {
        label: 'VOR gain',
        value: (c) => c.derived.vorGain.toFixed(2),
        unit: '×',
        secondary: (c) => (c.derived.vorGain < 0.6 ? 'mechanically deficient' : 'gaze stabilised'),
        colorToken: 'o2',
      },
      {
        label: 'Head impulse',
        value: (c) => (c.derived.headImpulsePositive ? 'positive' : 'negative'),
        secondary: (c) => (c.derived.headImpulsePositive ? 'corrective saccade visible' : 'no corrective saccade'),
        colorToken: 'danger',
      },
      {
        label: 'Positional nystagmus',
        value: (c) => c.derived.positionalNystagmusPct.toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.positionalNystagmusPct > 5 ? 'latency + fatigability = BPPV' : 'not provoked'),
        colorToken: 'danger',
      },
      {
        label: 'Cupula deflection',
        value: (c) => (c.derived.cupulaDeflection * 100).toFixed(0),
        unit: '%',
        secondary: () => 'signals acceleration, not velocity',
        colorToken: 'vestibular',
      },
      {
        label: 'Oscillopsia',
        value: (c) => c.derived.oscillopsiaPct.toFixed(0),
        unit: '%',
        secondary: () => 'with head motion',
        colorToken: 'warn',
      },
      {
        label: 'Romberg unsteadiness',
        value: (c) => c.derived.rombergUnsteadinessPct.toFixed(0),
        unit: '%',
        secondary: () => 'worse in the dark when high',
        colorToken: 'warn',
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
      {
        kind: 'sparkline',
        label: 'Slow-phase velocity',
        unit: '°/s',
        colorToken: 'vestibular',
        domainMin: -30,
        domainMax: 30,
        data: (points) => points.map((p) => p.spv),
      },
      {
        kind: 'sparkline',
        label: 'Vertigo',
        unit: '%',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.vertigo),
      },
      {
        kind: 'sparkline',
        label: 'Cupula deflection',
        unit: '%',
        colorToken: 'o2',
        domainMin: -100,
        domainMax: 100,
        data: (points) => points.map((p) => p.cupula),
      },
    ],
  };
}
