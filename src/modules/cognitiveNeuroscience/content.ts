import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { CognitionPresetName } from './engine/presets';

export const cognitionContent: ExplainerContent<CognitionPresetName> = {
  title: 'Arousal is a dial, not a dimmer',
  sections: [
    {
      heading: 'The inverted-U is the whole neuroscience exam',
      paragraphs: [
        'Performance is not a monotonic reward for trying harder — it climbs with arousal toward a mid-range peak and then falls away as arousal keeps rising. The Yerkes-Dodson curve is that shape, and it is the single most-examined relation in the cognitive syllabus because it explains the two failures students most often misattribute: the quiet learner who cannot get going, and the brilliant one who panics and freezes. This module plots the curve for the task being attempted and places the learner on it, so "why did I underperform when I cared so much" becomes a position on a graph rather than a mood.',
      ],
      demos: [
        { preset: 'relaxedLearning', watch: 'Performance index' },
      ],
    },
    {
      heading: 'Difficulty moves where the peak sits',
      paragraphs: [
        'The subtle part of the inverted-U is that the task itself relocates the optimum: a familiar, easy skill performs best at moderate arousal, while a hard, novel problem performs best at LOW arousal, so the same adrenaline that sharpens a practised pianist destroys a candidate in the viva. The task optimum arrow and the dashed-column position on this module follow exactly that shift — raise the demand slider and the optimum walks down the arousal axis, taking the whole curve with it, until the learner who was at a perfect 45% is now on the far shoulder of a peak that moved away from them.',
      ],
      demos: [
        { preset: 'examStress', watch: 'Task optimum' },
      ],
    },
    {
      heading: 'Working memory is a seven-plus-or-minus-two ceiling',
      paragraphs: [
        'What the learner is holding occupies a finite rack of chunks — Miller\'s seven, give or take two — and distraction and fatigue do not add chunks, they consume capacity that the task was supposed to use. The rack on this diagram fills as the memory load climbs, and slipping in a ringing phone or a short night steals occupancy rather than producing an error by itself: the learner has simply run out of chalk. That is why the rack is drawn before the performance curve — the same misallocation shows up downstream as an inability to hold the problem while solving it.',
      ],
      demos: [
        { preset: 'distractedClassroom', watch: 'Working memory occupancy' },
      ],
    },
    {
      heading: 'Effort is spent from a reserve that fatigue erodes',
      paragraphs: [
        'Executive effort is an expensive resource, meted out from a reserve that the tired brain can barely open. The deployed-effort bar is the record of who opened it: alert learners draw freely, sleep-deprived learners find their reserve door almost shut no matter how much they want to try. This is the physiology behind "I wanted to work but could not start" — motivation sets the price, the reserve decides whether the price can be paid. The fatigue slider is the lever, and the sleep-deprived preset is the worst-case proof that effort is not a choice.',
      ],
      demos: [
        { preset: 'sleepDeprived', watch: 'Deployed effort' },
      ],
    },
    {
      heading: 'Demand crosses a cliff, not a slope',
      paragraphs: [
        'There is a line on the bottom meter where the task demand exceeds what the reserve and the genuine arousal state can cover, and performance does not glide downhill toward it — it falls through it. Below the line, small changes in reserve or arousal buy small changes in output; beyond it, the same inputs buy nothing because the problem has overflowed the resources any amount of wanting can summon. The demand-overshoot reading and the red segment beyond the reserve line make the cliff visible, and the panic preset is deliberately parked on the wrong side of it.',
      ],
      demos: [
        { preset: 'panicAttack', watch: 'Demand overshoot' },
      ],
    },
    {
      heading: 'The zone is a position, not a personality trait',
      paragraphs: [
        'Flow — the absorbed, effortless-feeling peak of performance — looks like a special talent and behaves like a co-ordinate: arousal near the task\'s optimum, working memory with headroom to spare, and demand inside the reserve line. The in-the-zone preset lands on all three at once, and the same learner can be moved off them by changing a single slider, which is the therapeutic hope the module exists to carry. Exam-season advice is usually a set of moral commands; the model\'s advice is a set of positions to dial back towards.',
      ],
      demos: [
        { preset: 'inTheZone', watch: 'Arousal optimality' },
      ],
    },
    {
      heading: 'What the readouts are telling you',
      paragraphs: [
        'The six tiles are the six quantities a coach would actually optimise: the performance index is the outcome, working-memory occupancy says whether the rack is full, deployed effort records what the reserve allowed, arousal optimality names how near the task\'s own peak the learner sits, demand overshoot is the distance past the cliff, and the task optimum is the arousal this problem wants. Change one slider and watch which of the six moves first — that ordering is the mechanism, and it is the difference between telling a student to calm down and knowing which dial is actually blowing it.',
      ],
    },
  ],
};