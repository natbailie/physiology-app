import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { RenalTubularInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: RenalTubularInputs;
  onChange: <K extends keyof RenalTubularInputs>(key: K, value: RenalTubularInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider label="GFR" value={inputs.gfrMLPerMin} min={20} max={180} step={5} unit=" mL/min" onChange={(v) => onChange('gfrMLPerMin', v)} />
      <Slider
        label="Water intake"
        value={inputs.waterIntakeRate}
        min={0}
        max={300}
        step={10}
        unit="%"
        onChange={(v) => onChange('waterIntakeRate', v)}
      />
      <Slider
        label="ADH secretion capacity"
        value={inputs.adhSecretionCapacity}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('adhSecretionCapacity', v)}
      />
      <Slider
        label="Collecting duct ADH sensitivity"
        value={inputs.collectingDuctADHSensitivity}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('collectingDuctADHSensitivity', v)}
      />
      <Slider
        label="Exogenous ADH (DDAVP)"
        value={inputs.exogenousADH}
        min={0}
        max={150}
        step={5}
        unit="%"
        onChange={(v) => onChange('exogenousADH', v)}
      />
      <Slider
        label="Loop diuretic"
        value={inputs.loopDiureticDose}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('loopDiureticDose', v)}
      />
      <Slider label="Thiazide" value={inputs.thiazideDose} min={0} max={100} step={5} unit="%" onChange={(v) => onChange('thiazideDose', v)} />
      <Slider
        label="Macula densa feedback"
        value={inputs.maculaDensaFeedbackStrength}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('maculaDensaFeedbackStrength', v)}
      />
    
    </ControlRail>
  );
}
