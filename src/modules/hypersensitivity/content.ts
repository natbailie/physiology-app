import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { HypersensitivityPresetName } from './engine/presets';

export const hypersensitivityContent: ExplainerContent<HypersensitivityPresetName> = {
  title: 'Four ways for the immune system to injure its own host',
  sections: [
    {
      heading: 'The damage is done by ordinary effectors doing ordinary jobs',
      paragraphs: [
        'A hypersensitivity reaction is not an immune system malfunctioning. It is an immune system working exactly as designed against something harmless, and the damage is done by the ordinary effector mechanisms doing their ordinary jobs. That is why the classification is mechanistic rather than descriptive: the useful question is never how severe the reaction is, but which effector answered the antigen, because that determines how fast it appears, what tissue it injures, what shows up on a lab report, and — most practically — what treatment does anything at all.',
      ],
      demos: [
        { preset: 'naiveFirstExposure', watch: 'mediators' },
      ],
    },
    {
      heading: 'Onset time is the first and best discriminator',
      paragraphs: [
        'Onset time is the first and best discriminator, and it is not a matter of degree. The four effectors are physically incapable of working at each other speeds. Type I uses mediators that are already synthesised and sitting in mast cell granules, so it needs only a trigger and can kill someone within fifteen minutes. Type IV needs T cells to traffic to a site, recognise antigen and then activate macrophages, and cells take days to arrive. Nothing that happens in ten minutes can be waiting for cells to migrate, and nothing that takes three days can be preformed granule contents. Watch the timeline: the axis is logarithmic because no linear one can hold both ends of that range.',
      ],
      demos: [
        { preset: 'typeIAnaphylaxis', watch: 'onset' },
        { preset: 'typeIVContactDermatitis', watch: 'onset' },
      ],
    },
    {
      heading: 'Sensitisation is the whole of type I',
      paragraphs: [
        'Sensitisation is the whole of type I, and it is why a first exposure is so often uneventful. The reaction needs antigen to cross-link IgE that is already bound to mast cells, so it is a product of two things rather than a sum — and a naive host has none of the second. Challenge the naive preset with a maximal dose and nothing whatever happens, which is the correct answer and the reason a first bee sting is a non-event. Then challenge the sensitised host with an identical dose and watch the blood pressure collapse. Nothing about the antigen changed between them; the only difference is what a previous exposure left behind.',
      ],
      demos: [
        { preset: 'treatedAnaphylaxis', watch: 'blood pressure' },
      ],
    },
    {
      heading: 'Type II and type III differ only in where the antigen sits',
      paragraphs: [
        'Type II and type III use the same antibody and the same complement, and the only difference between them is where the antigen is sitting. In type II the antigen is fixed on a cell surface, so the cell is what gets destroyed and the antibody is detectably stuck to it — which is precisely what a direct Coombs test finds, and why haptoglobin falls as free haemoglobin is mopped up. In type III the antigen is soluble, so antibody and antigen meet in the plasma, form complexes, and deposit wherever the vessels filter. Same weapon, different target, and completely different illnesses: one haemolyses, the other produces a vasculitis, nephritis and arthralgia.',
      ],
      demos: [
        { preset: 'typeIIHaemolysis', watch: 'Coombs' },
        { preset: 'typeIIISerumSickness', watch: 'complement' },
      ],
    },
    {
      heading: 'Immune complexes have a dose optimum, not a dose response',
      paragraphs: [
        'Immune complexes have a quirk the other types do not, which is that they need antigen and antibody in comparable amounts. A large excess of either produces complexes too small or too large to lodge in a vessel wall, so type III has a dose optimum rather than a dose-response. That is why serum sickness follows a substantial protein load rather than a trace of one, and why it appears days later — the reaction happens when rising antibody finally meets an antigen that is still circulating. Drop the antigen dose right down on the serum sickness preset and watch the reaction shrink, which is not what a naive dose-response intuition predicts.',
      ],
    },
    {
      heading: 'Type IV has no antibody and no complement anywhere in it',
      paragraphs: [
        'Type IV is the odd one out because there is no antibody in it anywhere, and no complement either. T cells recruit macrophages, and the macrophages do the damage. Two consequences follow that are worth holding onto. First, C3 and C4 come back stone normal, so a normal complement in a patient with an obvious immune-mediated reaction points hard at type IV. Second, the swelling is a cellular infiltrate rather than leaked plasma, so it is firm rather than soft and it takes days rather than minutes — the difference between an induration and a weal is something you can feel with a finger, and it is the mechanistic difference made physical. This is why a tuberculin test is read at 48 to 72 hours, and why reading it at six would call every positive patient negative.',
      ],
    },
    {
      heading: 'Transfusion is where all four mechanisms show up at once',
      paragraphs: [
        'Transfusion reactions are the best place to see all of this at once, because almost every one of them is a mechanism above driven by something in the bag. An ABO-incompatible unit is a type II reaction — antibody against an antigen fixed on a cell — with a positive Coombs, a collapsed haptoglobin, and a haemoglobin that falls after a transfusion instead of rising. Anaphylaxis in an IgA-deficient recipient is a type I reaction against donor plasma proteins, which is why washed cells prevent it. And a delayed haemolytic reaction is the same type II arm with the antibody arriving late, because it has to be re-made from memory against a minor antigen and making antibody takes days.',
      ],
      demos: [
        { preset: 'compatibleTransfusion', watch: 'haemolysis' },
        { preset: 'aboIncompatible', watch: 'Coombs' },
        { preset: 'delayedHaemolytic', watch: 'onset' },
      ],
    },
    {
      heading: 'Blood is the one exception to everything about sensitisation',
      paragraphs: [
        'Blood is also the one exception to everything said above about sensitisation, and it is the exception that kills people. Anti-A and anti-B are naturally occurring: they are present from infancy, without any prior exposure to foreign blood at all. So the reassurance that a first exposure is safe, which holds for bee venom and antibiotics and latex, does not hold here. A patient who has never been transfused in their life is fully primed for an ABO-incompatible unit, and the reaction begins within minutes of the first one they ever receive.',
      ],
      demos: [
        { preset: 'anaphylacticIgaDeficient', watch: 'blood pressure' },
      ],
    },
    {
      heading: 'Two common transfusion reactions are not hypersensitivity at all',
      paragraphs: [
        'Two common transfusion reactions are not hypersensitivity at all, and recognising that is a diagnosis rather than a failure to make one. A febrile non-haemolytic reaction is cytokines that accumulated in the bag during storage — fever, and a completely unremarkable panel otherwise, which is why it is prevented by leukodepletion rather than by anything done to the patient. And circulatory overload is plain hydrostatics: more volume than the circulation can clear, with the immune system involved nowhere. Note that overload is not a property of the unit but of the recipient, which is why the identical bag is unremarkable in one patient and drowns the next.',
      ],
      demos: [
        { preset: 'febrileNonHaemolytic', watch: 'complement' },
      ],
    },
    {
      heading: 'Overload and TRALI present alike and are treated oppositely',
      paragraphs: [
        'The sharpest discrimination in the whole module is between circulatory overload and TRALI, because they present identically and are treated in opposite directions. Both produce a breathless, hypoxic patient with a white chest film, and the saturation cannot separate them. The BNP can: it is released by a stretched ventricle, so it is high when the lung is wet from volume the heart cannot clear, and normal when the lung is wet because the pulmonary capillaries are leaking. That leak is caused by antibody in the donor plasma acting on the recipient neutrophils, which makes TRALI a property of the unit rather than of the patient — and means no amount of pre-medicating the recipient would have prevented it. One patient needs the volume taken off; the other needs respiratory support and would be harmed by the delay.',
      ],
      demos: [
        { preset: 'taco', watch: 'filling pressure' },
        { preset: 'trali', watch: 'filling pressure' },
      ],
    },
    {
      heading: 'Treatment follows the mechanism and nothing else',
      paragraphs: [
        'The practical payoff is that treatment follows the mechanism and nothing else. Mast cell and histamine blockade transforms a type I reaction and does literally nothing to the other three, because there is no histamine in them to oppose — set the blockade to maximum on each preset in turn and watch three of the four curves fail to move at all. Complement deficiency works the other way round, sparing the two arms that need complement to injure and leaving type I untouched. A treatment aimed at the wrong arm is not merely weaker; it is inert, which is the strongest argument there is for naming the mechanism before reaching for a drug.',
      ],
    },
  ],
};
