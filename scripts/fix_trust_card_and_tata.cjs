const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'pages', 'PatientDashboard.jsx');
let code = fs.readFileSync(targetFile, 'utf8');

// Fix tata-mumbai if missing
const tataBlock = `    doctors: [
      { name: 'Dr. Vikramaditya Rathore', specialty: 'Cardiology', exp: '17 yrs' },
      { name: 'Dr. Rajesh Verma', specialty: 'Orthopedics & Joint Replacement', exp: '16 yrs' }
    ]
  },
  'tata-mumbai': {
    name: {
      en: 'Tata Memorial Hospital',
      hi: 'टाटा मेमोरियल अस्पताल मुंबई',
      mr: 'टाटा मेमोरियल रुग्णालय मुंबई',
      gu: 'ટાટા મેમોરિયલ હોસ્પિટલ મુંબઈ',
      ta: 'டாடா மெமோரியல் மருத்துவமனை மும்பை',
      te: 'టాటా మెమోరియల్ ఆసుపత్రి ముంబై',
      kn: 'ಟಾಟಾ ಮೆಮೋರಿಯಲ್ ಆಸ್ಪತ್ರೆ ಮುಂಬೈ',
      bn: 'টাটা মেমোরিয়াল হাসপাতাল মুম্বাই',
      pa: 'ਟਾਟਾ ਮੈਮੋਰੀਅਲ ਹਸਪਤਾਲ ਮੁੰਬਈ',
      ml: 'ടാറ്റാ മെമ്മോറിയൽ ആശുപത്രി മുംബൈ',
      or: 'ଟାଟା ମେମୋରିଆଲ୍ ଡାକ୍ତରଖାନା ମୁମ୍ବାଇ'
    },
    address: {
      en: 'Dr. E Borges Road, Parel, Mumbai, Maharashtra',
      hi: 'डॉ. ई बोर्गेस रोड, परेल, मुंबई, महाराष्ट्र',
      mr: 'डॉ. ई बोर्गेस रोड, परळ, मुंबई, महाराष्ट्र',
      gu: 'ડૉ. ઈ બોર્ગેસ રોડ, પરેલ, મુંબઈ, મહારાષ્ટ્ર',
      ta: 'டாக்டர் இ போர்ஜஸ் ரோடு, பரேல், மும்பை, மகாராஷ்டிரா',
      te: 'డాక్టర్ ఇ బోర్గేస్ రోడ్, పరేల్, ముంబై, మహారాష్ట్ర',
      kn: 'ಡಾ. ಇ ಬೋರ್ಗೆಸ್ ರಸ್ತೆ, ಪರೇಲ್, ಮುಂಬೈ, ಮಹಾರಾಷ್ಟ್ರ',
      bn: 'ডাঃ ই বোর্গেস রোড, পারেল, মুম্বাই, মহারাষ্ট্র',
      pa: 'ਡਾ. ਈ ਬੋਰਗਸ ਰੋਡ, ਪਰੇਲ, ਮੁੰਬਈ, ਮਹਾਰਾਸ਼ਟਰ',
      ml: 'ഡോ. ഇ ബോർഗെസ് റോഡ്, പരേൽ, മുംബൈ, മഹാരാഷ്ട്ര',
      or: 'ଡାକ୍ତର ଇ ବୋର୍ଗେସ୍ ରୋଡ୍, ପରେଲ, ମୁମ୍ବାଇ, ମହାରାଷ୍ଟ୍ର'
    },
    doctors: [
      { name: 'Dr. Arjun Mehta', specialty: 'General Medicine', exp: '19 yrs' },
      { name: 'Dr. Ananya Sharma', specialty: 'General Medicine', exp: '13 yrs' }
    ]
  },`;

if (code.includes('ml: \'ഡോ. ഇ ബോർഗെസ് റോഡ്, പരേൽ, മുംബൈ, മഹാരാഷ്ട്ര\',') && !code.includes('\'tata-mumbai\': {')) {
  const badSection = `    doctors: [
      ml: 'ഡോ. ഇ ബോർഗെസ് റോഡ്, പരേൽ, മുംബൈ, മഹാരാഷ്ട്ര',`;
  // Let's replace the broken section
  const p1 = code.indexOf('\'fortis-jaipur\': {');
  const p2 = code.indexOf('\'jaipur-hospital\': {');
  if (p1 !== -1 && p2 !== -1) {
    const fortisTataSection = `  'fortis-jaipur': {
    name: {
      en: 'Fortis Escorts Hospital Jaipur',
      hi: 'फोर्टिस एस्कॉर्ट्स अस्पताल जयपुर',
      mr: 'फोर्टिस एस्कॉर्ट्स रुग्णालय जयपूर',
      gu: 'ફોર્ટિસ એસ્કોર્ટ્સ હોસ્પિટલ જયપુર',
      ta: 'ஃபோர்டிஸ் எஸ்கார்ட்ஸ் மருத்துவமனை ஜெய்ப்பூர்',
      te: 'ఫోర్టిస్ ఎస్కార్ట్స్ ఆసుపత్రి జైపూర్',
      kn: 'ಫೋರ್ಟಿಸ್ ಎಸ್ಕಾರ್ಟ್ಸ್ ಆಸ್ಪತ್ರೆ ಜೈಪುರ',
      bn: 'ফোর্টিস এসকর্টস হাসপাতাল জয়পুর',
      pa: 'ਫੋਰਟਿਸ ਐਸਕੌਰਟਸ ਹਸਪਤਾਲ ਜੈਪੁਰ',
      ml: 'ഫോർട്ടിസ് എസ്കോർട്സ് ആശുപത്രി ജയ്‌പൂർ',
      or: 'ଫୋର୍ଟିସ୍ ଏସ୍କର୍ଟ୍ସ ଡାକ୍ତରଖାନା ଜୟପୁର'
    },
    address: {
      en: 'Jawahar Lal Nehru Marg, Malviya Nagar, Jaipur',
      hi: 'जवाहर लाल नेहरू मार्ग, मालवीय नगर, जयपुर',
      mr: 'जवाहर लाल नेहरू मार्ग, मालवीय नगर, जयपूर',
      gu: 'જવાહર લાલ નેહરુ માર્ગ, માલવિયા નગર, જયપુર',
      ta: 'ஜவஹர் லால் நேரு மார்க், மாளவியா நகர், ஜெய்ப்பூர்',
      te: 'జవహర్ లాల్ నెహ్రూ మార్గ్, మాలవీయ నగర్, జైపూర్',
      kn: 'ಜವಾಹರ ಲಾಲ್ ನೆಹರು ಮಾರ್ಗ, ಮಾಳವೀಯ ನಗರ, ಜೈಪುರ',
      bn: 'জওহর লাল নেহেরু মার্গ, মালভিয়া নগর, জয়পুর',
      pa: 'ਜਵਾਹਰ ਲਾਲ ਨਹਿਰੂ ਮਾਰਗ, ਮਾਲਵੀਆ ਨਗਰ, ਜੈਪੁਰ',
      ml: 'ജവഹർ ലാൽ നെഹ്‌റു മാർഗ്, മാളവ്യ നഗർ, ജയ്‌പൂർ',
      or: 'ଜବାହର ଲାଲ ନେହେରୁ ମାର୍ଗ, ମାଲବ୍ୟ ନଗର, ଜୟପୁର'
    },
` + tataBlock + '\n';
    code = code.slice(0, p1) + fortisTataSection + code.slice(p2);
  }
}

// Ensure the trust card in sidebar has className="notranslate" translate="no"
code = code.replace(
  `        {/* Sidebar Footer / Trust & Security Card (Exact Match to User Reference) */}
        {sidebarOpen ? (
          <div
            style={{
              background: '#f4fbf9',`,
  `        {/* Sidebar Footer / Trust & Security Card (Exact Match to User Reference) */}
        {sidebarOpen ? (
          <div
            className="notranslate"
            translate="no"
            style={{
              background: '#f4fbf9',`
);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully fixed tata-mumbai and added notranslate to sidebar trust card');
