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
const KEY_PROXY_HOLDS = 'ss_slot_holds_proxy';     // Proxy hold / temporary lock store
const KEY_PACING      = 'ss_doctor_opd_pacing_';   // Doctor OPD pacing and consultation duration
const HOLD_TTL_MS     = 10 * 60 * 1000;           // renewable booking lease
const HOLD_MAX_TTL_MS = 30 * 60 * 1000;           // anti-hoarding ceiling

// ─── AI Dynamic OPD Load & Slot Throttling Engine ────────────────────────────

/**
 * Record when a doctor starts consulting with a patient
 */
export function recordConsultationStart(doctorId, appointmentId = null) {
  if (!doctorId) return;
  const key = KEY_PACING + doctorId;
  let state = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) state = JSON.parse(raw);
  } catch (e) {}

  state.currentAppointmentId = appointmentId;
  state.inConsultationSince = Date.now();
  state.lastUpdated = Date.now();
  state.doctorId = doctorId;

  localStorage.setItem(key, JSON.stringify(state));
  try {
    window.dispatchEvent(new CustomEvent('swasthya_pacing_changed', { detail: state }));
  } catch (e) {}
}

/**
 * Record when a doctor ends session / completes consultation with a patient
 */
export function recordConsultationEnd(doctorId, appointmentId = null) {
  if (!doctorId) return;
  const key = KEY_PACING + doctorId;
  let state = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) state = JSON.parse(raw);
  } catch (e) {}

  const now = Date.now();
  let durationMins = 8; // default baseline
  if (state.inConsultationSince) {
    durationMins = Math.max(1, Math.round((now - state.inConsultationSince) / 60000));
  }

  const completed = (state.completedConsultations || 0) + 1;
  const totalMins = (state.totalConsultationMinutes || 0) + durationMins;
  const avgMins = Math.round(totalMins / completed);

  state.inConsultationSince = null;
  state.currentAppointmentId = null;
  state.completedConsultations = completed;
  state.totalConsultationMinutes = totalMins;
  state.averageConsultationMinutes = avgMins;
  state.lastConsultationEndedAt = now;
  state.lastUpdated = now;

  localStorage.setItem(key, JSON.stringify(state));
  try {
    window.dispatchEvent(new CustomEvent('swasthya_pacing_changed', { detail: state }));
    window.dispatchEvent(new CustomEvent('swasthya_slot_hold_changed', { detail: { unthrottled: true, doctorId } }));
  } catch (e) {}
}

/**
 * Calculate live AI Doctor Pacing, Estimated Delay, and Dynamic Slot Throttling Status
 */
export function getDoctorPacingStatus(doctorId, dateStr = todayStr()) {
  if (!doctorId) return { throttleLevel: 'none', delayMinutes: 0, isThrottled: false, pacingMessage: '' };

  const key = KEY_PACING + doctorId;
  let state = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) state = JSON.parse(raw);
  } catch (e) {}

  const isToday = dateStr === todayStr();
  const now = Date.now();

  // Calculate current consultation duration if active
  let currentConsultationMinutes = 0;
  if (state.inConsultationSince) {
    currentConsultationMinutes = Math.max(0, Math.round((now - state.inConsultationSince) / 60000));
  }

  // Count waiting queue appointments today
  const allAppts = readGlobalAppointments();
  const docApptsToday = allAppts.filter(a => a.doctorId === doctorId && a.dateStr === dateStr && a.status !== 'cancelled');
  const waitingCount = docApptsToday.filter(a => a.status === 'in_consultation' || a.status === 'waiting' || a.status === 'in_queue').length;

  const avgDuration = state.averageConsultationMinutes || 10;
  const baselineSlotDuration = 10; // expected mins per patient

  // AI Delay Computation:
  // If in consultation > 15 mins, doctor is engaged in a complex/extended case
  let delayMinutes = 0;
  if (isToday) {
    if (currentConsultationMinutes > 12) {
      delayMinutes += (currentConsultationMinutes - baselineSlotDuration);
    }
    if (waitingCount > 2) {
      delayMinutes += (waitingCount - 2) * avgDuration;
    }
  }

  // Determine AI dynamic throttle level
  let throttleLevel = 'none'; // 'none' | 'moderate' | 'heavy'
  let isThrottled = false;
  let pacingMessage = '';

  if (state.manualOverride === 'pause') {
    throttleLevel = 'heavy';
    isThrottled = true;
    pacingMessage = 'Doctor engaged in Emergency / High Priority Ward Rounds. Immediate slots paused.';
  } else if (delayMinutes >= 25 || waitingCount >= 5 || currentConsultationMinutes >= 22) {
    throttleLevel = 'heavy';
    isThrottled = true;
    pacingMessage = `Doctor managing complex cases (Running ~${delayMinutes}m behind schedule). Immediate slots temporarily paused to prevent crowding.`;
  } else if (delayMinutes >= 15 || waitingCount >= 3 || currentConsultationMinutes >= 15) {
    throttleLevel = 'moderate';
    isThrottled = true;
    pacingMessage = `Heavy OPD Load (Running ~${delayMinutes}m behind schedule). Slot capacity dynamically buffered.`;
  }

  return {
    doctorId,
    dateStr,
    isToday,
    inConsultationSince: state.inConsultationSince,
    currentConsultationMinutes,
    waitingCount,
    averageConsultationMinutes: avgDuration,
    delayMinutes,
    throttleLevel,
    isThrottled,
    pacingMessage,
    completedCount: state.completedConsultations || 0
  };
}

/**
 * Manually override doctor pacing from Doctor or Admin Dashboard
 */
export function setDoctorPacingOverride(doctorId, mode = 'auto', note = '') {
  if (!doctorId) return;
  const key = KEY_PACING + doctorId;
  let state = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) state = JSON.parse(raw);
  } catch (e) {}

  state.manualOverride = mode; // 'auto' | 'throttle' | 'pause'
  state.overrideNote = note;
  state.lastUpdated = Date.now();

  localStorage.setItem(key, JSON.stringify(state));
  try {
    window.dispatchEvent(new CustomEvent('swasthya_pacing_changed', { detail: state }));
    window.dispatchEvent(new CustomEvent('swasthya_slot_hold_changed', { detail: { override: true, doctorId } }));
  } catch (e) {}
}

// ─── Proxy Slot Lock & Hold Gatekeeper (IRCTC / Ticketmaster Architecture) ───

/**
 * Clean up expired holds from the proxy buffer
 */
export function cleanExpiredHolds() {
  try {
    const raw = localStorage.getItem(KEY_PROXY_HOLDS);
    if (!raw) return [];
    const now = Date.now();
    const list = JSON.parse(raw) || [];
    const valid = list.filter(h => h.expiresAt > now);
    if (valid.length !== list.length) {
      localStorage.setItem(KEY_PROXY_HOLDS, JSON.stringify(valid));
    }
    return valid;
  } catch (e) {
    return [];
  }
}

/**
 * Count active proxy holds for a slot (excluding current patient's own hold)
 */
export function countActiveHolds(doctorId, dateStr, time24, excludePatientId = null) {
  const valid = cleanExpiredHolds();
  return valid.filter(h => 
    h.doctorId === doctorId &&
    h.dateStr === dateStr &&
    h.time24 === time24 &&
    (!excludePatientId || h.patientId !== excludePatientId)
  ).length;
}

/**
 * Acquire a renewable slot hold in the local fallback layer.
 */
export function acquireSlotHold({ doctorId, dateStr, time24, patientId, patientName = '', clientRequestId = null }) {
  const valid = cleanExpiredHolds();
  const schedule = getDoctorSchedule(doctorId, dateStr);
  const slot = schedule.slots.find(s => s.time24 === time24);
  if (!slot || !slot.isOpen) {
    return { success: false, error: 'Slot is not open for booking' };
  }

  const confirmedBooked = countBookings(doctorId, dateStr, time24);

  const matchingRetry = valid.find(h =>
    clientRequestId && h.clientRequestId === clientRequestId &&
    h.patientId === patientId && h.doctorId === doctorId &&
    h.dateStr === dateStr && h.time24 === time24
  );
  if (matchingRetry) {
    return {
      success: true,
      holdId: matchingRetry.holdId,
      expiresAt: matchingRetry.expiresAt,
      maxExpiresAt: matchingRetry.maxExpiresAt,
      remainingSeconds: Math.max(0, Math.round((matchingRetry.expiresAt - Date.now()) / 1000))
    };
  }
  const otherHolds = valid.filter(h => 
    h.doctorId === doctorId && 
    h.dateStr === dateStr && 
    h.time24 === time24 && 
    h.patientId !== patientId
  ).length;

  // Capacity Gatekeeper: confirmed + active holds must be < capacity
  if (confirmedBooked + otherHolds >= slot.capacity) {
    return { 
      success: false, 
      error: 'This slot was just temporarily locked by another patient. Please select an alternate slot.' 
    };
  }

  // Remove any previous hold by this patient for any slot on this date
  const filtered = valid.filter(h => !(h.patientId === patientId && h.dateStr === dateStr));

  const now = Date.now();
  const expiresAt = now + HOLD_TTL_MS;
  const maxExpiresAt = now + HOLD_MAX_TTL_MS;
  const holdId = `hold_${now}_${Math.random().toString(36).slice(2, 7)}`;

  const newHold = {
    holdId,
    doctorId,
    dateStr,
    time24,
    patientId,
    patientName,
    clientRequestId,
    createdAt: now,
    expiresAt,
    maxExpiresAt
  };

  filtered.push(newHold);
  localStorage.setItem(KEY_PROXY_HOLDS, JSON.stringify(filtered));

  try {
    window.dispatchEvent(new CustomEvent('swasthya_slot_hold_changed', { detail: newHold }));
  } catch (e) {}

  return { success: true, holdId, expiresAt, maxExpiresAt, remainingSeconds: Math.round(HOLD_TTL_MS / 1000) };
}

/** Extend an active local lease without exceeding its anti-hoarding ceiling. */
export function renewSlotHold({ holdId, patientId }) {
  const valid = cleanExpiredHolds();
  const index = valid.findIndex(h => h.holdId === holdId && h.patientId === patientId);
  if (index < 0) return { success: false, error: 'Temporary slot hold has expired' };

  const now = Date.now();
  const maxExpiresAt = valid[index].maxExpiresAt || (valid[index].createdAt + HOLD_MAX_TTL_MS);
  if (maxExpiresAt <= now) return { success: false, error: 'Maximum booking time reached; please select the slot again' };

  valid[index] = {
    ...valid[index],
    expiresAt: Math.min(now + HOLD_TTL_MS, maxExpiresAt),
    maxExpiresAt,
    renewedAt: now,
  };
  localStorage.setItem(KEY_PROXY_HOLDS, JSON.stringify(valid));
  return { success: true, ...valid[index] };
}

/**
 * Release a proxy slot hold (when user cancels, changes slot, or navigates away)
 */
export function releaseSlotHold({ holdId = null, doctorId = null, dateStr = null, time24 = null, patientId = null } = {}) {
  const valid = cleanExpiredHolds();
  const filtered = valid.filter(h => {
    if (holdId && h.holdId === holdId) return false;
    if (patientId && doctorId && dateStr && time24 && h.patientId === patientId && h.doctorId === doctorId && h.dateStr === dateStr && h.time24 === time24) return false;
    if (patientId && h.patientId === patientId && !doctorId) return false;
    return true;
  });

  localStorage.setItem(KEY_PROXY_HOLDS, JSON.stringify(filtered));
  try {
    window.dispatchEvent(new CustomEvent('swasthya_slot_hold_changed', { detail: { released: true, patientId } }));
  } catch (e) {}
  return { success: true };
}

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

  const schedule = {
    doctorId,
    dateStr,
    slots: allSlots.map(s => ({
      ...s,
      capacity: DEFAULT_CAPACITY_PER_SLOT,
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
export function getLiveSlots(doctorId, dateStr = todayStr(), currentPatientId = null) {
  // Check if doctor is on approved leave / holiday
  try {
    const rawLeaves = localStorage.getItem('ss_db_doctor_leaves');
    if (rawLeaves) {
      const leaves = JSON.parse(rawLeaves) || [];
      const cleanId = String(doctorId || '').toLowerCase().trim();
      const cleanName = cleanId.replace(/^dr\.\s*|^dr\s*/i, '').trim();
      const found = leaves.find(l => {
        if (l.date !== dateStr) return false;
        const lDocId = String(l.doctor_id || l.doctorId || '').toLowerCase().trim();
        const lDocName = String(l.doctor_name || l.doctorName || '').toLowerCase().trim();
        const lDocNameClean = lDocName.replace(/^dr\.\s*|^dr\s*/i, '').trim();
        return lDocId === cleanId || lDocName === cleanId || lDocNameClean === cleanName || cleanId.includes(lDocId) || (lDocId && cleanId.includes(lDocId));
      });
      if (found) {
        return {
          onLeave: true,
          leaveReason: found.reason || 'On Approved Leave / Holiday',
          leaveInfo: found,
          morning: [],
          afternoon: [],
          evening: []
        };
      }
    }
  } catch (e) {}

  const schedule = getDoctorSchedule(doctorId, dateStr);
  const now = new Date();
  const isToday = dateStr === todayStr();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const pacing = getDoctorPacingStatus(doctorId, dateStr);

  const processed = schedule.slots.map(slot => {
    const [h, m] = slot.time_24?.split(':').map(Number) || slot.time24.split(':').map(Number);
    const slotMinutes = h * 60 + m;

    // For today, mark past slots as closed
    let isPast = false;
    if (isToday) {
      isPast = slotMinutes <= nowMinutes;
    }

    // Dynamic AI Throttling: If doctor is running behind or overloaded, dynamically throttle slots in the immediate window
    let isThrottledSlot = false;
    let effectiveCapacity = slot.capacity;

    if (isToday && pacing.isThrottled && !isPast) {
      const minsFromNow = slotMinutes - nowMinutes;
      // If slot is within next 90 minutes of the active delay
      if (minsFromNow >= 0 && minsFromNow <= 90) {
        if (pacing.throttleLevel === 'heavy') {
          isThrottledSlot = true;
          effectiveCapacity = 0;
        } else if (pacing.throttleLevel === 'moderate') {
          effectiveCapacity = Math.max(1, slot.capacity - 1);
        }
      }
    }

    const confirmedBooked = countBookings(doctorId, dateStr, slot.time24);
    const activeHolds = countActiveHolds(doctorId, dateStr, slot.time24, currentPatientId);
    const totalOccupied = confirmedBooked + activeHolds;
    const slotsLeft = Math.max(0, effectiveCapacity - totalOccupied);

    let state;
    if (!slot.isOpen || isPast || isThrottledSlot) state = 'closed';
    else if (slotsLeft === 0)    state = 'full';
    else if (slotsLeft === 1)    state = 'fast';
    else                          state = 'open';

    return {
      label:       slot.label,
      time24:      slot.time24,
      session:     slot.session,
      capacity:    effectiveCapacity,
      booked:      confirmedBooked,
      activeHolds,
      slotsLeft,
      state,
      isThrottled: isThrottledSlot
    };
  });

  return {
    onLeave: false,
    leaveReason: '',
    pacingInfo: pacing,
    morning:   processed.filter(s => s.session === 'morning'),
    afternoon: processed.filter(s => s.session === 'afternoon'),
    evening:   processed.filter(s => s.session === 'evening'),
  };
}

// ─── Booking (Patient side) ───────────────────────────────────────────────────

/**
 * Book a slot. Returns { success, token, error }
 */
export function bookSlot({ doctorId, doctorName, hospitalName, patientName, patientKey, dateStr, time24, slotLabel, reason, holdId = null }) {
  const schedule = getDoctorSchedule(doctorId, dateStr);
  const slot = schedule.slots.find(s => s.time24 === time24);

  if (!slot) return { success: false, error: 'Slot not found' };
  if (!slot.isOpen) return { success: false, error: 'Slot is closed by the doctor' };

  const booked = countBookings(doctorId, dateStr, time24);
  const otherHolds = countActiveHolds(doctorId, dateStr, time24, patientKey);
  if (booked + otherHolds >= slot.capacity) {
    return { success: false, error: 'Slot is fully booked or held by other patients' };
  }

  // Release proxy hold upon final booking
  releaseSlotHold({ holdId, doctorId, dateStr, time24, patientId: patientKey });

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
