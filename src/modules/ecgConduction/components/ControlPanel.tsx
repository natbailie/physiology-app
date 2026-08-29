import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { EcgInputs, InjuryTerritory, LeadName, Rhythm } from '../engine/types';

interface ControlPanelProps {
  inputs: EcgInputs;
  onChange: <K extends keyof EcgInputs>(key: K, value: EcgInputs[K]) => void;
}

const LEAD_OPTIONS: { value: LeadName; label: string }[] = [
  { value: 'I', label: 'I' },
  { value: 'II', label: 'II' },
  { value: 'III', label: 'III' },
  { value: 'aVR', label: 'aVR' },
  { value: 'aVL', label: 'aVL' },
  { value: 'aVF', label: 'aVF' },
  { value: 'V1', label: 'V1' },
  { value: 'V2', label: 'V2' },
  { value: 'V3', label: 'V3' },
  { value: 'V4', label: 'V4' },
  { value: 'V5', label: 'V5' },
  { value: 'V6', label: 'V6' },
];

/** Which wall the injury current is centred on — the input that turns "there is an infarct"
 * into "the infarct is here". */
const TERRITORY_OPTIONS: { value: InjuryTerritory; label: string }[] = [
  { value: 'anterior', label: 'Anterior' },
  { value: 'inferior', label: 'Inferior' },
  { value: 'lateral', label: 'Lateral' },
  { value: 'posterior', label: 'Posterior' },
];

const RHYTHM_OPTIONS: { value: Rhythm; label: string }[] = [
  { value: 'sinus', label: 'Sinus' },
  { value: 'atrialFibrillation', label: 'Atrial fib' },
  { value: 'atrialFlutter', label: 'Flutter 2:1' },
  { value: 'wpw', label: 'WPW' },
  { value: 'sickSinus', label: 'Sick sinus' },
  { value: 'ventricularTachycardia', label: 'VT' },
  { value: 'torsades', label: 'Torsades' },
  { value: 'ventricularFibrillation', label: 'VF' },
];

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ToggleGroup
        label="Recording lead"
        value={inputs.lead}
        options={LEAD_OPTIONS}
        colorVar="var(--ecg-trace)"
        onChange={(value) => onChange('lead', value)}
      />
      <ToggleGroup
        label="Rhythm"
        value={inputs.rhythm}
        options={RHYTHM_OPTIONS}
        colorVar="var(--ecg-trace)"
        onChange={(value) => onChange('rhythm', value)}
      />
      <Slider
        label="Sinus rate"
        value={inputs.heartRate}
        min={30}
        max={180}
        step={1}
        unit=" bpm"
        onChange={(v) => onChange('heartRate', v)}
      />
      <Slider
        label="AV conduction delay"
        value={inputs.avDelayMs}
        min={80}
        max={400}
        step={5}
        unit=" ms"
        onChange={(v) => onChange('avDelayMs', v)}
      />
      <Slider
        label="AV block severity"
        value={inputs.avBlockSeverity}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('avBlockSeverity', v)}
      />
      <Slider
        label="Right bundle conduction"
        value={inputs.rightBundleConduction}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('rightBundleConduction', v)}
      />
      <Slider
        label="Left bundle conduction"
        value={inputs.leftBundleConduction}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('leftBundleConduction', v)}
      />
      <Slider
        label="Ventricular APD"
        value={inputs.ventricularAPD}
        min={200}
        max={500}
        step={5}
        unit=" ms"
        onChange={(v) => onChange('ventricularAPD', v)}
      />
      <Slider
        label="Serum potassium"
        value={inputs.serumPotassium}
        min={2.5}
        max={8}
        step={0.1}
        unit=" mEq/L"
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => onChange('serumPotassium', v)}
      />
      <Slider
        label="Ischemic injury"
        value={inputs.ischemicInjury}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('ischemicInjury', v)}
      />
      <ToggleGroup
        label="Injury territory"
        value={inputs.injuryTerritory}
        options={TERRITORY_OPTIONS}
        colorVar="var(--depolarized)"
        onChange={(value) => onChange('injuryTerritory', value)}
      />
    
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
