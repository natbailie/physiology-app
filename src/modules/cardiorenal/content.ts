import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export const cardiorenalContent: ExplainerContent = {
  title: 'How the heart and kidneys hold pressure steady',
  paragraphs: [
    'Blood pressure (MAP) is the product of how much blood the heart pumps (cardiac output) and how constricted the vessels are (SVR). When MAP drops, baroreceptors trigger a fast reflex — seconds, not minutes — raising heart rate and vascular tone.',
    'If low pressure or low filtration persists, the kidneys release renin, activating angiotensin II (vasoconstriction) and aldosterone (sodium/fluid retention) over minutes — the RAAS pathway — to rebuild blood volume and pressure.',
    'When volume becomes excessive instead, stretched atria release ANP, which relaxes vessels and promotes salt/water loss — the direct counter-regulatory opposite of RAAS.',
    'In heart failure, a weak ventricle can’t make use of the extra volume RAAS retains, so fluid keeps accumulating (congestion) without pressure ever fully normalizing — this is the cardiorenal syndrome shown in the "Heart failure" preset.',
  ],
};
