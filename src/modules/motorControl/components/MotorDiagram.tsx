import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { TREMOR } from '../engine/constants';
import { dysmetriaPct } from '../engine/motorMechanics';
import type { MotorDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface MotorDiagramProps {
  derived: MotorDerived;
}

/** A connection's weight drives both its thickness and its opacity, so a pathway that has
 * stopped carrying traffic thins out rather than merely changing colour. */
/* Each proxy is normalised by the engine's OWN maximum for that quantity rather than by a
 * round number, so a node's shading means "this fraction of the worst this model produces".
 * dysmetria tops out at 45%, not 100, which had the cerebellum reading two-thirds intact
 * during a near-total cerebellar lesion. */
const DYSMETRIA_MAX = dysmetriaPct(0);

const edge = (strength: number) => ({ '--strength': clamp(strength, 0.05, 1.6) }) as CSSProperties;
const node = (integrity: number) => ({ '--integrity': clamp(integrity, 0, 1) }) as CSSProperties;

/**
 * The basal ganglia loop, drawn as a circuit with signed connections.
 *
 * Every preset in this module names a node: hemiballismus is the subthalamic nucleus,
 * Huntington's the striatal indirect pathway, Parkinson's the substantia nigra, and two more sit
 * outside the loop in the cerebellum and the corticospinal tract. The old drawing had cortex,
 * striatum, STN and thalamus on one horizontal line with no globus pallidus at all — so the
 * direct and indirect pathways, which are the entire mechanism, could not be told apart.
 *
 * Connections are signed the way neuroanatomy signs them: an arrowhead excites, a crossbar
 * inhibits. That matters more here than anywhere else in the app, because the direct pathway
 * works by inhibiting an inhibitor — a double negative that a plain line cannot express, and
 * which is why losing dopamine makes movement harder rather than easier.
 *
 * Node states are read from the consequences the engine already computes rather than from
 * invented firing rates: `spasticityScore` recovers corticospinal integrity exactly, `ballismAmp`
 * marks the subthalamic lesion, `choreaAmp` the striatal one, `dysmetriaPct` the cerebellar one.
 */
export function MotorDiagram({ derived }: MotorDiagramProps) {
  const dopamine = clamp(derived.effectiveDopaminePct / 100, 0, 1.3);
  const striatalLoss = clamp(derived.choreaAmp / TREMOR.CHOREA_MAX_AMP, 0, 1);
  const stnLoss = clamp(derived.ballismAmp / TREMOR.BALLISM_MAX_AMP, 0, 1);
  const cerebellarLoss = clamp(derived.dysmetriaPct / DYSMETRIA_MAX, 0, 1);
  const corticospinalLoss = clamp(derived.spasticityScore / 10, 0, 1);
  const brady = clamp(derived.bradykinesiaIndex, 0, 1);

  // The two routes out of the striatum. Dopamine facilitates the direct one and damps the
  // indirect one, which is the whole of why it makes movement easier.
  const directDrive = clamp(dopamine, 0.05, 1.4);
  const indirectDrive = clamp((1.6 - dopamine) * (1 - striatalLoss), 0.05, 1.5);
  const stnDrive = clamp(indirectDrive * (1 - stnLoss), 0.05, 1.5);
  const gpiOutput = clamp(0.3 + brady * 1.2, 0.05, 1.6);
  const thalamicOutput = clamp(1.3 - brady, 0.05, 1.4);

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="The basal ganglia loop with its direct and indirect pathways signed excitatory or inhibitory, the substantia nigra, the cerebellum and the corticospinal tract"
      defs={
        <>
          <marker id="motorExcite" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
            <path className={styles.markerExcite} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
          </marker>
          <marker id="motorInhibit" viewBox="0 0 8 8" refX="2" refY="4" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto">
            <path className={styles.markerInhibit} d="M 2 0 L 2 8" />
          </marker>
        </>
      }
    >
      {/* ---- The loop ---- */}
      <rect className={styles.node} x={190} y={26} width={150} height={32} rx={8} />
      <text className={styles.nodeLabel} x={265} y={47}>
        Cortex
      </text>

      <rect className={styles.nodeLesioned} style={node(1 - striatalLoss)} x={190} y={88} width={150} height={30} rx={8} />
      <text className={styles.nodeLabel} x={265} y={108}>
        Striatum
      </text>

      {/* Substantia nigra: the dopamine source, which is a number with no origin unless drawn. */}
      <ellipse className={styles.nigra} style={node(clamp(dopamine, 0, 1))} cx={116} cy={103} rx={26} ry={16} />
      <text className={styles.nodeLabelSmall} x={116} y={100}>
        SNc
      </text>
      <text className={styles.nodeValue} x={116} y={112}>
        {derived.effectiveDopaminePct.toFixed(0)}%
      </text>

      <rect className={styles.node} x={112} y={152} width={88} height={28} rx={6} />
      <text className={styles.nodeLabel} x={156} y={171}>
        GPe
      </text>

      <circle className={styles.nodeLesioned} style={node(1 - stnLoss)} cx={156} cy={222} r={20} />
      <text className={styles.nodeLabelSmall} x={156} y={226}>
        STN
      </text>

      <rect className={styles.node} x={262} y={186} width={98} height={28} rx={6} />
      <text className={styles.nodeLabel} x={311} y={205}>
        GPi / SNr
      </text>

      <rect className={styles.node} x={206} y={256} width={134} height={30} rx={8} />
      <text className={styles.nodeLabel} x={273} y={276}>
        Thalamus
      </text>

      {/* ---- Connections. Arrowhead excites, crossbar inhibits. ---- */}
      <path className={styles.excitatory} style={edge(1)} d="M 265 58 L 265 84" markerEnd="url(#motorExcite)" />
      <path className={styles.modulatory} style={edge(dopamine)} d="M 142 103 L 186 103" markerEnd="url(#motorExcite)" />

      {/* Direct: striatum inhibits GPi, which releases the thalamus. A double negative. */}
      <path
        className={styles.inhibitory}
        style={edge(directDrive)}
        d="M 306 118 C 322 142, 322 162, 316 182"
        markerEnd="url(#motorInhibit)"
      />
      <text className={styles.pathTag} x={330} y={150}>
        direct
      </text>

      {/* Indirect: striatum inhibits GPe, GPe stops inhibiting STN, STN drives GPi harder. */}
      <path
        className={styles.inhibitory}
        style={edge(indirectDrive)}
        d="M 218 118 C 196 132, 176 140, 164 148"
        markerEnd="url(#motorInhibit)"
      />
      <text className={styles.pathTag} x={150} y={136} textAnchor="end">
        indirect
      </text>
      <path className={styles.inhibitory} style={edge(indirectDrive)} d="M 156 180 L 156 198" markerEnd="url(#motorInhibit)" />
      <path className={styles.excitatory} style={edge(stnDrive)} d="M 176 235 C 214 234, 244 220, 258 208" markerEnd="url(#motorExcite)" />

      <path className={styles.inhibitory} style={edge(gpiOutput)} d="M 306 214 C 300 234, 292 244, 286 252" markerEnd="url(#motorInhibit)" />
      <path className={styles.excitatory} style={edge(thalamicOutput)} d="M 340 271 L 372 271 L 372 42 L 344 42" markerEnd="url(#motorExcite)" />

      {/* ---- Outside the loop: the two other places a preset lesions ---- */}
      <ellipse className={styles.nodeLesioned} style={node(1 - cerebellarLoss)} cx={462} cy={120} rx={58} ry={36} />
      <text className={styles.nodeLabel} x={462} y={118}>
        Cerebellum
      </text>
      <text className={styles.nodeValue} x={462} y={132}>
        dysmetria {derived.dysmetriaPct.toFixed(0)}%
      </text>
      <path className={styles.modulatory} style={edge(1 - cerebellarLoss)} d="M 406 138 C 384 160, 374 200, 372 236" markerEnd="url(#motorExcite)" />

      <path
        className={styles.corticospinal}
        style={edge(1 - corticospinalLoss)}
        d="M 340 34 L 534 34 L 534 282"
        markerEnd="url(#motorExcite)"
      />
      <text className={styles.pathTag} x={532} y={186} textAnchor="end">
        corticospinal
      </text>

      <rect className={styles.outputNode} style={node(clamp(derived.achievedAmplitudePct / 100, 0, 1))} x={400} y={288} width={140} height={32} rx={8} />
      <text className={styles.nodeLabel} x={470} y={302}>
        Movement
      </text>
      <text className={styles.nodeValue} x={470} y={314}>
        {derived.achievedAmplitudePct.toFixed(0)}% of command
      </text>

      {/* ---- Readouts ---- */}
      <DiagramText className={styles.caption} x={20} y={330} maxWidth={400}>
        latency {derived.initiationLatencyMs.toFixed(0)} ms · rigidity {derived.rigidityScore.toFixed(1)} · spasticity{' '}
        {derived.spasticityScore.toFixed(1)}
      </DiagramText>
      <DiagramText className={styles.caption} x={20} y={350} maxWidth={400}>
        tremor — rest {derived.restingTremorAmp.toFixed(1)} · intention {derived.intentionTremorAmp.toFixed(1)} · postural{' '}
        {derived.posturalTremorAmp.toFixed(1)}
      </DiagramText>
      <text className={styles.caption} x={20} y={370}>
        gait: {derived.gaitClass}
      </text>
      {derived.involuntaryMovementIndex > 2 && (
        <text className={styles.alarm} x={20} y={390}>
          involuntary movement — chorea/ballism {derived.involuntaryMovementIndex.toFixed(1)}
        </text>
      )}

      <DiagramText className={styles.verdict} x={20} y={414} maxWidth={520} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText className={styles.label} x={20} y={434} maxWidth={520} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
