import type { CSSProperties, ReactNode } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import styles from './EndocrineAxis.module.css';

interface Hormone {
  label: string;
  /** 0–1, where 1 is the top of this hormone's physiological range. */
  level: number;
  colorVar: string;
}

interface EndocrineAxisProps {
  ariaLabel: string;
  /** Hypothalamic releasing hormone — travels down the portal vessels, not the bloodstream. */
  releasing: Hormone;
  /** Anterior pituitary trophic hormone, which does travel in the blood. */
  trophic: Hormone;
  /** What the target gland makes. */
  product: Hormone;
  pituitaryFunction: number;
  glandFunction: number;
  glandLabel: string;
  /** The module draws its own gland at the origin of this slot. */
  renderGland: (intensity: number) => ReactNode;
  /** Hormone given as a drug: enters the circulation without passing through the axis. */
  exogenous?: { label: string; level: number };
  feedbackPositive?: boolean;
  targetTissue: { label: string; detail: string };
  /** Module-specific extras, drawn in the reserved area bottom-left. */
  children?: ReactNode;
}

export const AXIS_GLAND = { x: 410, y: 206 };

/**
 * The shared scaffold for a hypothalamic–pituitary–target axis.
 *
 * All three axes were the same drawing: three featureless blobs stacked in a column with arrows
 * between them that faded to nothing whenever the axis was quiet. Three things are drawn here
 * that none of them had.
 *
 * The pituitary has two lobes, and the releasing hormone reaches the anterior one down the
 * hypophyseal PORTAL vessels rather than through the circulation. That is not decoration: it is
 * why a stalk lesion disinhibits prolactin while cutting every other anterior hormone off, and
 * why the posterior lobe behaves completely differently from the anterior one.
 *
 * Everything past the pituitary moves through a drawn circulation. The gland secretes into it,
 * the target tissue reads from it, feedback rises out of it, and an exogenous hormone joins it
 * from outside the axis — which is what makes suppression by a drug, and the gland atrophy that
 * follows, something you can see rather than infer.
 *
 * Feedback is signed the way neuroanatomy signs it: a crossbar inhibits, an arrowhead excites.
 * The HPG axis is the one that flips, and it flips this marker with it.
 */
export function EndocrineAxis({
  ariaLabel,
  releasing,
  trophic,
  product,
  pituitaryFunction,
  glandFunction,
  glandLabel,
  renderGland,
  exogenous,
  feedbackPositive = false,
  targetTissue,
  children,
}: EndocrineAxisProps) {
  const drive = (level: number) => ({ '--level': clamp(level, 0, 1) }) as CSSProperties;
  const feedbackMarker = feedbackPositive ? 'url(#axisExcite)' : 'url(#axisInhibit)';
  const feedbackClass = feedbackPositive ? styles.feedbackPositive : styles.feedbackNegative;

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel={ariaLabel}
      defs={
        <>
          <marker id="axisExcite" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
            <path className={styles.markerExcite} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
          <marker id="axisInhibit" viewBox="0 0 8 8" refX="2" refY="4" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
            <path className={styles.markerInhibit} d="M 2 0 L 2 8" />
          </marker>
        </>
      }
    >
      {/* ---- Hypothalamus ---- */}
      <path className={styles.hypothalamus} d="M 96 50 C 118 40, 152 44, 160 60 C 166 74, 154 88, 132 90 C 110 92, 94 82, 92 68 C 91 60, 93 54, 96 50 Z" />
      <text className={styles.anatomyStrong} x={126} y={36} textAnchor="middle">
        Hypothalamus
      </text>
      {/* Neurosecretory neurons ending on the primary plexus. */}
      {[112, 126, 140].map((x) => (
        <path key={x} className={styles.neuron} style={drive(releasing.level)} d={`M ${x} 84 L ${x} 104`} />
      ))}

      {/* ---- Stalk and the hypophyseal portal vessels ---- */}
      <path className={styles.stalk} d="M 114 104 L 114 132 M 140 104 L 140 132" />
      <path className={styles.portal} style={drive(releasing.level)} d="M 118 106 C 126 116, 130 124, 128 134" />
      <text className={styles.anatomy} x={158} y={116}>
        Portal vessels
      </text>
      <text className={styles.hormoneTag} style={{ fill: releasing.colorVar }} x={158} y={130}>
        {releasing.label}
      </text>

      {/* ---- Pituitary, in its sella ---- */}
      <path className={styles.sella} d="M 78 148 C 78 184, 108 194, 128 194 C 150 194, 178 184, 178 148" />
      <ellipse className={styles.anteriorLobe} style={drive(pituitaryFunction)} cx={110} cy={158} rx={26} ry={20} />
      <ellipse className={styles.posteriorLobe} cx={152} cy={155} rx={14} ry={16} />
      <text className={styles.lobeLabel} x={110} y={162}>
        anterior
      </text>
      <text className={styles.lobeLabel} x={152} y={159}>
        post.
      </text>
      <text className={styles.anatomyStrong} x={128} y={210} textAnchor="middle">
        Pituitary
      </text>

      {/* ---- Trophic hormone: pituitary to gland, through the blood ---- */}
      <path
        className={styles.trophic}
        style={{ ...drive(trophic.level), stroke: trophic.colorVar }}
        d="M 136 146 C 232 150, 330 168, 380 190"
        markerEnd="url(#axisExcite)"
      />
      <text className={styles.hormoneTag} style={{ fill: trophic.colorVar }} x={250} y={148}>
        {trophic.label}
      </text>

      {/* ---- The target gland, drawn by the module ---- */}
      <g transform={`translate(${AXIS_GLAND.x}, ${AXIS_GLAND.y})`} style={drive(glandFunction)}>
        {renderGland(clamp(product.level, 0, 1))}
      </g>
      <text className={styles.anatomyStrong} x={AXIS_GLAND.x} y={AXIS_GLAND.y + 52} textAnchor="middle">
        {glandLabel}
      </text>

      {/* ---- The circulation everything downstream shares ---- */}
      <rect className={styles.circulation} x={64} y={286} width={432} height={30} rx={15} />
      <text className={styles.anatomy} x={72} y={306}>
        Circulation
      </text>
      <path
        className={styles.secretion}
        style={{ ...drive(product.level), stroke: product.colorVar }}
        d={`M ${AXIS_GLAND.x} ${AXIS_GLAND.y + 60} L ${AXIS_GLAND.x} 282`}
        markerEnd="url(#axisExcite)"
      />
      <text className={styles.hormoneTag} style={{ fill: product.colorVar }} x={AXIS_GLAND.x + 12} y={282}>
        {product.label}
      </text>

      {/* A hormone given as a drug joins the circulation without passing through the axis at all,
          which is why it suppresses the axis and lets the gland waste. */}
      {exogenous && exogenous.level > 0.01 && (
        <g style={drive(exogenous.level)}>
          <path className={styles.exogenous} d="M 20 301 L 60 301" markerEnd="url(#axisExcite)" />
          <text className={styles.exogenousLabel} x={20} y={290}>
            {exogenous.label}
          </text>
        </g>
      )}

      {/* ---- Feedback, rising out of the circulation ---- */}
      <path
        className={`${styles.feedback} ${feedbackClass}`}
        style={drive(product.level)}
        d="M 196 286 C 186 250, 170 200, 146 174"
        markerEnd={feedbackMarker}
      />
      <path
        className={`${styles.feedback} ${feedbackClass}`}
        style={drive(product.level)}
        d="M 92 286 C 62 240, 56 120, 96 66"
        markerEnd={feedbackMarker}
      />
      <text className={`${styles.feedbackLabel} ${feedbackClass}`} x={40} y={200}>
        {feedbackPositive ? 'positive' : 'negative'}
      </text>
      <text className={`${styles.feedbackLabel} ${feedbackClass}`} x={40} y={212}>
        feedback
      </text>

      {/* ---- What the hormone actually does ---- */}
      <path className={styles.toTissue} d="M 330 320 L 330 336" markerEnd="url(#axisExcite)" />
      <rect className={styles.tissue} style={drive(product.level)} x={252} y={338} width={244} height={56} rx={9} />
      <text className={styles.anatomyStrong} x={374} y={358} textAnchor="middle">
        {targetTissue.label}
      </text>
      <DiagramText className={styles.tissueDetail} x={374} y={372} maxWidth={226} fontSize={9} tracking={0.04} anchor="middle">
        {targetTissue.detail}
      </DiagramText>

      {children}
    </DiagramFrame>
  );
}
