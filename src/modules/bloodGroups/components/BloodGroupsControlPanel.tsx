import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { BloodInputs } from '../engine/types';
import { aboName } from '../engine/bloodMechanics';

interface ControlPanelProps {
  inputs: BloodInputs;
  onChange: <K extends keyof BloodInputs>(key: K, value: BloodInputs[K]) => void;
}

const aboFormat = (v: number) => aboName(v);
const rhFormat = (v: number) => (v >= 0.5 ? 'positive' : 'negative');
const yesNo = (v: number) => (v >= 0.5 ? 'yes' : 'no');

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Recipient ABO type"
        value={inputs.recipientAboIndex}
        min={0}
        max={3}
        step={1}
        formatValue={aboFormat}
        onChange={(v) => onChange('recipientAboIndex', v)}
      />
      <Slider
        label="Recipient Rh"
        value={inputs.recipientRhPositive}
        min={0}
        max={1}
        step={1}
        formatValue={rhFormat}
        onChange={(v) => onChange('recipientRhPositive', v)}
      />
      <Slider
        label="Donor ABO type"
        value={inputs.donorAboIndex}
        min={0}
        max={3}
        step={1}
        formatValue={aboFormat}
        onChange={(v) => onChange('donorAboIndex', v)}
      />
      <Slider
        label="Donor Rh"
        value={inputs.donorRhPositive}
        min={0}
        max={1}
        step={1}
        formatValue={rhFormat}
        onChange={(v) => onChange('donorRhPositive', v)}
      />
      <Slider
        label="Previously Rh-sensitised"
        value={inputs.rhSensitised}
        min={0}
        max={1}
        step={1}
        formatValue={yesNo}
        onChange={(v) => onChange('rhSensitised', v)}
      />
      <Slider
        label="Volume transfused"
        value={inputs.transfusionVolumeMl}
        min={0}
        max={500}
        step={10}
        unit=" mL"
        onChange={(v) => onChange('transfusionVolumeMl', v)}
      />
    </ControlRail>
  );
}
