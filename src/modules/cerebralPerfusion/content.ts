import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { CerebralPresetName } from './engine/presets';

export const cerebralPerfusionContent: ExplainerContent<CerebralPresetName> = {
  title: 'A box that cannot expand, and the pressure that gets you perfused',
  sections: [
    {
      heading: 'A fixed box means anything added must displace something',
      paragraphs: [
        'The skull is a fixed volume holding three things — brain, blood and cerebrospinal fluid — so anything added must displace something. That is the Monro-Kellie doctrine, and its consequence is the single most important shape in this module. CSF and venous blood leave first, and while they still can, pressure barely moves at all. Load the compensated mass: 68 mL of tumour sitting inside a skull with an entirely normal intracranial pressure. That patient looks well and has almost nothing left in reserve.',
      ],
      demos: [
        { preset: 'normal', watch: 'ICP' },
      ],
    },
    {
      heading: 'Once the reserve runs out, pressure rises exponentially',
      paragraphs: [
        'Then the reserve runs out and pressure rises exponentially. Watch the elastance readout — the pressure bought by one more millilitre — go from almost nothing to enormous over a narrow range of volume. It explains why a slow tumour is tolerated for months and then decompensates over hours, why the last few millilitres of a haematoma matter far more than the first fifty, and why draining a small volume from a skull at the steep end drops the pressure dramatically. The curve works in the patient\'s favour exactly once.',
      ],
      demos: [
        { preset: 'compensatedMass', watch: 'elastance' },
        { preset: 'decompensatedMass', watch: 'ICP' },
      ],
    },
    {
      heading: 'What the brain needs is perfusion, not a normal pressure',
      paragraphs: [
        'What the brain actually needs is not a normal intracranial pressure but adequate perfusion, and cerebral perfusion pressure is what is left of the arterial pressure once the pressure squeezing the vessels is subtracted: CPP = MAP − ICP. Note the readout uses whichever is higher, the intracranial or the venous pressure, because a vessel is compressed by whatever surrounds it. That is why a tight collar or a head-down position raises intracranial pressure, and why the first manoeuvre in a rising ICP is to sit the patient up and straighten their neck.',
      ],
      demos: [
        { preset: 'hydrocephalus', watch: 'CPP' },
        { preset: 'venousObstruction', watch: 'ICP' },
      ],
    },
    {
      heading: 'Injury abolishes autoregulation and flow then follows pressure',
      paragraphs: [
        'Autoregulation holds cerebral blood flow near constant across a wide band of perfusion pressures, so ordinary swings in blood pressure change nothing. Injury abolishes it, and flow then follows pressure passively — the same arterial pressure that was harmless becomes ischaemia at one end and hyperaemia at the other. Compare the intact and abolished presets at an identical blood pressure and the difference in flow is the whole argument for controlling blood pressure carefully in a head injury.',
      ],
      demos: [
        { preset: 'lostAutoregulation', watch: 'cerebral blood flow' },
      ],
    },
    {
      heading: 'Carbon dioxide is the fastest lever anyone has on pressure',
      paragraphs: [
        'Carbon dioxide is the most powerful cerebral vasodilator there is, and it acts within a minute — which makes hyperventilation the fastest lever anyone has on intracranial pressure. Constricting the vessels shrinks cerebral blood volume, and in a full skull that is the quickest volume available to remove. But it is temporising rather than treatment: the same constriction reduces flow, so it buys pressure at the cost of perfusion. Run the hyperventilated and hypoventilated presets against the same mass and the difference is the difference between a survivable injury and a catastrophe.',
      ],
      demos: [
        { preset: 'hyperventilated', watch: 'ICP' },
        { preset: 'hypoventilated', watch: 'ICP' },
      ],
    },
    {
      heading: 'The vasodilatory cascade protects the vessel and harms the skull',
      paragraphs: [
        'Two consequences are worth holding on to. The first is the vasodilatory cascade: a falling perfusion pressure dilates vessels to protect flow, but dilated vessels hold more blood, and more blood in a full skull raises pressure, which lowers perfusion pressure further. Protective at the vessel, disastrous at the box. The second is the Cushing response — the brainstem raising arterial pressure to restore perfusion, with reflex bradycardia from the resulting baroreceptor stretch. Hypertension with a falling pulse is a combination that should never be explained away.',
      ],
      demos: [
        { preset: 'bbbDisruption', watch: 'ICP' },
      ],
    },
  ],
};
