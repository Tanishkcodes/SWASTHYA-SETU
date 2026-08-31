const fs = require('fs');
const filePath = 'src/pages/PhysicianDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useLanguage import after useSession
if (!content.includes("import { useLanguage }")) {
  content = content.replace(
    `import { useSession } from '../context/SessionContext';`,
    `import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import domTranslator from '../engine/DOMTranslator';`
  );
  console.log('Added useLanguage import');
}

// 2. In the main PhysicianDashboard function, add language hook after session
const mainFnTarget = `export default function PhysicianDashboard() {
  const nav = useNavigate();
  const { session, logout } = useSession();
  const [activeTab, setActiveTab] = useState('appointments');`;

const mainFnReplacement = `export default function PhysicianDashboard() {
  const nav = useNavigate();
  const { session, logout } = useSession();
  const { currentLang } = useLanguage();

  // Sync domTranslator whenever the doctor portal's language changes
  useEffect(() => {
    domTranslator.start(currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const [activeTab, setActiveTab] = useState('appointments');`;

if (!content.includes('const { currentLang } = useLanguage()')) {
  content = content.replace(mainFnTarget, mainFnReplacement);
  console.log('Added useLanguage hook to main component');
} else {
  console.log('useLanguage hook already present');
}

// 3. Mark doctor name span in Top header as notranslate
content = content.replace(
  `<b>{doctor?.name || 'Dr. Ananya Sharma'}</b>`,
  `<b translate="no" className="notranslate">{doctor?.name || 'Dr. Ananya Sharma'}</b>`
);

// 4. Mark hospital name value as notranslate
content = content.replace(
  `<span className="dp-profile-item-val" title={hospital}>
            {hospital}
          </span>`,
  `<span className="dp-profile-item-val notranslate" title={hospital} translate="no">
            {hospital}
          </span>`
);

// 5. Mark email as notranslate  
content = content.replace(
  `<span className="dp-profile-email-txt" title={email}>`,
  `<span className="dp-profile-email-txt notranslate" title={email} translate="no">`
);

// 6. Mark greeting doctor name as notranslate
content = content.replace(
  `{greet}, {doctorDisplayName} 👋`,
  `{greet}, <span translate="no" className="notranslate">{doctorDisplayName}</span> 👋`
);

// 7. Mark doctor name + speciality chip in header as notranslate
content = content.replace(
  `<small>{doctor?.speciality || doctor?.department || 'General Physician'}</small>`,
  `<small className="notranslate" translate="no">{doctor?.speciality || doctor?.department || 'General Physician'}</small>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('PhysicianDashboard.jsx updated successfully');
