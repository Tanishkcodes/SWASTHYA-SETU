const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'PatientDashboard.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add extra translation keys to all 9 languages in DASHBOARD_I18N
const extraTranslations = {
  en: {
    searchDoctorPlaceholder: 'Search doctor by name or specialty...',
    filters: 'Filters',
    years: 'years',
    yrs: 'yrs'
  },
  hi: {
    searchDoctorPlaceholder: 'डॉक्टर का नाम या विशेषज्ञता खोजें...',
    filters: 'फ़िल्टर',
    years: 'वर्ष',
    yrs: 'वर्ष'
  },
  mr: {
    searchDoctorPlaceholder: 'डॉक्टरांचे नाव किंवा विशेषज्ञता शोधा...',
    filters: 'फिल्टर्स',
    years: 'वर्षे',
    yrs: 'वर्षे'
  },
  gu: {
    searchDoctorPlaceholder: 'ડૉક્ટરનું નામ અથવા વિશેષતા શોધો...',
    filters: 'ફિલ્ટર્સ',
    years: 'વર્ષ',
    yrs: 'વર્ષ'
  },
  ta: {
    searchDoctorPlaceholder: 'மருத்துவர் பெயர் அல்லது நிபுணத்துவத்தைத் தேடவும்...',
    filters: 'வடிகட்டிகள்',
    years: 'ஆண்டுகள்',
    yrs: 'ஆண்டுகள்'
  },
  te: {
    searchDoctorPlaceholder: 'డాక్టర్ పేరు లేదా స్పెషాలిటీని శోధించండి...',
    filters: 'ఫిల్టర్లు',
    years: 'సంవత్సరాలు',
    yrs: 'సంవత్సరాలు'
  },
  kn: {
    searchDoctorPlaceholder: 'ವೈದ್ಯರ ಹೆಸರು ಅಥವಾ ವಿಶೇಷತೆಯನ್ನು ಹುಡುಕಿ...',
    filters: 'ಫಿಲ್ಟರ್‌ಗಳು',
    years: 'ವರ್ಷಗಳು',
    yrs: 'ವರ್ಷಗಳು'
  },
  bn: {
    searchDoctorPlaceholder: 'ডাক্তারের নাম বা বিশেষত্ব অনুসন্ধান করুন...',
    filters: 'ফিল্টার',
    years: 'বছর',
    yrs: 'বছর'
  },
  ml: {
    searchDoctorPlaceholder: 'ഡോക്ടറുടെ പേരോ സ്പെഷ്യാലിറ്റിയോ തിരയുക...',
    filters: 'ഫിൽട്ടറുകൾ',
    years: 'വർഷം',
    yrs: 'വർഷം'
  }
};

for (const [lang, keys] of Object.entries(extraTranslations)) {
  const marker = `${lang}: {`;
  const idx = code.indexOf(marker);
  if (idx !== -1) {
    const endIdx = code.indexOf('  },', idx);
    if (endIdx !== -1) {
      const keysString = Object.entries(keys)
        .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
        .join('\n');
      code = code.slice(0, endIdx) + keysString + '\n' + code.slice(endIdx);
    }
  }
}

// 2. Doctor Selection Page (Screenshot 1 fixes)
// Title & Subtitle
code = code.replace(
  `<h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>\n                      Select a Doctor\n                    </h1>\n                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>\n                      Choose a doctor from {bookingHospital.name}\n                    </p>`,
  `<h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>\n                      {tr('selectDoctorTitle')}\n                    </h1>\n                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>\n                      {tr('chooseDoctorFrom').replace('{hospital}', aiTranslationService.translate(bookingHospital.name, currentLang, 'hospital') || bookingHospital.name)}\n                    </p>`
);

// Search input placeholder
code = code.replace(
  `placeholder="Search doctor by name or specialty..."`,
  `placeholder={tr('searchDoctorPlaceholder')}`
);

// Filters button label
code = code.replace(
  `<Filter size={15} color="#64748b" />\n                      <span>Filters</span>`,
  `<Filter size={15} color="#64748b" />\n                      <span>{tr('filters')}</span>`
);

// Care system buttons: Allopathy vs Ayurveda
code = code.replace(
  `<Stethoscope size={22} color={doctorCareSystem === 'allopathy' ? '#0f766e' : '#94a3b8'} />\n                      <span>Allopathy</span>`,
  `<Stethoscope size={22} color={doctorCareSystem === 'allopathy' ? '#0f766e' : '#94a3b8'} />\n                      <span>{tr('allopathic')}</span>`
);
code = code.replace(
  `<Leaf size={22} color={doctorCareSystem === 'ayurveda' ? '#ea580c' : '#94a3b8'} />\n                      <span>Ayurveda</span>`,
  `<Leaf size={22} color={doctorCareSystem === 'ayurveda' ? '#ea580c' : '#94a3b8'} />\n                      <span>{tr('ayush')}</span>`
);

// Doctor card details
code = code.replace(
  `                          <h4 style={{ margin: '0 0 3px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.3 }}>\n                            {fullProf.name}\n                          </h4>\n                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>\n                            {fullProf.degrees.split(',')[0] || 'MBBS'}\n                          </div>\n                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '14px' }}>\n                            <Briefcase size={13} color="#64748b" />\n                            <span>{fullProf.exp}</span>\n                          </div>`,
  `                          <h4 style={{ margin: '0 0 3px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.3 }}>\n                            {aiTranslationService.translate(fullProf.name, currentLang, 'doctor')}\n                          </h4>\n                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>\n                            {aiTranslationService.translate(fullProf.degrees.split(',')[0] || 'MBBS', currentLang, 'general')}\n                          </div>\n                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '14px' }}>\n                            <Briefcase size={13} color="#64748b" />\n                            <span>{(fullProf.exp || '').replace(/Years|yrs|years/gi, tr('years'))}</span>\n                          </div>`
);

// Doctor card button labels
code = code.replace(
  `<span>Select</span>\n                            <ArrowRight size={15} />`,
  `<span>{tr('select')}</span>\n                            <ArrowRight size={15} />`
);
code = code.replace(
  `View Profile\n                          </button>`,
  `{tr('viewProfile')}\n                          </button>`
);


// 3. Booking Wizard Stepper (Screenshot 2 fixes)
// 5 Step Indicator labels
code = code.replace(
  `                      {[\n                        { step: 1, label: 'Select Date' },\n                        { step: 2, label: 'Select Time' },\n                        { step: 3, label: 'Case' },\n                        { step: 4, label: 'Upload Reports' },\n                        { step: 5, label: 'Confirmation' }\n                      ].map((item, idx, arr) => {`,
  `                      {[\n                        { step: 1, label: tr('wizardStep1') },\n                        { step: 2, label: tr('wizardStep2') },\n                        { step: 3, label: tr('wizardStep3') },\n                        { step: 4, label: tr('wizardStep4') },\n                        { step: 5, label: tr('wizardStep5') }\n                      ].map((item, idx, arr) => {`
);

// Step Indicator circle styling fix (so number 1, 2, 3, 4, 5 is crisp, high-contrast, perfectly visible)
code = code.replace(
  `                                backgroundColor: isCompleted || isCurrent ? '#0c4e47' : '#ffffff',\n                                border: isCompleted || isCurrent ? '2px solid #0c4e47' : '2px solid #cbd5e1',\n                                color: isCompleted || isCurrent ? '#ffffff' : '#64748b',`,
  `                                backgroundColor: isCompleted ? '#0c4e47' : isCurrent ? '#0c4e47' : '#ffffff',\n                                border: isCompleted || isCurrent ? '2px solid #0c4e47' : '2px solid #cbd5e1',\n                                color: isCompleted || isCurrent ? '#ffffff' : '#334155',\n                                lineHeight: '1',`
);

// Step 1 Header
code = code.replace(
  `<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>\n                            Step 1: Select Date\n                          </h3>\n                          <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>\n                            Choose a convenient date for your doctor consultation\n                          </p>`,
  `<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>\n                            {tr('step1SelectDate')}\n                          </h3>\n                          <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>\n                            {tr('step1Desc')}\n                          </p>`
);

// Top Selected Doctor Card (above Step 1/2/3/4/5)
code = code.replace(
  `                        <h3 style={{ margin: '0 0 3px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>\n                          {selectedDoctorObj.name}\n                        </h3>\n                        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>\n                          {selectedDoctorObj.degrees || 'MBBS (General Medicine)'}\n                        </div>\n                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>\n                          <User size={13} color="#0f766e" />\n                          <span>{selectedDoctorObj.exp || '12+ Years Experience'}</span>\n                        </div>`,
  `                        <h3 style={{ margin: '0 0 3px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>\n                          {aiTranslationService.translate(selectedDoctorObj.name, currentLang, 'doctor')}\n                        </h3>\n                        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>\n                          {aiTranslationService.translate(selectedDoctorObj.degrees || 'MBBS (General Medicine)', currentLang, 'general')}\n                        </div>\n                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>\n                          <User size={13} color="#0f766e" />\n                          <span>{(selectedDoctorObj.exp || '12+ Years Experience').replace(/Years|yrs|years/gi, tr('years'))}</span>\n                        </div>`
);

// Step 2 Header & Subtitle
code = code.replace(
  `<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>\n                              Step 2: Select Time Slot\n                            </h3>\n                            <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>\n                              Live availability from {selectedDoctorObj.name}'s schedule\n                            </p>`,
  `<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>\n                              {tr('step2SelectTime')}\n                            </h3>\n                            <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>\n                              {tr('liveDoctorSchedule').replace('{doctor}', aiTranslationService.translate(selectedDoctorObj.name, currentLang, 'doctor'))}\n                            </p>`
);

// Step 2 Sessions rendering
code = code.replace(
  `{renderSlotGroup(liveSlots.morning,   '☀️', 'Morning Slots')}\n                            {renderSlotGroup(liveSlots.afternoon, '🌤️', 'Afternoon Slots')}\n                            {renderSlotGroup(liveSlots.evening,   '🌙', 'Evening Slots')}`,
  `{renderSlotGroup(liveSlots.morning,   '☀️', tr('morningSlots'))}\n                            {renderSlotGroup(liveSlots.afternoon, '🌤️', tr('afternoonSlots'))}\n                            {renderSlotGroup(liveSlots.evening,   '🌙', tr('eveningSlots'))}`
);

// Step 2 status labels inside slot buttons
code = code.replace(
  `                              const statusLabel = isSelected ? 'Selected'\n                                : slot.state === 'full'   ? 'Fully Booked'\n                                : slot.state === 'closed' ? 'Closed'\n                                : slot.state === 'fast'   ? \`\${slot.slotsLeft} slot left\`\n                                : \`\${slot.slotsLeft} slots left\`;`,
  `                              const statusLabel = isSelected ? tr('selected')\n                                : slot.state === 'full'   ? tr('fullyBooked')\n                                : slot.state === 'closed' ? tr('closed')\n                                : slot.state === 'fast'   ? \`\${slot.slotsLeft} \${tr('slotLeft')}\`\n                                : \`\${slot.slotsLeft} \${tr('slotsLeft')}\`;`
);

// Step 2 Legend items
code = code.replace(
  `                          {[\n                            { dot: '#059669', label: 'Available' },\n                            { dot: '#ea580c', label: 'Filling Fast' },\n                            { dot: '#cbd5e1', label: 'Fully Booked' },\n                            { dot: '#cbd5e1', label: 'Closed', strikethrough: true }\n                          ].map(l => (`,
  `                          {[\n                            { dot: '#059669', label: tr('available') },\n                            { dot: '#ea580c', label: tr('fillingFast') },\n                            { dot: '#cbd5e1', label: tr('fullyBooked') },\n                            { dot: '#cbd5e1', label: tr('closed'), strikethrough: true }\n                          ].map(l => (`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated all booking screens with comprehensive multilingual translations!');
