import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { MASS } from '../engine/constants';
import type { PituitaryDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface PituitaryDiagramProps {
  derived: PituitaryDerived;
}

/** Gland geometry, in viewBox units. The sella is the box everything else has to fit inside. */
const SELLA = { left: 168, right: 332, top: 178, floor: 262 };
const GLAND = { cx: 250, cy: 218 };

/**
 * The five anterior cell lines, in the positions the paths terminate on. Lactotroph sits on the
 * midline because the dopamine brake descending the stalk is this module's central mechanism and
 * deserves the short, unambiguous path.
 */
const CELLS = [
  { key: 'somatotroph', name: 'Somatotroph', hormone: 'GH', colorVar: 'var(--pituitary)', x: 202, y: 202 },
  { key: 'lactotroph', name: 'Lactotroph', hormone: 'Prolactin', colorVar: 'var(--estrogen)', x: 250, y: 202 },
  { key: 'thyrotroph', name: 'Thyrotroph', hormone: 'TSH', colorVar: 'var(--tsh)', x: 298, y: 202 },
  { key: 'corticotroph', name: 'Corticotroph', hormone: 'ACTH', colorVar: 'var(--acth)', x: 206, y: 242 },
  { key: 'gonadotroph', name: 'Gonadotroph', hormone: 'LH / FSH', colorVar: 'var(--lh)', x: 294, y: 242 },
] as const;

const LEGEND = { x: 416, top: 132, pitch: 24 };

/**
 * A coronal section through the sella — the view the pathology is actually reported in.
 *
 * The dashboard this replaces showed the same three numbers as the sparklines beside it and drew
 * no structure at all, so every preset differed only in bar length. Here the mass has somewhere
 * to sit and something to press on: it crowds the normal cell lines beside it, squeezes the stalk
 * that carries the dopamine brake, and lifts the chiasm above it. Those three consequences are
 * three different presets, and they are geometry rather than three more meters.
 */
export function PituitaryDiagram({ derived }: PituitaryDiagramProps) {
  // Fraction of the largest mass the engine can produce, so the drawing saturates where the
  // model does rather than at a round number.
  const massFraction = clamp(derived.totalMassCc / 15, 0, 1);
  const massRx = 12 + massFraction * 62;
  const massRy = 9 + massFraction * 44;
  const massCy = GLAND.cy - massFraction * 26;

  // A functioning adenoma IS somatotroph or lactotroph tissue; colour it as such.
  const components = [
    { cc: derived.ghAdenomaCc, colorVar: 'var(--pituitary)', label: 'somatotroph adenoma' },
    { cc: derived.prlAdenomaCc, colorVar: 'var(--estrogen)', label: 'lactotroph adenoma' },
    { cc: derived.nonfunctioningCc, colorVar: 'var(--text-faint)', label: 'non-functioning mass' },
  ];
  const dominant = components.reduce((a, b) => (b.cc > a.cc ? b : a));
  const hasMass = derived.totalMassCc > 0.05;

  const stalk = clamp(derived.stalkCompressionFraction / MASS.MAX_STALK_COMPRESSION_FRACTION, 0, 1);
  const waist = 26 - stalk * 19;
  const dopamineFlow = clamp(derived.effectiveDopamineFraction, 0, 1);
  const trhFlow = clamp(derived.trhStimulusUnits / 100, 0, 1);
  const d2Block = clamp(derived.d2ReceptorBlockPct / 100, 0, 1);
  const loss = clamp(derived.visualFieldDefectPct / 100, 0, 1);
  const chiasmLift = loss * 11;

  // Compression costs the normal gland its room. The adenoma's own line is exempt: it is the
  // tissue that is expanding, not the tissue being squashed.
  const crowding = (colorVar: string) =>
    hasMass && colorVar !== dominant.colorVar ? clamp(1 - massFraction * 0.85, 0.15, 1) : 1;

  return (
    <DiagramFrame
      viewBox="0 0 580 400"
      ariaLabel="Coronal section of the sella: hypothalamus, stalk, anterior pituitary cell lines, sellar mass and optic chiasm"
    >
      <defs>
        <marker id="pitExcite" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
        </marker>
        <marker id="pitInhibit" viewBox="0 0 8 8" refX="2" refY="4" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M 2 0 L 2 8" stroke="context-stroke" strokeWidth="2" />
        </marker>
      </defs>

      {/* --- Hypothalamus and the stalk --- */}
      <rect className={styles.hypothalamus} x={158} y={30} width={184} height={34} rx={12} />
      <text className={styles.anatomyStrong} x={250} y={52} textAnchor="middle">
        Hypothalamus
      </text>

      <path
        className={styles.stalk}
        d={`M 226 64 C ${250 - waist} 110, ${250 - waist} 130, 234 ${SELLA.top}
            L 266 ${SELLA.top} C ${250 + waist} 130, ${250 + waist} 110, 274 64 Z`}
      />
      {/* Kept clear of the chiasm label's baseline: at 8 units apart the two ran together and
          read as a single phrase, which no collision check catches. */}
      <text className={styles.anatomy} x={292} y={84} textAnchor="start">
        Stalk
      </text>
      {stalk > 0.12 && (
        <text className={styles.alarm} x={292} y={98} textAnchor="start">
          compressed {(derived.stalkCompressionFraction * 100).toFixed(0)}%
        </text>
      )}

      {/* Dopamine: tonic inhibition, so it ends in a crossbar, not an arrowhead. */}
      <path
        className={styles.dopamine}
        style={{ '--flow': dopamineFlow } as React.CSSProperties}
        d="M 240 66 C 236 118, 240 160, 246 194"
        markerEnd="url(#pitInhibit)"
      />
      {/* TRH drives the thyrotroph and spills onto the lactotroph — the reason primary
          hypothyroidism raises prolactin. The branch is the whole mechanism. */}
      <path
        className={styles.trh}
        style={{ '--flow': trhFlow } as React.CSSProperties}
        d="M 262 66 C 276 116, 290 158, 296 194"
        markerEnd="url(#pitExcite)"
      />
      <path
        className={styles.trh}
        style={{ '--flow': trhFlow } as React.CSSProperties}
        d="M 283 152 C 272 168, 260 182, 255 193"
        markerEnd="url(#pitExcite)"
      />

      {d2Block > 0.05 && (
        <>
          <line className={styles.receptorBlock} x1={230} y1={172} x2={254} y2={158} />
          <text className={styles.blockLabel} x={150} y={166} textAnchor="end">
            D2 block {(derived.d2ReceptorBlockPct).toFixed(0)}%
          </text>
          <line className={styles.receptorBlock} x1={154} y1={162} x2={226} y2={166} strokeWidth={1} />
        </>
      )}

      {/* --- Optic chiasm, lifted and stretched by anything growing under it --- */}
      <g className={styles.chiasm} style={{ transform: `translateY(${-chiasmLift}px)` }}>
        <path d="M 158 128 L 342 150" />
        <path d="M 158 150 L 342 128" />
      </g>
      <text className={styles.anatomy} x={250} y={112} textAnchor="middle">
        Optic chiasm
      </text>
      {loss > 0.02 && (
        <>
          <polygon
            className={styles.fieldWedge}
            style={{ '--loss': loss } as React.CSSProperties}
            points={`158,${139 - chiasmLift} ${158 - 30 * loss},${121 - chiasmLift} ${158 - 30 * loss},${157 - chiasmLift}`}
          />
          <polygon
            className={styles.fieldWedge}
            style={{ '--loss': loss } as React.CSSProperties}
            points={`342,${139 - chiasmLift} ${342 + 30 * loss},${121 - chiasmLift} ${342 + 30 * loss},${157 - chiasmLift}`}
          />
          <text className={styles.alarm} x={124} y={106} textAnchor="middle">
            bitemporal loss {derived.visualFieldDefectPct.toFixed(0)}%
          </text>
        </>
      )}

      {/* --- The bony sella and the sinuses either side of it --- */}
      <path
        className={styles.bone}
        d={`M ${SELLA.left - 10} ${SELLA.top} L ${SELLA.left - 10} ${SELLA.floor - 14}
            Q ${SELLA.left - 10} ${SELLA.floor} ${SELLA.left + 6} ${SELLA.floor}
            L ${SELLA.right - 6} ${SELLA.floor}
            Q ${SELLA.right + 10} ${SELLA.floor} ${SELLA.right + 10} ${SELLA.floor - 14}
            L ${SELLA.right + 10} ${SELLA.top}`}
      />
      <path className={styles.sinusAir} d={`M 186 ${SELLA.floor + 2} L 314 ${SELLA.floor + 2} L 292 322 L 208 322 Z`} />
      <text className={styles.anatomy} x={250} y={306} textAnchor="middle">
        Sphenoid sinus
      </text>

      {[110, 344].map((x, i) => (
        <g key={x}>
          <rect className={styles.cavernousSinus} x={x} y={186} width={52} height={64} rx={10} />
          <circle className={styles.carotid} cx={x + 26} cy={214} r={10} />
          {[196, 232, 242].map((cy) => (
            <circle key={cy} className={styles.cranialNerve} cx={x + (cy === 196 ? 12 : 40)} cy={cy} r={2.6} />
          ))}
          {i === 0 && (
            <text className={styles.anatomy} x={x + 26} y={272} textAnchor="middle">
              Cavernous sinus
            </text>
          )}
          {i === 1 && (
            <text className={styles.anatomy} x={x + 26} y={272} textAnchor="middle">
              ICA · III IV V VI
            </text>
          )}
        </g>
      ))}

      {/* --- The gland itself --- */}
      <ellipse className={styles.glandCapsule} cx={GLAND.cx} cy={GLAND.cy} rx={84} ry={42} />
      {/* The neurohypophysis is continuous with the stalk and sits centrally in this plane, so
          it belongs between the two rows of adenohypophyseal cells rather than beneath them. */}
      <ellipse className={styles.posteriorLobe} cx={GLAND.cx} cy={GLAND.cy + 7} rx={27} ry={10} />
      <text className={styles.anatomy} x={GLAND.cx} y={GLAND.cy + 11} textAnchor="middle">
        Posterior
      </text>

      {CELLS.map((cell) => (
        <g key={cell.key} style={{ '--cell-color': cell.colorVar, '--crowding': crowding(cell.colorVar) } as React.CSSProperties}>
          {[-8, 0, 8].map((dx) => (
            <circle key={dx} className={styles.cell} cx={cell.x + dx} cy={cell.y} r={4.4} />
          ))}
        </g>
      ))}

      {hasMass && (
        <ellipse
          className={styles.mass}
          style={{ '--mass-color': dominant.colorVar } as React.CSSProperties}
          cx={GLAND.cx}
          cy={massCy}
          rx={massRx}
          ry={massRy}
        />
      )}

      {/* --- Legend: the colour is doing real work, so it has to be keyed --- */}
      <text className={styles.label} x={LEGEND.x} y={LEGEND.top - 14}>
        CELL LINES
      </text>
      {CELLS.map((cell, i) => (
        <g key={cell.key} style={{ '--cell-color': cell.colorVar } as React.CSSProperties}>
          <circle className={styles.legendSwatch} cx={LEGEND.x + 6} cy={LEGEND.top + i * LEGEND.pitch} r={5.5} />
          <text className={styles.anatomy} x={LEGEND.x + 20} y={LEGEND.top + i * LEGEND.pitch + 4} textAnchor="start">
            {`${cell.name} · ${cell.hormone}`}
          </text>
        </g>
      ))}
      <line
        className={styles.legendRule}
        x1={LEGEND.x}
        y1={LEGEND.top + CELLS.length * LEGEND.pitch - 4}
        x2={LEGEND.x + 140}
        y2={LEGEND.top + CELLS.length * LEGEND.pitch - 4}
      />
      <DiagramText className={styles.caption} x={LEGEND.x} y={LEGEND.top + CELLS.length * LEGEND.pitch + 14} maxWidth={142}>
        {hasMass
          ? `${derived.totalMassCc.toFixed(1)} cm³ ${dominant.label}`
          : 'no sellar mass'}
      </DiagramText>

      {/* --- Findings --- */}
      {(derived.glucoseSuppressionTest !== 'not tested' || derived.acromegalicIndex > 20) && (
        <DiagramText className={styles.alarm} x={28} y={334} maxWidth={340} fontSize={12}>
          {derived.glucoseSuppressionTest !== 'not tested'
            ? `glucose test: ${derived.glucoseSuppressionTest}`
            : `acromegalic overgrowth index ${derived.acromegalicIndex.toFixed(0)}`}
        </DiagramText>
      )}
      <DiagramText className={styles.verdict} x={28} y={358} maxWidth={504} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText className={styles.caption} x={28} y={382} maxWidth={504} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
