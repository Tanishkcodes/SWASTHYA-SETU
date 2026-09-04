export function registrationFields(extracted = {}, normalizeGender = value => value) {
  const patch = {};
  for (const key of ['name', 'age', 'phone']) {
    const value = extracted[key] == null ? '' : String(extracted[key]).trim();
    if (value) patch[key] = value;
  }
  if (extracted.gender) {
    const gender = normalizeGender(extracted.gender);
    if (gender) patch.gender = gender;
  }
  return patch;
}
