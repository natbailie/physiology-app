import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export const toxicologyContent: ExplainerContent = {
  title: 'Poisoning is a race against the clock',
  sections: [
    {
      heading: 'What the nomogram is for',
      paragraphs: [
        'A paracetamol overdose is not judged on the dose alone. The liver distributes the drug into a volume that scales with body size and clears it with a half-life of a few hours, so the plasma concentration falls as time passes after the peak. The question "how dangerous is this overdose" is really "where on that falling curve is this patient now" - and that is exactly what the treatment line answers.',
        'The Rumack-Matthew line runs from 100 mg/L at four hours down to 15 mg/L at twenty-four hours on a log scale. A point above the line at any hour means enough drug is still circulating to injure the liver without NAC; below it, the concentration has already fallen out of harm\'s way. The line anchors the module - drag the dose and the hours dials and the point climbs or falls through the picture.',
      ],
    },
    {
      heading: 'Pull the dose and the hour apart',
      paragraphs: [
        'Two dials do all the important work. The dose sets how high the plasma starts; the hours move the patient along the falling curve after it. Same dose, later presentation, lower plasma - but also a smaller share of the eight-hour window still remaining, and the two counter-read against each other.',
        'A big dose at hour two is a high, steep point above the line that a learner can watch fall below it over the next hours. A modest dose seen late is already below the line and low risk, which is the counter-intuitive part of toxicology: the danger lives in the position on the curve, not in "how many tablets".',
      ],
      demos: [{ preset: 'earlyMassiveDose', label: 'A big dose, presented early' }],
    },
    {
      heading: 'The eight-hour NAC window',
      paragraphs: [
        'N-acetylcysteine replaces the glutathione the drug has spent and lets the liver handle the remaining load. The reason it is such a strong teaching clock is the time dependence: protection is near-total when NAC starts within eight hours, fades by twenty-four, and later gives little defence because the liver damage is already underway.',
        'The module models that window directly. Set the "when NAC is started" dial before the present hour and the treatment frame shows it running; push it later and the protection fraction drops while the risk meter climbs. Eight hours is the number to carry into the exam room.',
      ],
      demos: [{ preset: 'latePresentation', label: 'The same scale of overdose, seen at 16 h' }],
    },
    {
      heading: 'Charcoal only earns its place in the first hours',
      paragraphs: [
        'Activated charcoal does what it does inside the gut: it binds unabsorbed drug and stops it reaching the circulation. It cannot reach a dose already absorbed, so its value dies as the hours pass and the curve falls. In the model, up to half the load is captured when charcoal is given very early - which is why the "charcoal within the hour" preset settles so much lower than the same dose presented later.',
      ],
      demos: [{ preset: 'charcoalWins', label: 'Charcoal within the hour' }],
    },
    {
      heading: 'The patterns that recur across the shelf',
      paragraphs: [
        'The presets wrap the clinical arcs in one word each: a massive early overdose that is already above the line; a late presentation with the window closing; the window already missed; a sub-toxic exposure that needs nothing at all. Each is a different answer to the same two questions - where on the curve is the patient, and how much of the window remains.',
        'Because the engine is input-pure, every preset settles the moment it is chosen, which is exactly what a quiet ED lets a learner explore: the same dose becomes "awful" or "fine" depending purely on the hour at which it is seen and the half-life that has already been clearing it in the background. A learner who has dragged the hour dial both ways owns the relationship in a way a flashcard never delivers: the curve is falling the whole time, and the treatment landing zone is a moving target rather than a fixed number.',
      ],
    },
    {
      heading: 'The secondary poisonings that revise alongside',
      paragraphs: [
        'The kinetic skeleton here — an absorbed dose, a volume of distribution, first-order clearance, an antidote whose value is set by timing — is the same skeleton salicylate, iron and the alcohols run on, with different half-lives and different antidote windows. Salicylate has no NAC window but a very long half-life and a nomogram of its own; iron has no good antidote at all, which makes charcoal and urgent gastroscopy the only levers; the alcohols have specific enzyme-targeting antidotes (fomepizole, ethanol) but the same taught shape: time since ingestion, dose, and how much window remains before a point of no return. Learning paracetamol thoroughly gives the formula for the whole shelf, because every poisoning exam question is the same two questions dressed in different molecules.',
      ],
    },
    {
      heading: 'What the readouts are telling you',
      paragraphs: [
        'Plasma paracetamol is the presented number, in mg/L. The nomogram line is the treatment threshold at that same hour - compare them as a ratio rather than as absolutes, since a "high" plasma late in the curve may still sit below the line. The absorbed dose keeps the 75 mg/kg UK threshold in view. The antidote window is the countdown; the hepatotoxicity risk is the outcome of every dial at once, and the number that drops most reliably when NAC is started early rather than late.',
      ],
    },
  ],
};