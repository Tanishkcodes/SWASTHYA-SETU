import { resolveVoiceEntity } from './resolveVoiceSelection.js';

export function createPatientSelectionActions({ hospitals, doctors, selectedHospital, hospitalAliases, openTab, onHospital, onDoctor, onCrossHospitalDoctor }) {
  return {
    selectHospital(command) {
      const hospital = resolveVoiceEntity(hospitals, command, hospitalAliases);
      if (!hospital) return false;
      openTab('appointments');
      onHospital(hospital);
      return true;
    },
    selectDoctor(command) {
      const local = selectedHospital?.doctors || [];
      const labels = item => [item.name, item.specialty, item.speciality];
      const doctor = resolveVoiceEntity(local, command, labels) || resolveVoiceEntity(doctors, command, labels);
      if (!doctor) return false;
      openTab('appointments');
      if (local.some(item => item.id === doctor.id)) onDoctor(doctor);
      else onCrossHospitalDoctor(doctor);
      return true;
    },
  };
}
