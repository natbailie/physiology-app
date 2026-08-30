import { useState } from 'react';
import { MechanismDiagram } from './MechanismDiagram';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlGroup } from '@/shared/components/ControlRail/ControlRail';
import text from '@/shared/styles/diagramText.module.css';
import { computeCoxInhibition } from '../engine/coxInhibition';

const C = {
  AXIS_Y: 250,
  BAR_W: 96,
  BAR_MAX_H: 170,
  BAR_RX: 10,
  LEFT_X: 140,
  RIGHT_X: 340,
};

function axisBar(x: number) {
  return { x, y: C.AXIS_Y - C.BAR_MAX_H, w: C.BAR_W, h: C.BAR_MAX_H };
}

export function CoxDiagram() {
  const [ns, setNs] = useState(0);
  const [c2, setC2] = useState(0);
  const [drive, setDrive] = useState(80);

  const r = computeCoxInhibition({ nonselectiveDose: ns, cox2Dose: c2, inflammatoryDrive: drive });

  const benefitH = (r.antiInflammatory / 100) * C.BAR_MAX_H;
  const protectH = (r.gastricProtection / 100) * C.BAR_MAX_H;
  const benefit = axisBar(C.LEFT_X);
  const protect = axisBar(C.RIGHT_X);

  return (
    <MechanismDiagram
      heading="The COX-1 / COX-2 trade-off"
      readouts={
        <>
          <ReadoutItem label="Fever & pain" value={r.antiInflammatory.toFixed(0)} unit="% controlled" colorVar="var(--raas)" />
          <ReadoutItem label="Gastric protection" value={r.gastricProtection.toFixed(0)} unit="%" colorVar="var(--ok)" />
          <ReadoutItem
            label="Ulcer risk"
            value={r.gastricProtection < 50 ? 'High' : r.gastricProtection < 75 ? 'Moderate' : 'Low'}
            colorVar={r.gastricProtection < 50 ? 'var(--danger)' : 'var(--ok)'}
            wide
          />
        </>
      }
      controls={
        <ControlGroup label="NSAIDs">
          <Slider label="Nonselective NSAID" value={ns} min={0} max={200} unit="%" onChange={setNs} />
          <Slider label="COX-2 selective" value={c2} min={0} max={200} unit="%" onChange={setC2} />
          <Slider label="Inflammatory drive" value={drive} min={0} max={100} unit="%" onChange={setDrive} />
        </ControlGroup>
      }
    >
      <DiagramFrame viewBox="0 0 560 340" ariaLabel="Two bars showing inflammation controlled against gastric protection, moving in opposite directions">
        <g>
          <text className={text.tickLabel} x={C.LEFT_X + C.BAR_W / 2} y={C.AXIS_Y + 22}>
            Fever & pain
          </text>
          <text className={text.tickLabel} x={C.RIGHT_X + C.BAR_W / 2} y={C.AXIS_Y + 22}>
            Stomach protection
          </text>

          {[benefit, protect].map((bar, i) => {
            const h = i === 0 ? benefitH : protectH;
            const colour = i === 0 ? 'var(--raas)' : 'var(--ok)';
            return (
              <rect
                key={i}
                x={bar.x}
                y={bar.y + (C.BAR_MAX_H - h)}
                width={bar.w}
                height={h}
                rx={C.BAR_RX}
                fill={colour}
                fillOpacity="0.8"
              />
            );
          })}

          {/* Capsule legend for the split mechanism */}
          <g>
            <rect x={60} y={62} width={30} height={12} rx={3} fill="var(--raas)" fillOpacity="0.8" />
            <text className={text.caption} x={100} y={73}>
              COX-2: inflammation, fever, pain
            </text>
            <rect x={60} y={82} width={30} height={12} rx={3} fill="var(--ok)" fillOpacity="0.8" />
            <text className={text.caption} x={100} y={93}>
              COX-1: gastric mucosa, kidney
            </text>
          </g>

          {r.gastricProtection < 50 && (
            <text className={text.alarm} x={C.RIGHT_X + C.BAR_W / 2} y={C.AXIS_Y - C.BAR_MAX_H - 8} textAnchor="middle">
              Ulcer
            </text>
          )}
        </g>
      </DiagramFrame>
    </MechanismDiagram>
  );
}
