import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { Slider } from '@/shared/components/Slider/Slider';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { ControlSpec } from '../types';

interface ControlRailViewProps<Inputs> {
  controls: ReadonlyArray<ControlSpec<Inputs>>;
  inputs: Inputs;
  onChange: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;
}

function colorVar(token?: string): string | undefined {
  return token ? `var(--${token})` : undefined;
}

/** Rendering the control stack from specs: same rail holder, same sliders and toggle groups,
 * in spec order. A slider reads and writes a numeric input; a toggle group a string-valued one. */
export function ControlRailView<Inputs>({ controls, inputs, onChange }: ControlRailViewProps<Inputs>) {
  const percent = (v: number) => Math.round(v * 100).toString();
  return (
    <ControlRail>
      {controls.map((spec) =>
        spec.kind === 'toggle' ? (
          <ToggleGroup
            key={spec.key}
            label={spec.label}
            value={inputs[spec.key] as string}
            options={[...spec.options]}
            colorVar={colorVar(spec.colorToken)}
            onChange={(value) => onChange(spec.key as keyof Inputs, value as Inputs[keyof Inputs])}
          />
        ) : (
          <Slider
            key={spec.key}
            label={spec.label}
            value={inputs[spec.key] as number}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            unit={spec.unit}
            formatValue={spec.format === 'percent' ? percent : undefined}
            onChange={(value) => onChange(spec.key as keyof Inputs, value as Inputs[keyof Inputs])}
          />
        ),
      )}
    </ControlRail>
  );
}