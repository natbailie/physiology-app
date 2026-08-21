import type { NmjInputs } from './types';

export const DEFAULT_NMJ_INPUTS: NmjInputs = {
  vesicleReleaseCapacity: 1,
  calciumChannelFunction: 1,
  receptorDensity: 1,
  acetylcholinesteraseActivity: 1,
  nondepolarisingBlocker: 0,
  depolarisingBlocker: 0,
  stimulationFrequencyHz: 2,
};

export type NmjPresetName =
  | 'normal'
  | 'myastheniaGravis'
  | 'lambertEaton'
  | 'botulism'
  | 'nondepolarisingBlock'
  | 'depolarisingBlock'
  | 'organophosphate'
  | 'pyridostigmine';

/**
 * Each preset produces a distinct combination of safety factor, train-of-four ratio and
 * response to repetition. The last of those is the discriminator people forget: a presynaptic
 * lesion gets BETTER with repeated stimulation and a postsynaptic one gets worse.
 */
export const NMJ_PRESETS: Record<NmjPresetName, Partial<NmjInputs>> = {
  normal: { ...DEFAULT_NMJ_INPUTS },
  // Antibodies against the acetylcholine receptor: the nerve releases normally, the message is
  // not received. Reserve is spent, so repetition produces fade and clinical fatiguability.
  myastheniaGravis: { ...DEFAULT_NMJ_INPUTS, receptorDensity: 0.26 },
  // Antibodies against the presynaptic calcium channel: too little is released to begin with,
  // but residual calcium accumulates with use, so strength IMPROVES on repetition.
  lambertEaton: { ...DEFAULT_NMJ_INPUTS, calciumChannelFunction: 0.42 },
  // Toxin cleaves the docking proteins, so release fails at the first step and no amount of
  // stimulation recruits more.
  botulism: { ...DEFAULT_NMJ_INPUTS, vesicleReleaseCapacity: 0.12 },
  // Competitive antagonist at the receptor. Produces fade, and is reversed by raising
  // acetylcholine with an anticholinesterase.
  nondepolarisingBlock: { ...DEFAULT_NMJ_INPUTS, nondepolarisingBlocker: 78 },
  // Agonist that opens the receptor and holds it: initial fasciculation, then block WITHOUT
  // fade, and an anticholinesterase makes it worse rather than better.
  depolarisingBlock: { ...DEFAULT_NMJ_INPUTS, depolarisingBlocker: 85 },
  // Acetylcholinesterase inhibited: transmitter accumulates until the end plate depolarises
  // persistently and stops responding at all.
  organophosphate: { ...DEFAULT_NMJ_INPUTS, acetylcholinesteraseActivity: 0.08 },
  // The therapeutic version of the same idea, in a myasthenic patient.
  pyridostigmine: { ...DEFAULT_NMJ_INPUTS, receptorDensity: 0.26, acetylcholinesteraseActivity: 0.45 },
};

export const NMJ_PRESET_LABELS: Record<NmjPresetName, string> = {
  normal: 'Normal',
  myastheniaGravis: 'Myasthenia gravis',
  lambertEaton: 'Lambert-Eaton',
  botulism: 'Botulism',
  nondepolarisingBlock: 'Non-depolarising block',
  depolarisingBlock: 'Depolarising block',
  organophosphate: 'Organophosphate',
  pyridostigmine: 'MG on pyridostigmine',
};

export const NMJ_PRESET_ORDER: NmjPresetName[] = [
  'normal',
  'myastheniaGravis',
  'lambertEaton',
  'botulism',
  'nondepolarisingBlock',
  'depolarisingBlock',
  'organophosphate',
  'pyridostigmine',
];
