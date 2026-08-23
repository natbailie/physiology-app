import { useHashRoute, type RouteId } from '@/shared/hooks/useHashRoute';
import { AuthGate } from '@/auth/AuthGate';
import { useEntitlement } from '@/billing/useEntitlement';
import { Paywall } from '@/billing/Paywall';
import { PricingPage } from '@/billing/PricingPage';
import { HomePage } from '@/home/HomePage';
import { AccountPage } from '@/account/AccountPage';
import { CardiorenalPage } from '@/modules/cardiorenal/CardiorenalPage';
import { RespiratoryPage } from '@/modules/respiratory/RespiratoryPage';
import { HpaPage } from '@/modules/hpaAxis/HpaPage';
import { HptPage } from '@/modules/hptAxis/HptPage';
import { GastrointestinalPage } from '@/modules/gastrointestinal/GastrointestinalPage';
import { GlucoseRegulationPage } from '@/modules/glucoseRegulation/GlucoseRegulationPage';
import { CalciumHomeostasisPage } from '@/modules/calciumHomeostasis/CalciumHomeostasisPage';
import { MembranePotentialsPage } from '@/modules/membranePotentials/MembranePotentialsPage';
import { AutonomicNervousPage } from '@/modules/autonomicNervous/AutonomicNervousPage';
import { RenalTubularPage } from '@/modules/renalTubular/RenalTubularPage';
import { CardiacElectroPage } from '@/modules/cardiacElectro/CardiacElectroPage';
import { RespiratoryMechanicsPage } from '@/modules/respiratoryMechanics/RespiratoryMechanicsPage';
import { HpgAxisPage } from '@/modules/hpgAxis/HpgAxisPage';
import { EcgConductionPage } from '@/modules/ecgConduction/EcgConductionPage';
import { CoagulationPage } from '@/modules/coagulation/CoagulationPage';
import { ErythropoiesisPage } from '@/modules/erythropoiesis/ErythropoiesisPage';
import { ImmuneResponsePage } from '@/modules/immuneResponse/ImmuneResponsePage';
import { HypersensitivityPage } from '@/modules/hypersensitivity/HypersensitivityPage';
import { MuscleContractionPage } from '@/modules/muscleContraction/MuscleContractionPage';
import { ElectrolyteBalancePage } from '@/modules/electrolyteBalance/ElectrolyteBalancePage';
import { CapillaryExchangePage } from '@/modules/capillaryExchange/CapillaryExchangePage';
import { VenousReturnPage } from '@/modules/venousReturn/VenousReturnPage';
import { ShockStatesPage } from '@/modules/shockStates/ShockStatesPage';
import { FetalCirculationPage } from '@/modules/fetalCirculation/FetalCirculationPage';
import { NeuromuscularJunctionPage } from '@/modules/neuromuscularJunction/NeuromuscularJunctionPage';
import { CerebralPerfusionPage } from '@/modules/cerebralPerfusion/CerebralPerfusionPage';
import { VisionPage } from '@/modules/vision/VisionPage';
import { HearingPage } from '@/modules/hearing/HearingPage';
import { VestibularPage } from '@/modules/vestibular/VestibularPage';
import { SomaticSensationPage } from '@/modules/somaticSensation/SomaticSensationPage';
import { MotorControlPage } from '@/modules/motorControl/MotorControlPage';
import { ReferencePage } from '@/reference/ReferencePage';
import styles from './App.module.css';

/** Routes that are never a paid module: they must open whatever the subscription says. */
const UNGATED_ROUTES: ReadonlySet<RouteId> = new Set<RouteId>(['home', 'account', 'pricing']);

function App() {
  const route = useHashRoute();

  return (
    <AuthGate route={route}>
      <RoutedApp route={route} />
    </AuthGate>
  );
}

function RoutedApp({ route }: { route: RouteId }) {
  const { status, isUnlocked } = useEntitlement();

  if (!UNGATED_ROUTES.has(route)) {
    // Hold the render rather than flashing a paywall at someone who has in fact paid.
    if (status === 'loading') return <div className={styles.app} />;
    if (!isUnlocked(route)) {
      return (
        <div className={styles.app}>
          <Paywall moduleId={route} />
        </div>
      );
    }
  }

  return (
    <div className={styles.app}>
      {route === 'home' && <HomePage />}
      {route === 'account' && <AccountPage />}
      {route === 'pricing' && <PricingPage />}
      {route === 'cardiorenal' && <CardiorenalPage />}
      {route === 'respiratory' && <RespiratoryPage />}
      {route === 'hpaAxis' && <HpaPage />}
      {route === 'hptAxis' && <HptPage />}
      {route === 'gastrointestinal' && <GastrointestinalPage />}
      {route === 'glucoseRegulation' && <GlucoseRegulationPage />}
      {route === 'calciumHomeostasis' && <CalciumHomeostasisPage />}
      {route === 'membranePotentials' && <MembranePotentialsPage />}
      {route === 'autonomicNervous' && <AutonomicNervousPage />}
      {route === 'renalTubular' && <RenalTubularPage />}
      {route === 'cardiacElectro' && <CardiacElectroPage />}
      {route === 'respiratoryMechanics' && <RespiratoryMechanicsPage />}
      {route === 'hpgAxis' && <HpgAxisPage />}
      {route === 'ecgConduction' && <EcgConductionPage />}
      {route === 'coagulation' && <CoagulationPage />}
      {route === 'erythropoiesis' && <ErythropoiesisPage />}
      {route === 'immuneResponse' && <ImmuneResponsePage />}
      {route === 'hypersensitivity' && <HypersensitivityPage />}
      {route === 'muscleContraction' && <MuscleContractionPage />}
      {route === 'electrolyteBalance' && <ElectrolyteBalancePage />}
      {route === 'capillaryExchange' && <CapillaryExchangePage />}
      {route === 'venousReturn' && <VenousReturnPage />}
      {route === 'shockStates' && <ShockStatesPage />}
      {route === 'fetalCirculation' && <FetalCirculationPage />}
      {route === 'neuromuscularJunction' && <NeuromuscularJunctionPage />}
      {route === 'cerebralPerfusion' && <CerebralPerfusionPage />}
      {route === 'vision' && <VisionPage />}
      {route === 'hearing' && <HearingPage />}
      {route === 'vestibular' && <VestibularPage />}
      {route === 'somaticSensation' && <SomaticSensationPage />}
      {route === 'motorControl' && <MotorControlPage />}
      {route === 'reference' && <ReferencePage />}
    </div>
  );
}

export default App;
