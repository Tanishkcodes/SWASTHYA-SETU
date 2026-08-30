const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'PatientDashboard.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Ensure all property lines in DASHBOARD_I18N end with a comma
code = code.replace(/(\n\s+[a-zA-Z0-9_]+:\s*(?:'[^']*'|"[^"]*"|`[^`]*`))(\s*\n\s+[a-zA-Z0-9_]+:)/g, '$1,$2');
code = code.replace(/(\n\s+[a-zA-Z0-9_]+:\s*(?:'[^']*'|"[^"]*"|`[^`]*`))(\s*\n\s+[a-zA-Z0-9_]+:)/g, '$1,$2');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed trailing commas on properties');
