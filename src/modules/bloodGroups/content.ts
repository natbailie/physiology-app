import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { BloodPresetName } from './engine/presets';

export const bloodGroupsContent: ExplainerContent<BloodPresetName> = {
  title: 'The antibodies are already there, which is why the wrong unit is a five-minute emergency',
  sections: [
    {
      heading: 'The antibodies are already there before any exposure',
      paragraphs: [
        'ABO incompatibility is unique in medicine: the recipient needs no prior exposure, because gut flora share the A and B antigens and everyone makes antibodies against the ones they lack from infancy. Type O carries both anti-A and anti-B; type AB carries neither — hence the phrases universal donor and universal recipient, which describe red cells only. Load each mismatch and read the matrix: what matters is whether the recipient\'s preformed antibodies meet antigens on the donor\'S cells. An O patient given AB blood is maximal disaster; an AB patient given O red cells is silent — the dangerous plasma came out of the unit at processing.',
      ],
      demos: [
        { preset: 'compatibleMatch', watch: 'haemolysis' },
      ],
    },
    {
      heading: 'Preformed IgM fixes complement, so the reaction is immediate',
      paragraphs: [
        'The reaction that follows is immediate and intravascular because preformed IgM fixes complement directly on the transfused cells. Free haemoglobin floods the plasma, haemoglobinuria turns the urine dark, the complement cascade consumes itself, and the anaphylatoxins trigger shock — with DIC and acute renal injury as the two consequences that kill. Severity scales with volume: a few millilitres cause fever and loin pain, a full unit causes the complete syndrome. This is why the first fifteen millilitres are infused slowly with someone watching: stop the unit early and the reaction stops with it.',
      ],
      demos: [
        { preset: 'oToA', watch: 'free haemoglobin' },
        { preset: 'massiveMismatch', watch: 'blood pressure' },
      ],
    },
    {
      heading: 'Rh has the opposite personality and needs a first exposure',
      paragraphs: [
        'Rh incompatibility is the opposite personality. An Rh-negative person has no natural anti-D — it requires prior sensitisation by pregnancy or transfusion. So the first Rh+ unit given to an Rh− recipient causes nothing visible (but creates the antibody), while every later exposure meets an IgG response that clears cells EXTRAVASCULARLY through the spleen over days. Run the sensitised preset: severity climbs on a timescale of days rather than minutes, free haemoglobin stays modest, complement barely moves — a falling haemoglobin count next week instead of a collapse today. The same IgG biology crossing the placenta is why anti-D prophylaxis exists for Rh-negative mothers.',
      ],
      demos: [
        { preset: 'rhSensitisedMismatch', watch: 'haemolysis' },
      ],
    },
    {
      heading: 'The timelines are what the clinical discipline follows',
      paragraphs: [
        'The clinical discipline follows the timelines. Acute haemolytic reactions present during the infusion — fever, loin pain, dark urine, hypotension — and management is stopping immediately, fluids to protect the kidney, and supportive care for DIC. Delayed reactions appear three to fourteen days later as unexplained anaemia with a positive direct antiglobulin test. Both are prevented the same way: group, screen, crossmatch, and never let the bedside check replace the laboratory one. The compatibility matrix is not bureaucracy; it is the only thing standing between routine therapy and the fastest way to kill a patient with a bag of red cells.',
      ],
    },
    {
      heading: 'Universal donor describes a component, not a person',
      paragraphs: [
        'One quiet subtlety completes the picture: red-cell units are almost free of donor plasma, which is why "universal donor" O blood can go anywhere as packed cells — but whole blood or plasma from an O donor carries both antibodies and cannot be given so freely. The universal labels describe components, not people. And Rh adds a second dimension to every one of these decisions: an Rh-negative recipient should receive negative cells whenever possible, not because the first unit will hurt, but because it teaches the immune system what to do to the next one. Anti-D prophylaxis for Rh-negative mothers is exactly this logic applied preventively — deny the immune system its first lesson and all future lessons become unnecessary.',
      ],
      demos: [
        { preset: 'aToO', watch: 'haemolysis' },
        { preset: 'abUniversal', watch: 'haemolysis' },
        { preset: 'oRecipientGetsAb', watch: 'haemolysis' },
      ],
    },
    {
      heading: 'Haemolytic disease is the same lesson running across a placenta',
      paragraphs: [
        'Haemolytic disease of the newborn is that same lesson playing out across the placenta. A sensitised Rh-negative mother carries IgG against Rh — the one antibody class small enough to cross — so each pregnancy with a Rh-positive fetus becomes a slow, continuous transfusion reaction running in reverse: her antibody flows in, and the fetus\'s cells flow out to destruction in the fetal spleen. There is no complement burst and no free haemoglobin; instead haemoglobin drifts down over weeks, bilirubin climbs, and severe cases progress to hydrops. The prophylaxis logic is exquisitely timed: anti-D given within seventy-two hours of delivery destroys fetal cells before the mother\'s immune system learns them, protecting the next pregnancy while being useless once sensitisation exists. This baby fine, the next one in danger, and a single injection at the right moment standing between them — few ideas in medicine reward understanding the mechanism quite so directly.',
      ],
      demos: [
        { preset: 'hdnAffected', watch: 'fetal haemoglobin' },
        { preset: 'hdnProtected', watch: 'fetal haemoglobin' },
        { preset: 'hdnMissedProphylaxis', watch: 'fetal haemoglobin' },
      ],
    },
  ],
};
