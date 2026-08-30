import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  ClipboardList,
  Edit,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ShieldCheck,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2
} from 'lucide-react';

const CONFIRM_COPY = {
  en:{date:'Date',time:'Time',mins:'30 minutes',type:'Consultation type',general:'General consultation',opd:'OPD visit',summary:'Your case summary',edit:'Edit',reported:'Reported symptoms',details:'Patient-provided details',doctorReview:'For doctor review',doctorReviewDesc:'These are patient-reported details, not a diagnosis. The doctor will verify them during consultation.',reports:'Uploaded reports',uploaded:'Uploaded on',none:'No reports attached',optional:'Previous reports are optional for consultation.',uploadMore:'Upload more reports',important:'Important note',secure:'Your information is stored for the appointment and shared through the clinical workflow.',editDetails:'Edit details',confirm:'Confirm appointment',notProvided:'Not provided'},
  hi:{date:'तारीख',time:'समय',mins:'30 मिनट',type:'परामर्श प्रकार',general:'सामान्य परामर्श',opd:'ओपीडी विज़िट',summary:'आपके केस का सार',edit:'संपादित करें',reported:'बताए गए लक्षण',details:'रोगी द्वारा दी गई जानकारी',doctorReview:'डॉक्टर की समीक्षा हेतु',doctorReviewDesc:'यह रोगी द्वारा दी गई जानकारी है, निदान नहीं। डॉक्टर परामर्श में इसकी पुष्टि करेंगे।',reports:'अपलोड की गई रिपोर्ट',uploaded:'अपलोड किया',none:'कोई रिपोर्ट संलग्न नहीं',optional:'पिछली रिपोर्ट परामर्श के लिए वैकल्पिक हैं।',uploadMore:'और रिपोर्ट अपलोड करें',important:'महत्वपूर्ण सूचना',secure:'आपकी जानकारी अपॉइंटमेंट के लिए संग्रहित होती है और क्लिनिकल कार्यप्रवाह में साझा की जाती है।',editDetails:'विवरण बदलें',confirm:'अपॉइंटमेंट की पुष्टि करें',notProvided:'नहीं दिया गया'},
  ta:{date:'தேதி',time:'நேரம்',mins:'30 நிமிடங்கள்',type:'ஆலோசனை வகை',general:'பொது ஆலோசனை',opd:'ஓபிடி வருகை',summary:'உங்கள் வழக்கு சுருக்கம்',edit:'திருத்து',reported:'தெரிவித்த அறிகுறிகள்',details:'நோயாளர் வழங்கிய விவரங்கள்',doctorReview:'மருத்துவர் ஆய்வுக்கு',doctorReviewDesc:'இவை நோயாளர் தெரிவித்த விவரங்கள்; நோயறிதல் அல்ல. ஆலோசனையில் மருத்துவர் சரிபார்ப்பார்.',reports:'பதிவேற்றிய அறிக்கைகள்',uploaded:'பதிவேற்றியது',none:'அறிக்கைகள் இணைக்கப்படவில்லை',optional:'முந்தைய அறிக்கைகள் விருப்பமானவை.',uploadMore:'மேலும் அறிக்கைகள் பதிவேற்று',important:'முக்கிய குறிப்பு',secure:'உங்கள் தகவல் முன்பதிவிற்காகச் சேமிக்கப்பட்டு மருத்துவ செயல்முறையில் பகிரப்படும்.',editDetails:'விவரங்களைத் திருத்து',confirm:'முன்பதிவை உறுதிசெய்',notProvided:'வழங்கப்படவில்லை'},
  te:{date:'తేదీ',time:'సమయం',mins:'30 నిమిషాలు',type:'సంప్రదింపు రకం',general:'సాధారణ సంప్రదింపు',opd:'ఓపిడీ సందర్శన',summary:'మీ కేసు సారాంశం',edit:'సవరించండి',reported:'తెలిపిన లక్షణాలు',details:'రోగి ఇచ్చిన వివరాలు',doctorReview:'డాక్టర్ సమీక్ష కోసం',doctorReviewDesc:'ఇవి రోగి తెలిపిన వివరాలు మాత్రమే, నిర్ధారణ కాదు. డాక్టర్ సంప్రదింపులో ధృవీకరిస్తారు.',reports:'అప్‌లోడ్ చేసిన నివేదికలు',uploaded:'అప్‌లోడ్ తేదీ',none:'నివేదికలు జోడించలేదు',optional:'పాత నివేదికలు ఐచ్ఛికం.',uploadMore:'మరిన్ని నివేదికలు అప్‌లోడ్ చేయండి',important:'ముఖ్య గమనిక',secure:'మీ సమాచారం అపాయింట్‌మెంట్ కోసం నిల్వై క్లినికల్ ప్రక్రియలో పంచబడుతుంది.',editDetails:'వివరాలు సవరించండి',confirm:'అపాయింట్‌మెంట్ నిర్ధారించండి',notProvided:'ఇవ్వలేదు'},
  bn:{date:'তারিখ',time:'সময়',mins:'৩০ মিনিট',type:'পরামর্শের ধরন',general:'সাধারণ পরামর্শ',opd:'ওপিডি ভিজিট',summary:'আপনার কেস সারাংশ',edit:'সম্পাদনা',reported:'জানানো লক্ষণ',details:'রোগীর দেওয়া তথ্য',doctorReview:'ডাক্তারের পর্যালোচনার জন্য',doctorReviewDesc:'এগুলো রোগীর দেওয়া তথ্য, রোগ নির্ণয় নয়। পরামর্শের সময় ডাক্তার যাচাই করবেন।',reports:'আপলোড করা রিপোর্ট',uploaded:'আপলোড হয়েছে',none:'কোনো রিপোর্ট সংযুক্ত নেই',optional:'আগের রিপোর্ট ঐচ্ছিক।',uploadMore:'আরও রিপোর্ট আপলোড করুন',important:'গুরুত্বপূর্ণ নোট',secure:'আপনার তথ্য অ্যাপয়েন্টমেন্টের জন্য সংরক্ষিত হয়ে ক্লিনিক্যাল প্রক্রিয়ায় ভাগ করা হবে।',editDetails:'বিস্তারিত সম্পাদনা',confirm:'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন',notProvided:'দেওয়া হয়নি'},
  mr:{date:'तारीख',time:'वेळ',mins:'30 मिनिटे',type:'सल्ल्याचा प्रकार',general:'सामान्य सल्ला',opd:'ओपीडी भेट',summary:'तुमच्या केसचा सारांश',edit:'संपादित करा',reported:'सांगितलेली लक्षणे',details:'रुग्णाने दिलेली माहिती',doctorReview:'डॉक्टरांच्या पुनरावलोकनासाठी',doctorReviewDesc:'ही रुग्णाने दिलेली माहिती आहे, निदान नाही. डॉक्टर सल्ल्यादरम्यान पडताळतील.',reports:'अपलोड केलेले अहवाल',uploaded:'अपलोड केले',none:'अहवाल जोडलेले नाहीत',optional:'मागील अहवाल ऐच्छिक आहेत.',uploadMore:'आणखी अहवाल अपलोड करा',important:'महत्त्वाची सूचना',secure:'तुमची माहिती अपॉइंटमेंटसाठी साठवली जाते आणि क्लिनिकल प्रक्रियेत सामायिक होते.',editDetails:'तपशील बदला',confirm:'अपॉइंटमेंट निश्चित करा',notProvided:'दिलेली नाही'},
  gu:{date:'તારીખ',time:'સમય',mins:'30 મિનિટ',type:'પરામર્શ પ્રકાર',general:'સામાન્ય પરામર્શ',opd:'ઓપીડી મુલાકાત',summary:'તમારા કેસનો સારાંશ',edit:'સંપાદિત કરો',reported:'જણાવેલા લક્ષણો',details:'દર્દીએ આપેલી વિગતો',doctorReview:'ડૉક્ટરની સમીક્ષા માટે',doctorReviewDesc:'આ દર્દીએ આપેલી વિગતો છે, નિદાન નથી. ડૉક્ટર પરામર્શ સમયે ચકાસશે.',reports:'અપલોડ કરેલા રિપોર્ટ',uploaded:'અપલોડ કર્યું',none:'કોઈ રિપોર્ટ જોડ્યો નથી',optional:'પહેલાના રિપોર્ટ વૈકલ્પિક છે.',uploadMore:'વધુ રિપોર્ટ અપલોડ કરો',important:'મહત્વપૂર્ણ નોંધ',secure:'તમારી માહિતી એપોઇન્ટમેન્ટ માટે સંગ્રહિત થાય છે અને ક્લિનિકલ પ્રક્રિયામાં શેર થાય છે.',editDetails:'વિગતો બદલો',confirm:'એપોઇન્ટમેન્ટની પુષ્ટિ કરો',notProvided:'આપેલ નથી'},
  kn:{date:'ದಿನಾಂಕ',time:'ಸಮಯ',mins:'30 ನಿಮಿಷ',type:'ಸಮಾಲೋಚನೆ ಪ್ರಕಾರ',general:'ಸಾಮಾನ್ಯ ಸಮಾಲೋಚನೆ',opd:'ಒಪಿಡಿ ಭೇಟಿ',summary:'ನಿಮ್ಮ ಪ್ರಕರಣದ ಸಾರಾಂಶ',edit:'ತಿದ್ದು',reported:'ತಿಳಿಸಿದ ಲಕ್ಷಣಗಳು',details:'ರೋಗಿ ನೀಡಿದ ವಿವರಗಳು',doctorReview:'ವೈದ್ಯರ ಪರಿಶೀಲನೆಗಾಗಿ',doctorReviewDesc:'ಇವು ರೋಗಿ ನೀಡಿದ ವಿವರಗಳು, ರೋಗನಿರ್ಣಯವಲ್ಲ. ವೈದ್ಯರು ಸಮಾಲೋಚನೆಯಲ್ಲಿ ಪರಿಶೀಲಿಸುತ್ತಾರೆ.',reports:'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ವರದಿಗಳು',uploaded:'ಅಪ್‌ಲೋಡ್ ದಿನಾಂಕ',none:'ವರದಿಗಳು ಲಗತ್ತಿಸಿಲ್ಲ',optional:'ಹಿಂದಿನ ವರದಿಗಳು ಐಚ್ಛಿಕ.',uploadMore:'ಹೆಚ್ಚಿನ ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',important:'ಮುಖ್ಯ ಸೂಚನೆ',secure:'ನಿಮ್ಮ ಮಾಹಿತಿ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಾಗಿ ಸಂಗ್ರಹವಾಗಿ ಕ್ಲಿನಿಕಲ್ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿ ಹಂಚಲಾಗುತ್ತದೆ.',editDetails:'ವಿವರ ತಿದ್ದು',confirm:'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ದೃಢೀಕರಿಸಿ',notProvided:'ನೀಡಿಲ್ಲ'},
  ml:{date:'തീയതി',time:'സമയം',mins:'30 മിനിറ്റ്',type:'കൺസൾട്ടേഷൻ തരം',general:'പൊതു കൺസൾട്ടേഷൻ',opd:'ഒപിഡി സന്ദർശനം',summary:'നിങ്ങളുടെ കേസ് സംഗ്രഹം',edit:'തിരുത്തുക',reported:'അറിയിച്ച ലക്ഷണങ്ങൾ',details:'രോഗി നൽകിയ വിവരങ്ങൾ',doctorReview:'ഡോക്ടർ പരിശോധനയ്ക്ക്',doctorReviewDesc:'ഇവ രോഗി നൽകിയ വിവരങ്ങളാണ്, രോഗനിർണയമല്ല. കൺസൾട്ടേഷനിൽ ഡോക്ടർ പരിശോധിക്കും.',reports:'അപ്‌ലോഡ് ചെയ്ത റിപ്പോർട്ടുകൾ',uploaded:'അപ്‌ലോഡ് ചെയ്തത്',none:'റിപ്പോർട്ടുകൾ ചേർത്തിട്ടില്ല',optional:'മുൻ റിപ്പോർട്ടുകൾ ഐച്ഛികമാണ്.',uploadMore:'കൂടുതൽ റിപ്പോർട്ടുകൾ അപ്‌ലോഡ് ചെയ്യുക',important:'പ്രധാന കുറിപ്പ്',secure:'നിങ്ങളുടെ വിവരം അപ്പോയിന്റ്മെന്റിനായി സൂക്ഷിച്ച് ക്ലിനിക്കൽ പ്രക്രിയയിൽ പങ്കിടും.',editDetails:'വിവരങ്ങൾ തിരുത്തുക',confirm:'അപ്പോയിന്റ്മെന്റ് സ്ഥിരീകരിക്കുക',notProvided:'നൽകിയിട്ടില്ല'}
};

export default function BookingConfirmationStep({
  doctor = {},
  hospital = {},
  selectedDate = '2026-08-29',
  selectedSlot = '10:30 AM',
  caseSymptoms = [],
  caseNotes = '',
  uploadedReports = [],
  onEditCase = () => {},
  onEditReports = () => {},
  onPrevious = () => {},
  onConfirm = () => {},
  language = 'en'
}) {
  const c = CONFIRM_COPY[language] || CONFIRM_COPY.en;
  const [aiPoints, setAiPoints] = useState([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Format Date for Display (e.g. 25 May 2026, Sunday)
  const formattedDate = (() => {
    try {
      const d = new Date(selectedDate);
      if (isNaN(d.getTime())) return { main: selectedDate, day: 'Sunday' };
      const locale = language === 'en' ? 'en-IN' : `${language}-IN`;
      const main = d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
      const day = d.toLocaleDateString(locale, { weekday: 'long' });
      return { main, day };
    } catch {
      return { main: selectedDate, day: 'Sunday' };
    }
  })();

  // Build a faithful patient-reported summary. Diagnosis remains with the doctor.
  useEffect(() => {
    const complaints = Array.isArray(caseSymptoms) && caseSymptoms.length ? caseSymptoms.join(', ') : c.notProvided;
    setAiPoints([
      { title: c.reported, description: complaints },
      { title: c.details, description: caseNotes ? caseNotes.replace(/•/g, '').replace(/\n+/g, ' ') : c.notProvided },
      { title: c.doctorReview, description: c.doctorReviewDesc },
    ]);
    setIsGenerating(false);
  }, [caseSymptoms, caseNotes, language]);

  // Use actual uploaded reports only (no fake dummy reports)
  const displayReports = Array.isArray(uploadedReports) ? uploadedReports : [];

  return (
    <div style={{ width: '100%' }}>
      {/* ── STEP 5 MAIN WRAPPER ── */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        marginBottom: '1.5rem'
      }}>
        {/* ── 1. TOP 3-COLUMN QUICK BOOKING INFO STRIP ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}>
          {/* Card 1: Date */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#e6f7ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}>
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {c.date}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
                {formattedDate.main}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                {formattedDate.day}
              </div>
            </div>
          </div>

          {/* Card 2: Time */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#e6f7ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {c.time}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
                {selectedSlot}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                ({c.mins})
              </div>
            </div>
          </div>

          {/* Card 3: Consultation Type */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            padding: '1.15rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#e6f7ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}>
              <ClipboardList size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {c.type}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '1px' }}>
                {c.general}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                {c.opd}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. TWO SIDE-BY-SIDE CARDS: CASE SUMMARY & UPLOADED REPORTS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          {/* LEFT CARD: YOUR CASE SUMMARY (AI-GENERATED POINTS WITH CAUSE ANALYSIS) */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
          }}>
            <div>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#059669" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                    {c.summary}
                  </h3>
                </div>

                <button
                  onClick={onEditCase}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#059669',
                    border: '1px solid #059669',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit size={13} />
                  <span>{c.edit}</span>
                </button>
              </div>

              {/* AI Synthesized Points with Cause & Verification Details */}
              <div style={{ minHeight: '140px' }}>
                {isGenerating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', padding: '2rem 0', justifyContent: 'center' }}>
                    <Loader2 size={20} className="animate-spin" />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{c.summary}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(isExpanded ? aiPoints : aiPoints.slice(0, 4)).map((point, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          backgroundColor: idx === 3 ? '#f0fdf4' : '#f8fafc',
                          border: idx === 3 ? '1px solid #bbf7d0' : '1px solid #f1f5f9'
                        }}
                      >
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: idx === 3 ? '#16a34a' : '#059669',
                          marginTop: '6px',
                          flexShrink: 0
                        }} />
                        <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                          <span style={{
                            fontWeight: '800',
                            color: idx === 3 ? '#15803d' : '#0f172a',
                            marginRight: '6px'
                          }}>
                            {point.title}:
                          </span>
                          <span style={{ color: '#334155', fontWeight: '450' }}>
                            {point.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* View More / Less Toggle */}
            {aiPoints.length > 4 && (
              <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #f8fafc', marginTop: '8px' }}>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#059669',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{isExpanded ? 'View Less' : `View More (${aiPoints.length - 4} more)`}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT CARD: UPLOADED REPORTS */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
          }}>
            <div>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#0f172a" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                    {c.reports} ({displayReports.length})
                  </h3>
                </div>

                <button
                  onClick={onEditReports}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#059669',
                    border: '1px solid #059669',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit size={13} />
                  <span>{c.edit}</span>
                </button>
              </div>

              {/* Reports List */}
              {displayReports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {displayReports.map((report) => (
                    <div
                      key={report.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                        {/* Icon */}
                        {report.type === 'pdf' ? (
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: '1.5px solid #ef4444',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: '900',
                            flexShrink: 0
                          }}>
                            PDF
                          </div>
                        ) : (
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: '1.5px solid #3b82f6',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <ImageIcon size={18} />
                          </div>
                        )}

                        {/* Name and Meta */}
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {report.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {c.uploaded} {report.uploadedAt || formattedDate.main} &nbsp;•&nbsp; {report.size || ''}
                          </div>
                        </div>
                      </div>

                      {/* Green Checkmark Circle */}
                      <div style={{ flexShrink: 0 }}>
                        <CheckCircle2 size={20} color="#059669" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  borderRadius: '14px',
                  border: '1.5px dashed #cbd5e1',
                  color: '#64748b'
                }}>
                  <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>
                    {c.none}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                    {c.optional}
                  </div>
                </div>
              )}
            </div>

            {/* Upload More Reports Button */}
            <div style={{ marginTop: '1.25rem' }}>
              <button
                onClick={onEditReports}
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  color: '#059669',
                  border: '1.5px solid #059669',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={16} />
                <span>{c.uploadMore}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. IMPORTANT NOTE BANNER ── */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '12px 18px',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.85rem'
        }}>
          <ShieldCheck size={18} color="#059669" />
          <div>
            <span style={{ fontWeight: '800', color: '#059669', marginRight: '8px' }}>
              {c.important}
            </span>
            <span style={{ color: '#475569', fontWeight: '500' }}>
              {c.secure}
            </span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAVIGATION ROW ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1rem'
      }}>
        <button
          onClick={onPrevious}
          data-voice-action="back"
          style={{
            backgroundColor: '#ffffff',
            color: '#059669',
            border: '1.5px solid #059669',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={18} />
          <span>{c.editDetails}</span>
        </button>

        <button
          onClick={onConfirm}
          data-voice-action="confirm"
          style={{
            backgroundColor: '#059669',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 32px',
            fontSize: '0.95rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{c.confirm}</span>
        </button>
      </div>
    </div>
  );
}
