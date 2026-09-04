import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const patientId = '11111111-1111-4111-8111-111111111111';
const appointment = {
  id: '22222222-2222-4222-8222-222222222222', patient_id: patientId,
  doctor_id: 'test-doctor', hospital_id: 'test-hospital', date: '2020-01-01',
  time_24: '09:00', time_label: '09:00 AM', status: 'confirmed', token_number: 'APT-20200101-001',
  doctors: { name: 'Dr. Test Doctor', speciality: 'General Medicine' }, hospitals: { name: 'Test Hospital' },
};
let submitted = null;
await page.route('**/rest/v1/**', async route => {
  const request = route.request();
  const url = new URL(request.url());
  const resource = url.pathname.split('/').pop();
  let data = [];
  if (resource === 'appointments') data = [appointment];
  if (resource === 'doctors') data = [{ id: 'test-doctor', name: 'Dr. Test Doctor', speciality: 'General Medicine', hospital_id: 'test-hospital', is_active: true }];
  if (resource === 'hospitals') data = [{ id: 'test-hospital', name: 'Test Hospital', type: 'Government' }];
  if (resource === 'slot_schedules') data = ['09:00', '10:00'].map(time => ({
    doctor_id: 'test-doctor', date: url.searchParams.get('date')?.replace('eq.', ''),
    time_24: time, time_label: `${time} AM`, session: 'morning', capacity: 3, is_open: true,
  }));
  if (resource === 'get_appointment_slot_availability') data = ['09:00', '10:00'].map(time => ({ time_24: time, booked_count: 0, slots_left: 3 }));
  if (resource === 'reschedule_missed_appointment') {
    submitted = request.postDataJSON();
    data = { ...appointment, date: submitted.p_date, time_24: submitted.p_time_24, time_label: submitted.p_time_label, token_number: 'APT-NEW-001' };
  }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
});
await page.route('**/functions/v1/**', async route => {
  const { action, params } = route.request().postDataJSON() || {};
  let data = {};
  if (action === 'availability') data = { slots: ['09:00','10:00'].map(time24 => ({ time24, label: `${time24} AM`, session:'morning',capacity:6,slotsLeft:6,state:'open',isPast:false })),onLeave:false };
  if (action === 'reschedule') {
    submitted = params;
    data = { ...appointment, date:params.p_date,time_24:params.p_time_24,time_label:params.p_time_label,token_number:'APT-NEW-001' };
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
});
await page.addInitScript(({ patientId }) => {
  localStorage.setItem('swasthya_session', JSON.stringify({
    isAuthenticated: true, userRole: 'patient', language: 'en',
    patient: { id: patientId, name: 'Test Patient', phone: '9999999999', abhaId: 'test-abha' },
  }));
}, { patientId });
try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3001/patient-dashboard');
  await page.getByRole('button', { name: 'Reschedule missed appointment with Dr. Test Doctor' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reschedule missed appointment' });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  await dialog.getByLabel('1. Choose a new date').fill(date);
  const firstTime = dialog.getByRole('button', { name: '09:00 AM', exact: true });
  const secondTime = dialog.getByRole('button', { name: '10:00 AM', exact: true });
  await firstTime.click();
  assert.equal(await firstTime.getAttribute('aria-pressed'), 'true');
  assert.match(await dialog.getByRole('status').textContent(), /09:00 AM/);
  await secondTime.click();
  assert.equal(await firstTime.getAttribute('aria-pressed'), 'false');
  assert.equal(await secondTime.getAttribute('aria-pressed'), 'true');
  assert.match(await dialog.getByRole('status').textContent(), /10:00 AM/);
  assert.equal(await page.getByText('Click to reschedule', { exact: true }).count(), 0);
  await page.screenshot({ path: join(tmpdir(), 'swasthya-reschedule-ui-test.png'), fullPage: false });
  await dialog.getByRole('button', { name: 'Confirm new slot', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(submitted.p_date, date);
  assert.equal(submitted.p_time_24, '10:00');
  assert.equal(submitted.p_time_label, '10:00 AM');
  assert.deepEqual(errors, []);
  console.log('PASS: time selection, changing time, summary, helper removal, and submitted date/time.');
} finally {
  await browser.close();
}
