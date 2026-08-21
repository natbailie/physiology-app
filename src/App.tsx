import { useHashRoute } from '@/shared/hooks/useHashRoute';
import { HomePage } from '@/home/HomePage';
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
import { MuscleContractionPage } from '@/modules/muscleContraction/MuscleContractionPage';
import { ElectrolyteBalancePage } from '@/modules/electrolyteBalance/ElectrolyteBalancePage';
import { CapillaryExchangePage } from '@/modules/capillaryExchange/CapillaryExchangePage';
import { VenousReturnPage } from '@/modules/venousReturn/VenousReturnPage';
import { ShockStatesPage } from '@/modules/shockStates/ShockStatesPage';
import { FetalCirculationPage } from '@/modules/fetalCirculation/FetalCirculationPage';
import { NeuromuscularJunctionPage } from '@/modules/neuromuscularJunction/NeuromuscularJunctionPage';
import { CerebralPerfusionPage } from '@/modules/cerebralPerfusion/CerebralPerfusionPage';
import { ReferencePage } from '@/reference/ReferencePage';
import styles from './App.module.css';

function App() {
  const route = useHashRoute();

  return (
    <div className={styles.app}>
      {route === 'home' && <HomePage />}
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
      {route === 'muscleContraction' && <MuscleContractionPage />}
      {route === 'electrolyteBalance' && <ElectrolyteBalancePage />}
      {route === 'capillaryExchange' && <CapillaryExchangePage />}
      {route === 'venousReturn' && <VenousReturnPage />}
      {route === 'shockStates' && <ShockStatesPage />}
      {route === 'fetalCirculation' && <FetalCirculationPage />}
      {route === 'neuromuscularJunction' && <NeuromuscularJunctionPage />}
      {route === 'cerebralPerfusion' && <CerebralPerfusionPage />}
      {route === 'reference' && <ReferencePage />}
    </div>
  );
}

export default App;
