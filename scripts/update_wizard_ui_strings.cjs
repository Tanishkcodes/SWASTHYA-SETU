const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'PatientDashboard.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Wizard Step Indicator array
code = code.replace(
  `                      {[\n                        { step: 1, label: 'Select Date' },\n                        { step: 2, label: 'Select Time' },\n                        { step: 3, label: 'Case' },\n                        { step: 4, label: 'Upload Reports' },\n                        { step: 5, label: 'Confirmation' }\n                      ].map((item, idx, arr) => {`,
  `                      {[\n                        { step: 1, label: tr('wizardStep1') },\n                        { step: 2, label: tr('wizardStep2') },\n                        { step: 3, label: tr('wizardStep3') },\n                        { step: 4, label: tr('wizardStep4') },\n                        { step: 5, label: tr('wizardStep5') }\n                      ].map((item, idx, arr) => {`
);

// 2. Step 1 Header & Subtitle
code = code.replace(
  `<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>\n                            Step 1: Select Date\n                          </h3>\n                          <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>\n                            Choose a convenient date for your doctor consultation\n                          </p>`,
  `<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>\n                            {tr('step1SelectDate')}\n                          </h3>\n                          <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>\n                            {tr('step1Desc')}\n                          </p>`
);

// 3. Step 1 Date tile month & weekday localization
code = code.replace(
  `                            month: value.toLocaleDateString('en-US', { month: 'short' }),\n                            weekday: value.toLocaleDateString('en-US', { weekday: 'short' }),`,
  `                            month: value.toLocaleDateString(currentLang === 'en' ? 'en-IN' : (currentLang + '-IN'), { month: 'short' }).toUpperCase(),\n                            weekday: value.toLocaleDateString(currentLang === 'en' ? 'en-IN' : (currentLang + '-IN'), { weekday: 'short' }).toUpperCase(),`
);

// 4. Step 1 "More Dates" button
code = code.replace(
  `<span style={{ fontSize: '0.825rem', fontWeight: '800', color: '#475569' }}>More Dates</span>`,
  `<span style={{ fontSize: '0.825rem', fontWeight: '800', color: '#475569' }}>{tr('moreDates')}</span>`
);

// 5. Step 1 "Next: Select Time" button
code = code.replace(
  `<span>Next: Select Time</span>`,
  `<span>{tr('nextSelectTime')}</span>`
);

// 6. Step 2 Header & Subtitle
code = code.replace(
  `<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>\n                              Step 2: Select Time Slot\n                            </h3>\n                            <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>\n                              Live availability from {selectedDoctorObj.name}'s schedule\n                            </p>`,
  `<h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>\n                              {tr('step2SelectTime')}\n                            </h3>\n                            <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>\n                              {tr('liveDoctorSchedule').replace('{doctor}', selectedDoctorObj.name)}\n                            </p>`
);

// 7. Step 2 Session render calls
code = code.replace(
  `{renderSlotGroup(liveSlots.morning,   '☀️', 'Morning Slots')}\n                            {renderSlotGroup(liveSlots.afternoon, '🌤️', 'Afternoon Slots')}\n                            {renderSlotGroup(liveSlots.evening,   '🌙', 'Evening Slots')}`,
  `{renderSlotGroup(liveSlots.morning,   '☀️', tr('morningSlots'))}\n                            {renderSlotGroup(liveSlots.afternoon, '🌤️', tr('afternoonSlots'))}\n                            {renderSlotGroup(liveSlots.evening,   '🌙', tr('eveningSlots'))}`
);

// 8. Step 2 slots available counter
code = code.replace(
  `{visibleSlots.filter(s => s.state === 'open' || s.state === 'fast').length} slots available`,
  `{visibleSlots.filter(s => s.state === 'open' || s.state === 'fast').length} {tr('slotsAvailable')}`
);

// 9. Step 2 status labels
code = code.replace(
  `                              const statusLabel = isSelected ? 'Selected'\n                                : slot.state === 'full'   ? 'Fully Booked'\n                                : slot.state === 'closed' ? 'Closed'\n                                : slot.state === 'fast'   ? \`\${slot.slotsLeft} slot left\`\n                                : \`\${slot.slotsLeft} slots left\`;`,
  `                              const statusLabel = isSelected ? tr('selected')\n                                : slot.state === 'full'   ? tr('fullyBooked')\n                                : slot.state === 'closed' ? tr('closed')\n                                : slot.state === 'fast'   ? \`\${slot.slotsLeft} \${tr('slotLeft')}\`\n                                : \`\${slot.slotsLeft} \${tr('slotsLeft')}\`;`
);

// 10. Step 2 Legend
code = code.replace(
  `                          {[\n                            { dot: '#059669', label: 'Available' },\n                            { dot: '#ea580c', label: 'Filling Fast' },\n                            { dot: '#cbd5e1', label: 'Fully Booked' },\n                            { dot: '#cbd5e1', label: 'Closed', strikethrough: true }\n                          ].map(l => (`,
  `                          {[\n                            { dot: '#059669', label: tr('available') },\n                            { dot: '#ea580c', label: tr('fillingFast') },\n                            { dot: '#cbd5e1', label: tr('fullyBooked') },\n                            { dot: '#cbd5e1', label: tr('closed'), strikethrough: true }\n                          ].map(l => (`
);

// 11. Step 2 Previous button, live badge, and Next button
code = code.replace(
  `<span>Previous</span>`,
  `<span>{tr('previous')}</span>`
);
code = code.replace(
  `<span>Live availability · Refreshes every 15s</span>`,
  `<span>{tr('liveAvailabilityBadge')}</span>`
);
code = code.replace(
  `<span>Next: Case</span>`,
  `<span>{tr('nextCase')}</span>`
);
code = code.replace(
  `<p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading live schedule…</p>`,
  `<p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{tr('loadingLiveSchedule')}</p>`
);
code = code.replace(
  `No slots available for this date. Please select a different date.`,
  `{tr('noSlotsAvailable')}`
);

// 12. Doctor Select Page Navigation & Action Buttons
code = code.replace(
  `<span>Back to Dashboard</span>`,
  `<span>{tr('backToDashboard')}</span>`
);
code = code.replace(
  `<h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>\n                      Select a Doctor\n                    </h1>\n                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>\n                      Choose a doctor from {bookingHospital.name}\n                    </p>`,
  `<h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>\n                      {tr('selectDoctorTitle')}\n                    </h1>\n                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>\n                      {tr('chooseDoctorFrom').replace('{hospital}', bookingHospital.name)}\n                    </p>`
);
code = code.replace(
  `<span>Change Hospital</span>`,
  `<span>{tr('changeHospital')}</span>`
);
code = code.replace(
  `<span>Select</span>\n                            <ArrowRight size={15} />`,
  `<span>{tr('select')}</span>\n                            <ArrowRight size={15} />`
);
code = code.replace(
  `View Profile\n                          </button>`,
  `{tr('viewProfile')}\n                          </button>`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated all booking wizard UI strings to use dynamic tr(...)');
