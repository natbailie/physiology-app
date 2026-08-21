import { useCallback, useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { MuscleDiagram } from './components/MuscleDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { OxygenDissociationCurve } from '@/shared/components/OxygenDissociationCurve/OxygenDissociationCurve';
import { MUSCLE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { muscleContractionContent } from './content';
import { muscleLoopConfig } from './engine/loopConfig';
import { perturbCaffeine, perturbStimulate } from './engine/engine';
import { lengthTensionFactor, passiveTension } from './engine/lengthTension';
import { shorteningVelocity } from './engine/forceVelocity';
import {
  DEFAULT_MUSCLE_INPUTS,
  MUSCLE_PRESETS,
  MUSCLE_PRESET_LABELS,
  MUSCLE_PRESET_ORDER,
  type MusclePresetName,
} from './engine/presets';
import { FORCE_VELOCITY, LENGTH_TENSION, TENSION } from './engine/constants';
import type { MuscleInputs } from './engine/types';

export function MuscleContractionPage() {
  const [inputs, setInputs] = useState<MuscleInputs>(DEFAULT_MUSCLE_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, muscleLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'muscleContraction',
    questions: MUSCLE_QUESTIONS,
    presets: MUSCLE_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });
  const { derived, state } = snapshot;

  function handleChange<K extends keyof MuscleInputs>(key: K, value: MuscleInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: MusclePresetName) {
    setInputs((prev) => ({ ...prev, ...MUSCLE_PRESETS[name] }));
  }

  // Total tension the muscle could develop at each length if fully activated — the classic
  // curve. The live dot sits below it whenever activation is submaximal.
  const lengthTensionCurve = useCallback(
    (lengthUm: number) => lengthTensionFactor(lengthUm) * TENSION.MAX_PERCENT + passiveTension(lengthUm),
    [],
  );
  // The force-velocity hyperbola is redrawn for the muscle's CURRENT maximal isometric tension,
  // so raising activation visibly shifts the whole curve outward rather than moving along it.
  const maxIsometric = derived.maxIsometricTension;
  const forceVelocityCurve = useCallback((load: number) => shorteningVelocity(maxIsometric, load), [maxIsometric]);

  return (
    <ModulePage
      title="Muscle & Excitation-Contraction Coupling"
      subtitle="calcium, cross-bridges, length-tension & force-velocity"
      accentVar="var(--sarcomere)"
      presets={
        <PresetBar
          order={MUSCLE_PRESET_ORDER}
          labels={MUSCLE_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Stimulate', onClick: () => perturb((s) => perturbStimulate(s)), variant: 'impulse' },
            { label: 'Caffeine', onClick: () => perturb((s) => perturbCaffeine(s)), variant: 'danger' },
          ]}
          onReset={reset}
        />
      }
      diagram={<MuscleDiagram derived={derived} excitationPulse={state.excitationPulse} />}
      readouts={<ReadoutPanel derived={derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Cytosolic Ca2+"
            unit="uM"
            data={history.map((h) => h.calcium)}
            domainMin={0}
            domainMax={3}
            colorVar="var(--calcium)"
          />
          <Sparkline
            label="Tension"
            unit="%"
            data={history.map((h) => h.tension)}
            domainMin={0}
            domainMax={120}
            colorVar="var(--sarcomere)"
          />
          <OxygenDissociationCurve
            curveFn={lengthTensionCurve}
            currentX={derived.sarcomereLengthUm}
            currentY={derived.totalTension}
            xDomain={[LENGTH_TENSION.MIN_LENGTH_UM, LENGTH_TENSION.MAX_LENGTH_UM]}
            yDomain={[0, 140]}
            colorVar="var(--sarcomere)"
            xLabel="sarcomere length"
            yLabel="tension"
          />
          <OxygenDissociationCurve
            curveFn={forceVelocityCurve}
            currentX={derived.activeTension}
            currentY={derived.shorteningVelocityUmPerS}
            xDomain={[0, TENSION.MAX_PERCENT]}
            yDomain={[0, FORCE_VELOCITY.VMAX_UM_PER_S]}
            colorVar="var(--vm)"
            xLabel="load"
            yLabel="velocity"
          />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={muscleContractionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of excitation-contraction coupling — not a clinical or biomechanical tool. Tension is expressed as a percentage of maximal tetanic tension. Like the action potential module, this one runs far SLOWER than real time (about 1/20): a twitch is over in a tenth of a second, so the calcium transient and the tension it produces would otherwise be impossible to see as separate events. Press "Stimulate" for a single twitch, or raise the stimulation frequency for summation and tetanus.'
      }
    />
  );
}
