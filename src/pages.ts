import { lazy, type ComponentType } from 'react';
import type { RouteId } from '@/shared/hooks/useHashRoute';

/**
 * A lazy page that can also be fetched ahead of being rendered.
 *
 * Navigation used to show NOTHING while a chunk arrived — the Suspense fallback is a deliberately
 * invisible box — so the gap between clicking a module and seeing it was however long the network
 * took. Warming the chunk on hover or on pointer-down closes that, and it is also what makes a
 * crossfade honest: `document.startViewTransition` captures the page as it is when the callback
 * commits, so starting one before the chunk has landed would capture the blank fallback and then
 * pop the real page in afterwards.
 */
export type PageComponent = ComponentType & { preload: () => Promise<unknown> };

function page(load: () => Promise<{ default: ComponentType }>): PageComponent {
  // The module promise is memoised by the bundler, so preloading and then rendering costs one
  // fetch; the `.then` that re-wraps the named export is all that runs twice.
  const Component = Object.assign(lazy(load), { preload: load });
  return Component as unknown as PageComponent;
}

/**
 * Every page except the landing grid is its own chunk, loaded on first visit — thirty-odd
 * simulators would otherwise ship as one bundle and the first load would pay for all of them.
 * The destructured `.then` keeps each named export compile-time checked.
 */
export const PAGES: Partial<Record<RouteId, PageComponent>> = {
  accessibility: page(() =>
    import('@/accessibility/AccessibilityPage').then(({ AccessibilityPage }) => ({ default: AccessibilityPage })),
  ),
  account: page(() => import('@/account/AccountPage').then(({ AccountPage }) => ({ default: AccountPage }))),
  privacy: page(() => import('@/account/PrivacyPage').then(({ PrivacyPage }) => ({ default: PrivacyPage }))),
  methodology: page(() => import('@/methodology/MethodologyPage').then(({ MethodologyPage }) => ({ default: MethodologyPage }))),
  'review-h': page(() => import('@/review/HReviewPage').then(({ HReviewPage }) => ({ default: HReviewPage }))),
  teacher: page(() => import('@/teacher/TeacherPage').then(({ TeacherPage }) => ({ default: TeacherPage }))),
  pricing: page(() => import('@/billing/PricingPage').then(({ PricingPage }) => ({ default: PricingPage }))),
  reference: page(() => import('@/reference/ReferencePage').then(({ ReferencePage }) => ({ default: ReferencePage }))),
  medications: page(() => import('@/medications/MedicationsPage').then(({ MedicationsPage }) => ({ default: MedicationsPage }))),
  cardiorenal: page(() => import('@/modules/cardiorenal/CardiorenalPage').then(({ CardiorenalPage }) => ({ default: CardiorenalPage }))),
  respiratory: page(() => import('@/modules/respiratory/RespiratoryPage').then(({ RespiratoryPage }) => ({ default: RespiratoryPage }))),
  hpaAxis: page(() => import('@/modules/hpaAxis/HpaPage').then(({ HpaPage }) => ({ default: HpaPage }))),
  hptAxis: page(() => import('@/modules/hptAxis/HptPage').then(({ HptPage }) => ({ default: HptPage }))),
  gastrointestinal: page(() => import('@/modules/gastrointestinal/GastrointestinalPage').then(({ GastrointestinalPage }) => ({ default: GastrointestinalPage }))),
  glucoseRegulation: page(() => import('@/modules/glucoseRegulation/GlucoseRegulationPage').then(({ GlucoseRegulationPage }) => ({ default: GlucoseRegulationPage }))),
  calciumHomeostasis: page(() => import('@/modules/calciumHomeostasis/CalciumHomeostasisPage').then(({ CalciumHomeostasisPage }) => ({ default: CalciumHomeostasisPage }))),
  membranePotentials: page(() => import('@/modules/membranePotentials/MembranePotentialsPage').then(({ MembranePotentialsPage }) => ({ default: MembranePotentialsPage }))),
  metabolism: page(() => import('@/modules/metabolism/MetabolismPage').then(({ MetabolismPage }) => ({ default: MetabolismPage }))),
  toxicology: page(() => import('@/modules/toxicology/ToxicologyPage').then(({ ToxicologyPage }) => ({ default: ToxicologyPage }))),
  anaesthesia: page(() => import('@/modules/anaesthesia/AnaesthesiaPage').then(({ AnaesthesiaPage }) => ({ default: AnaesthesiaPage }))),
  cognitiveNeuroscience: page(() => import('@/modules/cognitiveNeuroscience/CognitiveNeurosciencePage').then(({ CognitiveNeurosciencePage }) => ({ default: CognitiveNeurosciencePage }))),
  autonomicNervous: page(() => import('@/modules/autonomicNervous/AutonomicNervousPage').then(({ AutonomicNervousPage }) => ({ default: AutonomicNervousPage }))),
  renalTubular: page(() => import('@/modules/renalTubular/RenalTubularPage').then(({ RenalTubularPage }) => ({ default: RenalTubularPage }))),
  cardiacElectro: page(() => import('@/modules/cardiacElectro/CardiacElectroPage').then(({ CardiacElectroPage }) => ({ default: CardiacElectroPage }))),
  respiratoryMechanics: page(() => import('@/modules/respiratoryMechanics/RespiratoryMechanicsPage').then(({ RespiratoryMechanicsPage }) => ({ default: RespiratoryMechanicsPage }))),
  mechanicalVentilation: page(() => import('@/modules/mechanicalVentilation/MechanicalVentilationPage').then(({ MechanicalVentilationPage }) => ({ default: MechanicalVentilationPage }))),
  respiratoryFailure: page(() => import('@/modules/respiratoryFailure/RespiratoryFailurePage').then(({ RespiratoryFailurePage }) => ({ default: RespiratoryFailurePage }))),
  hpgAxis: page(() => import('@/modules/hpgAxis/HpgAxisPage').then(({ HpgAxisPage }) => ({ default: HpgAxisPage }))),
  ecgConduction: page(() => import('@/modules/ecgConduction/EcgConductionPage').then(({ EcgConductionPage }) => ({ default: EcgConductionPage }))),
  coagulation: page(() => import('@/modules/coagulation/CoagulationPage').then(({ CoagulationPage }) => ({ default: CoagulationPage }))),
  erythropoiesis: page(() => import('@/modules/erythropoiesis/ErythropoiesisPage').then(({ ErythropoiesisPage }) => ({ default: ErythropoiesisPage }))),
  immuneResponse: page(() => import('@/modules/immuneResponse/ImmuneResponsePage').then(({ ImmuneResponsePage }) => ({ default: ImmuneResponsePage }))),
  hypersensitivity: page(() => import('@/modules/hypersensitivity/HypersensitivityPage').then(({ HypersensitivityPage }) => ({ default: HypersensitivityPage }))),
  muscleContraction: page(() => import('@/modules/muscleContraction/MuscleContractionPage').then(({ MuscleContractionPage }) => ({ default: MuscleContractionPage }))),
  electrolyteBalance: page(() => import('@/modules/electrolyteBalance/ElectrolyteBalancePage').then(({ ElectrolyteBalancePage }) => ({ default: ElectrolyteBalancePage }))),
  capillaryExchange: page(() => import('@/modules/capillaryExchange/CapillaryExchangePage').then(({ CapillaryExchangePage }) => ({ default: CapillaryExchangePage }))),
  venousReturn: page(() => import('@/modules/venousReturn/VenousReturnPage').then(({ VenousReturnPage }) => ({ default: VenousReturnPage }))),
  shockStates: page(() => import('@/modules/shockStates/ShockStatesPage').then(({ ShockStatesPage }) => ({ default: ShockStatesPage }))),
  fetalCirculation: page(() => import('@/modules/fetalCirculation/FetalCirculationPage').then(({ FetalCirculationPage }) => ({ default: FetalCirculationPage }))),
  neuromuscularJunction: page(() => import('@/modules/neuromuscularJunction/NeuromuscularJunctionPage').then(({ NeuromuscularJunctionPage }) => ({ default: NeuromuscularJunctionPage }))),
  cerebralPerfusion: page(() => import('@/modules/cerebralPerfusion/CerebralPerfusionPage').then(({ CerebralPerfusionPage }) => ({ default: CerebralPerfusionPage }))),
  vision: page(() => import('@/modules/vision/VisionPage').then(({ VisionPage }) => ({ default: VisionPage }))),
  hearing: page(() => import('@/modules/hearing/HearingPage').then(({ HearingPage }) => ({ default: HearingPage }))),
  vestibular: page(() => import('@/modules/vestibular/VestibularPage').then(({ VestibularPage }) => ({ default: VestibularPage }))),
  somaticSensation: page(() => import('@/modules/somaticSensation/SomaticSensationPage').then(({ SomaticSensationPage }) => ({ default: SomaticSensationPage }))),
  motorControl: page(() => import('@/modules/motorControl/MotorControlPage').then(({ MotorControlPage }) => ({ default: MotorControlPage }))),
  liverPhysiology: page(() => import('@/modules/liverPhysiology/LiverPhysiologyPage').then(({ LiverPhysiologyPage }) => ({ default: LiverPhysiologyPage }))),
  pregnancy: page(() => import('@/modules/pregnancy/PregnancyPage').then(({ PregnancyPage }) => ({ default: PregnancyPage }))),
  anteriorPituitary: page(() => import('@/modules/anteriorPituitary/AnteriorPituitaryPage').then(({ AnteriorPituitaryPage }) => ({ default: AnteriorPituitaryPage }))),
  adrenalCortex: page(() => import('@/modules/adrenalCortex/AdrenalCortexPage').then(({ AdrenalCortexPage }) => ({ default: AdrenalCortexPage }))),
  adrenalMedulla: page(() => import('@/modules/adrenalMedulla/AdrenalMedullaPage').then(({ AdrenalMedullaPage }) => ({ default: AdrenalMedullaPage }))),
  bloodGroups: page(() => import('@/modules/bloodGroups/BloodGroupsPage').then(({ BloodGroupsPage }) => ({ default: BloodGroupsPage }))),
  thermoregulation: page(() => import('@/modules/thermoregulation/ThermoregulationPage').then(({ ThermoregulationPage }) => ({ default: ThermoregulationPage }))),
  enzymeKinetics: page(() => import('@/modules/enzymeKinetics/EnzymeKineticsPage').then(({ EnzymeKineticsPage }) => ({ default: EnzymeKineticsPage }))),
  cellCycle: page(() => import('@/modules/cellCycle/CellCyclePage').then(({ CellCyclePage }) => ({ default: CellCyclePage }))),
  exercisePhysiology: page(() => import('@/modules/exercisePhysiology/ExercisePhysiologyPage').then(({ ExercisePhysiologyPage }) => ({ default: ExercisePhysiologyPage }))),
  coronaryCirculation: page(() => import('@/modules/coronaryCirculation/CoronaryCirculationPage').then(({ CoronaryCirculationPage }) => ({ default: CoronaryCirculationPage }))),
  digestionAbsorption: page(() => import('@/modules/digestionAbsorption/DigestionAbsorptionPage').then(({ DigestionAbsorptionPage }) => ({ default: DigestionAbsorptionPage }))),
  inflammation: page(() => import('@/modules/inflammation/InflammationPage').then(({ InflammationPage }) => ({ default: InflammationPage }))),
  micturition: page(() => import('@/modules/micturition/MicturitionPage').then(({ MicturitionPage }) => ({ default: MicturitionPage }))),
};
