const fs = require('fs');

const file = 'd:/swasthya setu/src/pages/PatientDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  // Translation helper
  const tr = (key) => {
    const langDict = DASHBOARD_I18N[currentLang] || DASHBOARD_I18N.en;
    return langDict[key] || DASHBOARD_I18N.en[key] || key;
  };
  const ui = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'general');`;

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
  }, []);`;

content = content.replace(target, replacement);

// Also fix hardcoded strings
content = content.replace(/{ step: 1, label: 'Select Date' }/g, `{ step: 1, label: ui('Select Date') }`);
content = content.replace(/{ step: 2, label: 'Select Time' }/g, `{ step: 2, label: ui('Select Time') }`);
content = content.replace(/{ step: 3, label: 'Case' }/g, `{ step: 3, label: ui('Case') }`);
content = content.replace(/{ step: 4, label: 'Upload Reports' }/g, `{ step: 4, label: ui('Upload Reports') }`);
content = content.replace(/{ step: 5, label: 'Confirmation' }/g, `{ step: 5, label: ui('Confirmation') }`);

content = content.replace(/>\s*Step 1: Select Date\s*<\/h3>/g, `>{ui('Step 1: Select Date')}</h3>`);
content = content.replace(/>\s*Choose a convenient date for your doctor consultation\s*<\/p>/g, `>{ui('Choose a convenient date for your doctor consultation')}</p>`);
content = content.replace(/>\s*Step 2: Select Time Slot\s*<\/h3>/g, `>{ui('Step 2: Select Time Slot')}</h3>`);

content = content.replace(/>\s*Live availability from {selectedDoctorObj\.name}'s schedule\s*<\/p>/g, `>{ui(\`Live availability from \${selectedDoctorObj.name}'s schedule\`)}</p>`);

content = content.replace(/>\s*Can't find the right doctor\? Request a Callback\s*<\/span>/g, `>{ui("Can't find the right doctor? Request a Callback")}</span>`);

content = content.replace(/const statusLabel = isSelected \? 'Selected'/g, `const statusLabel = isSelected ? ui('Selected')`);
content = content.replace(/: slot\.state === 'full'   \? 'Fully Booked'/g, `: slot.state === 'full'   ? ui('Fully Booked')`);
content = content.replace(/: slot\.state === 'closed' \? 'Closed'/g, `: slot.state === 'closed' ? ui('Closed')`);
content = content.replace(/: slot\.state === 'fast'   \? \`\${slot\.slotsLeft} slot left\`/g, `: slot.state === 'fast'   ? ui(\`\${slot.slotsLeft} slot left\`)`);
content = content.replace(/: \`\${slot\.slotsLeft} slots left\`/g, `: ui(\`\${slot.slotsLeft} slots left\`)`);

content = content.replace(/>\s*View Profile\s*<\/button>/g, `>{ui('View Profile')}</button>`);
content = content.replace(/<span>Select<\/span>/g, `<span>{ui('Select')}</span>`);

content = content.replace(/ui\(selectedDoctorObj\?\.name \|\| selectedDoctor\)/g, `uiName(selectedDoctorObj?.name || selectedDoctor)`);
content = content.replace(/ui\(doc\.name\)/g, `uiName(doc.name)`);
content = content.replace(/\{doc\.name\}/g, `{uiName(doc.name)}`);
content = content.replace(/ui\(selectedDoctor\)/g, `uiName(selectedDoctor)`);


fs.writeFileSync(file, content, 'utf8');
console.log("Replaced successfully");
