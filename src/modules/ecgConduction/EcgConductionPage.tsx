import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { EcgDiagram } from './components/EcgDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { EcgStrip } from '@/shared/components/EcgStrip/EcgStrip';
import { TwelveLeadGrid } from './components/TwelveLeadGrid';
import { ECG_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { ecgConductionContent } from './content';
import { ecgLoopConfig } from './engine/loopConfig';
import { DEFAULT_ECG_INPUTS, ECG_PRESETS, type EcgPresetName, ECG_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { EcgInputs } from './engine/types';

export function EcgConductionPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<EcgInputs>('ecgConduction', DEFAULT_ECG_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, ecgLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'ecgConduction',
    questions: ECG_QUESTIONS,
    presets: ECG_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });

  function handleChange<K extends keyof EcgInputs>(key: K, value: EcgInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: EcgPresetName) {
    setInputs((prev) => ({ ...prev, ...ECG_PRESETS[name] }));
  }

  const trace = history.map((point) => point.voltageMv);

  return (
    <ModulePage
      title="ECG & Cardiac Conduction"
      subtitle="how depolarisation and repolarisation write each wave"
      accentVar="var(--ecg-trace)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={ECG_PRESET_LABELS}
          onApply={handleApplyPreset}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={
        <>
          <EcgDiagram derived={snapshot.derived} />
          <EcgStrip
            label={`Lead ${snapshot.derived.lead}`}
            data={trace}
            mvRange={1}
            colorVar="var(--ecg-trace)"
            currentSegment={snapshot.derived.currentSegment}
          />
          <TwelveLeadGrid
            inputs={inputs}
            rrIntervalMs={snapshot.state.lastRrIntervalMs}
            selectedLead={inputs.lead}
            onSelectLead={(lead) => handleChange('lead', lead)}
          />
        </>
      }
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={ECG_PRESET_LABELS} />}
      transport={<SimControls transport={transport} />}
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={ecgConductionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of cardiac activation — not a clinical or diagnostic tool. The trace is computed from the activation sequence rather than drawn, so every lead is the same dipole seen from a different angle: the limb leads sample the frontal plane, the chest leads the horizontal one, and R-wave progression, the RSR\' of right bundle branch block and the localisation of an injury current all fall out of that geometry rather than being drawn in. The ventricle is modelled as four lumped regions, so morphology is directionally right but coarse — and only the injury CURRENT of an infarct is modelled, not the loss of muscle, so a posterior infarct shows its ST depression in V1-V2 without the tall R that accompanies it in life. The twelve-lead grid draws one representative conducted beat, so read the rhythm off the strip rather than the grid. Time runs slower than real life so the wavefront is watchable as its wave is inscribed. For the mechanical consequences of the same cycle — preload, afterload and the pressure-volume loop — see the Cardiac Cycle module.'
      }
    />
  );
}
