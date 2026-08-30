/**
 * db.js — Swasthya Setu Database Layer
 *
 * Unified API that wraps all Supabase operations with a localStorage fallback
 * so the app works even without credentials configured yet.
 *
 * Usage:
 *   import { db } from '../lib/db';
 *   const patient = await db.patients.upsert({ name, phone, age, gender });
 *   const appts   = await db.appointments.getByPatient(patientId);
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

// ─── LocalStorage Fallback Keys ───────────────────────────────────────────────
const LS = {
  patients:    'ss_db_patients',
  appointments:'ss_db_appointments',
  reports:     'ss_db_reports',
  schedules:   'ss_db_schedules',
};

function lsRead(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}
function lsWrite(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

const USE_SUPABASE = () => isSupabaseConfigured();

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function failure(error, fallback = null) {
  if (error) console.error('[Swasthya Setu database]', error.message || error);
  return { data: fallback, error };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENTS
// ═══════════════════════════════════════════════════════════════════════════════
const patients = {
  /**
   * Find or create a patient record by phone number.
   * Returns { data: patient, error }
   */
  async upsert({ name, phone, age, gender, language = 'en', abhaId = null, aadhaarLast4 = null, address = null, authMethod = null }) {
    if (USE_SUPABASE()) {
      let lookup = supabase.from('patients').select('*');
      if (phone) lookup = lookup.eq('phone', phone);
      else if (abhaId) lookup = lookup.eq('abha_id', abhaId);
      else lookup = lookup.eq('id', '00000000-0000-0000-0000-000000000000');
      const { data: existing, error: lookupError } = await lookup.maybeSingle();

      if (lookupError) return failure(lookupError);
      if (existing) {
        // Update name/age/language in case they changed
        const { data, error } = await supabase
          .from('patients')
          .update({ name, age, gender, language, abha_id: abhaId, aadhaar_last4: aadhaarLast4, address, auth_method: authMethod, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        return { data: data || existing, error };
      }

      // Create new
      const { data, error } = await supabase
        .from('patients')
        .insert({ name, phone, age, gender, language, abha_id: abhaId, aadhaar_last4: aadhaarLast4, address, auth_method: authMethod })
        .select()
        .single();
      return { data, error };
    }

    // ── localStorage fallback ──
    const all = lsRead(LS.patients);
    let patient = all.find(p => p.phone === phone);
    if (patient) {
      Object.assign(patient, { name, age, gender, language, updated_at: new Date().toISOString() });
    } else {
      patient = { id: uuid(), name, phone, age, gender, language, created_at: new Date().toISOString() };
      all.push(patient);
    }
    lsWrite(LS.patients, all);
    return { data: patient, error: null };
  },

  /** Get patient by phone */
  async getByPhone(phone) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();
      return { data, error };
    }
    const all = lsRead(LS.patients);
    return { data: all.find(p => p.phone === phone) || null, error: null };
  },

  /** Get patient by id */
  async getById(id) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    }
    const all = lsRead(LS.patients);
    return { data: all.find(p => p.id === id) || null, error: null };
  },

  async updateBloodGroup(id, bloodGroup) {
    if (!id) return { data: null, error: new Error('Patient session is required') };
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    return supabase.from('patients').update({ blood_group: bloodGroup, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOSPITALS
// ═══════════════════════════════════════════════════════════════════════════════
const hospitals = {
  async getAll() {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('name');
      return { data: data || [], error };
    }
    // Return built-in data when no Supabase
    return { data: _builtinHospitals, error: null };
  },

  async ensure(hospital) {
    if (!USE_SUPABASE()) return { data: hospital, error: null };
    const row = {
      id: hospital.id,
      name: hospital.name,
      address: hospital.address || null,
      city: hospital.city || null,
      type: hospital.type || 'Government',
      rating: Number(hospital.rating) || null,
    };
    const { data, error } = await supabase.rpc('ensure_booking_catalog', { p_hospital: row, p_doctor: null });
    return { data: error ? null : row, error };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCTORS
// ═══════════════════════════════════════════════════════════════════════════════
const doctors = {
  async getByHospital(hospitalId) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('is_active', true)
        .order('name');
      return { data: data || [], error };
    }
    // Fallback: return doctors matching hospital from built-in list
    return { data: _builtinDoctors.filter(d => d.hospital_id === hospitalId), error: null };
  },

  async getById(doctorId) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, hospitals(*)')
        .eq('id', doctorId)
        .single();
      return { data, error };
    }
    return { data: _builtinDoctors.find(d => d.id === doctorId) || null, error: null };
  },

  async ensure(doctor, hospitalId) {
    if (!USE_SUPABASE()) return { data: doctor, error: null };
    const row = {
      id: doctor.id,
      hospital_id: hospitalId,
      name: doctor.name,
      degrees: doctor.degrees || doctor.degree || null,
      speciality: doctor.speciality || doctor.specialty || null,
      system: doctor.system || (doctor.isAyush ? 'Ayurveda' : 'Allopathy'),
      experience: parseInt(doctor.experience || doctor.exp, 10) || null,
      rating: Number(doctor.rating) || null,
      is_active: true,
    };
    const hospital = { id: hospitalId, name: doctor.hospitalName || hospitalId };
    const { data, error } = await supabase.rpc('ensure_booking_catalog', { p_hospital: hospital, p_doctor: row });
    return { data: error ? null : row, error };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SLOT SCHEDULES
// ═══════════════════════════════════════════════════════════════════════════════
const slots = {
  /**
   * Get all slots for a doctor on a date.
   * Auto-generates them if none exist.
   */
  async getForDoctor(doctorId, dateStr) {
    if (USE_SUPABASE()) {
      // Try to fetch existing
      let { data, error } = await supabase
        .from('slot_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('date', dateStr)
        .order('time_24');

      if (!error && (!data || data.length === 0)) {
        // Generate slots via DB function
        await supabase.rpc('generate_doctor_slots', {
          p_doctor_id: doctorId,
          p_date: dateStr,
        });
        // Fetch again
        ({ data, error } = await supabase
          .from('slot_schedules')
          .select('*')
          .eq('doctor_id', doctorId)
          .eq('date', dateStr)
          .order('time_24'));
      }
      return { data: data || [], error };
    }

    // localStorage fallback (reuse SlotEngine)
    const { getDoctorSchedule } = await import('../engine/SlotEngine').catch(() => ({ getDoctorSchedule: null }));
    if (getDoctorSchedule) {
      const sched = getDoctorSchedule(doctorId, dateStr);
      return { data: sched.slots, error: null };
    }
    return { data: [], error: null };
  },

  /** Toggle a slot open/closed (doctor portal) */
  async setOpen(doctorId, dateStr, time24, isOpen) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('slot_schedules')
        .update({ is_open: isOpen })
        .eq('doctor_id', doctorId)
        .eq('date', dateStr)
        .eq('time_24', time24)
        .select()
        .single();
      return { data, error };
    }
    const { setSlotAvailability } = await import('../engine/SlotEngine').catch(() => ({ setSlotAvailability: null }));
    if (setSlotAvailability) setSlotAvailability(doctorId, dateStr, time24, isOpen);
    return { data: null, error: null };
  },

  /** Count bookings for a slot (to compute availability) */
  async countBookings(doctorId, dateStr, time24) {
    if (USE_SUPABASE()) {
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('date', dateStr)
        .eq('time_24', time24)
        .neq('status', 'cancelled');
      return { count: count || 0, error };
    }
    // localStorage fallback
    const all = lsRead(LS.appointments);
    const count = all.filter(a =>
      a.doctor_id === doctorId &&
      a.date === dateStr &&
      a.time_24 === time24 &&
      a.status !== 'cancelled'
    ).length;
    return { count, error: null };
  },

  /**
   * Get enriched live slot data grouped by session
   * (for Step 2 patient booking UI)
   */
  async getLive(doctorId, dateStr) {
    const { data: slotRows, error } = await this.getForDoctor(doctorId, dateStr);
    if (error) return { morning: [], afternoon: [], evening: [] };

    const now = new Date();
    const isToday = dateStr === localDateKey(now);

    const enriched = await Promise.all(slotRows.map(async slot => {
      const { count: booked } = await this.countBookings(doctorId, dateStr, slot.time_24);
      const slotsLeft = Math.max(0, slot.capacity - booked);

      let isPast = false;
      if (isToday) {
        const [h, m] = slot.time_24.split(':').map(Number);
        isPast = h * 60 + m <= now.getHours() * 60 + now.getMinutes();
      }

      let state;
      if (!slot.is_open || isPast) state = 'closed';
      else if (slotsLeft === 0)    state = 'full';
      else if (slotsLeft === 1)    state = 'fast';
      else                          state = 'open';

      return {
        time24:   slot.time_24,
        label:    slot.time_label,
        session:  slot.session,
        capacity: slot.capacity,
        booked,
        slotsLeft,
        state,
        isPast,
      };
    }));

    return {
      morning:   enriched.filter(s => s.session === 'morning'),
      afternoon: enriched.filter(s => s.session === 'afternoon'),
      evening:   enriched.filter(s => s.session === 'evening'),
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const appointments = {
  /**
   * Book an appointment. Returns { data: appointment, token, error }
   */
  async book({ patientId, doctorId, hospitalId, date, time24, timeLabel, reason }) {
    const now = new Date();
    const todayKey = localDateKey(now);
    const [slotHour, slotMinute] = String(time24 || '').split(':').map(Number);
    const isExpired = date < todayKey || (
      date === todayKey &&
      Number.isFinite(slotHour) &&
      slotHour * 60 + slotMinute <= now.getHours() * 60 + now.getMinutes()
    );
    if (!date || !time24 || isExpired) {
      return { data: null, token: null, error: new Error('Past appointment dates and time slots cannot be booked.') };
    }

    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('book_appointment', {
        p_patient_id: patientId,
        p_doctor_id: doctorId,
        p_hospital_id: hospitalId,
        p_date: date,
        p_time_24: time24,
        p_time_label: timeLabel,
        p_reason: reason || null,
      });
      const row = Array.isArray(data) ? data[0] : data;
      return { data: row, token: row?.token_number || null, error };
    }

    // Local fallback mirrors the database format and never invents a
    // display-only token that differs from the stored appointment.
    const all = lsRead(LS.appointments);
    const existingTokens = all.map(a => a.token_number || a.token).filter(Boolean);
    const compactDate = String(date).replace(/-/g, '');
    let nextNum = all.filter(a => a.date === date).length + 1;
    let candidateToken = `APT-${compactDate}-${String(nextNum).padStart(3, '0')}`;
    while (existingTokens.includes(candidateToken)) {
      nextNum += 1;
      candidateToken = `APT-${compactDate}-${String(nextNum).padStart(3, '0')}`;
    }
    const token = candidateToken;

    const appt = {
      id:          uuid(),
      patient_id:  patientId,
      doctor_id:   doctorId,
      hospital_id: hospitalId,
      date,
      time_24:     time24,
      time_label:  timeLabel,
      token_number: token,
      reason,
      status:      'confirmed',
      booked_at:   new Date().toISOString(),
    };
    all.push(appt);
    lsWrite(LS.appointments, all);
    return { data: appt, token, error: null };
  },

  /** Get all appointments for a patient */
  async getByPatient(patientId) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctors(name, degrees, speciality, avatar_url), hospitals(name, address)')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });
      return { data: data || [], error };
    }
    const all = lsRead(LS.appointments);
    return { data: all.filter(a => a.patient_id === patientId), error: null };
  },

  /** Get doctor's queue for a date */
  async getDoctorQueue(doctorId, dateStr) {
    if (USE_SUPABASE()) {
      let query = supabase
        .from('appointments')
        .select('*, patients(name, age, gender, phone), clinical_intakes(clinical_summary, red_flags, history)')
        .eq('date', dateStr)
        .neq('status', 'cancelled')
        .order('time_24');
      if (doctorId) query = query.eq('doctor_id', doctorId);
      const { data, error } = await query;
      return { data: data || [], error };
    }
    const all = lsRead(LS.appointments);
    return {
      data: all.filter(a => a.doctor_id === doctorId && a.date === dateStr && a.status !== 'cancelled'),
      error: null,
    };
  },

  /** Update appointment status */
  async updateStatus(appointmentId, status, extra = {}) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status, ...extra, updated_at: new Date().toISOString() })
        .eq('id', appointmentId)
        .select()
        .single();
      return { data, error };
    }
    const all = lsRead(LS.appointments);
    const idx = all.findIndex(a => a.id === appointmentId);
    if (idx !== -1) { all[idx] = { ...all[idx], status, ...extra }; lsWrite(LS.appointments, all); }
    return { data: all[idx] || null, error: null };
  },

  /** Cancel an appointment */
  async cancel(appointmentId) {
    return this.updateStatus(appointmentId, 'cancelled');
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEDICAL REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
const reports = {
  async getByPatient(patientId) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false });
      if (error) return { data: [], error };
      const hydrated = await Promise.all((data || []).map(async report => {
        if (!report.file_url || /^https?:|^data:|^blob:/.test(report.file_url)) return report;
        const { data: signed } = await supabase.storage
          .from('medical-reports')
          .createSignedUrl(report.file_url, 60 * 60);
        return { ...report, storage_path: report.file_url, file_url: signed?.signedUrl || null };
      }));
      return { data: hydrated, error: null };
    }
    const all = lsRead(LS.reports);
    return { data: all.filter(r => r.patient_id === patientId), error: null };
  },

  async upload({ patientId, appointmentId, reportType, title, file, dataUrl, ocrText }) {
    let fileUrl = null;

    if (USE_SUPABASE() && file) {
      const safeName = String(file.name || 'medical-report')
        .replace(/[^a-zA-Z0-9._-]+/g, '_');
      const fileName = `${patientId}/${Date.now()}_${safeName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-reports')
        .upload(fileName, file, { upsert: false });

      if (uploadError) return { data: null, error: uploadError };
      if (uploadData) fileUrl = uploadData.path;

      const { data, error } = await supabase
        .from('medical_reports')
        .insert({
          patient_id:     patientId,
          appointment_id: appointmentId,
          report_type:    reportType,
          title,
          file_url:       fileUrl,
          ocr_text:       ocrText,
        })
        .select()
        .single();
      return { data, error };
    }

    // localStorage fallback
    const all = lsRead(LS.reports);
    const report = {
      id:             uuid(),
      patient_id:     patientId,
      appointment_id: appointmentId,
      report_type:    reportType,
      title,
      file_url:       dataUrl || fileUrl,
      ocr_text:       ocrText,
      uploaded_at:    new Date().toISOString(),
    };
    all.push(report);
    lsWrite(LS.reports, all);
    return { data: report, error: null };
  },
};

// Complete clinical intake snapshots. JSONB intentionally retains every answer,
// consent, red flag and generated summary without lossy field mapping.
const intakes = {
  async save({ id, patientId, appointmentId = null, language, isAyushMode, consents, history, interviewProgress, documents, summary, redFlags, submitted = false }) {
    if (!USE_SUPABASE()) return { data: { id: id || uuid() }, error: null };
    const row = {
      ...(id ? { id } : {}),
      patient_id: patientId,
      appointment_id: appointmentId,
      language: language || 'en',
      is_ayush_mode: Boolean(isAyushMode),
      consents: consents || {},
      history: history || {},
      interview_progress: interviewProgress || {},
      documents: documents || [],
      clinical_summary: summary || null,
      red_flags: redFlags || [],
      submitted_at: submitted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    return supabase.from('clinical_intakes').upsert(row).select().single();
  },

  async getLatest(patientId) {
    if (!USE_SUPABASE()) return { data: null, error: null };
    return supabase.from('clinical_intakes').select('*').eq('patient_id', patientId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
  },

  async attachAppointment(intakeId, appointmentId) {
    if (!USE_SUPABASE() || !intakeId) return { data: null, error: null };
    return supabase.from('clinical_intakes').update({ appointment_id: appointmentId, updated_at: new Date().toISOString() })
      .eq('id', intakeId).select().single();
  },
  async submit(intakeId) {
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    const { data, error } = await supabase.rpc('submit_clinical_intake', { p_intake_id: intakeId });
    return { data: Array.isArray(data) ? data[0] : data, error };
  },
  async getSubmittedQueue(dateStr) {
    if (!USE_SUPABASE()) return { data: [], error: null };
    return supabase.from('clinical_intakes')
      .select('*, patients(name,age,gender,phone)')
      .eq('queue_date', dateStr).in('status', ['submitted','in_consultation'])
      .order('submitted_at');
  },
  async updateStatus(intakeId, status, extra = {}) {
    if (!USE_SUPABASE()) return { data: null, error: null };
    return supabase.from('clinical_intakes').update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', intakeId).select().single();
  },
};

const staff = {
  async getAll() {
    if (!USE_SUPABASE()) return { data: [], error: null };
    return supabase.rpc('list_staff_accounts');
  },
  async login(username, password) {
    if (!USE_SUPABASE()) return { data: null, error: new Error('Supabase is not configured') };
    const { data, error } = await supabase.rpc('staff_login', { p_username: username, p_password: password });
    return { data: data?.[0] || null, error };
  },
  async create({ username, password, name, role, department, doctorId = null }) {
    if (!USE_SUPABASE()) return { data: null, error: new Error('Supabase is not configured') };
    const { data, error } = await supabase.rpc('create_staff_account', {
      p_username: username, p_password: password, p_name: name,
      p_role: role, p_department: department || null, p_doctor_id: doctorId,
    });
    return { data, error };
  },
};

const communities = {
  async getDirectory() {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('communities')
      .select('*, patient_community_memberships(count), community_posts(count), community_professionals(count)')
      .eq('is_active', true).order('sort_order').order('title');
    return { data: data || [], error };
  },
  async getImpact() {
    if (!USE_SUPABASE()) return { data: { members: 0, posts: 0, reactions: 0, experts: 0 }, error: new Error('Database is not configured') };
    const tables = ['patient_community_memberships', 'community_posts', 'community_post_reactions', 'community_professionals'];
    const results = await Promise.all(tables.map(table => supabase.from(table).select('*', { count: 'exact', head: true })));
    const firstError = results.find(result => result.error)?.error || null;
    return { data: { members: results[0].count || 0, posts: results[1].count || 0, reactions: results[2].count || 0, experts: results[3].count || 0 }, error: firstError };
  },
  async getMemberships(patientId) {
    if (!patientId) return { data: [], error: null };
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    return supabase.from('patient_community_memberships').select('community_id').eq('patient_id', patientId);
  },
  async setMembership(patientId, communityId, joined) {
    if (!patientId) return { data: null, error: new Error('Patient session is required') };
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    return supabase.rpc('set_community_membership', { p_patient_id: patientId, p_community_id: communityId, p_joined: joined });
  },
  async getPosts(communityId) {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('community_posts')
      .select('*, doctors(name,degrees,speciality,avatar_url,hospitals(name,city)), community_post_reactions(count), community_post_comments(count)')
      .eq('community_id', communityId).eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    return { data: data || [], error };
  },
  async getPatientReactions(patientId, postIds) {
    if (!patientId || !postIds?.length) return { data: [], error: null };
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('community_post_reactions')
      .select('post_id,reaction_type').eq('patient_id', patientId).in('post_id', postIds);
    return { data: data || [], error };
  },
  async toggleReaction(patientId, postId, reactionType = 'helpful') {
    if (!patientId) return { data: null, error: new Error('Patient session is required') };
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    return supabase.rpc('set_community_post_reaction', { p_patient_id: patientId, p_post_id: postId, p_reaction_type: reactionType });
  },
  async getComments(postId) {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('community_post_comments')
      .select('*, patients(name)')
      .eq('post_id', postId).eq('status', 'published').order('created_at');
    return { data: data || [], error };
  },
  async addComment(patientId, postId, body) {
    if (!patientId) return { data: null, error: new Error('Patient session is required') };
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    return supabase.rpc('add_community_post_comment', { p_patient_id: patientId, p_post_id: postId, p_body: body });
  },
};

const donations = {
  async getActiveRequests() {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('donation_requests')
      .select('*, hospitals(id,name,address,city,state,type)')
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('urgency_rank', { ascending: false })
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async getAllRequests() {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase
      .from('donation_requests')
      .select('*, hospitals(id,name,address,city,state,type), donation_contributions(count)')
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async createRequest(request) {
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    return supabase.from('donation_requests').insert({
      hospital_id: request.hospitalId,
      created_by_staff_id: request.staffId || null,
      category: request.category,
      title: request.title?.trim(),
      description: request.description?.trim(),
      urgency: request.urgency || 'normal',
      status: request.status || 'active',
      amount_target: request.category === 'financial' ? Number(request.amountTarget) : null,
      blood_group: request.category === 'blood' ? request.bloodGroup : null,
      units_needed: request.category === 'blood' ? Number(request.unitsNeeded) : null,
      patient_summary: request.patientSummary?.trim() || null,
      location: request.location?.trim() || null,
      contact_instructions: request.contactInstructions?.trim() || null,
      expires_at: request.expiresAt || null,
    }).select('*, hospitals(id,name,address,city,state,type)').single();
  },

  async updateRequest(requestId, changes) {
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    return supabase.from('donation_requests')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', requestId).select('*, hospitals(id,name,address,city,state,type)').single();
  },

  async getContributions(patientId) {
    if (!patientId) return { data: [], error: null };
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('donation_contributions')
      .select('*, donation_requests(id,title,category,blood_group,hospital_id,hospitals(name,city))')
      .eq('patient_id', patientId).order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async getResponsesForRequest(requestId) {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('donation_contributions')
      .select('*, patients(id,name,phone,blood_group)')
      .eq('request_id', requestId).order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async respond({ requestId, patientId, contributionType, amountInr = null, unitsOffered = null, bloodGroup = null, message = null }) {
    if (!patientId) return { data: null, error: new Error('Patient session is required') };
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    const { data, error } = await supabase.rpc('respond_to_donation_request', {
      p_request_id: requestId,
      p_patient_id: patientId,
      p_contribution_type: contributionType,
      p_amount_inr: amountInr ? Number(amountInr) : null,
      p_units_offered: unitsOffered ? Number(unitsOffered) : null,
      p_blood_group: bloodGroup || null,
      p_message: message?.trim() || null,
    });
    return { data: Array.isArray(data) ? data[0] : data, error };
  },
};

const voice = {
  async log(event) {
    if (!USE_SUPABASE()) return { data: null, error: null };
    return supabase.from('voice_interactions').insert(event);
  },
};

const feedback = {
  async submit({ patientId = null, pageId, language, message }) {
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    return supabase.from('feedback').insert({ patient_id: patientId, page_id: pageId, language, message }).select().single();
  },
};

const support = {
  async getChannels() {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('support_channels').select('*')
      .eq('is_active', true).eq('is_verified', true).order('display_order').order('label');
    return { data: data || [], error };
  },
  async getHospitals() {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('hospitals')
      .select('id,name,address,city,state,support_phone,emergency_phone,support_email,website_url,support_hours,contact_verified_at')
      .not('contact_verified_at', 'is', null).order('name');
    return { data: (data || []).filter(row => row.support_phone || row.emergency_phone || row.support_email || row.website_url), error };
  },
  async getFaqs() {
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.from('support_faqs').select('*')
      .eq('is_active', true).order('display_order').order('created_at');
    return { data: data || [], error };
  },
  async getRequests(patientId) {
    if (!patientId) return { data: [], error: null };
    if (!USE_SUPABASE()) return { data: [], error: new Error('Database is not configured') };
    const { data, error } = await supabase.rpc('list_support_requests', { p_patient_id: patientId });
    return { data: data || [], error };
  },
  async createRequest({ patientId, hospitalId = null, category, subject, message, preferredContact = 'in_app', language = 'en' }) {
    if (!patientId) return { data: null, error: new Error('Patient session is required') };
    if (!USE_SUPABASE()) return { data: null, error: new Error('Database is not configured') };
    const { data, error } = await supabase.rpc('create_support_request', {
      p_patient_id: patientId,
      p_hospital_id: hospitalId || null,
      p_category: category,
      p_subject: subject?.trim(),
      p_message: message?.trim(),
      p_preferred_contact: preferredContact,
      p_language: language,
    });
    return { data, error };
  },
};

async function healthCheck() {
  if (!USE_SUPABASE()) return { connected: false, error: new Error('Supabase is not configured') };
  const { error } = await supabase.from('hospitals').select('id', { head: true }).limit(1);
  return { connected: !error, error };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN SEED DATA (used as fallback when Supabase is not configured)
// ═══════════════════════════════════════════════════════════════════════════════
const _builtinHospitals = [
  { id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'AIIMS New Delhi',       address: 'Ansari Nagar, New Delhi', city: 'New Delhi',   type: 'Government', rating: 4.8 },
  { id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Sawai Man Singh Hospital', address: 'J.L.N. Marg, Jaipur', city: 'Jaipur',      type: 'Government', rating: 4.6 },
  { id: 'a1b2c3d4-0003-0003-0003-000000000003', name: 'PGIMER Chandigarh',     address: 'Sector 12, Chandigarh',  city: 'Chandigarh',  type: 'Government', rating: 4.7 },
  { id: 'a1b2c3d4-0004-0004-0004-000000000004', name: 'KEM Hospital Mumbai',   address: 'Parel, Mumbai',          city: 'Mumbai',      type: 'Government', rating: 4.5 },
  { id: 'a1b2c3d4-0005-0005-0005-000000000005', name: 'NIMHANS Bangalore',     address: 'Hosur Road, Bangalore',  city: 'Bangalore',   type: 'Government', rating: 4.6 },
];

const _builtinDoctors = [
  { id: 'd0000001-0001-0001-0001-000000000001', hospital_id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'Dr. Randeep Guleria',    degrees: 'MBBS, MD', speciality: 'Pulmonology',  system: 'Allopathy', experience: 26, rating: 4.9, reviews_count: 1240 },
  { id: 'd0000001-0002-0002-0002-000000000001', hospital_id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'Dr. Ananya Sharma',      degrees: 'MBBS, MS', speciality: 'Gynaecology', system: 'Allopathy', experience: 12, rating: 4.7, reviews_count: 860  },
  { id: 'd0000001-0003-0003-0003-000000000002', hospital_id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Dr. Anil Mehta',         degrees: 'MBBS, MS', speciality: 'Orthopaedics',system: 'Allopathy', experience: 18, rating: 4.6, reviews_count: 720  },
  { id: 'd0000001-0004-0004-0004-000000000002', hospital_id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Dr. Vaidya Krishnamurthy',degrees: 'BAMS, MD',speciality: 'Panchakarma',  system: 'Ayurveda',  experience: 20, rating: 4.8, reviews_count: 540  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const db = {
  patients,
  hospitals,
  doctors,
  slots,
  appointments,
  reports,
  intakes,
  staff,
  communities,
  donations,
  voice,
  feedback,
  support,
  /** Direct Supabase client access for advanced queries */
  client: supabase,
  isConfigured: isSupabaseConfigured,
  isConnected: isSupabaseConfigured,
  healthCheck,
};
