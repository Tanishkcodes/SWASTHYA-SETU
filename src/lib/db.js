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
import { hashPassword, verifyPassword, validatePasswordStrength } from './crypto';

// ─── LocalStorage Fallback Keys ───────────────────────────────────────────────
const LS = {
  patients:     'ss_db_patients',
  appointments: 'ss_db_appointments',
  reports:      'ss_db_reports',
  schedules:    'ss_db_schedules',
  staff:        'ss_db_staff',
  hospitals:    'ss_db_hospitals',
  doctors:      'ss_db_doctors',
  doctorLeaves: 'ss_db_doctor_leaves',
};

// ─── Staff Authentication Lockout (Brute-force defense: 2 min lockout on 5 failed attempts) ───
function lsReadObj(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch {
    return {};
  }
}

export function getAuthLockStatus(username) {
  if (!username) return { locked: false, remainingSeconds: 0 };
  const attempts = lsReadObj('swasthya_auth_attempts');
  const key = username.toLowerCase().trim();
  const record = attempts[key];
  if (!record) return { locked: false, remainingSeconds: 0 };
  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, remainingSeconds };
  }
  return { locked: false, remainingSeconds: 0 };
}

export function recordFailedAttempt(username) {
  if (!username) return { count: 0, locked: false, remainingSeconds: 0 };
  const attempts = lsReadObj('swasthya_auth_attempts');
  const key = username.toLowerCase().trim();
  const record = attempts[key] || { count: 0, lockedUntil: 0 };
  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil <= now) {
    record.count = 0;
    record.lockedUntil = 0;
  }
  record.count = (record.count || 0) + 1;
  if (record.count >= 5) {
    record.lockedUntil = now + (2 * 60 * 1000); // 2 minutes lockout
    record.count = 5;
    attempts[key] = record;
    lsWrite('swasthya_auth_attempts', attempts);
    return { count: 5, locked: true, remainingSeconds: 120 };
  }
  attempts[key] = record;
  lsWrite('swasthya_auth_attempts', attempts);
  return { count: record.count, locked: false, remainingSeconds: 0 };
}

export function clearFailedAttempts(username) {
  if (!username) return;
  const attempts = lsReadObj('swasthya_auth_attempts');
  const key = username.toLowerCase().trim();
  if (attempts[key]) {
    delete attempts[key];
    lsWrite('swasthya_auth_attempts', attempts);
  }
}

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
      else if (aadhaarLast4) lookup = lookup.eq('aadhaar_last4', aadhaarLast4);
      else if (name) lookup = lookup.eq('name', name);
      else lookup = lookup.eq('id', '00000000-0000-0000-0000-000000000000');
      const { data: existing, error: lookupError } = await lookup.maybeSingle();

      if (lookupError) return failure(lookupError);
      if (existing) {
        // Update name/age/language in case they changed
        const { data, error } = await supabase
          .from('patients')
          .update({
            name: name || existing.name,
            phone: phone || existing.phone,
            age: age || existing.age,
            gender: gender || existing.gender,
            language: language || existing.language,
            abha_id: abhaId || existing.abha_id,
            aadhaar_last4: aadhaarLast4 || existing.aadhaar_last4,
            address: address || existing.address,
            auth_method: authMethod || existing.auth_method,
            updated_at: new Date().toISOString()
          })
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
    let patient = all.find(p =>
      (phone && p.phone === phone) ||
      (abhaId && (p.abha_id === abhaId || p.abhaId === abhaId)) ||
      (aadhaarLast4 && (p.aadhaar_last4 === aadhaarLast4 || p.aadhaarLast4 === aadhaarLast4)) ||
      (name && p.name && p.name.toLowerCase().trim() === name.toLowerCase().trim())
    );
    if (patient) {
      Object.assign(patient, {
        name: name || patient.name,
        phone: phone || patient.phone,
        age: age || patient.age,
        gender: gender || patient.gender,
        language: language || patient.language,
        abha_id: abhaId || patient.abha_id || patient.abhaId,
        abhaId: abhaId || patient.abhaId || patient.abha_id,
        aadhaar_last4: aadhaarLast4 || patient.aadhaar_last4 || patient.aadhaarLast4,
        aadhaarLast4: aadhaarLast4 || patient.aadhaarLast4 || patient.aadhaar_last4,
        auth_method: authMethod || patient.auth_method || patient.authMethod,
        updated_at: new Date().toISOString()
      });
    } else {
      patient = {
        id: uuid(),
        name: name || 'Patient',
        phone,
        age,
        gender,
        language,
        abha_id: abhaId,
        abhaId,
        aadhaar_last4: aadhaarLast4,
        aadhaarLast4,
        auth_method: authMethod,
        created_at: new Date().toISOString()
      };
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
    // Return built-in data + any locally added hospitals
    const customList = lsRead(LS.hospitals);
    const all = [...(customList || []), ..._builtinHospitals];
    const unique = [];
    const seen = new Set();
    for (const h of all) {
      if (h && h.id && !seen.has(h.id)) {
        seen.add(h.id);
        unique.push(h);
      }
    }
    return { data: unique, error: null };
  },

  async create({
    name,
    address = null,
    city = 'Jaipur',
    type = 'Government',
    rating = 4.8,
    isAyush = false,
  }) {
    if (!name) return { data: null, error: new Error('Hospital name is required') };
    const slug = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const hospitalId = `${slug(name)}${city ? `-${slug(city)}` : ''}`;
    const hospitalRow = {
      id: hospitalId,
      name,
      address: address || `${city || 'India'}`,
      city: city || null,
      type: type || 'Government',
      rating: Number(rating) || 4.8,
    };

    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('hospitals').upsert(hospitalRow, { onConflict: 'id' }).select().single();
      // Auto-provision hospital admin staff account with standard dynamic password
      const adminUser = `admin.${slug(name).slice(0, 12)}`;
      await staff.create({
        username: adminUser,
        password: `${adminUser}123`,
        name: `${name} Admin`,
        role: 'admin',
        department: 'Hospital Administration',
        hospitalId,
        hospitalName: name,
      });
      return { data: data || hospitalRow, error };
    }

    // LocalStorage fallback
    const customList = lsRead(LS.hospitals);
    const existingIdx = customList.findIndex(h => h.id === hospitalId);
    if (existingIdx !== -1) {
      customList[existingIdx] = hospitalRow;
    } else {
      customList.unshift(hospitalRow);
    }
    lsWrite(LS.hospitals, customList);
    _builtinHospitals.unshift(hospitalRow);

    // Auto-provision hospital admin staff account
    const adminUser = `admin.${slug(name).slice(0, 12)}`;
    await staff.create({
      username: adminUser,
      password: `${adminUser}123`,
      name: `${name} Admin`,
      role: 'admin',
      department: 'Hospital Administration',
      hospitalId,
      hospitalName: name,
    });

    return { data: hospitalRow, error: null };
  },

  async ensure(hospital) {
    if (!hospital || !hospital.name) return { data: null, error: new Error('Hospital name required') };
    const slug = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const generatedId = hospital.id && !String(hospital.id).startsWith('a1b2c3d4-') 
      ? hospital.id 
      : `${slug(hospital.name)}${hospital.city ? `-${slug(hospital.city)}` : ''}`;

    if (!USE_SUPABASE()) {
      const row = { ...hospital, id: generatedId };
      const customList = lsRead(LS.hospitals);
      if (!customList.some(h => h.id === generatedId)) {
        customList.push(row);
        lsWrite(LS.hospitals, customList);
      }
      return { data: row, error: null };
    }
    const row = {
      id: generatedId,
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
const doctors = {
  async getAll({ includeInactive = false } = {}) {
    if (USE_SUPABASE()) {
      let query = supabase
        .from('doctors')
        .select('*, hospitals(*)')
        .order('name');
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const normalized = data.map(d => ({
          ...d,
          hospitalName: d.hospital_name || d.hospitals?.name || d.hospitalName || 'Sawai Man Singh Hospital',
          hospital_name: d.hospital_name || d.hospitals?.name || d.hospitalName || 'Sawai Man Singh Hospital'
        }));
        return { data: normalized, error: null };
      }
    }
    const custom = lsRead(LS.doctors) || [];
    const all = [...custom, ..._builtinDoctors.filter(b => !custom.some(c => c.id === b.id))];
    const filtered = includeInactive ? all : all.filter(d => d.is_active !== false);
    return { data: filtered, error: null };
  },

  async getAllForAdmin() {
    return this.getAll({ includeInactive: true });
  },

  async updateDoctor(doctorId, updates) {
    if (!doctorId) return { data: null, error: new Error('Doctor ID is required') };
    
    // Normalize update payload
    const payload = { ...updates, updated_at: new Date().toISOString() };
    if (payload.avatarUrl) {
      payload.avatar_url = payload.avatarUrl;
      delete payload.avatarUrl;
    }

    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctors')
        .update(payload)
        .eq('id', doctorId)
        .select('*, hospitals(*)')
        .single();
      
      if (!error && data) {
        const normalized = {
          ...data,
          hospitalName: data.hospital_name || data.hospitals?.name || data.hospitalName || 'Sawai Man Singh Hospital',
          hospital_name: data.hospital_name || data.hospitals?.name || data.hospitalName || 'Sawai Man Singh Hospital'
        };
        return { data: normalized, error: null };
      }
    }

    const customList = lsRead(LS.doctors) || [];
    const customIdx = customList.findIndex(d => d.id === doctorId);
    if (customIdx !== -1) {
      customList[customIdx] = { ...customList[customIdx], ...payload };
      lsWrite(LS.doctors, customList);
    }
    const idx = _builtinDoctors.findIndex(d => d.id === doctorId);
    if (idx !== -1) {
      _builtinDoctors[idx] = { ..._builtinDoctors[idx], ...payload };
      return { data: _builtinDoctors[idx], error: null };
    }
    if (customIdx !== -1) {
      return { data: customList[customIdx], error: null };
    }
    return { data: null, error: new Error('Doctor not found') };
  },

  async getByHospital(hospitalIdOrName) {
    if (!hospitalIdOrName) return { data: [], error: null };
    const norm = String(hospitalIdOrName).toLowerCase().trim();

    if (USE_SUPABASE()) {
      // 1. Try querying by hospital_id
      const { data: byId, error: err1 } = await supabase
        .from('doctors')
        .select('*, hospitals(*)')
        .eq('hospital_id', hospitalIdOrName)
        .eq('is_active', true)
        .order('name');
      
      if (!err1 && byId && byId.length > 0) {
        return {
          data: byId.map(d => ({
            ...d,
            hospitalName: d.hospital_name || d.hospitals?.name || d.hospitalName || 'Sawai Man Singh Hospital',
            hospital_name: d.hospital_name || d.hospitals?.name || d.hospitalName || 'Sawai Man Singh Hospital'
          })),
          error: null
        };
      }

      // 2. Try querying by hospital_name (case-insensitive ilike)
      const { data: byName, error: err2 } = await supabase
        .from('doctors')
        .select('*, hospitals(*)')
        .ilike('hospital_name', `%${norm}%`)
        .eq('is_active', true)
        .order('name');

      if (!err2 && byName && byName.length > 0) {
        return {
          data: byName.map(d => ({
            ...d,
            hospitalName: d.hospital_name || d.hospitals?.name || d.hospitalName || 'Sawai Man Singh Hospital',
            hospital_name: d.hospital_name || d.hospitals?.name || d.hospitalName || 'Sawai Man Singh Hospital'
          })),
          error: null
        };
      }
    }

    // Fallback: match custom and built-in doctors by hospital_id, hospital_name, or hospitalName
    const custom = lsRead(LS.doctors) || [];
    const allDoctors = [...custom, ..._builtinDoctors.filter(b => !custom.some(c => c.id === b.id))];
    const matched = allDoctors.filter(d => {
      if (d.is_active === false) return false;
      const hId = String(d.hospital_id || '').toLowerCase();
      const hName = String(d.hospital_name || d.hospitalName || '').toLowerCase();
      return hId === norm || hName.includes(norm) || norm.includes(hId);
    });
    return { data: matched, error: null };
  },

  async getById(doctorId) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, hospitals(*)')
        .eq('id', doctorId)
        .single();
      if (data) {
        return {
          data: {
            ...data,
            hospitalName: data.hospital_name || data.hospitals?.name || data.hospitalName || 'Sawai Man Singh Hospital',
            hospital_name: data.hospital_name || data.hospitals?.name || data.hospitalName || 'Sawai Man Singh Hospital'
          },
          error: null
        };
      }
    }
    const custom = lsRead(LS.doctors) || [];
    const found = custom.find(d => d.id === doctorId) || _builtinDoctors.find(d => d.id === doctorId);
    return { data: found || null, error: null };
  },

  async getByName(name) {
    const norm = String(name || '').toLowerCase().trim();
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, hospitals(*)')
        .ilike('name', `%${norm}%`)
        .eq('is_active', true)
        .limit(1)
        .single();
      if (data) return { data, error: null };
    }
    const found = _builtinDoctors.find(d => d.name.toLowerCase().trim() === norm || d.name.toLowerCase().includes(norm));
    return { data: found || null, error: null };
  },

  async createDoctor({
    name,
    degrees = 'MBBS, MD',
    speciality = 'General Physician',
    system = 'Allopathy',
    experience = 10,
    age = 36,
    gender = 'Female',
    hospitalId = null,
    hospitalName = 'Sawai Man Singh Hospital',
    email = null,
    phone = null,
    avatarUrl = null,
    username = null,
    registrationNumber = null,
    dob = null,
    initialPassword = 'password123',
  }) {
    const slug = str => String(str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const hospitalNameToSlug = {
      'aiims new delhi': 'aiims-delhi',
      'sawai man singh hospital': 'sms-jaipur',
      'indraprastha apollo hospitals': 'apollo-delhi',
      'shalby hospital jaipur': 'shalby-jaipur',
      'all india institute of ayurveda (aiia)': 'aiia-delhi',
      'national institute of ayurveda (nia)': 'nia-jaipur',
      'narayana health city': 'narayana-bangalore',
      'fortis escorts hospital': 'fortis-jaipur',
      'tata memorial hospital': 'tata-mumbai',
      'jaipur hospital': 'jaipur-hospital',
      'pgimer chandigarh': 'pgimer-chandigarh',
      'kem hospital mumbai': 'kem-mumbai',
      'nimhans bangalore': 'nimhans-bangalore',
    };

    const resolvedHospitalId = (hospitalId && !hospitalId.startsWith('a1b2c3d4-'))
      ? hospitalId
      : (hospitalNameToSlug[hospitalName.toLowerCase().trim()] || slug(hospitalName) || 'sms-jaipur');

    const doctorId = 'doc-' + uuid().replace(/-/g, '').slice(0, 14);
    const cleanEmail = email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@swasthyasetu.ac.in`;
    const cleanUsername = username ? username.toLowerCase().trim() : (cleanEmail.split('@')[0] || `dr.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
    const generatedAvatar = avatarUrl || `https://randomuser.me/api/portraits/${String(gender).toLowerCase() === 'female' ? 'women' : 'men'}/${Math.floor(10 + Math.random() * 70)}.jpg`;

    const doctorRow = {
      id: doctorId,
      hospital_id: resolvedHospitalId,
      hospital_name: hospitalName,
      name,
      degrees,
      speciality,
      system,
      experience: parseInt(experience, 10) || 5,
      age: parseInt(age, 10) || 35,
      gender: gender || 'Female',
      email: cleanEmail,
      phone: phone || null,
      avatar_url: generatedAvatar,
      registration_number: registrationNumber || null,
      dob: dob || null,
      rating: 4.8,
      reviews_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (USE_SUPABASE()) {
      // Ensure hospital exists first
      await supabase.from('hospitals').upsert({
        id: resolvedHospitalId,
        name: hospitalName
      }, { onConflict: 'id', ignoreDuplicates: true });

      const { data: docData, error: docError } = await supabase.from('doctors').insert(doctorRow).select().single();
      if (docError) {
        console.warn('Direct doctor insert error, using ensure fallback:', docError);
        await doctors.ensure(doctorRow, resolvedHospitalId);
      }

      // Initialize doctor appointment slots for next 14 days
      try {
        await supabase.rpc('initialize_doctor_schedule_range', { p_doctor_id: doctorId });
      } catch (slotErr) {
        console.warn('Slot generation notice:', slotErr);
      }

      // Create staff account with encrypted password
      const { data: staffId, error: staffError } = await staff.create({
        username: cleanUsername,
        password: initialPassword,
        name,
        role: 'doctor',
        department: speciality,
        doctorId: doctorId,
      });

      return { data: { doctor: docData || doctorRow, staffId, username: cleanUsername }, error: staffError };
    }

    // localStorage fallback
    const customList = lsRead(LS.doctors) || [];
    const docEntry = { ...doctorRow, hospitalName, hospital_id: resolvedHospitalId };
    customList.unshift(docEntry);
    lsWrite(LS.doctors, customList);
    _builtinDoctors.unshift(docEntry);

    const { data: staffId, error: staffError } = await staff.create({
      username: cleanUsername,
      password: initialPassword,
      name,
      role: 'doctor',
      department: speciality,
      doctorId: doctorId,
    });

    return { data: { doctor: docEntry, staffId, username: cleanUsername }, error: staffError };
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
      age: parseInt(doctor.age, 10) || null,
      gender: doctor.gender || null,
      email: doctor.email || null,
      phone: doctor.phone || null,
      avatar_url: doctor.avatar_url || null,
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
  async getLive(doctorId, dateStr, patientId = null) {
    // Check if doctor is on approved leave / holiday
    const leaveCheck = await doctorLeaves.isDoctorOnLeave(doctorId, dateStr);
    if (leaveCheck.onLeave) {
      const reason = leaveCheck.leave?.reason || 'On Approved Leave / Holiday';
      return {
        onLeave: true,
        leaveReason: reason,
        leaveInfo: leaveCheck.leave,
        morning: [],
        afternoon: [],
        evening: [],
      };
    }

    const { data: slotRows, error } = await this.getForDoctor(doctorId, dateStr);
    if (error) return { onLeave: false, leaveReason: '', morning: [], afternoon: [], evening: [] };

    const now = new Date();
    const isToday = dateStr === localDateKey(now);

    let serverAvailability = new Map();
    if (USE_SUPABASE()) {
      const { data: availability, error: availabilityError } = await supabase.rpc('get_appointment_slot_availability', {
        p_doctor_id: doctorId,
        p_date: dateStr,
        p_patient_id: patientId || null,
      });
      if (!availabilityError) {
        serverAvailability = new Map((availability || []).map(item => [item.time_24, item]));
      }
    }

    const enriched = await Promise.all(slotRows.map(async slot => {
      const serverSlot = serverAvailability.get(slot.time_24);
      const bookingResult = serverSlot ? { count: Number(serverSlot.booked_count || 0) } : await this.countBookings(doctorId, dateStr, slot.time_24);
      const booked = bookingResult.count;
      const activeHolds = Number(serverSlot?.active_hold_count || 0);
      const slotsLeft = serverSlot ? Number(serverSlot.slots_left || 0) : Math.max(0, slot.capacity - booked);
      const consultationBlocked = Boolean(serverSlot?.consultation_blocked);

      let isPast = false;
      if (isToday) {
        const [h, m] = slot.time_24.split(':').map(Number);
        isPast = h * 60 + m <= now.getHours() * 60 + now.getMinutes();
      }

      let state;
      if (!slot.is_open || isPast || consultationBlocked) state = 'closed';
      else if (slotsLeft === 0)    state = 'full';
      else if (slotsLeft === 1)    state = 'fast';
      else                          state = 'open';

      return {
        time24:   slot.time_24,
        label:    slot.time_label,
        session:  slot.session,
        capacity: slot.capacity,
        booked,
        activeHolds,
        consultationBlocked,
        slotsLeft,
        state,
        isPast,
      };
    }));

    return {
      onLeave: false,
      leaveReason: '',
      morning:   enriched.filter(s => s.session === 'morning'),
      afternoon: enriched.filter(s => s.session === 'afternoon'),
      evening:   enriched.filter(s => s.session === 'evening'),
    };
  },

  /** Acquire a shared renewable gateway lease before collecting case details. */
  async acquireHold({ patientId, doctorId, date, time24, clientRequestId }) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('acquire_appointment_slot_hold', {
        p_patient_id: patientId,
        p_doctor_id: doctorId,
        p_date: date,
        p_time_24: time24,
        p_client_request_id: clientRequestId,
        p_ttl_seconds: 600,
        p_max_lifetime_seconds: 1800,
      });
      const row = Array.isArray(data) ? data[0] : data;
      return { data: row, error };
    }
    const { acquireSlotHold } = await import('../engine/SlotEngine');
    const result = acquireSlotHold({ doctorId, dateStr: date, time24, patientId, clientRequestId });
    return result.success ? {
      data: {
        id: result.holdId,
        expires_at: new Date(result.expiresAt).toISOString(),
        max_expires_at: new Date(result.maxExpiresAt).toISOString(),
      }, error: null
    } : { data: null, error: new Error(result.error) };
  },

  async renewHold({ holdId, patientId }) {
    if (!holdId || !patientId) return { data: null, error: new Error('Hold and patient are required') };
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('renew_appointment_slot_hold', {
        p_hold_id: holdId,
        p_patient_id: patientId,
        p_ttl_seconds: 600,
      });
      const row = Array.isArray(data) ? data[0] : data;
      return { data: row, error };
    }
    const { renewSlotHold } = await import('../engine/SlotEngine');
    const result = renewSlotHold({ holdId, patientId });
    return result.success ? {
      data: {
        id: result.holdId,
        expires_at: new Date(result.expiresAt).toISOString(),
        max_expires_at: new Date(result.maxExpiresAt).toISOString(),
      }, error: null
    } : { data: null, error: new Error(result.error) };
  },

  async releaseHold({ holdId, patientId }) {
    if (!holdId || !patientId) return { data: false, error: null };
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('release_appointment_slot_hold', {
        p_hold_id: holdId,
        p_patient_id: patientId,
      });
      return { data: Boolean(data), error };
    }
    const { releaseSlotHold } = await import('../engine/SlotEngine');
    releaseSlotHold({ holdId, patientId });
    return { data: true, error: null };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCTOR LEAVES & HOLIDAYS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const doctorLeaves = {
  async getAll({ doctorId = null, date = null, hospitalId = null } = {}) {
    let list = lsRead(LS.doctorLeaves) || [];
    if (USE_SUPABASE()) {
      try {
        let query = supabase.from('doctor_leaves').select('*');
        if (doctorId) query = query.eq('doctor_id', doctorId);
        if (date) query = query.eq('date', date);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          list = data;
        }
      } catch (e) {}
    }
    return {
      data: list.filter(item => {
        if (doctorId && item.doctor_id !== doctorId && item.doctorId !== doctorId) return false;
        if (date && item.date !== date) return false;
        if (hospitalId && item.hospital_id !== hospitalId && item.hospitalId !== hospitalId) return false;
        return true;
      }),
      error: null
    };
  },

  async isDoctorOnLeave(doctorIdOrName, dateStr) {
    if (!doctorIdOrName || !dateStr) return { onLeave: false, leave: null };
    const cleanId = String(doctorIdOrName).toLowerCase().trim();
    const cleanName = cleanId.replace(/^dr\.\s*|^dr\s*/i, '').trim();

    const { data: leaves } = await this.getAll();
    const found = (leaves || []).find(l => {
      if (l.date !== dateStr) return false;
      const lDocId = String(l.doctor_id || l.doctorId || '').toLowerCase().trim();
      const lDocName = String(l.doctor_name || l.doctorName || '').toLowerCase().trim();
      const lDocNameClean = lDocName.replace(/^dr\.\s*|^dr\s*/i, '').trim();
      return lDocId === cleanId || lDocName === cleanId || lDocNameClean === cleanName || cleanId.includes(lDocId) || (lDocId && cleanId.includes(lDocId));
    });

    if (found) {
      return { onLeave: true, leave: found };
    }
    return { onLeave: false, leave: null };
  },

  async getDoctorLeaves(doctorIdOrName) {
    if (!doctorIdOrName) return { data: [], error: null };
    const cleanId = String(doctorIdOrName).toLowerCase().trim();
    const cleanName = cleanId.replace(/^dr\.\s*|^dr\s*/i, '').trim();
    const { data: leaves } = await this.getAll();
    const matched = (leaves || []).filter(l => {
      const lDocId = String(l.doctor_id || l.doctorId || '').toLowerCase().trim();
      const lDocName = String(l.doctor_name || l.doctorName || '').toLowerCase().trim();
      const lDocNameClean = lDocName.replace(/^dr\.\s*|^dr\s*/i, '').trim();
      return lDocId === cleanId || lDocName === cleanId || lDocNameClean === cleanName || cleanId.includes(lDocId) || (lDocId && cleanId.includes(lDocId));
    });
    return { data: matched, error: null };
  },

  async setLeave({ doctorId, doctorName, hospitalId, hospitalName, date, reason = 'Annual Leave', notes = '' }) {
    if (!date) return { data: null, error: new Error('Date is required') };
    const leaveId = 'leave-' + uuid().replace(/-/g, '').slice(0, 12);
    const row = {
      id: leaveId,
      doctor_id: doctorId,
      doctorId: doctorId,
      doctor_name: doctorName,
      doctorName: doctorName,
      hospital_id: hospitalId,
      hospitalId: hospitalId,
      hospital_name: hospitalName,
      hospitalName: hospitalName,
      date,
      reason: reason || 'Scheduled Holiday / Leave',
      notes: notes || '',
      created_at: new Date().toISOString(),
    };

    if (USE_SUPABASE()) {
      try {
        await supabase.from('doctor_leaves').upsert(row);
      } catch (e) {}
    }

    const list = lsRead(LS.doctorLeaves) || [];
    const filtered = list.filter(l => !( (l.doctor_id === doctorId || l.doctorId === doctorId || l.doctor_name === doctorName) && l.date === date ));
    filtered.unshift(row);
    lsWrite(LS.doctorLeaves, filtered);

    try {
      window.dispatchEvent(new CustomEvent('swasthya_doctor_leave_changed', { detail: row }));
    } catch (e) {}

    return { data: row, error: null };
  },

  async cancelLeave(leaveId, doctorId = null, date = null) {
    if (USE_SUPABASE()) {
      try {
        if (leaveId) {
          await supabase.from('doctor_leaves').delete().eq('id', leaveId);
        } else if (doctorId && date) {
          await supabase.from('doctor_leaves').delete().eq('doctor_id', doctorId).eq('date', date);
        }
      } catch (e) {}
    }

    const list = lsRead(LS.doctorLeaves) || [];
    const updated = list.filter(l => {
      if (leaveId && l.id === leaveId) return false;
      if (doctorId && date && (l.doctor_id === doctorId || l.doctorId === doctorId) && l.date === date) return false;
      return true;
    });
    lsWrite(LS.doctorLeaves, updated);

    try {
      window.dispatchEvent(new CustomEvent('swasthya_doctor_leave_changed', { detail: { leaveId, doctorId, date } }));
    } catch (e) {}

    return { success: true, error: null };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const appointments = {
  /**
   * Book an appointment. Returns { data: appointment, token, error }
   */
  async book({ patientId, doctorId, hospitalId, date, time24, timeLabel, reason, holdId = null, bookingRequestId = null }) {
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

    // Check if doctor is on approved leave / holiday
    const leaveCheck = await doctorLeaves.isDoctorOnLeave(doctorId, date);
    if (leaveCheck.onLeave) {
      const leaveReason = leaveCheck.leave?.reason || 'On Approved Leave / Holiday';
      return {
        data: null,
        token: null,
        error: new Error(`Dr. is on leave (${leaveReason}) on ${date}. Appointment slots are blocked. Please select an alternative date.`)
      };
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
        p_hold_id: holdId,
        p_booking_request_id: bookingRequestId,
      });
      const row = Array.isArray(data) ? data[0] : data;
      return { data: row, token: row?.token_number || null, error };
    }

    // Local fallback mirrors the database format and never invents a
    // display-only token that differs from the stored appointment.
    const all = lsRead(LS.appointments);
    const retriedBooking = bookingRequestId
      ? all.find(appointment => appointment.booking_request_id === bookingRequestId && appointment.patient_id === patientId)
      : null;
    if (retriedBooking) {
      return { data: retriedBooking, token: retriedBooking.token_number || null, error: null };
    }
    const duplicateBooking = all.find(appointment =>
      appointment.patient_id === patientId && appointment.doctor_id === doctorId &&
      appointment.date === date && appointment.time_24 === time24 && appointment.status !== 'cancelled'
    );
    if (duplicateBooking) {
      return { data: duplicateBooking, token: duplicateBooking.token_number || null, error: null };
    }
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
      booking_request_id: bookingRequestId,
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

  /** Get all appointments for admin dashboard */
  /** Get all appointments for admin dashboard */
  async getAllForAdmin({ limit = 500 } = {}) {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const parseSlotMins = (tStr, t24) => {
      if (t24 && typeof t24 === 'string' && t24.includes(':')) {
        const [h, m] = t24.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
      }
      if (tStr && typeof tStr === 'string') {
        const match = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const mer = (match[3] || '').toUpperCase();
          if (mer === 'PM' && h < 12) h += 12;
          if (mer === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        }
      }
      return 600;
    };

    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(id, name, age, gender, phone), doctors(id, name, speciality, degrees, system, avatar_url, hospital_id, hospital_name), hospitals(id, name, city)')
        .order('date', { ascending: false })
        .order('time_24', { ascending: true })
        .limit(limit);
      if (!error && data) {
        const normalized = data.map(a => {
          const slotMins = parseSlotMins(a.time_label, a.time_24);
          const isPast = (a.date && a.date < todayKey) || (a.date === todayKey && slotMins <= currentMins);
          if (isPast && (a.status === 'confirmed' || a.status === 'upcoming' || !a.status)) {
            return { ...a, status: 'cancelled' };
          }
          return a;
        });
        return { data: normalized, error: null };
      }
      return { data: data || [], error };
    }
    const all = lsRead(LS.appointments);
    const normalized = all.map(a => {
      const slotMins = parseSlotMins(a.time_label, a.time_24);
      const isPast = (a.date && a.date < todayKey) || (a.date === todayKey && slotMins <= currentMins);
      if (isPast && (a.status === 'confirmed' || a.status === 'upcoming' || !a.status)) {
        return { ...a, status: 'cancelled' };
      }
      return a;
    });
    const sorted = [...normalized].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return { data: sorted.slice(0, limit), error: null };
  },

  /** Get doctor's queue for a date */
  async getDoctorQueue(doctorId, dateStr) {
    const cleanTarget = String(doctorId || '').toLowerCase().trim().replace(/^dr\.\s*|^dr\s*/i, '').replace(/[^a-z0-9]/g, '');

    if (USE_SUPABASE()) {
      let query = supabase
        .from('appointments')
        .select('*, patients(name, age, gender, phone), clinical_intakes(clinical_summary, red_flags, history)')
        .order('date', { ascending: false })
        .order('time_24');
      if (dateStr && dateStr !== 'all') {
        query = query.eq('date', dateStr);
      }
      if (doctorId) query = query.eq('doctor_id', doctorId);
      const { data, error } = await query;
      return { data: data || [], error };
    }

    const all = lsRead(LS.appointments);
    return {
      data: all.filter(a => {
        if (!a) return false;
        if (dateStr && dateStr !== 'all' && a.date !== dateStr) return false;
        const aDocId = String(a.doctor_id || '').toLowerCase().trim();
        const aDocName = String(a.doctor_name || a.doctorName || a.doctor || '').toLowerCase().trim().replace(/^dr\.\s*|^dr\s*/i, '').replace(/[^a-z0-9]/g, '');
        const aDocSlug = aDocId.replace(/[^a-z0-9]/g, '');
        if (aDocId === String(doctorId || '').toLowerCase().trim()) return true;
        if (cleanTarget && (aDocSlug === cleanTarget || aDocSlug.includes(cleanTarget) || cleanTarget.includes(aDocSlug) || aDocName === cleanTarget)) return true;
        return false;
      }),
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

  async startConsultation(appointmentId, doctorId) {
    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.rpc('start_doctor_consultation', {
          p_appointment_id: appointmentId,
          p_doctor_id: doctorId,
        });
        if (error) {
          console.warn('Supabase start_doctor_consultation note:', error?.message || error);
          return { data: { id: appointmentId, status: 'in_consultation' }, error: null };
        }
        return { data: Array.isArray(data) ? data[0] : data, error: null };
      } catch (err) {
        console.warn('Supabase start_doctor_consultation exception:', err);
        return { data: { id: appointmentId, status: 'in_consultation' }, error: null };
      }
    }
    return this.updateStatus(appointmentId, 'in_consultation');
  },

  async endConsultation(appointmentId, doctorId, extra = {}) {
    if (USE_SUPABASE()) {
      try {
        await supabase.rpc('end_doctor_consultation', {
          p_appointment_id: appointmentId,
          p_doctor_id: doctorId,
        });
      } catch (e) {
        console.warn('Supabase end_doctor_consultation exception:', e);
      }
      return this.updateStatus(appointmentId, 'completed', extra);
    }
    return this.updateStatus(appointmentId, 'completed', extra);
  },

  /** Cancel an appointment */
  async cancel(appointmentId) {
    return this.updateStatus(appointmentId, 'cancelled');
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCTOR QUEUE (Live OPD queue with checked_in_at)
// ═══════════════════════════════════════════════════════════════════════════════
const doctorQueue = {
  async getQueue(doctorId, dateStr) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctor_queue')
        .select('*, appointments(*, patients(name, age, gender, phone))')
        .eq('doctor_id', doctorId)
        .eq('date', dateStr)
        .order('queue_position', { ascending: true });
      return { data: data || [], error };
    }
    return { data: [], error: null };
  },

  async checkIn({ appointmentId, doctorId, date, queuePosition }) {
    const checkedInAt = new Date().toISOString();
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctor_queue')
        .upsert({
          appointment_id: appointmentId,
          doctor_id: doctorId,
          date: date || new Date().toISOString().split('T')[0],
          queue_position: queuePosition || 1,
          checked_in_at: checkedInAt,
          status: 'waiting',
        })
        .select()
        .single();
      return { data, error };
    }
    return { data: { appointment_id: appointmentId, checked_in_at: checkedInAt }, error: null };
  },

  async updateStatus(queueIdOrAppointmentId, status) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctor_queue')
        .update({ status })
        .or(`id.eq.${queueIdOrAppointmentId},appointment_id.eq.${queueIdOrAppointmentId}`)
        .select();
      return { data, error };
    }
    return { data: null, error: null };
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
  async save({ id, patientId, appointmentId = null, language, isAyushMode, consents, history, interviewProgress, documents, summary, redFlags, tokenNumber, queueDate, doctorNotes, prescription, status, submitted = false }) {
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
      token_number: tokenNumber || null,
      queue_date: queueDate || null,
      doctor_notes: doctorNotes || null,
      prescription: prescription || null,
      status: status || (submitted ? 'submitted' : 'draft'),
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

const DEFAULT_STAFF_DEFINITIONS = [
  {
    id: 'f0000001-0001-0001-0001-000000000001',
    username: 'admin',
    name: 'Master Clinic Admin',
    role: 'admin',
    department: 'Central Administration',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0001-0001-0001-000000000002',
    username: 'admin.aiims',
    name: 'AIIMS Delhi Admin',
    role: 'admin',
    department: 'Hospital Administration',
    hospital_id: 'aiims-delhi',
    hospital_name: 'AIIMS New Delhi',
    is_active: true,
  },
  {
    id: 'f0000001-0001-0001-0001-000000000003',
    username: 'admin.sms',
    name: 'SMS Hospital Admin',
    role: 'admin',
    department: 'Hospital Administration',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0001-0001-0001-000000000004',
    username: 'admin.apollo',
    name: 'Apollo Delhi Admin',
    role: 'admin',
    department: 'Hospital Administration',
    hospital_id: 'apollo-delhi',
    hospital_name: 'Indraprastha Apollo Hospitals',
    is_active: true,
  },
  {
    id: 'f0000001-0001-0001-0001-000000000005',
    username: 'admin.shalby',
    name: 'Shalby Jaipur Admin',
    role: 'admin',
    department: 'Hospital Administration',
    hospital_id: 'shalby-jaipur',
    hospital_name: 'Shalby Hospital Jaipur',
    is_active: true,
  },
  {
    id: 'f0000001-0001-0001-0001-000000000006',
    username: 'admin.fortis',
    name: 'Fortis Jaipur Admin',
    role: 'admin',
    department: 'Hospital Administration',
    hospital_id: 'fortis-jaipur',
    hospital_name: 'Fortis Escorts Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0001-0001-0001-000000000007',
    username: 'admin.narayana',
    name: 'Narayana Health Admin',
    role: 'admin',
    department: 'Hospital Administration',
    hospital_id: 'narayana-bangalore',
    hospital_name: 'Narayana Health City',
    is_active: true,
  },
  {
    id: 'f0000001-0002-0001-0001-000000000001',
    username: 'swasthya_admin',
    name: 'Chief Systems Admin',
    role: 'admin',
    department: 'Executive Operations',
    is_active: true,
  },
  {
    id: 'f0000001-0003-0002-0002-000000000001',
    username: 'drananyasharma',
    name: 'Dr. Ananya Sharma',
    role: 'doctor',
    department: 'General Physician',
    doctor_id: 'd0000001-0002-0002-0002-000000000001',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0004-0001-0001-000000000001',
    username: 'drrandeepguleria',
    name: 'Dr. Randeep Guleria',
    role: 'doctor',
    department: 'Pulmonology',
    doctor_id: 'd0000001-0001-0001-0001-000000000001',
    hospital_id: 'aiims-delhi',
    hospital_name: 'AIIMS New Delhi',
    is_active: true,
  },
  {
    id: 'f0000001-0005-0002-0002-000000000002',
    username: 'drpriyaverma',
    name: 'Dr. Priya Verma',
    role: 'doctor',
    department: 'General Medicine',
    doctor_id: 'd0000001-0004-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0006-0002-0002-000000000002',
    username: 'drrohanmehta',
    name: 'Dr. Rohan Mehta',
    role: 'doctor',
    department: 'General Medicine',
    doctor_id: 'd0000001-0005-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0007-0002-0002-000000000002',
    username: 'drnehaagarwal',
    name: 'Dr. Neha Agarwal',
    role: 'doctor',
    department: 'General Medicine',
    doctor_id: 'd0000001-0006-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0008-0002-0002-000000000002',
    username: 'dramitsingh',
    name: 'Dr. Amit Singh',
    role: 'doctor',
    department: 'General Medicine',
    doctor_id: 'd0000001-0007-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0009-0002-0002-000000000002',
    username: 'vaidyarmehta',
    name: 'Vaidya R. Mehta',
    role: 'doctor',
    department: 'Ayurveda & Panchakarma',
    doctor_id: 'd0000001-0008-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0010-0002-0002-000000000002',
    username: 'vaidyasanjeev',
    name: 'Vaidya Sanjeev Sharma',
    role: 'doctor',
    department: 'Ayurveda & Panchakarma',
    doctor_id: 'd0000001-0009-0002-0002-000000000002',
    hospital_id: 'nia-jaipur',
    hospital_name: 'National Institute of Ayurveda (NIA)',
    is_active: true,
  },
  {
    id: 'f0000001-0011-0003-0003-000000000003',
    username: 'drnareshtrehan',
    name: 'Dr. Naresh Trehan',
    role: 'doctor',
    department: 'Cardiology',
    doctor_id: 'd0000001-0010-0003-0003-000000000003',
    hospital_id: 'apollo-delhi',
    hospital_name: 'Indraprastha Apollo Hospitals',
    is_active: true,
  },
  {
    id: 'f0000001-0012-0003-0003-000000000003',
    username: 'drarjunmehta',
    name: 'Dr. Arjun Mehta',
    role: 'doctor',
    department: 'General Medicine',
    doctor_id: 'd0000001-0011-0003-0003-000000000003',
    hospital_id: 'apollo-delhi',
    hospital_name: 'Indraprastha Apollo Hospitals',
    is_active: true,
  },
  {
    id: 'f0000001-0013-0004-0004-000000000004',
    username: 'drrajeshverma',
    name: 'Dr. Rajesh Verma',
    role: 'doctor',
    department: 'Orthopedics & Joint Replacement',
    doctor_id: 'd0000001-0012-0004-0004-000000000004',
    hospital_id: 'shalby-jaipur',
    hospital_name: 'Shalby Hospital Jaipur',
    is_active: true,
  },
  {
    id: 'f0000001-0014-0004-0004-000000000004',
    username: 'drnehagupta',
    name: 'Dr. Neha Gupta',
    role: 'doctor',
    department: 'General Medicine',
    doctor_id: 'd0000001-0013-0004-0004-000000000004',
    hospital_id: 'shalby-jaipur',
    hospital_name: 'Shalby Hospital Jaipur',
    is_active: true,
  },
  {
    id: 'f0000001-0015-0005-0005-000000000005',
    username: 'drgayatrijoshi',
    name: 'Dr. Gayatri Joshi',
    role: 'doctor',
    department: 'Nadi Pariksha & Kayachikitsa',
    doctor_id: 'd0000001-0014-0005-0005-000000000005',
    hospital_id: 'aiia-delhi',
    hospital_name: 'All India Institute of Ayurveda (AIIA)',
    is_active: true,
  },
  {
    id: 'f0000001-0016-0007-0007-000000000007',
    username: 'drdevishetty',
    name: 'Dr. Devi Shetty',
    role: 'doctor',
    department: 'Cardiology',
    doctor_id: 'd0000001-0015-0007-0007-000000000007',
    hospital_id: 'narayana-bangalore',
    hospital_name: 'Narayana Health City',
    is_active: true,
  },
  {
    id: 'f0000001-0017-0010-0010-000000000010',
    username: 'drmanojsaxena',
    name: 'Dr. Manoj Saxena',
    role: 'doctor',
    department: 'General Medicine',
    doctor_id: 'd0000001-0016-0010-0010-000000000010',
    hospital_id: 'jaipur-hospital',
    hospital_name: 'Jaipur Hospital',
    is_active: true,
  },
  {
    id: 'f0000001-0018-0010-0010-000000000010',
    username: 'drsunitakhandelwal',
    name: 'Dr. Sunita Khandelwal',
    role: 'doctor',
    department: 'Pediatrics',
    doctor_id: 'd0000001-0017-0010-0010-000000000010',
    hospital_id: 'jaipur-hospital',
    hospital_name: 'Jaipur Hospital',
    is_active: true,
  },
];

const staff = {
  async ensureSeedAccounts() {
    let list = lsRead(LS.staff) || [];
    let updated = false;

    // Seed default staff (admins and core doctors)
    for (const def of DEFAULT_STAFF_DEFINITIONS) {
      const existing = list.find(a => a.username?.toLowerCase() === def.username.toLowerCase());
      if (!existing) {
        // Compute default password dynamically: ${username}123
        const defaultPw = def.username === 'swasthya_admin' ? 'SwasthyaAdmin@2026' : `${def.username}123`;
        const defaultHash = await hashPassword(defaultPw);
        list.push({
          ...def,
          password_hash: defaultHash,
          password_changed_at: null,
          created_at: new Date().toISOString(),
        });
        updated = true;
      } else if (!existing.password_changed_at) {
        // If password was never modified by admin/doctor, keep default password aligned to ${username}123
        const defaultPw = def.username === 'swasthya_admin' ? 'SwasthyaAdmin@2026' : `${def.username}123`;
        const defaultHash = await hashPassword(defaultPw);
        if (existing.password_hash !== defaultHash) {
          existing.password_hash = defaultHash;
          updated = true;
        }
      }
    }

    if (updated || !lsRead(LS.staff)) {
      lsWrite(LS.staff, list);
    }
    return list;
  },

  async getAll() {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('list_staff_accounts');
      if (!error && data) return { data, error: null };
    }
    const accounts = await staff.ensureSeedAccounts();
    return {
      data: accounts.map(({ password_hash, ...rest }) => rest),
      error: null,
    };
  },

  async getDoctorDailyLogins(adminSessionId = null) {
    const todayKey = new Date().toISOString().split('T')[0];
    let map = lsRead('swasthya_doctor_logins') || {};

    if (USE_SUPABASE()) {
      try {
        if (adminSessionId) {
          const localDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
          const { data: activityRows, error: activityError } = await supabase.rpc('admin_doctor_activity', {
            p_admin_session_id: adminSessionId,
            p_local_date: localDate,
          });
          if (!activityError && Array.isArray(activityRows)) {
            const activityMap = {};
            activityRows.forEach(row => {
              const sessions = Array.isArray(row.sessions_today) ? row.sessions_today : [];
              const entry = {
                doctor_id: row.doctor_id,
                staff_id: row.staff_id,
                hospital_id: row.hospital_id,
                firstLoginTodayAt: row.first_login_at,
                lastLoginAt: row.last_login_at,
                lastLogoutAt: row.last_logout_at,
                lastHeartbeatAt: row.last_seen_at,
                isOnline: row.is_online === true,
                loggedInToday: true,
                dutySecondsToday: Number(row.duty_seconds_today || 0),
                dutyMinutesToday: Math.round(Number(row.duty_seconds_today || 0) / 60),
                sessionsToday: sessions,
                targetShiftHours: 6,
              };
              if (row.doctor_id) activityMap[String(row.doctor_id).toLowerCase()] = entry;
              if (row.staff_id) activityMap[String(row.staff_id).toLowerCase()] = entry;
            });
            return { data: activityMap, error: null };
          }
          if (activityError) {
            console.warn('Hospital-scoped activity query failed:', activityError.message);
            return { data: {}, error: new Error(activityError.message) };
          }
        }

        // Never fall back to a cross-hospital staff scan when Supabase is the
        // source of truth. A fresh authenticated admin session is required.
        return { data: {}, error: new Error('A fresh hospital admin session is required for activity data') };

        const { data, error } = await supabase
          .from('staff_accounts')
          .select('id, doctor_id, username, name, updated_at, is_active')
          .eq('role', 'doctor');

        if (!error && data) {
          data.forEach(row => {
            const loginDate = row.updated_at ? row.updated_at.split('T')[0] : null;
            const existing = map[row.doctor_id] || map[row.id] || map[row.username] || (row.name ? map[row.name.toLowerCase().trim()] : null) || {};
            const isToday = loginDate === todayKey || existing.loggedInToday === true;
            
            const dynamicShift = existing.shiftType || (row.updated_at ? (() => {
              const d = new Date(row.updated_at);
              const m = d.getHours() * 60 + d.getMinutes();
              if (m >= 540 && m < 750) return 'Morning OPD Session (09:00 AM - 12:30 PM)';
              if (m >= 750 && m < 960) return 'Afternoon OPD Session (12:30 PM - 04:00 PM)';
              if (m >= 960 && m <= 1170) return 'Evening OPD Session (04:00 PM - 07:30 PM)';
              return 'Hospital OPD Schedule (09:00 AM - 07:30 PM)';
            })() : 'Hospital OPD Schedule (09:00 AM - 07:30 PM)');

            const entry = {
              ...existing,
              lastLoginAt: existing.lastLoginAt || row.updated_at,
              lastLogoutAt: existing.lastLogoutAt || null,
              isOnline: existing.isOnline === true,
              loggedInToday: isToday,
              dutyMinutesToday: existing.dutyMinutesToday || 0,
              dutySecondsToday: existing.dutySecondsToday || (existing.dutyMinutesToday ? existing.dutyMinutesToday * 60 : 0),
              sessionsToday: existing.sessionsToday || [],
              shiftType: dynamicShift,
              targetShiftHours: existing.targetShiftHours || 6,
            };
            if (row.doctor_id) map[row.doctor_id] = entry;
            if (row.id) map[row.id] = entry;
            if (row.username) map[row.username] = entry;
            if (row.name) {
              map[row.name.toLowerCase().trim()] = entry;
              map[row.name.toLowerCase().replace(/^dr\.\s*|^dr\s*/i, '').trim()] = entry;
            }
          });
          lsWrite('swasthya_doctor_logins', map);
          return { data: map, error: null };
        }
      } catch (e) {
        console.warn('Could not query staff logins from Supabase:', e);
      }
    }

    return { data: map, error: null };
  },

  async login(username, password) {
    const cleanUser = String(username || '').toLowerCase().trim();
    const nowIso = new Date().toISOString();
    const todayKey = nowIso.split('T')[0];

    // Compute active OPD shift from current login time
    const currentMins = new Date().getHours() * 60 + new Date().getMinutes();
    const calculatedShift = currentMins >= 540 && currentMins < 750
      ? 'Morning OPD Session (09:00 AM - 12:30 PM)'
      : currentMins >= 750 && currentMins < 960
      ? 'Afternoon OPD Session (12:30 PM - 04:00 PM)'
      : currentMins >= 960 && currentMins <= 1170
      ? 'Evening OPD Session (04:00 PM - 07:30 PM)'
      : 'Hospital OPD Schedule (09:00 AM - 07:30 PM)';

    // Check brute-force lockout status
    const lockStatus = getAuthLockStatus(cleanUser);
    if (lockStatus.locked) {
      const minutes = Math.floor(lockStatus.remainingSeconds / 60);
      const seconds = lockStatus.remainingSeconds % 60;
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      return {
        data: null,
        error: new Error(`Account temporarily locked due to repeated failed attempts. Please wait ${timeStr} before trying again.`)
      };
    }

    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('staff_login', {
        p_username: cleanUser,
        p_password: password,
      });
      if (!error && data && data.length > 0) {
        clearFailedAttempts(cleanUser);
        const userRow = data[0];
        // Record login time in staff_accounts
        try {
          await supabase.from('staff_accounts').update({ updated_at: nowIso }).eq('id', userRow.id);
        } catch (e) {}

        // Record in doctor daily login tracker
        const loginMap = lsRead('swasthya_doctor_logins') || {};
        const prev = loginMap[userRow.doctor_id] || loginMap[userRow.id] || loginMap[userRow.username] || (userRow.name ? loginMap[userRow.name.toLowerCase().trim()] : null) || {};
        const prevWasToday = prev.lastLoginAt ? prev.lastLoginAt.split('T')[0] === todayKey : false;
        
        const entry = {
          ...prev,
          lastLoginAt: nowIso,
          firstLoginTodayAt: (prevWasToday && prev.firstLoginTodayAt) ? prev.firstLoginTodayAt : nowIso,
          loggedInToday: true,
          isOnline: true,
          lastLogoutAt: null,
          dutyMinutesToday: prevWasToday ? (prev.dutyMinutesToday || 0) : 0,
          dutySecondsToday: prevWasToday ? (prev.dutySecondsToday || (prev.dutyMinutesToday ? prev.dutyMinutesToday * 60 : 0)) : 0,
          sessionsToday: prevWasToday ? (prev.sessionsToday || []) : [],
          shiftType: calculatedShift,
          targetShiftHours: 6,
        };
        const registerKeys = [
          userRow.doctor_id,
          userRow.id,
          userRow.username,
          cleanUser,
          userRow.name ? userRow.name.toLowerCase().trim() : null,
          userRow.name ? userRow.name.toLowerCase().replace(/^dr\.\s*|^dr\s*/i, '').trim() : null,
          userRow.email ? userRow.email.toLowerCase().trim() : null,
        ].filter(Boolean);

        registerKeys.forEach(k => { loginMap[k] = entry; });
        lsWrite('swasthya_doctor_logins', loginMap);
        try {
          window.dispatchEvent(new CustomEvent('swasthya_doctor_status_changed'));
        } catch (e) {}

        return { data: userRow, error: null };
      }
      if (error) {
        console.warn('Supabase staff_login RPC fallback to local verify:', error.message);
      }
    }

    // Local / Client-side fallback authentication with encrypted password hash verification
    const accounts = await staff.ensureSeedAccounts();
    const cleanAlpha = cleanUser.replace(/[^a-z0-9]/g, '');
    const account = accounts.find(a => {
      if (a.is_active === false) return false;
      const aUser = (a.username || '').toLowerCase().trim();
      const aAlpha = aUser.replace(/[^a-z0-9]/g, '');
      const aName = (a.name || '').toLowerCase().replace(/^dr\.\s*|^dr\s*/i, '').replace(/[^a-z0-9]/g, '');
      const aEmail = (a.email || '').toLowerCase().trim();
      const aEmailPre = aEmail.split('@')[0]?.replace(/[^a-z0-9]/g, '');

      return (
        aUser === cleanUser ||
        aAlpha === cleanAlpha ||
        (cleanAlpha.startsWith('dr') && aAlpha === cleanAlpha.slice(2)) ||
        (aAlpha.startsWith('dr') && aAlpha.slice(2) === cleanAlpha) ||
        (cleanAlpha.startsWith('dr') && aName === cleanAlpha.slice(2)) ||
        aName === cleanAlpha ||
        aEmail === cleanUser ||
        aEmailPre === cleanAlpha
      );
    });

    if (!account) {
      const attempt = recordFailedAttempt(cleanUser);
      if (attempt.locked) {
        return { data: null, error: new Error('Account temporarily locked for 2 minutes due to 5 consecutive failed attempts.') };
      }
      return { data: null, error: new Error(`Invalid credentials (${5 - attempt.count} attempt(s) remaining before 2-minute lockout)`) };
    }

    let isMatch = false;
    if (account.password_hash) {
      isMatch = await verifyPassword(password, account.password_hash);
    }
    // Dynamic default password fallback (${username}123) if password was never modified
    if (!isMatch && (!account.password_changed_at || account.password_changed_at === null)) {
      const u1 = (account.username || '').toLowerCase();
      const u2 = u1.replace(/[^a-z0-9]/g, '');
      const u3 = cleanUser;
      const u4 = cleanAlpha;
      if (
        password === `${u1}123` ||
        password === `${u2}123` ||
        password === `${u3}123` ||
        password === `${u4}123` ||
        (account.username === 'swasthya_admin' && password === 'SwasthyaAdmin@2026')
      ) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      const attempt = recordFailedAttempt(cleanUser);
      if (attempt.locked) {
        return { data: null, error: new Error('Account temporarily locked for 2 minutes due to 5 consecutive failed attempts.') };
      }
      return { data: null, error: new Error(`Invalid credentials (${5 - attempt.count} attempt(s) remaining before 2-minute lockout)`) };
    }

    // Successful login - clear failed attempts counter
    clearFailedAttempts(cleanUser);

    // Comprehensive alias key builder for 100% reliable doctor matching
    const buildDoctorKeys = (acc) => {
      if (!acc) return [];
      const n = (acc.name || '').toLowerCase().trim();
      const nClean = n.replace(/^dr\.\s*|^dr\s*/i, '').trim();
      const nSlug = nClean.replace(/[^a-z0-9]+/g, '-');
      const nAlpha = nClean.replace(/[^a-z0-9]/g, '');
      const u = (acc.username || '').toLowerCase().trim();
      const uAlpha = u.replace(/[^a-z0-9]/g, '');
      const em = (acc.email || '').toLowerCase().trim();
      const emPre = em.split('@')[0]?.trim();
      const did = acc.doctor_id || acc.doctorId;
      const id = acc.id;
      const hospId = acc.hospital_id || acc.hospitalId || 'sms-jaipur';

      return [
        did,
        id,
        u,
        uAlpha,
        `dr.${uAlpha}`,
        `dr${uAlpha}`,
        n,
        nClean,
        `dr. ${nClean}`,
        `dr ${nClean}`,
        `dr-${nSlug}`,
        nSlug,
        `dr${nAlpha}`,
        nAlpha,
        em,
        emPre,
        `${hospId}-${nSlug}`,
        `${hospId}-dr-${nSlug}`,
        acc.professionalId ? String(acc.professionalId).toLowerCase().trim() : null
      ].filter(Boolean);
    };

    const registerKeys = buildDoctorKeys({
      ...account,
      name: account.name,
      username: cleanUser || account.username,
      doctor_id: account.doctor_id || account.id,
    });

    const loginMap = lsRead('swasthya_doctor_logins') || {};
    let foundPrev = null;
    for (const k of registerKeys) {
      if (loginMap[k]) {
        foundPrev = loginMap[k];
        break;
      }
    }
    const prev = foundPrev || {};
    const prevWasToday = prev.lastLoginAt ? prev.lastLoginAt.split('T')[0] === todayKey : false;

    const entry = {
      ...prev,
      doctor_id: account.doctor_id || account.id,
      doctor_name: account.name,
      lastLoginAt: nowIso,
      firstLoginTodayAt: (prevWasToday && prev.firstLoginTodayAt) ? prev.firstLoginTodayAt : nowIso,
      loggedInToday: true,
      isOnline: true,
      lastLogoutAt: null,
      dutyMinutesToday: prevWasToday ? (prev.dutyMinutesToday || 0) : 0,
      dutySecondsToday: prevWasToday ? (prev.dutySecondsToday || (prev.dutyMinutesToday ? prev.dutyMinutesToday * 60 : 0)) : 0,
      sessionsToday: prevWasToday ? (prev.sessionsToday || []) : [],
      shiftType: calculatedShift,
      targetShiftHours: 6,
    };

    registerKeys.forEach(k => { loginMap[k] = entry; });
    lsWrite('swasthya_doctor_logins', loginMap);
    try {
      window.dispatchEvent(new CustomEvent('swasthya_doctor_status_changed'));
    } catch (e) {}

    const { password_hash, ...cleanAccount } = account;
    return { data: cleanAccount, error: null };
  },

  async recordHeartbeat(staffMember) {
    const activitySessionId = staffMember?.activity_session_id || staffMember?.activitySessionId;
    if (!activitySessionId || !USE_SUPABASE()) return { data: false, error: null };
    const { data, error } = await supabase.rpc('staff_activity_heartbeat', { p_session_id: activitySessionId });
    return { data, error };
  },

  async recordLogout(staffMember, reason = 'user_logout') {
    if (!staffMember) return;
    const activitySessionId = staffMember.activity_session_id || staffMember.activitySessionId;
    if (activitySessionId && USE_SUPABASE()) {
      try {
        await supabase.rpc('staff_activity_logout', {
          p_session_id: activitySessionId,
          p_reason: reason,
        });
      } catch (e) {
        console.warn('Could not close server staff activity session:', e);
      }
    }
    const nowIso = new Date().toISOString();
    const todayKey = nowIso.split('T')[0];
    const loginMap = lsRead('swasthya_doctor_logins') || {};

    const n = (staffMember.name || '').toLowerCase().trim();
    const nClean = n.replace(/^dr\.\s*|^dr\s*/i, '').trim();
    const nSlug = nClean.replace(/[^a-z0-9]+/g, '-');
    const nAlpha = nClean.replace(/[^a-z0-9]/g, '');
    const u = (staffMember.username || '').toLowerCase().trim();
    const uAlpha = u.replace(/[^a-z0-9]/g, '');
    const em = (staffMember.email || '').toLowerCase().trim();
    const emPre = em.split('@')[0]?.trim();
    const did = staffMember.doctor_id || staffMember.doctorId;
    const id = staffMember.id;
    const hospId = staffMember.hospital_id || staffMember.hospitalId || 'sms-jaipur';

    const keys = [
      did,
      id,
      u,
      uAlpha,
      `dr.${uAlpha}`,
      `dr${uAlpha}`,
      n,
      nClean,
      `dr. ${nClean}`,
      `dr ${nClean}`,
      `dr-${nSlug}`,
      nSlug,
      `dr${nAlpha}`,
      nAlpha,
      em,
      emPre,
      `${hospId}-${nSlug}`,
      `${hospId}-dr-${nSlug}`
    ].filter(Boolean);

    let foundPrev = null;
    for (const k of keys) {
      if (loginMap[k]) {
        foundPrev = loginMap[k];
        break;
      }
    }
    const prev = foundPrev || {};
    const wasToday = prev.lastLoginAt ? prev.lastLoginAt.split('T')[0] === todayKey : true;
    
    let additionalSeconds = 0;
    if (prev.lastLoginAt && wasToday) {
      const diffMs = new Date(nowIso).getTime() - new Date(prev.lastLoginAt).getTime();
      if (diffMs > 0) {
        additionalSeconds = Math.max(1, Math.round(diffMs / 1000));
      }
    }
    const totalSeconds = (prev.dutySecondsToday || ((prev.dutyMinutesToday || 0) * 60)) + additionalSeconds;
    const totalMinutes = Math.round(totalSeconds / 60);

    const sessionRecord = {
      loginAt: prev.lastLoginAt,
      logoutAt: nowIso,
      durationSeconds: additionalSeconds,
    };
    const prevSessions = Array.isArray(prev.sessionsToday) ? prev.sessionsToday : [];
    const sessionsToday = [...prevSessions, sessionRecord];

    const entry = {
      ...prev,
      lastLogoutAt: nowIso,
      isOnline: false,
      loggedInToday: wasToday,
      dutyMinutesToday: totalMinutes,
      dutySecondsToday: totalSeconds,
      sessionsToday,
      shiftType: prev.shiftType || 'Hospital OPD Schedule (09:00 AM - 07:30 PM)',
      targetShiftHours: 6,
    };

    keys.forEach(k => {
      loginMap[k] = entry;
    });

    lsWrite('swasthya_doctor_logins', loginMap);
    try {
      window.dispatchEvent(new CustomEvent('swasthya_doctor_status_changed'));
    } catch (e) {}
  },

  async create({
    username,
    password,
    name,
    role = 'doctor',
    department = null,
    doctorId = null,
    hospitalId = null,
    hospitalName = null,
  }) {
    const cleanUser = String(username || '').toLowerCase().trim();
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('create_staff_account', {
        p_username: cleanUser,
        p_password: password,
        p_name: name,
        p_role: role,
        p_department: department || null,
        p_doctor_id: doctorId || null,
        p_hospital_id: hospitalId || null,
        p_hospital_name: hospitalName || null,
      });
      if (!error && data) return { data, error: null };
    }

    // LocalStorage Fallback with PBKDF2 hash
    const accounts = await staff.ensureSeedAccounts();
    if (accounts.some(a => a.username.toLowerCase() === cleanUser)) {
      return { data: null, error: new Error('Username already exists') };
    }

    const hashedPassword = await hashPassword(password);
    const newAccount = {
      id: uuid(),
      username: cleanUser,
      password_hash: hashedPassword,
      name,
      role,
      department,
      doctor_id: doctorId,
      hospital_id: hospitalId,
      hospital_name: hospitalName,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    accounts.unshift(newAccount);
    lsWrite(LS.staff, accounts);
    return { data: newAccount.id, error: null };
  },

  async changePassword({ username, doctorId = null, oldPassword, newPassword }) {
    let cleanUser = String(username || '').toLowerCase().trim();
    if (!cleanUser && !doctorId) {
      try {
        const saved = JSON.parse(localStorage.getItem('swasthya_session') || '{}');
        if (saved?.staff?.username) cleanUser = saved.staff.username.toLowerCase().trim();
        if (saved?.staff?.doctor_id && !doctorId) doctorId = saved.staff.doctor_id;
      } catch {}
    }

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return {
        data: null,
        error: new Error(strengthCheck.message || 'Password must be at least 8 characters long and contain letters and numbers.'),
      };
    }

    if (cleanUser.includes('@')) {
      cleanUser = cleanUser.split('@')[0];
    }

    // Step 1: Check LocalStorage accounts first
    const accounts = await staff.ensureSeedAccounts();
    let accountIndex = accounts.findIndex(
      a => (cleanUser && (a.username.toLowerCase() === cleanUser || a.email?.toLowerCase() === cleanUser || a.email?.split('@')[0].toLowerCase() === cleanUser)) ||
           (doctorId && a.doctor_id === doctorId)
    );

    // If not found, try loose name match
    if (accountIndex === -1 && cleanUser) {
      accountIndex = accounts.findIndex(
        a => a.name && a.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanUser.replace(/[^a-z0-9]/g, '')
      );
    }

    let localValid = false;

    if (accountIndex !== -1) {
      const account = accounts[accountIndex];
      cleanUser = account.username.toLowerCase();
      localValid = await verifyPassword(oldPassword, account.password_hash);
      
      // Fallback check for initial default password format
      if (!localValid && !account.password_changed_at) {
        const defaultPw = account.username === 'swasthya_admin' ? 'SwasthyaAdmin@2026' : `${account.username}123`;
        if (oldPassword === defaultPw) {
          localValid = true;
        }
      }
    }

    // Step 2: If Supabase is configured, try Supabase RPC
    let supabaseSuccess = false;
    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.rpc('change_staff_password', {
          p_username: cleanUser,
          p_old_password: oldPassword,
          p_new_password: newPassword,
        });
        if (!error && data) {
          supabaseSuccess = true;
        }
      } catch (e) {
        console.warn('Supabase change_staff_password notice:', e);
      }
    }

    // If neither local verification succeeded nor Supabase RPC succeeded
    if (!localValid && !supabaseSuccess) {
      return { data: null, error: new Error('Current password is incorrect. Please verify your current password.') };
    }

    // Compute new PBKDF2 hash
    const newHash = await hashPassword(newPassword);

    // Update LocalStorage account
    if (accountIndex !== -1) {
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        password_hash: newHash,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      lsWrite(LS.staff, accounts);
    } else {
      accounts.push({
        id: uuid(),
        username: cleanUser,
        password_hash: newHash,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: true,
      });
      lsWrite(LS.staff, accounts);
    }

    // Also update session in localStorage if current active staff user
    try {
      const session = JSON.parse(localStorage.getItem('swasthya_session') || '{}');
      if (session?.staff && (session.staff.username?.toLowerCase() === cleanUser || (doctorId && session.staff.doctor_id === doctorId))) {
        session.staff.password_changed_at = new Date().toISOString();
        localStorage.setItem('swasthya_session', JSON.stringify(session));
      }
    } catch {}

    // If Supabase is active and account wasn't updated via RPC, sync it to Supabase
    if (USE_SUPABASE() && !supabaseSuccess) {
      try {
        await supabase.from('staff_accounts').upsert({
          username: cleanUser,
          password_hash: newHash,
          password_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        }, { onConflict: 'username' });
      } catch (e) {
        console.warn('Supabase staff_accounts background sync:', e);
      }
    }

    return { data: true, error: null };
  },
};

const DEFAULT_COMMUNITIES = [
  {
    id: 'c0000001-0001-0001-0001-000000000001',
    title: 'Mental Health & Wellness',
    category: 'Mental Health',
    theme_key: 'mental',
    disease_key: 'mental',
    tagline: 'You are not alone. We listen. We support. We care.',
    description: 'A safe and supportive space to share, learn and grow together. Let us break the stigma and build a mentally healthier world.',
    is_verified: true,
    is_active: true,
    sort_order: 1,
    eligible_specialities: ['Psychiatry', 'Clinical Psychology', 'Counseling', 'Mind-Body Medicine'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0002-0002-0002-000000000002',
    title: 'Diabetes & Metabolic Wellness',
    category: 'Chronic Conditions',
    theme_key: 'diabetes',
    disease_key: 'diabetes',
    tagline: 'Empowering healthy living through nutrition, exercise, and clinical monitoring.',
    description: 'Evidence-based glycemic control guidance, dietary plans, insulin management, and peer encouragement for diabetic patients.',
    is_verified: true,
    is_active: true,
    sort_order: 2,
    eligible_specialities: ['Endocrinology', 'Diabetology', 'General Medicine', 'Clinical Nutrition'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0003-0003-0003-000000000003',
    title: 'Maternal & Child Care',
    category: 'Women & Children',
    theme_key: 'maternal',
    disease_key: 'maternal',
    tagline: 'Comprehensive care for mothers and little ones at every step.',
    description: 'Prenatal wellness, safe delivery awareness, postnatal recovery, newborn immunization, and pediatric nutrition guidance.',
    is_verified: true,
    is_active: true,
    sort_order: 3,
    eligible_specialities: ['Obstetrics & Gynecology', 'Pediatrics', 'Neonatology', 'Lactation Consulting'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0004-0004-0004-000000000004',
    title: 'Heart Health Circle',
    category: 'Cardiology',
    theme_key: 'cardiac',
    disease_key: 'cardiac',
    tagline: 'Protecting your heart with preventive cardiology and post-op care.',
    description: 'Managing hypertension, cholesterol, coronary wellness, and rehabilitation routines led by verified cardiologists.',
    is_verified: true,
    is_active: true,
    sort_order: 4,
    eligible_specialities: ['Cardiology', 'Cardiothoracic Surgery', 'Preventive Cardiology'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0005-0005-0005-000000000005',
    title: 'Cancer Warriors Network',
    category: 'Oncology',
    theme_key: 'cancer',
    disease_key: 'cancer',
    tagline: 'Standing strong with cancer patients and families with hope and courage.',
    description: 'Oncology care navigation, chemotherapy support, radiation therapy insights, and survivor stories.',
    is_verified: true,
    is_active: true,
    sort_order: 5,
    eligible_specialities: ['Medical Oncology', 'Surgical Oncology', 'Radiation Oncology', 'Palliative Care'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0006-0006-0006-000000000006',
    title: 'AYUSH & Integrative Healing',
    category: 'AYUSH / Alternative',
    theme_key: 'ayush',
    disease_key: 'ayush',
    tagline: 'Ancient wisdom meets modern evidence for holistic well-being.',
    description: 'Ayurvedic Rasayana, Dinacharya, herbal formulations, Yoga therapy, and Panchakarma lifestyle management.',
    is_verified: true,
    is_active: true,
    sort_order: 6,
    eligible_specialities: ['Ayurveda', 'Panchakarma', 'Kayachikitsa', 'Yoga & Naturopathy'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0007-0007-0007-000000000007',
    title: 'Respiratory & Asthma Health',
    category: 'Pulmonology',
    theme_key: 'respiratory',
    disease_key: 'respiratory',
    tagline: 'Breathing easy through clear air, inhaler techniques, and allergy care.',
    description: 'Guidance on managing asthma, COPD, seasonal allergies, post-viral respiratory recovery, and breathing exercises.',
    is_verified: true,
    is_active: true,
    sort_order: 7,
    eligible_specialities: ['Pulmonology', 'Chest Medicine', 'Respiratory Therapy', 'Allergy & Immunology'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0008-0008-0008-000000000008',
    title: 'Senior Wellness & Care',
    category: 'Geriatrics',
    theme_key: 'senior',
    disease_key: 'geriatrics',
    tagline: 'Dignified, healthy, and joyous golden years for our elders.',
    description: 'Joint mobility, dementia care, fall prevention, balanced nutrition, and medication management for seniors.',
    is_verified: true,
    is_active: true,
    sort_order: 8,
    eligible_specialities: ['Geriatrics', 'Orthopedics', 'Neurology', 'Physiotherapy'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0009-0009-0009-000000000009',
    title: 'Caregivers Sanctuary',
    category: 'Support & Caregiving',
    theme_key: 'caregiver',
    disease_key: 'caregiver',
    tagline: 'Caring for those who care for others.',
    description: 'Burnout prevention, peer coping circles, respite care tips, and emotional resilience for family caregivers.',
    is_verified: true,
    is_active: true,
    sort_order: 9,
    eligible_specialities: ['Psychiatry', 'Social Work', 'Palliative Care', 'Nursing'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  },
  {
    id: 'c0000001-0010-0010-0010-000000000010',
    title: 'Blood & Hematology Network',
    category: 'Hematology',
    theme_key: 'blood',
    disease_key: 'blood',
    tagline: 'Every drop counts. Life-saving blood donation and anemia awareness.',
    description: 'Emergency blood drives, thalassemia support, anemia prevention, and voluntary donor mobilization.',
    is_verified: true,
    is_active: true,
    sort_order: 10,
    eligible_specialities: ['Hematology', 'Transfusion Medicine', 'General Medicine'],
    patient_community_memberships: [{ count: 0 }],
    community_posts: [{ count: 0 }],
    community_professionals: [{ count: 0 }]
  }
];

const DEFAULT_POSTS = [];

const communities = {
  async getDirectory() {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('communities')
        .select('*, patient_community_memberships(count), community_posts(count), community_professionals(count)')
        .eq('is_active', true).order('sort_order').order('title');
      if (!error && data && data.length > 0) return { data, error: null };
    }
    const local = lsRead('swasthya_communities');
    if (local && local.length > 0) {
      const active = local.filter(c => c.is_active !== false);
      return { data: active, error: null };
    }
    lsWrite('swasthya_communities', DEFAULT_COMMUNITIES);
    return { data: DEFAULT_COMMUNITIES, error: null };
  },

  async createCommunity({ title, category, description, banner_url, icon_url, staffId, tagline, theme_key }) {
    if (!title?.trim()) return { data: null, error: new Error('Community title is required') };
    
    const slug = String(title || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const commId = `${slug}-${uuid().slice(0, 6)}`;
    const titleLower = title.toLowerCase();
    const detectedTheme = theme_key || (
      titleLower.includes('cancer') || titleLower.includes('onco') ? 'cancer' :
      titleLower.includes('blood') || titleLower.includes('donor') ? 'blood' :
      titleLower.includes('mental') || titleLower.includes('mind') ? 'mental' :
      titleLower.includes('caregiver') || titleLower.includes('care') ? 'caregiver' :
      titleLower.includes('diabetes') ? 'diabetes' :
      titleLower.includes('heart') || titleLower.includes('cardiac') ? 'cardiac' :
      titleLower.includes('women') || titleLower.includes('maternal') ? 'maternal' :
      titleLower.includes('senior') || titleLower.includes('geriatric') ? 'senior' :
      titleLower.includes('respiratory') || titleLower.includes('asthma') ? 'respiratory' :
      titleLower.includes('ayush') || titleLower.includes('ayurveda') ? 'ayush' : 'general'
    );

    const newComm = {
      id: commId,
      title: title.trim(),
      category: category || 'General',
      description: description?.trim() || '',
      tagline: tagline || (description?.trim() ? description.trim().slice(0, 100) : 'Support and care circle'),
      theme_key: detectedTheme,
      icon_key: 'community',
      cover_image_url: banner_url || null,
      banner_url: banner_url || null,
      icon_url: icon_url || null,
      is_active: true,
      is_verified: true,
      sort_order: 50,
      created_at: new Date().toISOString(),
      patient_community_memberships: [{ count: 0 }],
      community_posts: [{ count: 0 }],
      community_reactions: [{ count: 0 }]
    };

    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.from('communities').insert({
          id: commId,
          title: newComm.title,
          category: newComm.category,
          description: newComm.description,
          tagline: newComm.tagline,
          theme_key: newComm.theme_key,
          icon_key: newComm.icon_key,
          cover_image_url: newComm.cover_image_url,
          is_active: true,
          is_verified: true,
          sort_order: 50
        }).select().single();

        if (!error && data) {
          return { data: { ...newComm, ...data }, error: null };
        }
        if (error) console.warn('Supabase createCommunity insert notice:', error.message);
      } catch (e) {
        console.warn('Supabase createCommunity exception:', e);
      }
    }

    const local = lsRead('swasthya_communities') || DEFAULT_COMMUNITIES;
    local.unshift(newComm);
    lsWrite('swasthya_communities', local);
    return { data: newComm, error: null };
  },

  async deleteCommunity(communityId) {
    if (!communityId) return { data: null, error: new Error('Community ID required') };

    if (USE_SUPABASE()) {
      try {
        const { error } = await supabase.from('communities').update({ is_active: false }).eq('id', communityId);
        if (!error) {
          let local = lsRead('swasthya_communities') || DEFAULT_COMMUNITIES;
          local = local.filter(c => c.id !== communityId);
          lsWrite('swasthya_communities', local);
          return { data: true, error: null };
        }
      } catch (e) {
        console.warn('Supabase deleteCommunity error:', e);
      }
    }
    let local = lsRead('swasthya_communities') || DEFAULT_COMMUNITIES;
    local = local.filter(c => c.id !== communityId);
    lsWrite('swasthya_communities', local);
    return { data: true, error: null };
  },

  async getImpact() {
    if (USE_SUPABASE()) {
      try {
        const tables = ['patient_community_memberships', 'community_posts', 'community_post_reactions', 'community_professionals'];
        const results = await Promise.all(tables.map(table => supabase.from(table).select('*', { count: 'exact', head: true })));
        const firstError = results.find(result => result.error)?.error || null;
        if (!firstError) {
          return {
            data: {
              professionals: results[3].count || 0,
              communitiesCount: 10,
              discussions: results[1].count || 0,
              responses: results[2].count || 0,
              members: results[0].count || 0
            },
            error: null
          };
        }
      } catch (e) {}
    }
    return {
      data: {
        professionals: 0,
        communitiesCount: 10,
        discussions: 0,
        responses: 0,
        members: 0
      },
      error: null
    };
  },

  async getMemberships(patientId) {
    if (!patientId) return { data: [], error: null };
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('patient_community_memberships').select('community_id').eq('patient_id', patientId);
      if (!error) return { data: data || [], error: null };
    }
    const localMembers = lsRead('swasthya_community_memberships') || [];
    return { data: localMembers.filter(m => m.patient_id === patientId), error: null };
  },

  async setMembership(patientId, communityId, joined) {
    if (!patientId) return { data: null, error: new Error('Session is required') };
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.rpc('set_community_membership', { p_patient_id: patientId, p_community_id: communityId, p_joined: joined });
      if (!error) return { data, error: null };
    }
    let localMembers = lsRead('swasthya_community_memberships') || [];
    if (joined) {
      if (!localMembers.some(m => m.patient_id === patientId && m.community_id === communityId)) {
        localMembers.push({ patient_id: patientId, community_id: communityId, created_at: new Date().toISOString() });
      }
    } else {
      localMembers = localMembers.filter(m => !(m.patient_id === patientId && m.community_id === communityId));
    }
    lsWrite('swasthya_community_memberships', localMembers);
    return { data: true, error: null };
  },

  async getPosts(communityId) {
    let supabasePosts = [];
    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.from('community_posts')
          .select('*, doctors:author_doctor_id(name,degrees,speciality,avatar_url,hospitals(name,city)), community_post_reactions(count), community_post_comments(count)')
          .eq('community_id', communityId)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          supabasePosts = data.map(post => {
            const docInfo = post.doctors || {};
            return {
              ...post,
              doctor_id: post.doctor_id || post.author_doctor_id,
              doctors: {
                name: docInfo.name || 'Dr. Ananya Sharma',
                degrees: docInfo.degrees || 'MBBS, MD',
                speciality: docInfo.speciality || 'General Physician',
                avatar_url: docInfo.avatar_url || 'https://randomuser.me/api/portraits/women/44.jpg',
                hospitals: docInfo.hospitals || { name: 'Sawai Man Singh Hospital', city: 'Jaipur' }
              }
            };
          });
        }
      } catch (e) {
        console.warn('Error fetching Supabase community posts:', e);
      }
    }
    const localPosts = lsRead('swasthya_community_posts') || DEFAULT_POSTS;
    const filteredLocal = localPosts.filter(p => p.community_id === communityId);
    const mergedMap = new Map();
    [...supabasePosts, ...filteredLocal].forEach(p => {
      if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
    });
    return { data: Array.from(mergedMap.values()), error: null };
  },

  async publishDoctorPost({ doctor, doctorId, staffId, communityId, title, body, postType, mediaUrl, mediaType, mediaAlt, contentLanguage, translations, pollData }) {
    const finalDocId = doctorId || doctor?.id || doctor?.doctor_id || 'd0000001-0002-0002-0002-000000000001';
    let resolvedStaffUuid = null;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (staffId && uuidRegex.test(staffId)) {
      resolvedStaffUuid = staffId;
    } else if (doctor?.staff_id && uuidRegex.test(doctor.staff_id)) {
      resolvedStaffUuid = doctor.staff_id;
    } else if (USE_SUPABASE()) {
      try {
        const { data: staffRow } = await supabase
          .from('staff_accounts')
          .select('id')
          .or(`doctor_id.eq.${finalDocId},username.eq.drananyasharma`)
          .limit(1)
          .maybeSingle();
        if (staffRow?.id) {
          resolvedStaffUuid = staffRow.id;
        }
      } catch (e) {
        console.warn('Could not resolve staff UUID:', e);
      }
    }

    const newPost = {
      id: uuid(),
      community_id: communityId,
      doctor_id: finalDocId,
      author_doctor_id: finalDocId,
      author_staff_id: resolvedStaffUuid,
      title: title || null,
      body: body || '',
      post_type: postType || 'Clinical Guidance',
      content_language: contentLanguage || 'en',
      translations: translations || {},
      media_url: mediaUrl || null,
      media_type: mediaType || (mediaUrl ? 'image' : null),
      media_alt: mediaAlt || (mediaUrl ? (title || 'Clinical guidance visual aid') : null),
      poll_data: pollData || null,
      status: 'published',
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      doctors: {
        name: doctor?.name || 'Dr. Ananya Sharma',
        degrees: doctor?.degrees || 'MBBS, MD',
        speciality: doctor?.speciality || doctor?.specialty || 'General Physician',
        avatar_url: doctor?.avatar_url || doctor?.avatar || 'https://randomuser.me/api/portraits/women/44.jpg',
        hospitals: {
          name: doctor?.hospitalName || doctor?.hospitals?.name || 'Sawai Man Singh Hospital',
          city: doctor?.city || doctor?.hospitals?.city || 'Jaipur'
        }
      },
      community_post_reactions: [{ count: 0 }],
      community_post_comments: [{ count: 0 }]
    };

    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.from('community_posts').insert({
          id: newPost.id,
          community_id: communityId,
          doctor_id: newPost.doctor_id,
          author_doctor_id: newPost.author_doctor_id,
          author_staff_id: newPost.author_staff_id,
          title: newPost.title,
          body: newPost.body,
          post_type: newPost.post_type,
          content_language: newPost.content_language,
          translations: newPost.translations,
          media_url: newPost.media_url,
          media_alt: newPost.media_alt,
          poll_data: newPost.poll_data,
          status: 'published',
          published_at: newPost.published_at,
          created_at: newPost.created_at
        }).select();
        if (error) {
          console.warn('Supabase community_posts insert warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase community_posts exception:', e);
      }
    }

    const localPosts = lsRead('swasthya_community_posts') || DEFAULT_POSTS;
    localPosts.unshift(newPost);
    lsWrite('swasthya_community_posts', localPosts);
    return { data: newPost, error: null };
  },

  async votePoll({ communityId, postId, optionId, userId }) {
    if (USE_SUPABASE()) {
      try {
        const { data: currentPost } = await supabase
          .from('community_posts')
          .select('poll_data')
          .eq('id', postId)
          .maybeSingle();

        if (currentPost?.poll_data) {
          const poll = currentPost.poll_data;
          if (!poll.votedUsers) poll.votedUsers = {};
          const previousVote = poll.votedUsers[userId];

          poll.options = (poll.options || []).map(opt => {
            let v = opt.votes || 0;
            if (previousVote === opt.id) v = Math.max(0, v - 1);
            if (opt.id === optionId) v += 1;
            return { ...opt, votes: v };
          });

          poll.votedUsers[userId] = optionId;
          poll.totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

          await supabase
            .from('community_posts')
            .update({ poll_data: poll, updated_at: new Date().toISOString() })
            .eq('id', postId);
        }
      } catch (e) {
        console.warn('Error updating poll vote in Supabase:', e);
      }
    }

    const localPosts = lsRead('swasthya_community_posts') || DEFAULT_POSTS;
    const postIdx = localPosts.findIndex(p => p.id === postId);
    if (postIdx !== -1) {
      const post = localPosts[postIdx];
      if (post.poll_data) {
        const poll = post.poll_data;
        if (!poll.votedUsers) poll.votedUsers = {};
        const previousVote = poll.votedUsers[userId];
        poll.options = (poll.options || []).map(opt => {
          let v = opt.votes || 0;
          if (previousVote === opt.id) v = Math.max(0, v - 1);
          if (opt.id === optionId) v += 1;
          return { ...opt, votes: v };
        });
        poll.votedUsers[userId] = optionId;
        poll.totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
        localPosts[postIdx] = { ...post, poll_data: poll };
        lsWrite('swasthya_community_posts', localPosts);
        return { data: localPosts[postIdx], error: null };
      }
    }
    return { data: true, error: null };
  },

  async getPatientReactions(patientId, postIds) {
    if (!patientId || !postIds?.length) return { data: [], error: null };
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('community_post_reactions')
        .select('post_id,reaction_type').eq('patient_id', patientId).in('post_id', postIds);
      if (!error) return { data: data || [], error: null };
    }
    const localReactions = lsRead('swasthya_post_reactions') || [];
    return { data: localReactions.filter(r => r.patient_id === patientId && postIds.includes(r.post_id)), error: null };
  },

  async toggleReaction(patientId, postId, reactionType = 'helpful') {
    if (!patientId) return { data: null, error: new Error('Session is required') };
    if (USE_SUPABASE()) {
      try {
        const { data: existing } = await supabase.from('community_post_reactions')
          .select('*').eq('patient_id', patientId).eq('post_id', postId).maybeSingle();
        if (existing) {
          await supabase.from('community_post_reactions')
            .delete().eq('patient_id', patientId).eq('post_id', postId);
        } else {
          await supabase.from('community_post_reactions')
            .insert({ patient_id: patientId, post_id: postId, reaction_type: reactionType });
        }
      } catch (e) {
        console.warn('Reaction Supabase sync exception:', e);
      }
    }
    let localReactions = lsRead('swasthya_post_reactions') || [];
    const exists = localReactions.some(r => r.patient_id === patientId && r.post_id === postId);
    if (exists) {
      localReactions = localReactions.filter(r => !(r.patient_id === patientId && r.post_id === postId));
    } else {
      localReactions.push({ patient_id: patientId, post_id: postId, reaction_type: reactionType, created_at: new Date().toISOString() });
    }
    lsWrite('swasthya_post_reactions', localReactions);
    return { data: !exists, error: null };
  },

  async getComments(postId) {
    let supabaseComments = [];
    if (USE_SUPABASE()) {
      const { data, error } = await supabase.from('community_post_comments')
        .select('*, patients(name)')
        .eq('post_id', postId).eq('status', 'published').order('created_at');
      if (!error && data) supabaseComments = data;
    }
    const localComments = lsRead('swasthya_post_comments') || [];
    const filteredLocal = localComments.filter(c => c.post_id === postId);
    return { data: [...supabaseComments, ...filteredLocal], error: null };
  },

  async addComment(patientId, postId, body, authorName) {
    if (!patientId) return { data: null, error: new Error('Session is required') };
    const newComment = {
      id: uuid(),
      post_id: postId,
      patient_id: patientId,
      body: body?.trim() || '',
      patients: { name: authorName || 'Community Member' },
      status: 'published',
      created_at: new Date().toISOString()
    };
    if (USE_SUPABASE()) {
      try {
        await supabase.from('community_post_comments').insert({
          id: newComment.id,
          post_id: postId,
          patient_id: patientId,
          body: newComment.body,
          status: 'published'
        });
      } catch (e) {
        console.warn('Comment Supabase sync exception:', e);
      }
    }
    const localComments = lsRead('swasthya_post_comments') || [];
    localComments.push(newComment);
    lsWrite('swasthya_post_comments', localComments);
    return { data: newComment, error: null };
  }
};

const donations = {
  async getActiveRequests() {
    if (!USE_SUPABASE()) {
      const local = lsRead('swasthya_donations') || [];
      return { data: local.filter(r => r.status === 'active'), error: null };
    }
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
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('donation_requests')
        .select('*, hospitals(id,name,address,city,state,type), donation_contributions(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const normalized = data.map(req => {
          const pName = req.patient_summary
            ? req.patient_summary.replace(/^Patient:\s*/i, '').split('(')[0].trim()
            : req.title || 'Patient';
          const dept = req.location
            ? req.location.split(',')[0].trim()
            : 'Emergency';

          return {
            ...req,
            patient_name: pName,
            department: dept,
            required_by: req.expires_at || req.required_by,
            amount_raised: req.amount_received || req.amount_raised || 0,
            units_needed: req.units_needed || 1,
            doctor_name: req.hospitals?.name || 'Central Hospital'
          };
        });
        return { data: normalized, error: null };
      }
      return { data: data || [], error };
    }

    const local = lsRead('swasthya_donations') || [];
    return { data: local, error: null };
  },

  async createRequest(request) {
    const pName = request.patientName || request.patient_name || 'Emergency Patient';
    const bGroup = request.bloodGroup || request.blood_group || 'O+';
    const units = Number(request.unitsNeeded || request.units_needed || 1);
    const dept = request.department || 'Emergency Ward';
    const hospName = request.hospitalName || 'Sawai Man Singh Hospital';

    const defaultTitle = `Blood Request: ${bGroup} (${units} Units) for ${pName}`;
    const defaultDesc = `Urgent blood requirement of ${units} unit(s) ${bGroup} for ${pName} in ${dept}. ${request.additionalNotes || ''}`.trim();
    const finalDesc = defaultDesc.length < 10 ? `${defaultDesc} - Transfusion required immediately.` : defaultDesc;

    const urgencyNorm = String(request.urgency || '').toLowerCase();
    const mappedUrgency = urgencyNorm.includes('emerg') || urgencyNorm === 'critical'
      ? 'critical'
      : urgencyNorm.includes('urg') || urgencyNorm === 'high'
      ? 'high'
      : 'normal';

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validStaffId = request.staffId && uuidRegex.test(request.staffId) ? request.staffId : null;
    const resolvedHospitalId = request.hospitalId && !request.hospitalId.startsWith('a1b2c3d4-')
      ? request.hospitalId
      : 'sms-jaipur';

    const newReqLocal = {
      id: uuid(),
      hospital_id: resolvedHospitalId,
      hospital_name: hospName,
      patient_name: pName,
      category: request.category || 'blood',
      title: request.title || defaultTitle,
      description: finalDesc,
      patient_summary: `Patient: ${pName} (${dept})`,
      urgency: mappedUrgency,
      status: request.status || 'active',
      amount_target: request.category === 'financial' ? Number(request.amountTarget || request.amount_target || 50000) : null,
      amount_raised: 0,
      blood_group: (request.category === 'financial') ? null : bGroup,
      units_needed: (request.category === 'financial') ? null : units,
      units_fulfilled: 0,
      department: dept,
      location: `${dept}, ${hospName}`,
      required_by: request.requiredBy || request.expires_at || null,
      expires_at: request.requiredBy || request.expires_at || null,
      created_at: new Date().toISOString(),
      donation_contributions: []
    };

    if (USE_SUPABASE()) {
      try {
        const insertRow = {
          hospital_id: resolvedHospitalId,
          created_by_staff_id: validStaffId,
          category: request.category || 'blood',
          title: (request.title || defaultTitle).slice(0, 140),
          description: finalDesc.slice(0, 2000),
          urgency: mappedUrgency,
          status: request.status || 'active',
          amount_target: request.category === 'financial' ? Number(request.amountTarget || request.amount_target || 50000) : null,
          blood_group: (request.category === 'financial') ? null : bGroup,
          units_needed: (request.category === 'financial') ? null : units,
          patient_summary: `Patient: ${pName} (${dept})`.slice(0, 500),
          location: `${dept}, ${hospName}`.slice(0, 300),
          contact_instructions: (request.contactInstructions || `Contact ${dept} counter directly.`).slice(0, 500),
          expires_at: request.requiredBy || request.expiresAt || null,
        };

        const { data, error } = await supabase.from('donation_requests').insert(insertRow).select('*, hospitals(id,name,address,city,state,type)').single();
        if (!error && data) {
          return {
            data: {
              ...data,
              patient_name: pName,
              department: dept,
              required_by: data.expires_at,
              units_needed: data.units_needed || units
            },
            error: null
          };
        }
        if (error) console.warn('Supabase donation_requests error:', error.message);
      } catch (e) {
        console.warn('Supabase donation_requests exception:', e);
      }
    }

    const local = lsRead('swasthya_donations') || [];
    local.unshift(newReqLocal);
    lsWrite('swasthya_donations', local);
    return { data: newReqLocal, error: null };
  },

  async updateRequest(requestId, changes) {
    if (!requestId) return { data: null, error: new Error('Request ID required') };

    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.from('donation_requests')
          .update({ ...changes, updated_at: new Date().toISOString() })
          .eq('id', requestId).select('*, hospitals(id,name,address,city,state,type)').single();
        if (!error && data) {
          return { data, error: null };
        }
      } catch (e) {
        console.warn('Supabase updateRequest exception:', e);
      }
    }

    const local = lsRead('swasthya_donations') || [];
    const idx = local.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...changes, updated_at: new Date().toISOString() };
      lsWrite('swasthya_donations', local);
      return { data: local[idx], error: null };
    }
    return { data: null, error: null };
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (USE_SUPABASE() && uuidRegex.test(patientId)) {
      try {
        const { data, error } = await supabase.rpc('list_support_requests', { p_patient_id: patientId });
        if (!error) return { data: data || [], error: null };
      } catch (e) {
        console.warn('list_support_requests notice:', e);
      }
    }
    const local = lsRead('swasthya_support_requests') || [];
    return { data: local.filter(r => r.patient_id === patientId), error: null };
  },
  async createRequest({ patientId, hospitalId = null, category, subject, message, preferredContact = 'in_app', language = 'en' }) {
    if (!patientId) return { data: null, error: new Error('Patient session is required') };
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(patientId);

    const localReq = {
      id: uuid(),
      patient_id: patientId,
      hospital_id: hospitalId || null,
      category,
      subject: subject?.trim(),
      message: message?.trim(),
      preferred_contact: preferredContact,
      language,
      status: 'new',
      created_at: new Date().toISOString()
    };

    if (USE_SUPABASE() && isUuid) {
      try {
        const { data, error } = await supabase.rpc('create_support_request', {
          p_patient_id: patientId,
          p_hospital_id: hospitalId || null,
          p_category: category,
          p_subject: subject?.trim(),
          p_message: message?.trim(),
          p_preferred_contact: preferredContact,
          p_language: language,
        });
        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : data;
          return { data: row, error: null };
        }
      } catch (e) {
        console.warn('create_support_request notice:', e);
      }
    }

    const local = lsRead('swasthya_support_requests') || [];
    local.unshift(localReq);
    lsWrite('swasthya_support_requests', local);
    return { data: localReq, error: null };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTER-HOSPITAL ORGAN AVAILABILITY & EXCHANGE NETWORK
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_ORGAN_LISTINGS = [
  {
    id: 'ORG-20260830-01',
    hospital_id: 'aiims-delhi',
    hospital_name: 'AIIMS New Delhi',
    hospital_city: 'New Delhi',
    hospital_contact: '+91 11 2659 8700 (Transplant Desk)',
    organ_type: 'Kidney',
    blood_group: 'O+',
    donor_age: 34,
    donor_gender: 'Male',
    hla_typing: 'HLA-A*02, B*44, DRB1*04 (High Matching Score)',
    preservation_method: 'Machine Perfusion (Hypothermic Oxygenated)',
    harvest_time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    cold_ischemia_limit_hours: 24,
    viability_status: 'available',
    urgency_level: 'Standard Allocation',
    medical_notes: 'Deceased donor following TBI. Normal renal function (Creatinine 0.9 mg/dL). Serology non-reactive for HIV/HCV/HBsAg.',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ORG-20260830-02',
    hospital_id: 'sms-jaipur',
    hospital_name: 'Sawai Man Singh Hospital',
    hospital_city: 'Jaipur',
    hospital_contact: '+91 141 256 0291 (SMS Organ Bank Desk)',
    organ_type: 'Liver',
    blood_group: 'B+',
    donor_age: 28,
    donor_gender: 'Female',
    hla_typing: 'HLA-A*24, B*35, DRB1*15',
    preservation_method: 'Static Cold Storage (Custodiol HTK Solution)',
    harvest_time: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
    cold_ischemia_limit_hours: 12,
    viability_status: 'available',
    urgency_level: 'Urgent Tier-1 Fast-Track',
    medical_notes: 'Young organ donor, pristine liver histology, zero steatosis. Immediate recipient allocation ready.',
    created_at: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ORG-20260830-03',
    hospital_id: 'narayana-bangalore',
    hospital_name: 'Narayana Health City',
    hospital_city: 'Bangalore',
    hospital_contact: '+91 80 7122 2222 (Cardiac Transplant Unit)',
    organ_type: 'Heart',
    blood_group: 'AB+',
    donor_age: 22,
    donor_gender: 'Male',
    hla_typing: 'HLA-A*01, B*08, DRB1*03',
    preservation_method: 'TransMedics Organ Care System (OCS Heart)',
    harvest_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    cold_ischemia_limit_hours: 4,
    viability_status: 'reserved',
    urgency_level: 'Emergency Level 1 (Green Corridor Active)',
    medical_notes: 'Echocardiogram LVEF 65%, pristine coronaries via angio. Green corridor air route cleared.',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORG-20260830-04',
    hospital_id: 'apollo-delhi',
    hospital_name: 'Indraprastha Apollo Hospitals',
    hospital_city: 'New Delhi',
    hospital_contact: '+91 11 2692 5858 (Cornea Bank)',
    organ_type: 'Cornea',
    blood_group: 'All Match',
    donor_age: 45,
    donor_gender: 'Male',
    hla_typing: 'Universal Tissue Viability',
    preservation_method: 'Optisol-GS Storage Medium',
    harvest_time: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    cold_ischemia_limit_hours: 72,
    viability_status: 'available',
    urgency_level: 'Standard Allocation',
    medical_notes: 'Endothelial cell density > 2800 cells/mm2. Both corneas optical grade.',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  }
];

const DEFAULT_ORGAN_CLAIMS = [
  {
    id: 'CLM-ORG-8041',
    listing_id: 'ORG-20260830-03',
    requesting_hospital_id: 'sms-jaipur',
    requesting_hospital_name: 'Sawai Man Singh Hospital',
    requesting_hospital_city: 'Jaipur',
    recipient_patient_token: 'APT-20260830-019',
    recipient_blood_group: 'AB+',
    recipient_urgency: 'Status 1A - Super Urgent (ICU on ECMO)',
    transplant_surgeon: 'Dr. Rajesh Sharma (+91 98290 11223)',
    logistics_mode: 'Air Ambulance & Green Corridor (BLR -> JAI)',
    status: 'approved',
    notes: 'Green corridor clearance granted by Rajasthan Police & Bangalore Traffic Police.',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  }
];

const DEFAULT_ORGAN_MESSAGES = [
  {
    id: 'MSG-001',
    listing_id: 'ORG-20260830-03',
    claim_id: 'CLM-ORG-8041',
    sender_hospital_id: 'narayana-bangalore',
    sender_hospital_name: 'Narayana Health City',
    sender_name: 'Transplant Desk (Dr. Devi)',
    message: 'Donor heart harvest complete at 16:15 IST. Organ packaged in TransMedics OCS system. Perfusion parameters optimal.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'MSG-002',
    listing_id: 'ORG-20260830-03',
    claim_id: 'CLM-ORG-8041',
    sender_hospital_id: 'sms-jaipur',
    sender_hospital_name: 'Sawai Man Singh Hospital',
    sender_name: 'SMS Admin Desk (Transplant Unit)',
    message: 'Charter flight dispatched from BLR airport at 16:45. ETA Jaipur Airport 19:15. Green corridor escort vehicles ready at Terminal 2.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  }
];

const DEFAULT_ORGAN_NOTIFICATIONS = [
  {
    id: 'NOTIF-ORG-101',
    title: 'New Organ Broadcast: Heart (AB+)',
    message: 'Narayana Health City (Bangalore) has broadcast a viable donor Heart with 4h Cold Ischemia limit. Green corridor route cleared.',
    type: 'broadcast',
    organId: 'ORG-20260830-03',
    hospitalName: 'Narayana Health City',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'NOTIF-ORG-102',
    title: 'Green Corridor Dispatched',
    message: 'Police Escort Pilot RJ-14-GA-9021 cleared for Heart transfer (BLR -> JAI). Flight ETA 19:15 at Jaipur Airport.',
    type: 'corridor',
    organId: 'ORG-20260830-03',
    hospitalName: 'Sawai Man Singh Hospital',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'NOTIF-ORG-103',
    title: 'New Organ Broadcast: Kidney (O+)',
    message: 'AIIMS New Delhi broadcast a deceased donor Kidney (O+) with 24h Cold Ischemia window and machine perfusion.',
    type: 'broadcast',
    organId: 'ORG-20260830-01',
    hospitalName: 'AIIMS New Delhi',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isRead: true,
  }
];

const DEFAULT_GREEN_CORRIDORS = [
  {
    id: 'GC-2026-8901',
    claimId: 'CLM-ORG-8041',
    listingId: 'ORG-20260830-03',
    organType: 'Heart',
    bloodGroup: 'AB+',
    originHospital: 'Narayana Health City, Bangalore',
    originCity: 'Bangalore',
    destinationHospital: 'Sawai Man Singh Hospital, Jaipur',
    destinationCity: 'Jaipur',
    transitMode: 'Air Ambulance & Dual Airport Green Corridors',
    nocCode: 'NOC-GC-NOTTO-2026-BLR-JAI',
    policeEscortVehicle: 'Pilot Car 1 (RJ-14-GA-9021)',
    policeOfficerContact: 'Insp. R. Meena (+91 94140 12345)',
    airAmbulanceCallsign: 'VT-MED-09',
    estimatedStandardMinutes: 380, // Standard commercial transit 6h 20m
    estimatedCorridorMinutes: 155, // Green corridor transit 2h 35m
    timeSavedMinutes: 225,
    distanceKm: 1980,
    currentCheckpointIndex: 2, // 0 to 4
    checkpoints: [
      { name: 'Organ Harvested & Sealed in TransMedics OCS', location: 'OT Block 4, Narayana Health City', status: 'completed', time: '16:15 IST' },
      { name: 'Bangalore Police Escort to Kempegowda Airport', location: 'HAL / Airport Expressway', status: 'completed', time: '16:40 IST' },
      { name: 'Air Ambulance Airborne (Charter Flight VT-MED-09)', location: 'Cruising Altitude (ETA JAI: 19:15)', status: 'in_progress', time: '17:05 IST' },
      { name: 'Jaipur Police Pilot to SMS Hospital Emergency OT', location: 'Terminal 2 -> JLN Marg Green Corridor', status: 'pending', time: 'Est. 19:25 IST' },
      { name: 'Handover to Lead Transplant Surgeon', location: 'SMS Advanced Cardiac Surgery OT-2', status: 'pending', time: 'Est. 19:40 IST' },
    ],
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  }
];

const organExchange = {
  async getAllListings() {
    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.from('organ_exchange_listings')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return { data, error: null };
        }
      } catch (e) {
        console.warn('Supabase organ_exchange_listings fetch fallback:', e);
      }
    }
    const local = lsRead('swasthya_organ_listings') || DEFAULT_ORGAN_LISTINGS;
    return { data: local, error: null };
  },

  async createListing(listingData) {
    const newListing = {
      id: `ORG-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(10 + Math.random() * 90)}`,
      hospital_id: listingData.hospitalId || listingData.hospital_id || 'sms-jaipur',
      hospital_name: listingData.hospitalName || listingData.hospital_name || 'Sawai Man Singh Hospital',
      hospital_city: listingData.hospitalCity || listingData.hospital_city || 'Jaipur',
      hospital_contact: listingData.hospitalContact || listingData.hospital_contact || '+91 141 256 0291',
      organ_type: listingData.organType || listingData.organ_type || 'Kidney',
      blood_group: listingData.bloodGroup || listingData.blood_group || 'O+',
      donor_age: Number(listingData.donorAge || listingData.donor_age || 30),
      donor_gender: listingData.donorGender || listingData.donor_gender || 'Male',
      hla_typing: listingData.hlaTyping || listingData.hla_typing || 'Standard Serology Compatible',
      preservation_method: listingData.preservationMethod || listingData.preservation_method || 'Static Cold Storage',
      harvest_time: listingData.harvestTime || listingData.harvest_time || new Date().toISOString(),
      cold_ischemia_limit_hours: Number(listingData.coldIschemiaLimitHours || listingData.cold_ischemia_limit_hours || 24),
      viability_status: 'available',
      urgency_level: listingData.urgencyLevel || listingData.urgency_level || 'Standard Allocation',
      medical_notes: listingData.medicalNotes || listingData.medical_notes || 'All baseline viral markers non-reactive.',
      created_at: new Date().toISOString(),
    };

    if (USE_SUPABASE()) {
      try {
        const { data, error } = await supabase.from('organ_exchange_listings').insert(newListing).select().single();
        if (!error && data) {
          const local = lsRead('swasthya_organ_listings') || DEFAULT_ORGAN_LISTINGS;
          local.unshift(data);
          lsWrite('swasthya_organ_listings', local);
          
          await this.createNotification({
            title: `New Organ Broadcast: ${newListing.organ_type} (${newListing.blood_group})`,
            message: `${newListing.hospital_name} (${newListing.hospital_city}) has broadcast an available ${newListing.organ_type}. Viability: ${newListing.cold_ischemia_limit_hours}h.`,
            type: 'broadcast',
            organId: newListing.id,
            hospitalName: newListing.hospital_name,
          });

          return { data, error: null };
        }
      } catch (e) {
        console.warn('Supabase createListing fallback:', e);
      }
    }

    const local = lsRead('swasthya_organ_listings') || DEFAULT_ORGAN_LISTINGS;
    local.unshift(newListing);
    lsWrite('swasthya_organ_listings', local);

    await this.createNotification({
      title: `New Organ Broadcast: ${newListing.organ_type} (${newListing.blood_group})`,
      message: `${newListing.hospital_name} (${newListing.hospital_city}) has broadcast an available ${newListing.organ_type}. Viability limit: ${newListing.cold_ischemia_limit_hours} hours.`,
      type: 'broadcast',
      organId: newListing.id,
      hospitalName: newListing.hospital_name,
    });

    return { data: newListing, error: null };
  },

  async updateListingStatus(listingId, status) {
    if (USE_SUPABASE()) {
      try {
        await supabase.from('organ_exchange_listings').update({ viability_status: status, updated_at: new Date().toISOString() }).eq('id', listingId);
      } catch (e) {}
    }
    const local = lsRead('swasthya_organ_listings') || DEFAULT_ORGAN_LISTINGS;
    const idx = local.findIndex(l => l.id === listingId);
    if (idx !== -1) {
      local[idx].viability_status = status;
      lsWrite('swasthya_organ_listings', local);
      return { data: local[idx], error: null };
    }
    return { data: null, error: new Error('Listing not found') };
  },

  async getAllClaims() {
    const local = lsRead('swasthya_organ_claims') || DEFAULT_ORGAN_CLAIMS;
    return { data: local, error: null };
  },

  async createClaim(claimData) {
    const newClaim = {
      id: `CLM-ORG-${Math.floor(8000 + Math.random() * 1900)}`,
      listing_id: claimData.listingId || claimData.listing_id,
      requesting_hospital_id: claimData.hospitalId || claimData.hospital_id || 'sms-jaipur',
      requesting_hospital_name: claimData.hospitalName || claimData.hospital_name || 'Sawai Man Singh Hospital',
      requesting_hospital_city: claimData.hospitalCity || claimData.hospital_city || 'Jaipur',
      recipient_patient_token: claimData.recipientToken || claimData.recipient_patient_token || 'APT-EMERGENCY',
      recipient_blood_group: claimData.recipientBloodGroup || claimData.recipient_blood_group || 'O+',
      recipient_urgency: claimData.recipientUrgency || claimData.recipient_urgency || 'Status 1A - Super Urgent',
      transplant_surgeon: claimData.transplantSurgeon || claimData.transplant_surgeon || 'On-Duty Transplant Head',
      logistics_mode: claimData.logisticsMode || claimData.logistics_mode || 'Green Corridor Ambulance',
      status: 'pending',
      notes: claimData.notes || 'Compatibility screening matched. Requesting urgent allocation.',
      created_at: new Date().toISOString(),
    };

    const claims = lsRead('swasthya_organ_claims') || DEFAULT_ORGAN_CLAIMS;
    claims.unshift(newClaim);
    lsWrite('swasthya_organ_claims', claims);

    await this.sendMessage({
      listingId: newClaim.listing_id,
      claimId: newClaim.id,
      senderHospitalId: newClaim.requesting_hospital_id,
      senderHospitalName: newClaim.requesting_hospital_name,
      senderName: `${newClaim.requesting_hospital_name} (Transplant Team)`,
      message: `Transfer claim submitted for recipient (Blood: ${newClaim.recipient_blood_group}, Urgency: ${newClaim.recipient_urgency}). Logistics: ${newClaim.logistics_mode}.`,
    });

    await this.createNotification({
      title: `Transfer Claim: ${newClaim.recipient_blood_group} Recipient`,
      message: `${newClaim.requesting_hospital_name} requested organ allocation (${newClaim.listing_id}) for ${newClaim.recipient_urgency}.`,
      type: 'claim',
      organId: newClaim.listing_id,
      hospitalName: newClaim.requesting_hospital_name,
    });

    return { data: newClaim, error: null };
  },

  async updateClaimStatus(claimId, status, listingId = null) {
    const claims = lsRead('swasthya_organ_claims') || DEFAULT_ORGAN_CLAIMS;
    const idx = claims.findIndex(c => c.id === claimId);
    if (idx !== -1) {
      claims[idx].status = status;
      lsWrite('swasthya_organ_claims', claims);

      if (listingId && (status === 'approved' || status === 'in_transit' || status === 'completed')) {
        const listingStatus = status === 'approved' ? 'reserved' : status === 'in_transit' ? 'in_transit' : 'completed';
        await this.updateListingStatus(listingId, listingStatus);
      }

      await this.createNotification({
        title: `Transfer Status: ${status.toUpperCase()}`,
        message: `Claim #${claimId} marked as ${status.toUpperCase().replace('_', ' ')}. Coordination logged.`,
        type: 'status',
        organId: listingId,
        hospitalName: claims[idx].requesting_hospital_name,
      });

      return { data: claims[idx], error: null };
    }
    return { data: null, error: new Error('Claim not found') };
  },

  async getMessages(listingId) {
    const all = lsRead('swasthya_organ_messages') || DEFAULT_ORGAN_MESSAGES;
    const filtered = listingId ? all.filter(m => m.listing_id === listingId) : all;
    return { data: filtered, error: null };
  },

  async sendMessage({ listingId, claimId = null, senderHospitalId, senderHospitalName, senderName, message }) {
    const newMsg = {
      id: `MSG-${Date.now()}`,
      listing_id: listingId,
      claim_id: claimId,
      sender_hospital_id: senderHospitalId,
      sender_hospital_name: senderHospitalName,
      sender_name: senderName,
      message: message?.trim(),
      timestamp: new Date().toISOString(),
    };

    const all = lsRead('swasthya_organ_messages') || DEFAULT_ORGAN_MESSAGES;
    all.push(newMsg);
    lsWrite('swasthya_organ_messages', all);
    return { data: newMsg, error: null };
  },

  // ── NOTIFICATIONS API ──
  async getNotifications() {
    const notifs = lsRead('swasthya_organ_notifications') || DEFAULT_ORGAN_NOTIFICATIONS;
    return { data: notifs, error: null };
  },

  async createNotification({ title, message, type = 'broadcast', organId = null, hospitalName = 'Network Hospital' }) {
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      title,
      message,
      type,
      organId,
      hospitalName,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    const notifs = lsRead('swasthya_organ_notifications') || DEFAULT_ORGAN_NOTIFICATIONS;
    notifs.unshift(newNotif);
    lsWrite('swasthya_organ_notifications', notifs.slice(0, 30));
    return { data: newNotif, error: null };
  },

  async markNotificationRead(notifId) {
    const notifs = lsRead('swasthya_organ_notifications') || DEFAULT_ORGAN_NOTIFICATIONS;
    const updated = notifs.map(n => n.id === notifId ? { ...n, isRead: true } : n);
    lsWrite('swasthya_organ_notifications', updated);
    return { data: true, error: null };
  },

  // ── GREEN CORRIDOR LOGISTICS API ──
  async getCorridors() {
    const corridors = lsRead('swasthya_green_corridors') || DEFAULT_GREEN_CORRIDORS;
    return { data: corridors, error: null };
  },

  async createCorridor(corridorData) {
    const newCorridor = {
      id: `GC-${new Date().getFullYear()}-${Math.floor(8000 + Math.random() * 1900)}`,
      claimId: corridorData.claimId,
      listingId: corridorData.listingId,
      organType: corridorData.organType || 'Heart',
      bloodGroup: corridorData.bloodGroup || 'O+',
      originHospital: corridorData.originHospital,
      originCity: corridorData.originCity || 'Origin Hospital',
      destinationHospital: corridorData.destinationHospital,
      destinationCity: corridorData.destinationCity || 'Destination Hospital',
      transitMode: corridorData.transitMode || 'Ground Green Corridor (State Traffic Police Escort)',
      nocCode: `NOC-GC-NOTTO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
      policeEscortVehicle: corridorData.policeEscortVehicle || 'Pilot Escort Unit 1 (RJ-14-GA-9021)',
      policeOfficerContact: corridorData.policeOfficerContact || 'Insp. R. Meena (+91 94140 12345)',
      airAmbulanceCallsign: corridorData.airAmbulanceCallsign || 'VT-MED-09',
      estimatedStandardMinutes: corridorData.estimatedStandardMinutes || 180,
      estimatedCorridorMinutes: corridorData.estimatedCorridorMinutes || 65,
      timeSavedMinutes: (corridorData.estimatedStandardMinutes || 180) - (corridorData.estimatedCorridorMinutes || 65),
      distanceKm: corridorData.distanceKm || 45,
      currentCheckpointIndex: 0,
      checkpoints: [
        { name: 'Organ Harvested & Sealed in Transport Device', location: corridorData.originHospital, status: 'completed', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
        { name: 'Police Escort Dispatched from Origin Hospital', location: 'Traffic Control Clearance Active', status: 'in_progress', time: 'Now' },
        { name: 'Highway / Air Transit Corridor Clearance Active', location: 'En Route with Green Signal Wave', status: 'pending', time: 'Est. +25 min' },
        { name: 'Arrival at Destination Hospital Emergency Gate', location: corridorData.destinationHospital, status: 'pending', time: 'Est. +50 min' },
        { name: 'Handover to Lead Transplant Surgeon', location: 'Advanced Transplant OT Block', status: 'pending', time: 'Est. +65 min' },
      ],
      createdAt: new Date().toISOString(),
    };

    const corridors = lsRead('swasthya_green_corridors') || DEFAULT_GREEN_CORRIDORS;
    corridors.unshift(newCorridor);
    lsWrite('swasthya_green_corridors', corridors);

    await this.createNotification({
      title: `🚦 Green Corridor Active: ${newCorridor.organType}`,
      message: `Green Corridor ${newCorridor.nocCode} activated between ${newCorridor.originCity} and ${newCorridor.destinationCity}. ETA: ${newCorridor.estimatedCorridorMinutes} mins.`,
      type: 'corridor',
      organId: newCorridor.listingId,
      hospitalName: newCorridor.originHospital,
    });

    return { data: newCorridor, error: null };
  },

  async getOrCreateCorridor(organListing, destHospital = 'Sawai Man Singh Hospital', destCity = 'Jaipur') {
    const corridors = lsRead('swasthya_green_corridors') || DEFAULT_GREEN_CORRIDORS;
    const found = corridors.find(c => c.listingId === organListing.id || c.id === organListing.id);
    if (found) return { data: found, error: null };

    // Calculate distance & route based on cities
    const originCity = organListing.hospital_city || 'New Delhi';
    const isSameCity = originCity.toLowerCase() === destCity.toLowerCase();
    const isFar = originCity.toLowerCase().includes('bangalore') || originCity.toLowerCase().includes('mumbai') || originCity.toLowerCase().includes('chennai') || originCity.toLowerCase().includes('kolkata');

    let transitMode = 'Ground Green Corridor (State Traffic Police Escort)';
    let distanceKm = isSameCity ? 18 : 280;
    let estimatedStandardMinutes = isSameCity ? 60 : 300;
    let estimatedCorridorMinutes = isSameCity ? 19 : 95;

    if (isFar) {
      transitMode = 'Air Ambulance & Dual Airport Green Corridors';
      distanceKm = 1850;
      estimatedStandardMinutes = 480;
      estimatedCorridorMinutes = 145;
    }

    const newCorridor = {
      id: `GC-${new Date().getFullYear()}-${Math.floor(8000 + Math.random() * 1900)}`,
      claimId: `CLM-${Math.floor(8000 + Math.random() * 1900)}`,
      listingId: organListing.id,
      organType: organListing.organ_type || 'Organ',
      bloodGroup: organListing.blood_group || 'O+',
      originHospital: organListing.hospital_name || 'Donor Medical Center',
      originCity: originCity,
      destinationHospital: destHospital,
      destinationCity: destCity,
      transitMode,
      nocCode: `NOC-GC-NOTTO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`,
      policeEscortVehicle: 'Pilot Escort Unit 1 (RJ-14-GA-9021)',
      policeOfficerContact: 'Insp. R. Meena (+91 94140 12345)',
      airAmbulanceCallsign: 'VT-MED-09',
      estimatedStandardMinutes,
      estimatedCorridorMinutes,
      timeSavedMinutes: estimatedStandardMinutes - estimatedCorridorMinutes,
      distanceKm,
      currentCheckpointIndex: 1, // Start at step 2 (En route)
      checkpoints: [
        { name: 'Organ Harvested & Sealed in Certified Perfusion Unit', location: `OT Block, ${organListing.hospital_name}`, status: 'completed', time: new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
        { name: 'Police Escort Dispatched with Emergency Green Wave', location: `${originCity} Traffic Control Corridor`, status: 'in_progress', time: 'Active Now' },
        { name: 'Express Highway / Air Clearance Corridor Active', location: 'Transit Vector Clearance Cleared', status: 'pending', time: `Est. +${Math.round(estimatedCorridorMinutes * 0.4)} min` },
        { name: 'Arrival at Destination Hospital Emergency Gate', location: `${destHospital} Trauma Gate`, status: 'pending', time: `Est. +${Math.round(estimatedCorridorMinutes * 0.8)} min` },
        { name: 'Direct Handover to Lead Transplant Surgeon in OT', location: 'Advanced Transplant OT Block', status: 'pending', time: `Est. +${estimatedCorridorMinutes} min` },
      ],
      createdAt: new Date().toISOString(),
    };

    corridors.unshift(newCorridor);
    lsWrite('swasthya_green_corridors', corridors);

    await this.createNotification({
      title: `🚦 Green Corridor Activated: ${newCorridor.organType}`,
      message: `Corridor ${newCorridor.nocCode} activated between ${newCorridor.originCity} and ${newCorridor.destinationCity}. ETA: ${newCorridor.estimatedCorridorMinutes} mins.`,
      type: 'corridor',
      organId: newCorridor.listingId,
      hospitalName: newCorridor.originHospital,
    });

    return { data: newCorridor, error: null };
  },

  async updateCorridorCheckpoint(corridorId, stepIndex) {
    const corridors = lsRead('swasthya_green_corridors') || DEFAULT_GREEN_CORRIDORS;
    const idx = corridors.findIndex(c => c.id === corridorId);
    if (idx !== -1) {
      corridors[idx].currentCheckpointIndex = stepIndex;
      corridors[idx].checkpoints = corridors[idx].checkpoints.map((cp, i) => {
        if (i < stepIndex) return { ...cp, status: 'completed' };
        if (i === stepIndex) return { ...cp, status: 'in_progress', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
        return { ...cp, status: 'pending' };
      });

      lsWrite('swasthya_green_corridors', corridors);

      await this.createNotification({
        title: `🚦 Green Corridor Progress: Step ${stepIndex + 1}/5`,
        message: `Corridor ${corridors[idx].nocCode} reached: ${corridors[idx].checkpoints[stepIndex].name}.`,
        type: 'corridor',
        organId: corridors[idx].listingId,
        hospitalName: corridors[idx].originHospital,
      });

      return { data: corridors[idx], error: null };
    }
    return { data: null, error: new Error('Corridor not found') };
  }
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
  { id: 'aiims-delhi', name: 'AIIMS New Delhi', address: 'Ansari Nagar, New Delhi', city: 'New Delhi', type: 'Government', rating: 4.9 },
  { id: 'sms-jaipur', name: 'Sawai Man Singh Hospital', address: 'J.L.N. Marg, Jaipur', city: 'Jaipur', type: 'Government', rating: 4.6 },
  { id: 'apollo-delhi', name: 'Indraprastha Apollo Hospitals', address: 'Sarita Vihar, Mathura Road, New Delhi', city: 'New Delhi', type: 'Private', rating: 4.8 },
  { id: 'shalby-jaipur', name: 'Shalby Hospital Jaipur', address: 'Vaishali Nagar, Jaipur, Rajasthan', city: 'Jaipur', type: 'Private', rating: 4.7 },
  { id: 'aiia-delhi', name: 'All India Institute of Ayurveda (AIIA)', address: 'Ayush Campus, Sarita Vihar, New Delhi', city: 'New Delhi', type: 'Government', rating: 4.8, isAyush: true },
  { id: 'nia-jaipur', name: 'National Institute of Ayurveda (NIA)', address: 'Jorawar Singh Gate, Amer Road, Jaipur', city: 'Jaipur', type: 'Government', rating: 4.9, isAyush: true },
  { id: 'narayana-bangalore', name: 'Narayana Health City', address: 'Bommasandra Industrial Area, Bangalore', city: 'Bangalore', type: 'Private', rating: 4.8 },
  { id: 'fortis-jaipur', name: 'Fortis Escorts Hospital', address: 'J.L.N. Marg, Malviya Nagar, Jaipur', city: 'Jaipur', type: 'Private', rating: 4.7 },
  { id: 'tata-mumbai', name: 'Tata Memorial Hospital', address: 'Dr. E Borges Road, Parel, Mumbai', city: 'Mumbai', type: 'Government', rating: 4.8 },
  { id: 'jaipur-hospital', name: 'Jaipur Hospital', address: 'Lal Kothi, Jaipur, Rajasthan', city: 'Jaipur', type: 'Private', rating: 4.5 },
  { id: 'pgimer-chandigarh', name: 'PGIMER Chandigarh', address: 'Sector 12, Chandigarh', city: 'Chandigarh', type: 'Government', rating: 4.7 },
  { id: 'kem-mumbai', name: 'KEM Hospital Mumbai', address: 'Parel, Mumbai', city: 'Mumbai', type: 'Government', rating: 4.5 },
  { id: 'nimhans-bangalore', name: 'NIMHANS Bangalore', address: 'Hosur Road, Bangalore', city: 'Bangalore', type: 'Government', rating: 4.6 },
];

const _builtinDoctors = [
  // AIIMS New Delhi
  {
    id: 'd0000001-0001-0001-0001-000000000001',
    hospital_id: 'aiims-delhi',
    name: 'Dr. Randeep Guleria',
    degrees: 'MBBS, MD (Pulmonary Medicine)',
    speciality: 'Pulmonology',
    system: 'Allopathy',
    experience: 26,
    age: 56,
    gender: 'Male',
    hospitalName: 'AIIMS New Delhi',
    hospital_name: 'AIIMS New Delhi',
    email: 'drrandeepguleria@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/11.jpg',
    rating: 4.9,
    reviews_count: 1240
  },
  {
    id: 'd0000001-0002-0002-0002-000000000001',
    hospital_id: 'sms-jaipur',
    name: 'Dr. Ananya Sharma',
    degrees: 'MBBS, MD (Internal Medicine)',
    speciality: 'General Physician',
    system: 'Allopathy',
    experience: 12,
    age: 36,
    gender: 'Female',
    hospitalName: 'Sawai Man Singh Hospital',
    hospital_name: 'Sawai Man Singh Hospital',
    email: 'drananyasharma@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.8,
    reviews_count: 860
  },
  {
    id: 'd0000001-0003-0001-0001-000000000001',
    hospital_id: 'aiims-delhi',
    name: 'Dr. Vikramaditya Rathore',
    degrees: 'MBBS, MD, DM (Cardiology)',
    speciality: 'Cardiology',
    system: 'Allopathy',
    experience: 20,
    age: 52,
    gender: 'Male',
    hospitalName: 'AIIMS New Delhi',
    hospital_name: 'AIIMS New Delhi',
    email: 'drvikramaditya@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/18.jpg',
    rating: 4.9,
    reviews_count: 940
  },

  // Sawai Man Singh Hospital, Jaipur
  {
    id: 'd0000001-0004-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    name: 'Dr. Priya Verma',
    degrees: 'MBBS, DGO (Family Medicine)',
    speciality: 'General Medicine',
    system: 'Allopathy',
    experience: 10,
    age: 35,
    gender: 'Female',
    hospitalName: 'Sawai Man Singh Hospital',
    hospital_name: 'Sawai Man Singh Hospital',
    email: 'drpriyaverma@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/women/65.jpg',
    rating: 4.8,
    reviews_count: 95
  },
  {
    id: 'd0000001-0005-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    name: 'Dr. Rohan Mehta',
    degrees: 'MBBS, MD (Internal Medicine)',
    speciality: 'General Medicine',
    system: 'Allopathy',
    experience: 8,
    age: 34,
    gender: 'Male',
    hospitalName: 'Sawai Man Singh Hospital',
    hospital_name: 'Sawai Man Singh Hospital',
    email: 'drrohanmehta@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 4.7,
    reviews_count: 84
  },
  {
    id: 'd0000001-0006-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    name: 'Dr. Neha Agarwal',
    degrees: 'MBBS, DNB (Family Medicine)',
    speciality: 'General Medicine',
    system: 'Allopathy',
    experience: 7,
    age: 33,
    gender: 'Female',
    hospitalName: 'Sawai Man Singh Hospital',
    hospital_name: 'Sawai Man Singh Hospital',
    email: 'drnehaagarwal@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 4.9,
    reviews_count: 110
  },
  {
    id: 'd0000001-0007-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    name: 'Dr. Amit Singh',
    degrees: 'MBBS, MS',
    speciality: 'General Medicine',
    system: 'Allopathy',
    experience: 15,
    age: 44,
    gender: 'Male',
    hospitalName: 'Sawai Man Singh Hospital',
    hospital_name: 'Sawai Man Singh Hospital',
    email: 'dramitsingh@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/46.jpg',
    rating: 4.8,
    reviews_count: 210
  },
  {
    id: 'd0000001-0008-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    name: 'Vaidya R. Mehta',
    degrees: 'BAMS, MD (Ayurveda)',
    speciality: 'Ayurveda & Panchakarma',
    system: 'Ayurveda',
    experience: 18,
    age: 49,
    gender: 'Male',
    hospitalName: 'Sawai Man Singh Hospital',
    hospital_name: 'Sawai Man Singh Hospital',
    email: 'vaidyarmehta@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/52.jpg',
    rating: 4.9,
    reviews_count: 190
  },
  {
    id: 'd0000001-0009-0002-0002-000000000002',
    hospital_id: 'sms-jaipur',
    name: 'Vaidya Sanjeev Sharma',
    degrees: 'BAMS, Ph.D. (Ayurveda)',
    speciality: 'Ayurveda & Panchakarma',
    system: 'Ayurveda',
    experience: 22,
    age: 53,
    gender: 'Male',
    hospitalName: 'National Institute of Ayurveda',
    hospital_name: 'National Institute of Ayurveda',
    email: 'vaidyasanjeev@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/61.jpg',
    rating: 5.0,
    reviews_count: 340
  },

  // Indraprastha Apollo Hospitals
  {
    id: 'd0000001-0010-0003-0003-000000000003',
    hospital_id: 'apollo-delhi',
    name: 'Dr. Naresh Trehan',
    degrees: 'MBBS, MS, FRCS (Cardiology)',
    speciality: 'Cardiology',
    system: 'Allopathy',
    experience: 24,
    age: 58,
    gender: 'Male',
    hospitalName: 'Indraprastha Apollo Hospitals',
    hospital_name: 'Indraprastha Apollo Hospitals',
    email: 'drnareshtrehan@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/24.jpg',
    rating: 4.9,
    reviews_count: 1520
  },
  {
    id: 'd0000001-0011-0003-0003-000000000003',
    hospital_id: 'apollo-delhi',
    name: 'Dr. Arjun Mehta',
    degrees: 'MBBS, MD (General Medicine)',
    speciality: 'General Medicine',
    system: 'Allopathy',
    experience: 15,
    age: 46,
    gender: 'Male',
    hospitalName: 'Indraprastha Apollo Hospitals',
    hospital_name: 'Indraprastha Apollo Hospitals',
    email: 'drarjunmehta@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/35.jpg',
    rating: 4.8,
    reviews_count: 670
  },

  // Shalby Hospital Jaipur
  {
    id: 'd0000001-0012-0004-0004-000000000004',
    hospital_id: 'shalby-jaipur',
    name: 'Dr. Rajesh Verma',
    degrees: 'MBBS, MS (Orthopedics)',
    speciality: 'Orthopedics & Joint Replacement',
    system: 'Allopathy',
    experience: 15,
    age: 45,
    gender: 'Male',
    hospitalName: 'Shalby Hospital Jaipur',
    hospital_name: 'Shalby Hospital Jaipur',
    email: 'drrajeshverma@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/43.jpg',
    rating: 4.7,
    reviews_count: 480
  },
  {
    id: 'd0000001-0013-0004-0004-000000000004',
    hospital_id: 'shalby-jaipur',
    name: 'Dr. Neha Gupta',
    degrees: 'MBBS, MD (General Medicine)',
    speciality: 'General Medicine',
    system: 'Allopathy',
    experience: 9,
    age: 35,
    gender: 'Female',
    hospitalName: 'Shalby Hospital Jaipur',
    hospital_name: 'Shalby Hospital Jaipur',
    email: 'drnehagupta@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/women/12.jpg',
    rating: 4.8,
    reviews_count: 310
  },

  // All India Institute of Ayurveda (AIIA)
  {
    id: 'd0000001-0014-0005-0005-000000000005',
    hospital_id: 'aiia-delhi',
    name: 'Dr. Gayatri Joshi',
    degrees: 'BAMS, MD (Kayachikitsa)',
    speciality: 'Nadi Pariksha & Kayachikitsa',
    system: 'Ayurveda',
    experience: 14,
    age: 41,
    gender: 'Female',
    hospitalName: 'All India Institute of Ayurveda (AIIA)',
    hospital_name: 'All India Institute of Ayurveda (AIIA)',
    email: 'drgayatrijoshi@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/women/28.jpg',
    rating: 4.9,
    reviews_count: 520
  },

  // Narayana Health City
  {
    id: 'd0000001-0015-0007-0007-000000000007',
    hospital_id: 'narayana-bangalore',
    name: 'Dr. Devi Shetty',
    degrees: 'MBBS, MS, FRCS (Cardiac Surgery)',
    speciality: 'Cardiology',
    system: 'Allopathy',
    experience: 30,
    age: 62,
    gender: 'Male',
    hospitalName: 'Narayana Health City',
    hospital_name: 'Narayana Health City',
    email: 'drdevishetty@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/57.jpg',
    rating: 5.0,
    reviews_count: 3800
  },

  // Jaipur Hospital
  {
    id: 'd0000001-0016-0010-0010-000000000010',
    hospital_id: 'jaipur-hospital',
    name: 'Dr. Manoj Saxena',
    degrees: 'MBBS, MD (General Medicine)',
    speciality: 'General Medicine',
    system: 'Allopathy',
    experience: 11,
    age: 39,
    gender: 'Male',
    hospitalName: 'Jaipur Hospital',
    hospital_name: 'Jaipur Hospital',
    email: 'drmanojsaxena@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/men/64.jpg',
    rating: 4.7,
    reviews_count: 290
  },
  {
    id: 'd0000001-0017-0010-0010-000000000010',
    hospital_id: 'jaipur-hospital',
    name: 'Dr. Sunita Khandelwal',
    degrees: 'MBBS, DCH (Pediatrics)',
    speciality: 'Pediatrics',
    system: 'Allopathy',
    experience: 8,
    age: 34,
    gender: 'Female',
    hospitalName: 'Jaipur Hospital',
    hospital_name: 'Jaipur Hospital',
    email: 'drsunitakhandelwal@swasthyasetu.ac.in',
    avatar_url: 'https://randomuser.me/api/portraits/women/39.jpg',
    rating: 4.9,
    reviews_count: 410
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const db = {
  patients,
  hospitals,
  doctors,
  doctorLeaves,
  slots,
  appointments,
  queue: doctorQueue,
  doctorQueue,
  reports,
  intakes,
  staff,
  communities,
  donations,
  organExchange,
  voice,
  feedback,
  support,
  /** Direct Supabase client access for advanced queries */
  client: supabase,
  isConfigured: isSupabaseConfigured,
  isConnected: isSupabaseConfigured,
  healthCheck,
};
