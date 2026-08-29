import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { AdrenalMedullaDiagram } from './components/AdrenalMedullaDiagram';
import { AdrenalMedullaReadoutPanel } from './components/AdrenalMedullaReadoutPanel';
import { ControlPanel as AdrenalMedullaControlPanel } from './components/AdrenalMedullaControlPanel';
import { MEDULLA_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { adrenalMedullaContent } from './content';
import { medullaLoopConfig } from './engine/loopConfig';
import { perturbParoxysm } from './engine/engine';
import {
  MEDULLA_PRESETS,
  MEDULLA_PRESET_LABELS,
  MEDULLA_PRESET_ORDER,
  DEFAULT_MEDULLA_INPUTS,
} from './engine/presets';
import type { MedullaInputs } from './engine/types';

export function AdrenalMedullaPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<MedullaInputs>('adrenalMedulla', DEFAULT_MEDULLA_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, medullaLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_MEDULLA_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'adrenalMedulla',
    questions: MEDULLA_QUESTIONS,
    presets: MEDULLA_PRESETS,
    inputs,
    defaultInputs: DEFAULT_MEDULLA_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_MEDULLA_INPUTS,
    presets: MEDULLA_PRESETS,
    resetEngine: reset,
  });

  const mapHistory = useSeries(history, (h) => h.map);
  const mapBaseline = useSeries(baseline.history, (h) => h.map);
  const hrHistory = useSeries(history, (h) => h.hr);
  const hrBaseline = useSeries(baseline.history, (h) => h.hr);
  const volumeHistory = useSeries(history, (h) => h.volume);
  const volumeBaseline = useSeries(baseline.history, (h) => h.volume);

  return (
    <ModulePage
      moduleId="adrenalMedulla"
      title="Adrenal Medulla & Phaeochromocytoma"
      subtitle="alpha raises it, beta moves everything else — and the order of blockade is the exam"
      accentVar="var(--adrenal-medulla)"
      presets={
        <PresetBar
          order={MEDULLA_PRESET_ORDER}
          labels={MEDULLA_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Paroxysm', onClick: () => perturb(perturbParoxysm), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<AdrenalMedullaDiagram derived={snapshot.derived} inputs={inputs} />}
      readouts={<AdrenalMedullaReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={MEDULLA_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="MAP"
            unit="mmHg"
            data={mapHistory}
            baselineData={mapBaseline}
            domainMin={60}
            domainMax={230}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Heart rate"
            unit="bpm"
            data={hrHistory}
            baselineData={hrBaseline}
            domainMin={40}
            domainMax={160}
            colorVar="var(--epinephrine)"
          />
          <Sparkline
            label="Plasma volume"
            unit="%"
            data={volumeHistory}
            baselineData={volumeBaseline}
            domainMin={80}
            domainMax={102}
            colorVar="var(--venous)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<AdrenalMedullaControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={adrenalMedullaContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of catecholamine physiology and phaeochromocytoma — not a clinical or diagnostic tool. The synthesis pathway is described in prose rather than simulated; receptor populations are single scalars per class; and paroxysms are exponential bursts rather than neural secretion patterns. Volume contraction runs on compressed weeks. For the cortex this medulla sits on top of, see Adrenal Cortex and HPA Axis."
    />
  );
}
