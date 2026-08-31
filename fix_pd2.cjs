const fs = require('fs');
const filePath = 'src/pages/PatientDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add uiName helper right after the ui helper on line 2270
const uiLine = `  const ui = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'general');`;
const replacement = `  const ui = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'general');
  const uiName = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'name');`;

if (!content.includes('const uiName')) {
  content = content.replace(uiLine, replacement);
  console.log('uiName added');
} else {
  console.log('uiName already present');
}

// Fix stepper labels - use ui() wrapper
content = content.replace(
  `{ step: 1, label: 'Select Date' }`,
  `{ step: 1, label: ui('Select Date') }`
);
content = content.replace(
  `{ step: 2, label: 'Select Time' }`,
  `{ step: 2, label: ui('Select Time') }`
);
content = content.replace(
  `{ step: 3, label: 'Case' }`,
  `{ step: 3, label: ui('Case') }`
);
content = content.replace(
  `{ step: 4, label: 'Upload Reports' }`,
  `{ step: 4, label: ui('Upload Reports') }`
);
content = content.replace(
  `{ step: 5, label: 'Confirmation' }`,
  `{ step: 5, label: ui('Confirmation') }`
);

// Fix "Step 1: Select Date" in heading (hardcoded text inside JSX)
content = content.replace(
  /(<h3[^>]*>)\s*Step 1: Select Date\s*(<\/h3>)/g,
  `$1{ui('Step 1: Select Date')}$2`
);
content = content.replace(
  /(<h3[^>]*>)\s*Step 2: Select Time Slot\s*(<\/h3>)/g,
  `$1{ui('Step 2: Select Time Slot')}$2`
);

// Fix subtitle text
content = content.replace(
  /(<p[^>]*>)\s*Choose a convenient date for your doctor consultation\s*(<\/p>)/g,
  `$1{ui('Choose a convenient date for your doctor consultation')}$2`
);

// Fix "View Profile" button text
content = content.replace(
  />\s*View Profile\s*<\/button>/g,
  `>{ui('View Profile')}</button>`
);

// Fix "Select" button in doctor card
content = content.replace(
  /<span>Select<\/span>/g,
  `<span>{ui('Select')}</span>`
);

// Fix slot status labels - they are in JS variables, handle carefully
// statusLabel values
content = content.replace(
  `const statusLabel = isSelected ? 'Selected'`,
  `const statusLabel = isSelected ? ui('Selected')`
);
content = content.replace(
  `: slot.state === 'full'   ? 'Fully Booked'`,
  `: slot.state === 'full'   ? ui('Fully Booked')`
);
content = content.replace(
  `: slot.state === 'closed' ? 'Closed'`,
  `: slot.state === 'closed' ? ui('Closed')`
);

// Wrap "Can't find the right doctor" span
content = content.replace(
  `<span>Can't find the right doctor?`,
  `<span>{ui("Can't find the right doctor?")}{' '}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('PatientDashboard.jsx updated successfully');
