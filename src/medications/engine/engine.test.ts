import { describe, expect, it } from 'vitest';
import { computeAcidSuppression } from './acidSuppression';
import { computeCoxInhibition } from './coxInhibition';
import { computeStatinEffect } from './ldlReduction';

describe('acid suppression engine', () => {
  const base = { ppiDose: 0, h2BlockerDose: 0, antacidDose: 0, vagalTone: 100 };

  it('secretes acid (acidic gastric pH) to a vagal drive with no drug on board', () => {
    const r = computeAcidSuppression(base);
    expect(r.acidOutput).toBeGreaterThan(50);
    expect(r.gastricPH).toBeLessThan(3);
  });

  it('a PPI suppresses acid more completely than an H2 blocker at equal dose', () => {
    const ppi = computeAcidSuppression({ ...base, ppiDose: 100 });
    const h2 = computeAcidSuppression({ ...base, h2BlockerDose: 100 });
    expect(ppi.acidOutput).toBeLessThan(h2.acidOutput);
    expect(ppi.gastricPH).toBeGreaterThan(h2.gastricPH);
  });

  it('a PPI overcomes a strong vagal drive that an H2 blocker cannot', () => {
    const strong = { ppiDose: 0, h2BlockerDose: 0, antacidDose: 0, vagalTone: 400 };
    const ppi = computeAcidSuppression({ ...strong, ppiDose: 100 });
    const h2 = computeAcidSuppression({ ...strong, h2BlockerDose: 100 });
    expect(ppi.gastricPH).toBeGreaterThan(4);
    expect(h2.gastricPH).toBeLessThan(ppi.gastricPH);
  });

  it('an antacid raises pH without touching secretion', () => {
    const plain = computeAcidSuppression(base);
    const withAntacid = computeAcidSuppression({ ...base, antacidDose: 100 });
    expect(withAntacid.gastricPH).toBeGreaterThan(plain.gastricPH);
    expect(withAntacid.acidOutput).toBeCloseTo(plain.acidOutput, 6);
  });
});

describe('statin / LDL engine', () => {
  it('a high untreated LDL stays high with no drug', () => {
    const r = computeStatinEffect({ statinDose: 0, cetpDose: 0, baselineLDL: 5 });
    expect(r.plasmaLDL).toBeGreaterThan(4.5);
    expect(r.synthesisFraction).toBeCloseTo(1, 6);
  });

  it('a statin lowers LDL, and the drop comes from blocking cholesterol synthesis', () => {
    const treated = computeStatinEffect({ statinDose: 100, cetpDose: 0, baselineLDL: 5 });
    const untreated = computeStatinEffect({ statinDose: 0, cetpDose: 0, baselineLDL: 5 });
    expect(treated.plasmaLDL).toBeLessThan(untreated.plasmaLDL);
    expect(treated.synthesisFraction).toBeLessThan(untreated.synthesisFraction);
  });

  it('doubling the dose does not halve LDL — the effect saturates', () => {
    const low = computeStatinEffect({ statinDose: 50, cetpDose: 0, baselineLDL: 5 });
    const high = computeStatinEffect({ statinDose: 200, cetpDose: 0, baselineLDL: 5 });
    const dropLow = 5 - low.plasmaLDL;
    const dropHigh = 5 - high.plasmaLDL;
    expect(dropHigh).toBeLessThan(dropLow * 2 + 0.01);
  });

  it('LDL never reaches zero even at maximal statin dose', () => {
    const r = computeStatinEffect({ statinDose: 200, cetpDose: 0, baselineLDL: 5 });
    expect(r.plasmaLDL).toBeGreaterThan(0.5);
  });

  it('a CETP inhibitor pushes LDL below what the statin alone achieves', () => {
    const statinOnly = computeStatinEffect({ statinDose: 100, cetpDose: 0, baselineLDL: 5 });
    const plusCetp = computeStatinEffect({ statinDose: 100, cetpDose: 100, baselineLDL: 5 });
    expect(plusCetp.plasmaLDL).toBeLessThan(statinOnly.plasmaLDL);
  });
});

describe('COX / NSAID engine', () => {
  const base = { nonselectiveDose: 0, cox2Dose: 0, inflammatoryDrive: 80 };

  it('with no drug the GI tract is protected and fever is unchanged', () => {
    const r = computeCoxInhibition(base);
    expect(r.gastricProtection).toBeGreaterThan(95);
    expect(r.antiInflammatory).toBeLessThan(40);
  });

  it('a nonselective NSAID treats the inflammation but erodes gastric protection', () => {
    const r = computeCoxInhibition({ ...base, nonselectiveDose: 100 });
    expect(r.antiInflammatory).toBeGreaterThan(
      computeCoxInhibition(base).antiInflammatory,
    );
    expect(r.gastricProtection).toBeLessThan(60);
  });

  it('a COX-2-selective inhibitor spares the stomach while still treating fever', () => {
    const r = computeCoxInhibition({ ...base, cox2Dose: 100 });
    expect(r.gastricProtection).toBeGreaterThan(80);
    expect(r.antiInflammatory).toBeGreaterThan(70);
  });

  it('benefit and gastric risk move in opposite directions as the nonselective dose rises', () => {
    const low = computeCoxInhibition({ ...base, nonselectiveDose: 20 });
    const high = computeCoxInhibition({ ...base, nonselectiveDose: 150 });
    expect(high.antiInflammatory).toBeGreaterThan(low.antiInflammatory);
    expect(high.gastricProtection).toBeLessThan(low.gastricProtection);
  });
});
