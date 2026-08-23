import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { CapillaryDiagram } from './components/CapillaryDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { CAPILLARY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { capillaryExchangeContent } from './content';
import { capillaryLoopConfig } from './engine/loopConfig';
import { perturbAlbuminInfusion, perturbStandUp } from './engine/engine';
import {
  CAPILLARY_PRESETS,
  CAPILLARY_PRESET_LABELS,
  CAPILLARY_PRESET_ORDER,
  DEFAULT_CAPILLARY_INPUTS,
  bedDefaults,
  type CapillaryPresetName,
} from './engine/presets';
import type { CapillaryInputs, TissueBed } from './engine/types';

export function CapillaryExchangePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CapillaryInputs>('capillaryExchange', DEFAULT_CAPILLARY_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, capillaryLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'capillaryExchange',
    questions: CAPILLARY_QUESTIONS,
    presets: CAPILLARY_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });
  const { derived } = snapshot;

  function handleChange<K extends keyof CapillaryInputs>(key: K, value: CapillaryInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelectBed(bed: TissueBed) {
    setInputs((prev) => ({ ...prev, ...bedDefaults(bed) }));
  }

  function handleApplyPreset(name: CapillaryPresetName) {
    setInputs((prev) => ({ ...prev, ...CAPILLARY_PRESETS[name] }));
  }

  return (
    <ModulePage
      title="Capillary Exchange & Oedema"
      subtitle="Starling forces, the interstitium & lymphatic reserve"
      accentVar="var(--capillary)"
      presets={
        <PresetBar
          order={CAPILLARY_PRESET_ORDER}
          labels={CAPILLARY_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Albumin infusion', onClick: () => perturb((s) => perturbAlbuminInfusion(s)), variant: 'impulse' },
            { label: 'Stand up', onClick: () => perturb((s) => perturbStandUp(s)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={reset}
        />
      }
      diagram={<CapillaryDiagram derived={derived} />}
      readouts={<ReadoutPanel derived={derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Interstitial volume"
            unit="% of normal"
            data={history.map((h) => h.interstitialVolume)}
            domainMin={80}
            domainMax={260}
            colorVar="var(--interstitium)"
          />
          {/* Filtration and lymph flow on the same axis: while they track each other nothing
              accumulates, and the gap between them IS the rate of swelling. */}
          <Sparkline
            label="Filtration"
            secondaryLabel="lymph flow"
            unit="mL/min"
            data={history.map((h) => h.filtrationRate)}
            secondaryData={history.map((h) => h.lymphFlow)}
            secondaryColorVar="var(--lymph)"
            domainMin={0}
            domainMax={Math.max(6, derived.lymphaticCapacityMlPerMin * 1.2)}
            colorVar="var(--capillary)"
          />
          <Sparkline
            label="Capillary pressure"
            unit="mmHg"
            data={history.map((h) => h.capillaryPressure)}
            domainMin={0}
            domainMax={60}
            colorVar="var(--artery)"
          />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} onSelectBed={handleSelectBed} />}
      explainer={<ExplainerPanel content={capillaryExchangeContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of capillary fluid exchange — not a clinical tool. This is Starling\'s law of the CAPILLARY, not the Frank-Starling relationship between preload and stroke volume in the cardiorenal and PV loop modules; same physiologist, different law. One second of real time is about half a simulated hour, so oedema that takes a day or two to build appears over roughly a minute.'
      }
    />
  );
}
