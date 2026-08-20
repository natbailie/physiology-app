import { describe, expect, it } from 'vitest';
import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

import { autonomicNervousContent } from './autonomicNervous/content';
import { calciumHomeostasisContent } from './calciumHomeostasis/content';
import { capillaryExchangeContent } from './capillaryExchange/content';
import { cardiacElectroContent } from './cardiacElectro/content';
import { cardiorenalContent } from './cardiorenal/content';
import { coagulationContent } from './coagulation/content';
import { ecgConductionContent } from './ecgConduction/content';
import { electrolyteBalanceContent } from './electrolyteBalance/content';
import { erythropoiesisContent } from './erythropoiesis/content';
import { gastrointestinalContent } from './gastrointestinal/content';
import { glucoseRegulationContent } from './glucoseRegulation/content';
import { hpaAxisContent } from './hpaAxis/content';
import { hpgAxisContent } from './hpgAxis/content';
import { hptAxisContent } from './hptAxis/content';
import { immuneResponseContent } from './immuneResponse/content';
import { membranePotentialsContent } from './membranePotentials/content';
import { muscleContractionContent } from './muscleContraction/content';
import { renalTubularContent } from './renalTubular/content';
import { respiratoryContent } from './respiratory/content';
import { respiratoryMechanicsContent } from './respiratoryMechanics/content';
import { venousReturnContent } from './venousReturn/content';

const ALL: [string, ExplainerContent][] = [
  ['autonomicNervous', autonomicNervousContent],
  ['calciumHomeostasis', calciumHomeostasisContent],
  ['capillaryExchange', capillaryExchangeContent],
  ['cardiacElectro', cardiacElectroContent],
  ['cardiorenal', cardiorenalContent],
  ['coagulation', coagulationContent],
  ['ecgConduction', ecgConductionContent],
  ['electrolyteBalance', electrolyteBalanceContent],
  ['erythropoiesis', erythropoiesisContent],
  ['gastrointestinal', gastrointestinalContent],
  ['glucoseRegulation', glucoseRegulationContent],
  ['hpaAxis', hpaAxisContent],
  ['hpgAxis', hpgAxisContent],
  ['hptAxis', hptAxisContent],
  ['immuneResponse', immuneResponseContent],
  ['membranePotentials', membranePotentialsContent],
  ['muscleContraction', muscleContractionContent],
  ['renalTubular', renalTubularContent],
  ['respiratory', respiratoryContent],
  ['respiratoryMechanics', respiratoryMechanicsContent],
  ['venousReturn', venousReturnContent],
];

const words = (text: string) => text.trim().split(/\s+/).length;

/**
 * The explainer is the default first encounter with a module now that it opens by design, so
 * these guard a floor rather than an aspiration: every module gets a real title and enough
 * substantive prose that a learner meets a mechanism rather than a caption.
 */
describe('module explainer content', () => {
  it('covers every simulator module', () => {
    // 21 simulators; the formula reference has no explainer.
    expect(ALL).toHaveLength(21);
    expect(new Set(ALL.map(([id]) => id)).size).toBe(ALL.length);
  });

  it('gives every module a title that says something', () => {
    for (const [id, content] of ALL) {
      expect(content.title.length, `${id} title`).toBeGreaterThan(15);
      // A title is a claim about the mechanism, not a restatement of the module name.
      expect(words(content.title), `${id} title`).toBeGreaterThan(3);
    }
  });

  it('carries at least five substantive paragraphs', () => {
    for (const [id, content] of ALL) {
      expect(content.paragraphs.length, `${id} paragraph count`).toBeGreaterThanOrEqual(5);
    }
  });

  it('has no thin paragraphs', () => {
    const thin = ALL.flatMap(([id, content]) =>
      content.paragraphs
        .map((paragraph, index) => ({ id, index, count: words(paragraph) }))
        .filter(({ count }) => count < 40)
        .map(({ index, count }) => `  ${id}[${index}]: ${count} words`),
    );
    expect(thin.join('\n'), `paragraphs too thin to teach anything:\n${thin.join('\n')}`).toBe('');
  });

  it('reaches a usable total length per module', () => {
    for (const [id, content] of ALL) {
      const total = content.paragraphs.reduce((sum, p) => sum + words(p), 0);
      expect(total, `${id} total words`).toBeGreaterThan(300);
    }
  });

  it('never repeats a paragraph within a module', () => {
    for (const [id, content] of ALL) {
      expect(new Set(content.paragraphs).size, `${id} duplicate paragraph`).toBe(
        content.paragraphs.length,
      );
    }
  });
});
