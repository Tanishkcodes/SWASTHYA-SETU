const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'PatientDashboard.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace any broken dictionary strings
code = code.replace(/noSlotsAvailable:\s*'\{tr\('noSlotsAvailable'\)\}',/g, "noSlotsAvailable: 'No slots available for this date. Please select a different date.',");
code = code.replace(/noSlotsAvailable:\s*"\{tr\('noSlotsAvailable'\)\}",/g, "noSlotsAvailable: 'No slots available for this date. Please select a different date.',");

// In Step 2 JSX, ensure it calls {tr('noSlotsAvailable')} properly:
code = code.replace(
  `<div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>\n                                {tr('noSlotsAvailable')}\n                              </div>`,
  `<div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>\n                                {tr('noSlotsAvailable')}\n                              </div>`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed syntax in PatientDashboard.jsx');
