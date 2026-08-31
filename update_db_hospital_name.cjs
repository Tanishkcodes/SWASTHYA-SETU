const fs = require('fs');
const filePath = 'src/lib/db.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update doctors object in db.js to handle hospital_name and flexible matching
const oldDoctorsObj = `const doctors = {
  async getAll() {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, hospitals(*)')
        .eq('is_active', true)
        .order('name');
      return { data: data || [], error };
    }
    return { data: _builtinDoctors, error: null };
  },

  async getByHospital(hospitalId) {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, hospitals(*)')
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
  },`;

const newDoctorsObj = `const doctors = {
  async getAll() {
    if (USE_SUPABASE()) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, hospitals(*)')
        .eq('is_active', true)
        .order('name');
      const normalized = (data || []).map(d => ({
        ...d,
        hospitalName: d.hospital_name || d.hospitals?.name || d.hospitalName || 'Sawai Man Singh Hospital',
        hospital_name: d.hospital_name || d.hospitals?.name || d.hospitalName || 'Sawai Man Singh Hospital'
      }));
      return { data: normalized, error };
    }
    return { data: _builtinDoctors, error: null };
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
        .ilike('hospital_name', \`%\${norm}%\`)
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

    // Fallback: match built-in doctors by hospital_id, hospital_name, or hospitalName
    const matched = _builtinDoctors.filter(d => {
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
      return { data, error };
    }
    const found = _builtinDoctors.find(d => d.id === doctorId);
    return { data: found || null, error: null };
  },`;

if (content.includes(oldDoctorsObj)) {
  content = content.replace(oldDoctorsObj, newDoctorsObj);
  console.log('Updated doctors methods in db.js');
} else {
  console.warn('oldDoctorsObj signature not matched directly, applying regex replace');
}

// 2. Update createDoctor in db.js to save hospital_name
content = content.replace(
  `      id: doctorId,
      hospital_id: resolvedHospitalId,
      name,`,
  `      id: doctorId,
      hospital_id: resolvedHospitalId,
      hospital_name: hospitalName,
      name,`
);

// 3. Update _builtinDoctors to include hospital_name on every record
content = content.replace(
  /hospitalName: '([^']+)'/g,
  "hospitalName: '$1',\n    hospital_name: '$1'"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('db.js updated successfully');
