import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { LiverPresetName } from './engine/presets';

export const liverPhysiologyContent: ExplainerContent<LiverPresetName> = {
  title: 'One pigment, three places to fail, and a urine dipstick that tells you which',
  sections: [
    {
      heading: 'One pigment with exactly three stages that can fail',
      paragraphs: [
        'Bilirubin is haemoglobin\'s breakdown product, and its journey has exactly three stages where things go wrong. It is made in the spleen as UNconjugated bilirubin — lipid-soluble, albumin-bound, unable to enter urine. The hepatocyte takes it up and conjugates it with glucuronic acid via UGT, making it water-soluble. It is then secreted down the bile ducts into the gut, where flora convert it to stercobilin (stool colour) and urobilinogen, part of which is reabsorbed and excreted in urine. Every pattern of jaundice is one of those three stages failing — too much load, failed processing, or blocked drainage — and each leaves a different fingerprint on the urine and stool before any scan is done.',
      ],
      demos: [
        { preset: 'normal', watch: 'bilirubin' },
      ],
    },
    {
      heading: 'The urine discriminates better than the eye does',
      paragraphs: [
        'The urine discriminates better than the eye does. Unconjugated bilirubin cannot enter urine however high it climbs — it is bound to albumin and insoluble — so a deeply jaundiced haemolytic patient has completely negative bilirubin dipstick while their urobilinogen floods the strip. Obstruction is the mirror image: conjugated pigment regurgitates into plasma and pours into urine (dark urine) while nothing reaches the gut, so urobilinogen vanishes and stools turn pale. Load the stone preset, read the four-way split — dark urine, pale stool, absent urobilinogen, ALT normal with ALP soaring — and you have diagnosed surgical jaundice from bedside tests alone.',
      ],
      demos: [
        { preset: 'haemolyticAnaemia', watch: 'urobilinogen' },
        { preset: 'choledocholithiasis', watch: 'urine bilirubin' },
        { preset: 'pancreaticHeadCa', watch: 'conjugated bilirubin' },
      ],
    },
    {
      heading: 'Hepatocellular injury raises both pigments at once',
      paragraphs: [
        'Hepatocellular injury does something subtler than either. Dying hepatocytes fail at uptake and conjugation, but they also lose the canalicular seal, so freshly conjugated bilirubin leaks straight back into plasma — which is why acute hepatitis raises both pigments and makes the urine positive for bilirubin despite being a processing failure. The enzymes tell the same story two ways: transaminases reflect hepatocyte necrosis; ALP reflects biliary epithelial pressure or infiltration. The R-factor — (ALT/ULN) ÷ (ALP/ULN) — turns that into arithmetic: above 5 hepatocellular, below 2 cholestatic. Run hepatitis against the stone and compare R.',
      ],
      demos: [
        { preset: 'acuteHepatitisA', watch: 'conjugated bilirubin' },
      ],
    },
    {
      heading: 'Capacity matters as much as direction',
      paragraphs: [
        'Capacity matters as much as direction. The conjugating pump saturates, which is why Gilbert\'s syndrome surfaces during fasting and illness: a mildly reduced UGT handles an ordinary load invisibly and decompensates visibly under stress, always unconjugated, always without enzyme change, always benign. Crigler-Najjar type I sits at the other end of the same axis — near-total UGT absence with unconjugated levels that threaten kernicterus from infancy, because unconjugated bilirubin is the only form that crosses the blood-brain barrier. Watch the kernicterus risk readout fall as albumin rises: binding capacity IS the defence.',
      ],
      demos: [
        { preset: 'gilbert', watch: 'unconjugated bilirubin' },
        { preset: 'criglerNajjar', watch: 'unconjugated bilirubin' },
        { preset: 'neonatalPhysiological', watch: 'unconjugated bilirubin' },
      ],
    },
    {
      heading: 'The chronic failure mode integrates everything',
      paragraphs: [
        'The chronic failure mode integrates everything. Cirrhosis loses excretory mass slowly, so mild jaundice arrives late; what announces decompensation is ammonia — the same failed hepatocyte mass stops converting gut-derived ammonia to urea, and the encephalopathy that follows tracks the toxin, not the pigment. Note also what bile stasis starves: bile salts are the vehicle for fat and fat-soluble vitamin absorption, which is why longstanding obstruction produces steatorrhoea and vitamin K deficiency with prolonged INR long before it produces confusion. The pancreas heads its own warning here: a slowly obstructing head-of-pancreas tumour can produce every finding on this chart painlessly — which is precisely why painless jaundice is never reassuring.',
      ],
      demos: [
        { preset: 'alcoholicCirrhosis', watch: 'ammonia' },
      ],
    },
  ],
};
