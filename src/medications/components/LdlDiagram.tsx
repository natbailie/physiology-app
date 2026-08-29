import { useState } from 'react';
import { MechanismDiagram } from './MechanismDiagram';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlGroup } from '@/shared/components/ControlRail/ControlRail';
import text from '@/shared/styles/diagramText.module.css';
import { computeStatinEffect } from '../engine/ldlReduction';

const B = {
  AXIS_Y: 250,
  BAR_X: 96,
  BAR_MAX_W: 300,
  BAR_H: 60,
};

export function LdlDiagram() {
  const [statin, setStatin] = useState(0);
  const [cetp, setCetp] = useState(0);
  const [baseline, setBaseline] = useState(5);

  const r = computeStatinEffect({ statinDose: statin, cetpDose: cetp, baselineLDL: baseline });

  const width = Math.max((r.plasmaLDL / 6) * B.BAR_MAX_W, 6);
  const synthW = r.synthesisFraction * 0.9 * B.BAR_MAX_W;

  return (
    <MechanismDiagram
      heading="Where the statin acts on plasma LDL"
      readouts={
        <>
          <ReadoutItem label="Plasma LDL" value={r.plasmaLDL.toFixed(2)} unit="mmol/L" secondary={`start ${baseline.toFixed(1)}`} />
          <ReadoutItem label="Synthesis" value={Math.round(r.synthesisFraction * 100).toString()} unit="% on" colorVar="var(--warn)" />
          <ReadoutItem label="Reduction" value={Math.round((1 - r.plasmaLDL / baseline) * 100).toString()} unit="%" wide />
        </>
      }
      controls={
        <ControlGroup label="Antilipids">
          <Slider label="Statin dose" value={statin} min={0} max={200} unit="%" onChange={setStatin} />
          <Slider label="CETP inhibitor" value={cetp} min={0} max={200} unit="%" onChange={setCetp} />
          <Slider label="Starting LDL" value={baseline} min={1} max={6} step={0.1} unit=" mmol/L" onChange={setBaseline} />
        </ControlGroup>
      }
    >
      <DiagramFrame viewBox="0 0 560 340" ariaLabel="Plasma LDL bar that shortens as the statin blocks cholesterol synthesis, with the liver receptor shown pulling LDL out">
        <g>
          <text className={text.tickLabel} x={B.BAR_X + B.BAR_MAX_W / 2} y={64}>
            PLASMA LDL (mmol/L)
          </text>

          {/* Plasma LDL bar */}
          <rect
            x={B.BAR_X}
            y={B.AXIS_Y - B.BAR_H}
            width={width}
            height={B.BAR_H}
            rx="8"
            fill="var(--raas)"
            fillOpacity="0.8"
          />
          {/* Residual-synthesis marker inside - what the statin leaves */}
          <rect
            x={B.BAR_X}
            y={B.AXIS_Y - B.BAR_H}
            width={Math.min(synthW, width)}
            height={B.BAR_H}
            rx="8"
            fill="var(--warn)"
            fillOpacity="0.5"
          />
          <text className={text.valueLabel} x={B.BAR_X + width + 10} y={B.AXIS_Y - B.BAR_H / 2 + 3}>
            {r.plasmaLDL.toFixed(2)}
          </text>

          {/* Baseline reference line */}
          <line className={text.axis} x1={B.BAR_X} y1={B.AXIS_Y - B.BAR_H} x2={B.BAR_X + B.BAR_MAX_W} y2={B.AXIS_Y - B.BAR_H} />
          <line className={text.axis} x1={B.BAR_X} y1={B.AXIS_Y} x2={B.BAR_X + 60} y2={B.AXIS_Y} />
          <text className={text.tickLabel} x={B.BAR_X} y={B.AXIS_Y + 20}>
            0
          </text>
          <text className={text.tickLabel} x={B.BAR_X + B.BAR_MAX_W} y={B.AXIS_Y + 20}>
            {baseline.toFixed(1)}
          </text>
          <text className={text.tickLabel} x={B.BAR_X + B.BAR_MAX_W / 2} y={B.AXIS_Y + 20}>
            plasma LDL
          </text>

          {/* Liver LDL receptor - pulls LDL out of plasma; brightens as statin rises */}
          <text className={text.organLabel} x={420} y={B.AXIS_Y + 60}>
            Liver receptors
          </text>
          <g opacity={statin > 0 ? 0.55 + 0.45 * Math.min(1, statin / 100) : 0.35}>
            <path d="M 370 150 a 60 60 0 0 1 100 0" fill="none" stroke="var(--ok)" strokeWidth="4" strokeLinecap="round" />
            <path d="M 370 150 l 12 -6 M 470 150 l -12 -6" stroke="var(--ok)" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Arrows flowing into the receptor */}
            <line x1={B.BAR_X + B.BAR_MAX_W} y1={B.AXIS_Y - B.BAR_H / 2} x2={372} y2={150} stroke="var(--ok)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
            <path d="M 372 150 l -20 2 M 372 150 l -18 -8" fill="var(--ok)" />
          </g>

          {cetp > 0 && (
            <text className={text.caption} x={B.BAR_X} y={B.AXIS_Y - B.BAR_H - 10}>
              CETP inhibitor trims the remainder
            </text>
          )}
        </g>
      </DiagramFrame>
    </MechanismDiagram>
  );
}
