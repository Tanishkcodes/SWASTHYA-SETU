const fs = require('fs');

const file = 'd:/swasthya setu/src/pages/PatientDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  // Translation helper
  const tr = (key) => {
    const langDict = DASHBOARD_I18N[currentLang] || DASHBOARD_I18N.en;
    return langDict[key] || DASHBOARD_I18N.en[key] || key;
  };
  const ui = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'general');

  // Sidebar Collapsible State`;

const replacement = `  // Translation helper
  const tr = (key) => {
    const langDict = DASHBOARD_I18N[currentLang] || DASHBOARD_I18N.en;
    return langDict[key] || DASHBOARD_I18N.en[key] || key;
  };
  const ui = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'general');
  const uiName = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'name');

  const [, setTranslationTick] = useState(0);
  useEffect(() => {
    return aiTranslationService.subscribe(() => {
      setTranslationTick(t => t + 1);
    });
  }, []);

  // Sidebar Collapsible State`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');

// Now let's wrap all hardcoded English strings with ui() or uiName() or tr()

console.log("Replaced successfully");
