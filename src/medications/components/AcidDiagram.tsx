import { useState } from 'react';
import { MechanismDiagram } from './MechanismDiagram';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlGroup } from '@/shared/components/ControlRail/ControlRail';
import text from '@/shared/styles/diagramText.module.css';
import { computeAcidSuppression } from '../engine/acidSuppression';

const A = {
  // Stomach pouch
  STOM: { x: 168, y: 42, w: 148, h: 210, rx: 52 },
  // Acid bar
  BAR: { x: 380, y: 62, w: 124, h: 170 },
};

function phColour(ph: number): string {
  if (ph < 1.8) return 'var(--danger)';
  if (ph < 3.5) return 'var(--warn)';
  if (ph < 5.5) return 'var(--ok)';
  return 'var(--raas)';
}

export function AcidDiagram() {
  const [ppi, setPpi] = useState(0);
  const [h2, setH2] = useState(0);
  const [antacid, setAntacid] = useState(0);
  const [vagal, setVagal] = useState(100);

  const r = computeAcidSuppression({ ppiDose: ppi, h2BlockerDose: h2, antacidDose: antacid, vagalTone: vagal });

  const acidFillHeight = (r.acidOutput / 120) * A.BAR.h;
  const acidY = A.BAR.y + A.BAR.h - acidFillHeight;
  const barColour = phColour(r.gastricPH);

  return (
    <MechanismDiagram
      heading="Acid suppression in the stomach"
      readouts={
        <>
          <ReadoutItem label="Gastric pH" value={r.gastricPH.toFixed(1)} colorVar={barColour} />
          <ReadoutItem label="Acid output" value={r.acidOutput.toFixed(0)} unit="%" />
          <ReadoutItem
            label="Result"
            value={r.gastricPH >= 4 ? 'SUPPRESSED' : r.gastricPH < 2 ? 'SECRETING' : 'RAISED'}
            wide
          />
        </>
      }
      controls={
        <ControlGroup label="Drugs">
          <Slider label="PPI dose" value={ppi} min={0} max={150} unit="%" onChange={setPpi} />
          <Slider label="H2 blocker dose" value={h2} min={0} max={150} unit="%" onChange={setH2} />
          <Slider label="Antacid dose" value={antacid} min={0} max={150} unit="%" onChange={setAntacid} />
          <Slider label="Vagal tone" value={vagal} min={0} max={200} unit="%" onChange={setVagal} />
        </ControlGroup>
      }
    >
      <DiagramFrame viewBox="0 0 560 340" ariaLabel="Schematic of the stomach with its acid pumped into the lumen and a pH scale">
        <g>
          {/* Stomach */}
          <path
            d={`M ${A.STOM.x} ${A.STOM.y + 20}
                Q ${A.STOM.x - 6} ${A.STOM.y + A.STOM.h / 2} ${A.STOM.x + A.STOM.w / 2} ${A.STOM.y + A.STOM.h}
                Q ${A.STOM.x + A.STOM.w + 6} ${A.STOM.y + A.STOM.h / 2} ${A.STOM.x + A.STOM.w} ${A.STOM.y + 20}`}
            fill={barColour}
            fillOpacity="0.22"
            stroke={barColour}
            strokeWidth="2"
          />
          <text className={text.organLabel} x={A.STOM.x + A.STOM.w / 2} y={A.STOM.y + A.STOM.h + 26}>
            Stomach
          </text>

          {/* H+/K+ pump gate - the PPI target */}
          <text className={text.pathLabel} x={A.STOM.x - 40} y={A.STOM.y + 90}>
            H⁺/K⁺ pump
          </text>
          <rect
            x={A.STOM.x - 34}
            y={A.STOM.y + 96}
            width="20"
            height="30"
            rx="4"
            fill={ppi > 0 ? 'var(--text-faint)' : 'var(--panel-border)'}
            stroke={ppi > 0 ? 'var(--danger)' : 'var(--panel-border)'}
            strokeWidth="2"
            opacity={ppi > 0 ? 0.4 : 1}
          />

          {/* Histamine arm - the H2 target */}
          <text className={text.pathLabel} x={A.STOM.x - 78} y={A.STOM.y + 158}>
            His + H2
          </text>
          <line
            x1={A.STOM.x - 18}
            y1={A.STOM.y + 130}
            x2={A.STOM.x - 18}
            y2={A.STOM.y + 168}
            stroke={h2 > 0 ? 'var(--danger)' : 'var(--panel-border)'}
            strokeWidth="2"
            opacity={h2 > 0 ? 0.4 : 1}
          />

          {/* Antacid neutraliser badge */}
          {antacid > 0 && (
            <text className={text.caption} x={A.STOM.x + A.STOM.w / 2} y={A.STOM.y + 64}>
              antacid +{Math.round(r.antacidNeutralisation * 100)}%
            </text>
          )}

          {/* Acid readout bar */}
          <text className={text.tickLabel} x={A.BAR.x + A.BAR.w / 2} y={A.BAR.y - 8}>
            ACID
          </text>
          <rect x={A.BAR.x} y={A.BAR.y} width={A.BAR.w} height={A.BAR.h} rx="6" fill="none" stroke="var(--panel-border)" strokeWidth="1" />
          <rect
            x={A.BAR.x}
            y={acidY}
            width={A.BAR.w}
            height={acidFillHeight}
            rx="6"
            fill={barColour}
            fillOpacity="0.85"
          />
          {/* pH scale ticks */}
          {[1, 3, 5, 7].map((ph) => {
            const ty = A.BAR.y + A.BAR.h - (ph / 8) * A.BAR.h;
            return (
              <g key={ph}>
                <line className={text.axis} x1={A.BAR.x - 4} y1={ty} x2={A.BAR.x} y2={ty} />
                <text className={text.tickLabel} x={A.BAR.x - 8} y={ty + 3} textAnchor="end">
                  {ph}
                </text>
              </g>
            );
          })}
          <text className={text.tickLabel} x={A.BAR.x + A.BAR.w / 2} y={A.BAR.y + A.BAR.h + 18}>
            pH
          </text>
        </g>
      </DiagramFrame>
    </MechanismDiagram>
  );
}
