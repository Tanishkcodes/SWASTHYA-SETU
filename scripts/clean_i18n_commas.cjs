const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'PatientDashboard.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Fix missing commas before backToDashboard
code = code.replace(/('Next: Case & Symptoms'|'आगे: लक्षण और केस'|'पुढे: लक्षणे व केस'|'આગળ: કેસ અને લક્ષણો'|'அடுத்து: அறிகுறிகள் & வழக்கு'|'తర్వాత: లక్షణాలు & వివరాలు'|'ಮುಂದೆ: ಲಕ್ಷಣಗಳು ಮತ್ತು ವಿವರ'|'পরবর্তী: লক্ষণ ও কেস'|'അടുത്തത്: ലക്ഷണങ്ങളും വിശദാംശങ്ങളും')\s*\n\s*backToDashboard:/g, "$1,\n    backToDashboard:");

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed missing commas in PatientDashboard.jsx');
