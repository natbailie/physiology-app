import type { ComponentType } from 'react';
import { AcidDiagram } from './AcidDiagram';
import { CoxDiagram } from './CoxDiagram';
import { LdlDiagram } from './LdlDiagram';

/**
 * Which drug classes get an in-place interactive mechanism diagram on their page.
 *
 * A small number of classes earn one: PPIs / H2 blockers / antacids / alginates share the stomach-acid
 * engine and are registered together so the learner can compare the arms on any of those
 * pages; the NSAID and COX-2 inhibitor pages get the COX-1/COX-2 trade-off; the statin page gets the LDL bar.
 * Everything else already has a "watch it happen" link into a full simulator when one applies.
 */
export const MECHANISM_DIAGRAMS: Record<string, ComponentType> = {
  'proton-pump-inhibitors': AcidDiagram,
  'h2-receptor-antagonists': AcidDiagram,
  alginates: AcidDiagram,
  antacids: AcidDiagram,
  'non-steroidal-anti-inflammatory-drugs-nsaids': CoxDiagram,
  'cox-2-inhibitors': CoxDiagram,
  statins: LdlDiagram,
};

export function getMechanismDiagram(classId: string): ComponentType | undefined {
  return MECHANISM_DIAGRAMS[classId];
}
