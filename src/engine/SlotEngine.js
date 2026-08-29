/**
 * SlotEngine.js — Swasthya Setu Real-Time Slot Management
 *
 * This engine acts as the shared "backend" between:
 *  - Patient Dashboard (reads available slots, books them)
 *  - Physician Dashboard (sets doctor availability/schedule)
 *
 * All data is persisted in localStorage so both portals share state
 * in real-time within the same browser session (simulates a live API).
 *
 * Key concepts:
 *  - DOCTOR_SCHEDULE: how many patients a doctor can see per 30-min slot
 *  - APPOINTMENTS: booked appointments (each consumes one slot)
 *  - SLOT STATUS: derived by counting booked vs capacity
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default capacity per 30-min slot (doctor sees N patients per slot) */
const DEFAULT_CAPACITY_PER_SLOT = 3;

/** Default OPD session windows per doctor (24-hour format) */
const DEFAULT_MORNING_WINDOW   = { start: '09:00', end: '12:30' }; // 09:00–12:30
const DEFAULT_AFTERNOON_WINDOW = { start: '12:30', end: '16:00' }; // 12:30–16:00
const DEFAULT_EVENING_WINDOW   = { start: '16:00', end: '19:30' }; // 16:00–19:30

/** localStorage key prefixes */
const KEY_SCHEDULE   = 'ss_doctor_schedule_';    // + doctorId_dateStr
const KEY_APPTS      = 'ss_appointments_';        // + patientKey
const KEY_GLOBAL_APPTS = 'ss_global_appointments'; // all appointments across patients

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Generate all 30-min slot strings between two HH:MM times */
function generateSlots(startTime, endTime) {
  const slots = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;

  while (cur < end) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    const label12 = formatTo12Hr(h, m);
    slots.push({ time24: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, label: label12 });
    cur += 30;
  }
  return slots;
}

function formatTo12Hr(h, m) {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`;
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ─── Schedule Management (Doctor side) ───────────────────────────────────────

/**
 * Get or create a doctor's schedule for a given date.
 * Returns { slots: [ { time24, label, capacity, isOpen } ] }
 */
export function getDoctorSchedule(doctorId, dateStr = todayStr()) {
  const key = KEY_SCHEDULE + doctorId + '_' + dateStr;
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);

  // Auto-generate default schedule
  const morningSlots   = generateSlots(DEFAULT_MORNING_WINDOW.start, DEFAULT_MORNING_WINDOW.end);
  const afternoonSlots = generateSlots(DEFAULT_AFTERNOON_WINDOW.start, DEFAULT_AFTERNOON_WINDOW.end);
  const eveningSlots   = generateSlots(DEFAULT_EVENING_WINDOW.start, DEFAULT_EVENING_WINDOW.end);

  const allSlots = [
    ...morningSlots.map(s => ({ ...s, session: 'morning',   capacity: DEFAULT_CAPACITY_PER_SLOT, isOpen: true })),
    ...afternoonSlots.map(s => ({ ...s, session: 'afternoon', capacity: DEFAULT_CAPACITY_PER_SLOT, isOpen: true })),
    ...eveningSlots.map(s => ({ ...s, session: 'evening',   capacity: DEFAULT_CAPACITY_PER_SLOT, isOpen: true })),
  ];

  // Slightly randomize capacity between 2–4 for realism
  const schedule = {
    doctorId,
    dateStr,
    slots: allSlots.map(s => ({
      ...s,
      capacity: Math.floor(Math.random() * 3) + 2, // 2, 3 or 4
    }))
  };

  localStorage.setItem(key, JSON.stringify(schedule));
  return schedule;
}

/**
 * Doctor: Update a specific slot's open/close status & capacity
 */
export function setSlotAvailability(doctorId, dateStr, time24, isOpen, capacity = null) {
  const schedule = getDoctorSchedule(doctorId, dateStr);
  schedule.slots = schedule.slots.map(s => {
    if (s.time24 === time24) {
      return { ...s, isOpen, ...(capacity !== null ? { capacity } : {}) };
    }
    return s;
  });
  const key = KEY_SCHEDULE + doctorId + '_' + dateStr;
  localStorage.setItem(key, JSON.stringify(schedule));
}

// ─── Global Appointment Store ─────────────────────────────────────────────────

function readGlobalAppointments() {
  const raw = localStorage.getItem(KEY_GLOBAL_APPTS);
  return raw ? JSON.parse(raw) : [];
}

function writeGlobalAppointments(appts) {
  localStorage.setItem(KEY_GLOBAL_APPTS, JSON.stringify(appts));
}

// ─── Slot Query (Patient side) ────────────────────────────────────────────────

/**
 * Count how many appointments are already booked for a doctor/date/slot.
 */
function countBookings(doctorId, dateStr, time24) {
  const all = readGlobalAppointments();
  return all.filter(a =>
    a.doctorId === doctorId &&
    a.dateStr === dateStr &&
    a.time24 === time24 &&
    a.status !== 'cancelled'
  ).length;
}

/**
 * Get live slot availability for a doctor on a given date.
 * Returns structured data for Step 2 UI.
 *
 * @returns {
 *   morning:   [ SlotInfo ],
 *   afternoon: [ SlotInfo ],
 *   evening:   [ SlotInfo ]
 * }
 * Where SlotInfo = { label, time24, capacity, booked, slotsLeft, state }
 * state: 'open' | 'fast' | 'full' | 'closed'
 */
export function getLiveSlots(doctorId, dateStr = todayStr()) {
  const schedule = getDoctorSchedule(doctorId, dateStr);
  const now = new Date();
  const isToday = dateStr === todayStr();

  const processed = schedule.slots.map(slot => {
    const booked = countBookings(doctorId, dateStr, slot.time24);
    const slotsLeft = Math.max(0, slot.capacity - booked);

    // For today, mark past slots as closed
    let isPast = false;
    if (isToday) {
      const [h, m] = slot.time24.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      isPast = slotMinutes <= nowMinutes;
    }

    let state;
    if (!slot.isOpen || isPast) state = 'closed';
    else if (slotsLeft === 0)    state = 'full';
    else if (slotsLeft === 1)    state = 'fast';
    else                          state = 'open';

    return {
      label:     slot.label,
      time24:    slot.time24,
      session:   slot.session,
      capacity:  slot.capacity,
      booked,
      slotsLeft,
      state
    };
  });

  return {
    morning:   processed.filter(s => s.session === 'morning'),
    afternoon: processed.filter(s => s.session === 'afternoon'),
    evening:   processed.filter(s => s.session === 'evening'),
  };
}

// ─── Booking (Patient side) ───────────────────────────────────────────────────

/**
 * Book a slot. Returns { success, token, error }
 */
export function bookSlot({ doctorId, doctorName, hospitalName, patientName, patientKey, dateStr, time24, slotLabel, reason }) {
  const schedule = getDoctorSchedule(doctorId, dateStr);
  const slot = schedule.slots.find(s => s.time24 === time24);

  if (!slot) return { success: false, error: 'Slot not found' };
  if (!slot.isOpen) return { success: false, error: 'Slot is closed by the doctor' };

  const booked = countBookings(doctorId, dateStr, time24);
  if (booked >= slot.capacity) return { success: false, error: 'Slot is fully booked' };

  // Generate OPD token
  const allAppts = readGlobalAppointments();
  const todayTokens = allAppts.filter(a => a.dateStr === dateStr && a.doctorId === doctorId);
  const tokenNum = todayTokens.length + 1;
  const token = `#${String(tokenNum).padStart(3, '0')}`;

  const appointment = {
    id: `appt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    doctorId,
    doctorName,
    hospitalName,
    patientName,
    patientKey,
    dateStr,
    time24,
    slotLabel,
    reason: reason || '',
    status: 'confirmed',
    token,
    bookedAt: new Date().toISOString()
  };

  // Write to global store
  allAppts.push(appointment);
  writeGlobalAppointments(allAppts);

  // Also write to per-patient store (for the patient's Upcoming Appointments)
  const patientKey2 = `swasthya_patient_appointments_${patientKey}`;
  const patientAppts = JSON.parse(localStorage.getItem(patientKey2) || '[]');
  patientAppts.unshift({
    id: appointment.id,
    doctor: doctorName,
    hospital: hospitalName,
    date: dateStr,
    time: slotLabel,
    token,
    status: 'Confirmed',
    reason: reason || ''
  });
  localStorage.setItem(patientKey2, JSON.stringify(patientAppts));

  return { success: true, token, appointment };
}

/**
 * Cancel a booked appointment by ID
 */
export function cancelAppointment(appointmentId) {
  const all = readGlobalAppointments();
  const updated = all.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' } : a);
  writeGlobalAppointments(updated);
}

/**
 * Get all upcoming appointments for a patient
 */
export function getPatientAppointments(patientKey) {
  const key = `swasthya_patient_appointments_${patientKey}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

/**
 * Doctor: Get their full queue for a given date (from global appointments)
 */
export function getDoctorQueue(doctorId, dateStr = todayStr()) {
  const all = readGlobalAppointments();
  return all
    .filter(a => a.doctorId === doctorId && a.dateStr === dateStr && a.status !== 'cancelled')
    .sort((a, b) => a.time24.localeCompare(b.time24));
}
