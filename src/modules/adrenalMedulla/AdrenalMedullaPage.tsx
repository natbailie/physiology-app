import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
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
  type MedullaPresetName,
} from './engine/presets';
import type { MedullaInputs } from './engine/types';

export function AdrenalMedullaPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<MedullaInputs>('adrenalMedulla', DEFAULT_MEDULLA_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, medullaLoopConfig);

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

  function handleChange<K extends keyof MedullaInputs>(key: K, value: MedullaInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: MedullaPresetName) {
    setInputs((prev) => ({ ...prev, ...MEDULLA_PRESETS[name] }));
  }

  const mapHistory = history.map((h) => h.map);
  const mapBaseline = baseline.history?.map((h) => h.map) ?? null;
  const hrHistory = history.map((h) => h.hr);
  const hrBaseline = baseline.history?.map((h) => h.hr) ?? null;
  const volumeHistory = history.map((h) => h.volume);
  const volumeBaseline = baseline.history?.map((h) => h.volume) ?? null;

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
          onApply={handleApplyPreset}
          actions={[
            { label: 'Paroxysm', onClick: () => perturb(perturbParoxysm), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={reset}
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
