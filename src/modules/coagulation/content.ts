import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { CoagPresetName } from './engine/presets';

export const coagulationContent: ExplainerContent<CoagPresetName> = {
  title: 'Why two clotting times localise the defect',
  sections: [
    {
      heading: 'Two times interrogate two stretches of one cascade',
      paragraphs: [
        'The screening panel works by interrogating different stretches of the same cascade. The PT sees the extrinsic limb — factor VII — plus the common pathway beyond it. The APTT sees the intrinsic limb — factors XII, XI, IX and VIII — plus that same common pathway. So a long APTT with a normal PT localises the defect to the intrinsic limb (haemophilia), a long PT with a relatively spared APTT points at factor VII (warfarin, whose shortest-lived factor it is), and both prolonged together points at the shared limb or the liver that makes all of it. Bleeding time is blind to the cascade entirely and reports only on platelets, which is why thrombocytopenia and aspirin are its exact mirror image.',
      ],
      demos: [
        { preset: 'normal', watch: 'PT and APTT' },
        { preset: 'hemophiliaA', watch: 'APTT' },
        { preset: 'warfarin', watch: 'PT' },
        { preset: 'liverDisease', watch: 'PT and APTT' },
      ],
    },
    {
      heading: 'Thrombin recruits the cofactors that make more thrombin',
      paragraphs: [
        'Haemostasis has to be explosive to work at all, and thrombin is what makes it so: it feeds back to activate factors V, VIII and XI, the very cofactors needed to make more thrombin. A trace therefore recruits a burst. This is the second genuine positive-feedback loop in this app after the ovulatory LH surge, and like that one it has a threshold — below a minimum the burst never ignites, which is precisely what a severe factor deficiency does.',
      ],
    },
    {
      heading: 'That explosiveness is why the brakes matter so much',
      paragraphs: [
        'That explosiveness is also why the brakes matter so much. Antithrombin neutralises thrombin and factor Xa continuously and heparin accelerates it about a thousandfold, which is why heparin works in minutes while warfarin — which starves the liver of usable vitamin K — takes days. Protein C, activated by thrombin bound to thrombomodulin, switches off factors Va and VIIIa: the cascade carries its own brake, triggered by its own product, and that is what keeps a clot confined to the injury instead of propagating down the vessel.',
      ],
      demos: [
        { preset: 'heparin', watch: 'APTT' },
        { preset: 'dic', watch: 'fibrinogen' },
      ],
    },
    {
      heading: 'A durable clot needs both arms, and they fail differently',
      paragraphs: [
        'A durable clot needs both arms of haemostasis, and they fail in different ways. The platelet plug seals the breach within seconds but is mechanically fragile; the fibrin mesh takes longer to build and is what gives the clot tensile strength. Either one alone leaves the patient bleeding, which is exactly why the screen tests them separately — the cascade times say nothing about platelets, and the bleeding time says nothing about the cascade. Note too that the panel is a property of the blood rather than of any particular clot: you can run it without injuring anything, which is why it works as a screening test.',
      ],
      demos: [
        { preset: 'thrombocytopenia', watch: 'bleeding time' },
      ],
    },
    {
      heading: 'Von Willebrand disease sits across both arms at once',
      paragraphs: [
        'Von Willebrand disease sits across both arms at once, and that is what makes it confusing on paper. Von Willebrand factor is what platelets use to adhere to damaged vessel wall, so losing it prolongs the bleeding time with a completely normal platelet count — a functional defect rather than a numerical one. But vWF is also the carrier protein for factor VIII, so factor VIII falls with it and the APTT prolongs too. One deficiency, two abnormal tests, in two different arms. Mucosal bleeding is its signature, in contrast to the deep joint and muscle bleeds of haemophilia.',
      ],
      demos: [
        { preset: 'vonWillebrand', watch: 'bleeding time' },
      ],
    },
    {
      heading: 'A normal PT does not mean normal haemostasis',
      paragraphs: [
        'A normal PT does not mean normal haemostasis, and haemophilia is the proof. Tissue factor pathway inhibitor quenches the extrinsic limb within seconds of it firing, so that limb only ever provides the spark — every bit of sustained thrombin generation comes from the intrinsic amplification loop. Trigger an injury with factor VIII at 2% and watch it: the PT is perfectly normal, the initial burst starts, and then thrombin collapses and no durable clot forms. Finally, compare DIC with liver disease. Both prolong PT and APTT and drop fibrinogen, but only DIC — simultaneous runaway clotting and bleeding through consumption — sends the D-dimer through the roof, and that single value is what tells them apart.',
      ],
    },
  ],
};
