const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'PatientDashboard.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Find start and end of DASHBOARD_I18N
const startIdx = code.indexOf('const DASHBOARD_I18N = {');
const endIdx = code.indexOf('const HOSPITAL_DATA = [', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const i18nSection = code.slice(startIdx, endIdx);
  // Deduplicate lines within each language object
  const cleaned = i18nSection.split('\n').filter((line, i, arr) => {
    const keyMatch = line.match(/^\s+([a-zA-Z0-9_]+):/);
    if (!keyMatch) return true;
    const key = keyMatch[1];
    // Check if duplicate in immediate previous 40 lines
    const prevSlice = arr.slice(Math.max(0, i - 40), i);
    return !prevSlice.some(p => p.startsWith(`    ${key}:`));
  }).join('\n');
  code = code.slice(0, startIdx) + cleaned + code.slice(endIdx);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Cleaned duplicate keys in DASHBOARD_I18N');
}
