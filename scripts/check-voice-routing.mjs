import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createPatientSelectionActions } from '../src/voicenav/PatientVoiceActions.js';

// Opt-in live diagnostic; synthetic catalog only, never writes patient records.
const source = await fs.readFile(new URL('../src/voicenav/VoiceAIService.js', import.meta.url), 'utf8');
const url = source.match(/https:\/\/[^']+\.supabase\.co/)[0];
const key = source.match(/sb_publishable_[^']+/)[0];
const hospital = { id: 'test-hospital-42', name: 'City Care Hospital', doctors: [{ id: 'test-doctor-9', name: 'Dr. Meera Rao', specialty: 'Cardiology' }] };
const state = { hospital: null, doctor: null, tab: 'history' };
const communities = [{ id: 'test-group-51', title: 'Diabetes Support', disease_key: 'diabetes' }, { id: 'test-group-52', title: 'Heart Health', disease_key: 'cardiology' }];
const showProfile = doctor => { state.doctor = doctor; state.view = 'doctor_profile'; };
const selection = () => createPatientSelectionActions({ hospitals: [hospital], doctors: hospital.doctors, selectedHospital: state.hospital, hospitalAliases: h => [h.name], openTab: tab => { state.tab = tab; }, onHospital: h => { state.hospital = h; }, onDoctor: d => { state.doctor = d; }, onCrossHospitalDoctor: d => { state.doctor = d; }, onDoctorProfile: showProfile, onCrossHospitalDoctorProfile: showProfile, communities, onCommunity: community => { state.community = community.id; } });
const actions = [
  { intent: 'select_hospital', description: `Select hospital by exact ID in target and name in value: ${JSON.stringify([hospital])}` },
  { intent: 'select_doctor', description: `Select doctor by exact ID in target and name in value: ${JSON.stringify(hospital.doctors)}` },
  { intent: 'viewReports', description: 'Open the reports tab' },
  { intent: 'viewCommunities', description: 'Open all communities directory' },
  { intent: 'viewProfile', description: 'View the patient account profile' },
  { intent: 'open_doctor_profile', description: `View a doctor's profile, qualifications or reviews without booking. Put exact id in target and name in value. Doctors: ${JSON.stringify(hospital.doctors)}` },
  { intent: 'open_community', description: `Open a specific group using its exact id in target and title in value. Communities: ${JSON.stringify(communities)}` },
];
for (const [transcript, expected] of [
  ['मुझे सिटी केयर अस्पताल चुनना है', 'select_hospital'],
  ['I would like to consult Meera Rao please', 'select_doctor'],
  ['Leave this form and open my reports please', 'viewReports'],
  ['Before I book, let me see Meera Rao’s qualifications and reviews', 'open_doctor_profile'],
  ['मुझे डायबिटीज वाले लोगों का समूह दिखाइए', 'open_community'],
]) {
  const start = Date.now();
  const response = await fetch(`${url}/functions/v1/voice-ai`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` }, body: JSON.stringify({ action: 'intent', transcript, language: expected === 'select_hospital' ? 'hi' : 'en', pageId: 'patientDashboard', actions, expectsFreeText: true }), signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.intent, expected);
  if (expected === 'select_hospital') { assert.equal(selection().selectHospital(result), true); assert.equal(state.hospital, hospital); }
  if (expected === 'select_doctor') { assert.equal(selection().selectDoctor(result), true); assert.equal(state.doctor, hospital.doctors[0]); }
  if (expected === 'open_doctor_profile') { assert.equal(selection().openDoctorProfile(result), true); assert.equal(state.view, 'doctor_profile'); assert.equal(state.doctor, hospital.doctors[0]); }
  if (expected === 'open_community') { assert.equal(selection().openCommunity(result), true); assert.equal(state.tab, 'communities'); assert.equal(state.community, communities[0].id); }
  console.log(`PASS ${expected}: ${Date.now() - start}ms`);
}
