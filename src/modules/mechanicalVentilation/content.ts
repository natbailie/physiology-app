import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { MvPresetName } from './engine/presets';

export const mechanicalVentilationContent: ExplainerContent<MvPresetName> = {
  title: 'Ventilating a patient, and why the numbers the dial shows are not the numbers that matter',
  sections: [
    {
      heading: 'The mode decides how much of the breath the pressure actually produces',
      paragraphs: [
        'The ventilator can be the whole breath, a helper, or not a breath at all. Invasive ventilation is an endotracheal tube that splints the upper airway and lets the machine drive the entire tidal volume from its own pressure; BiPAP (non-invasive) delivers a supported breath through a mask but leaks some of it; CPAP delivers no breath at all — a constant pressure that keeps the airway patent while the patient does every litre of the work. Changing the mode is not swapping one knob for another: it decides how much of the minute ventilation the machine is producing, and therefore how much of it would vanish if the patient stopped breathing. That is why a neuromuscular patient on a mask is a step away from failure, while the same patient intubated is safe for the night.',
      ],
      demos: [
        { preset: 'normal', watch: 'tidal volume' },
        { preset: 'neuromuscular', watch: 'alveolar ventilation' },
      ],
    },
    {
      heading: 'CPAP does one thing that nothing else in this module can',
      paragraphs: [
        'CPAP is a pressure that never breathes for you, and its whole point is the thing it keeps open. In obstructive sleep apnoea the pharynx is a floppy air-soft-tissue tube that collapses when inspiratory suction is applied; a constant positive airway pressure simply stents it apart from the moment it is dialled. Turn the OSA preset on and raise EPAP, and the tidal volume climbs back from a dominant 57 mmHg PaCO2 as the collapse resolves. The same slider does nothing at all for a patient whose lungs are stiff, because a floppy airway was never their problem — which is the first lesson in matching a machine to a disease rather than to a syndrome.',
      ],
      demos: [
        { preset: 'osaHypoventilation', watch: 'tidal volume' },
      ],
    },
    {
      heading: 'Oxygen treats the shunt; pressure support treats the work',
      paragraphs: [
        'The two gases separate cleanly because they leak at different points. Hypoxia is a ventilation-perfusion problem — blood flows through lung that is not being ventilated, so it never meets oxygen — and the fix is either more FiO2, washed easily into well-ventilated units, or recruitment with pressure to open the collapsed ones. Hypercapnia is a work and clearance problem: the muscles cannot move enough air, so CO2 accumulates, and the fix is supporting those muscles (pressure support) or dropping the dead space. An ARDS patient needs PEEP and oxygen, not a faster rate — the rate does nothing for a shunt. A neuromuscular patient needs pressure support, and feeding them oxygen would paper over a ventilator that is about to stop.',
      ],
      demos: [
        { preset: 'ards', watch: 'PaO2' },
        { preset: 'neuromuscular', watch: 'PaCO2' },
      ],
    },
    {
      heading: 'Auto-PEEP is pressure the dial did not set, and it is double-edged',
      paragraphs: [
        'A trapped breath is a pressure you did not dial. When an obstructed lung cannot empty before the next breath arrives, the air that is left over exerts its own end-expiratory pressure on top of the PEEP you set — auto-PEEP, sometimes several cmH2O above the dial. The COPD preset shows it stacking as flow slows to 17 cmH2O of total PEEP. Auto-PEEP re-expands alveoli the way PEEP does, so a little is helpful; too much risks barotrauma and quietly depresses cardiac output by raising intrathoracic pressure and venous return. The way out of the double edge is to slow the rate and lengthen expiration rather than to raise the dial — often the single best move for a wheezy trapped lung.',
      ],
      demos: [
        { preset: 'copd', watch: 'total PEEP' },
      ],
    },
    {
      heading: 'Driving pressure is what actually injures the lung',
      paragraphs: [
        'Two patients can have the same peak pressure and very different lungs. The driving pressure — plateau or peak minus PEEP — is the pressure that actually distends the alveolus; the PEEP sits on top of it elevating both numbers without stretching anything. In ARDS with compliance of 25, a modest 22 cmH2O peak over 3 cmH2O PEEP produces a 19 cmH2O driving pressure that keeps the lung injured and the P/F ratio stuck at 180. Recruitment is the rescue — raise PEEP, open the collapsed units, and the effective shunt falls, so the same peak now delivers more gas exchange for less injury. The learner tracks driving pressure, not peak pressure, because peak can look reassuringly normal on a stiff lung while the injury is happening underneath it.',
      ],
      demos: [
        { preset: 'ards', watch: 'driving pressure' },
      ],
    },
    {
      heading: 'Every breath the vent borrows, the muscle stops doing',
      paragraphs: [
        'Support and effort are trading places, not two separate things. Set a pressure-support breath and the ventilator performs part of the inspiratory work that the patient\'s diaphragm would otherwise have to supply, so the effort meter drops. Give them everything and the effort falls to near zero and the muscles are effectively resting — which is the therapeutic goal in neuromuscular failure but a danger in a patient who is merely tired, because the diaphragm was doing that work for a reason. The load is worth measuring against the cost: a fully supported patient who stops triggering is a patient who has stopped breathing, and every preset disappears when you take the pressure back out from under them.',
      ],
    },
  ],
};