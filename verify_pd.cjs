const fs = require('fs');
const c = fs.readFileSync('src/pages/PatientDashboard.jsx', 'utf8');
console.log('uiName:', (c.match(/uiName/g)||[]).length, 'refs');
console.log('setAiUpdateTick:', (c.match(/setAiUpdateTick/g)||[]).length);
console.log("'Step 1: Select Date' hardcoded:", (c.match(/'Step 1: Select Date'/g)||[]).length);
console.log("ui('Select Date'):", (c.match(/ui\('Select Date'\)/g)||[]).length);
console.log("ui('Confirmation'):", (c.match(/ui\('Confirmation'\)/g)||[]).length);
console.log("View Profile hardcoded:", (c.match(/>View Profile</g)||[]).length);
