import { resolveVoiceEntity } from './resolveVoiceSelection.js';

export function createPatientSelectionActions({ hospitals, doctors, selectedHospital, selectedDoctor, hospitalAliases, openTab, onHospital, onDoctor, onCrossHospitalDoctor, onDoctorProfile, onCrossHospitalDoctorProfile, communities = [], onCommunity }) {
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
    openDoctorProfile(command) {
      const local = selectedHospital?.doctors || [];
      const labels = item => [item.name, item.specialty, item.speciality];
      const doctor = resolveVoiceEntity(local, command, labels) || resolveVoiceEntity(doctors, command, labels)
        || (!command?.target && !command?.value ? selectedDoctor : null);
      if (!doctor) return false;
      openTab('appointments');
      if (local.some(item => item.id === doctor.id)) onDoctorProfile(doctor);
      else onCrossHospitalDoctorProfile(doctor);
      return true;
    },
    openCommunity(command) {
      const community = resolveVoiceEntity(communities, command, item => [item.title, ...Object.values(item.title_i18n || {})]);
      if (!community) return false;
      openTab('communities');
      onCommunity(community);
      return true;
    },
  };
}
