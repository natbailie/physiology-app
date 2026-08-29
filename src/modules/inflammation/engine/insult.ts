import { INSULT } from './constants';
import { clamp } from '@/shared/lib/math';
import type { InsultType } from './types';

/** How much insult the initial challenge deposits, relative units. */
export function depositedLoad(insultSeverityPct: number): number {
  return clamp(insultSeverityPct / 100, 0, 1.2) * 1.1;
}

/**
 * Net daily change in the driving load, before the immune system's share.
 *
 * Bacteria multiply on their own — the only insult that GROWS unattended, and the reason a
 * bacterial cause makes every other decision urgent. Crystals dissolve slowly on their own.
 * A foreign body does neither: it will still be there next month, which is precisely why it
 * turns the response chronic.
 */
export function insultGrowthPerDay(type: InsultType, insultLoad: number): number {
  switch (type) {
    case 'bacterial':
      return INSULT.BACTERIAL_GROWTH_PER_DAY * clamp(insultLoad, 0, 2) * (1 - clamp(insultLoad / 2.2, 0, 1));
    case 'sterileCrystal':
      return -INSULT.CRYSTAL_DISSOLVE_PER_DAY;
    case 'foreignBody':
      return -INSULT.FOREIGN_BODY_DEGRADE_PER_DAY;
  }
}

/** What antibiotics remove per day — meaningful only for bacteria, by definition. */
export function antibioticKillPerDay(antibioticEfficacyPct: number, type: InsultType): number {
  if (type !== 'bacterial') return 0;
  return 3.4 * clamp(antibioticEfficacyPct / 100, 0, 1);
}

/**
 * Biphasic immune clearance: neutrophils handle the early wave (hours 0-48), macrophages
 * take over the sustained siege (days 2-7). An untreated cellulitis resolves in roughly a
 * week because the macrophage handover is slower but more thorough than the neutrophil burst.
 * Crystals are cleared more slowly — even healthy neutrophils struggle with urate.
 * Foreign bodies cannot be phagocytosed at all.
 */
export function immuneKillPerDay(
  neutrophilPopulation: number,
  monocyteMacrophageActivity: number,
  innateImmuneFunctionPct: number,
  type: InsultType,
): number {
  if (type === 'foreignBody') return 0;
  const power = clamp(innateImmuneFunctionPct / 100, 0, 1);
  const neutKill = 0.25 * clamp(neutrophilPopulation, 0, 2) * power;
  const monoKill = 0.30 * clamp(monocyteMacrophageActivity, 0, 1.6) * power;
  const ceiling = type === 'sterileCrystal' ? 0.45 : 1;
  return (neutKill + monoKill) * ceiling;
}

/** Source control removes load directly — the surgeon's contribution to antimicrobial therapy. */
export function sourceControlRemovalPerDay(sourceControlPct: number): number {
  return 3.0 * clamp(sourceControlPct / 100, 0, 1);
}
