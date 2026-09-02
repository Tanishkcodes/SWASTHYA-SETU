/* =========================================================================
   SWASTHYA SETU — Clinical Anamnesis & Adaptive AI Consultation Chat
   - 100% Visual Chat Matching User's Design
   - AI-selected, variable touch options plus speech and free text
   - Clinically adaptive reasoning for any complaint, specialty and care system
   - Real-time Sync with Doctor Appointment Case File
   ========================================================================= */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Mic, MicOff, Bot, User, CheckCircle2,
  RotateCcw, ArrowRight, ArrowLeft, Stethoscope, Leaf
} from 'lucide-react';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import voiceAIService from '../voicenav/VoiceAIService';

// ── Custom SVG Icons for Initial Problem Selection ──
function ThermometerIcon({ size = 46, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-20deg)' }}>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      <path d="M11.5 6h2" />
      <path d="M11.5 9h2" />
      <path d="M11.5 12h2" />
    </svg>
  );
}

function HeadacheIcon({ size = 46, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 19a7 7 0 0 1-7-7c0-2 .8-3.9 2.2-5.3A7 7 0 0 1 18 5v1" />
      <path d="M9 12a4 4 0 0 0 4 4h1" />
      <path d="M5 4l2 2" />
      <path d="M2 9h3" />
      <path d="M5 14l2-2" />
      <path d="M8 3v3" />
      <path d="M13 18v3" />
      <path d="M16 21h4" />
    </svg>
  );
}

function StomachIcon({ size = 46, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3v4c0 1.5-1 2.5-2.5 3S7 11.5 7 14.5c0 3.5 3 6.5 7 6.5 3.5 0 6-2.5 6-6 0-3.5-2-5.5-3.5-7l.5-5" />
    </svg>
  );
}

function CoughIcon({ size = 46, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 19a6 6 0 0 0-6-6H8a4 4 0 0 1-4-4 6 6 0 0 1 12 0v2" />
      <path d="M17 11h4" />
      <path d="M18 14h4" />
      <path d="M17 17h3" />
    </svg>
  );
}

function BodyPainIcon({ size = 46, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3l-3 4-2-1-3 4 2 2-3 4 4 2 2-3 4 2 3-4-2-2z" />
      <path d="M11 9l-2 3 3 1-2 3" />
    </svg>
  );
}

// ── Specialized Question Option Card Icons ──
function TargetIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ChestRadiateIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21v-8a5 5 0 0 1 10 0v8" />
      <path d="M12 3v4" />
      <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      <path d="M9 9l-2-2" />
      <path d="M15 9l2-2" />
    </svg>
  );
}

function BackSpineIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21v-7a5 5 0 0 1 10 0v7" />
      <path d="M12 5v14" />
      <circle cx="12" cy="15" r="2" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function ShoulderJointIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 21v-6a6 6 0 0 1 12 0v6" />
      <circle cx="15" cy="12" r="3" />
      <path d="M15 9l2-2" />
      <path d="M18 12h2" />
    </svg>
  );
}

function QuestionPersonIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M19 8c.5-.7 1.5-.7 2 0 .5.7 0 1.5-.5 2l-.5.5v.5" />
      <circle cx="20" cy="13" r="0.5" fill={color} />
    </svg>
  );
}

function ClockIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function FlameIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
    </svg>
  );
}

function PillIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function MoonIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function WindIcon({ size = 42, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

// ── Initial 5 Problem Tiles ──
const INITIAL_PROBLEMS = [
  { id: 'fever', icon: ThermometerIcon },
  { id: 'headache', icon: HeadacheIcon },
  { id: 'stomach', icon: StomachIcon },
  { id: 'cough', icon: CoughIcon },
  { id: 'bodypain', icon: BodyPainIcon },
];

const CHAT_COPY = {
  en:{title:'What problem are you having?',subtitle:'Select all that apply, or speak/type in your own words.',fever:'Fever',headache:'Headache',stomach:'Stomach pain',cough:'Cough / cold',bodypain:'Body pain',symptomPlaceholder:'Type your symptoms or details (optional)',answerPlaceholder:'You can also speak or type your answer…',speakSymptoms:'Speak your symptoms',speakAnswer:'Speak your answer',change:'Change problem',firstQuestion:'What problem are you having today?',patientHas:'I have {disease}.',complete:'Thank you. I have prepared your clinical briefing for {doctor}. You can now upload previous reports or continue the appointment.',proceed:'Proceed to upload reports',previous:'Previous: select time',next:'Next: upload reports'},
  hi:{title:'आपको क्या समस्या हो रही है?',subtitle:'लागू सभी विकल्प चुनें, या अपनी भाषा में बोलें/लिखें।',fever:'बुखार',headache:'सिरदर्द',stomach:'पेट दर्द',cough:'खांसी / जुकाम',bodypain:'शरीर में दर्द',symptomPlaceholder:'अपने लक्षण या विवरण लिखें (वैकल्पिक)',answerPlaceholder:'आप अपना उत्तर बोल या लिख भी सकते हैं…',speakSymptoms:'अपने लक्षण बोलें',speakAnswer:'अपना उत्तर बोलें',change:'समस्या बदलें',firstQuestion:'आज आपको क्या समस्या हो रही है?',patientHas:'मुझे {disease} है।',complete:'धन्यवाद। मैंने {doctor} के लिए आपकी क्लिनिकल जानकारी तैयार कर दी है। अब आप पिछली रिपोर्ट अपलोड कर सकते हैं या अपॉइंटमेंट जारी रख सकते हैं।',proceed:'रिपोर्ट अपलोड करने के लिए आगे बढ़ें',previous:'पिछला: समय चुनें',next:'अगला: रिपोर्ट अपलोड करें'},
  ta:{title:'உங்களுக்கு என்ன பிரச்சினை?',subtitle:'பொருந்தும் அனைத்தையும் தேர்ந்தெடுக்கவும் அல்லது உங்கள் சொற்களில் பேசவும்/தட்டச்சு செய்யவும்.',fever:'காய்ச்சல்',headache:'தலைவலி',stomach:'வயிற்று வலி',cough:'இருமல் / சளி',bodypain:'உடல் வலி',symptomPlaceholder:'அறிகுறிகள் அல்லது விவரங்களை உள்ளிடவும் (விருப்பம்)',answerPlaceholder:'பதிலை பேசலாம் அல்லது தட்டச்சு செய்யலாம்…',speakSymptoms:'அறிகுறிகளை பேசுங்கள்',speakAnswer:'பதிலை பேசுங்கள்',change:'பிரச்சினையை மாற்று',firstQuestion:'இன்று உங்களுக்கு என்ன பிரச்சினை?',patientHas:'எனக்கு {disease} உள்ளது.',complete:'நன்றி. {doctor} க்கான மருத்துவ குறிப்பைத் தயாரித்துள்ளேன். இப்போது பழைய அறிக்கைகளைப் பதிவேற்றலாம் அல்லது முன்பதிவைத் தொடரலாம்.',proceed:'அறிக்கைகளைப் பதிவேற்ற தொடரவும்',previous:'முந்தையது: நேரத்தைத் தேர்ந்தெடு',next:'அடுத்து: அறிக்கைகளைப் பதிவேற்று'},
  te:{title:'మీకు ఏ సమస్య ఉంది?',subtitle:'వర్తించే అన్నింటినీ ఎంచుకోండి లేదా మీ మాటల్లో చెప్పండి/టైప్ చేయండి.',fever:'జ్వరం',headache:'తలనొప్పి',stomach:'కడుపు నొప్పి',cough:'దగ్గు / జలుబు',bodypain:'శరీర నొప్పి',symptomPlaceholder:'లక్షణాలు లేదా వివరాలు టైప్ చేయండి (ఐచ్ఛికం)',answerPlaceholder:'మీ సమాధానాన్ని చెప్పవచ్చు లేదా టైప్ చేయవచ్చు…',speakSymptoms:'లక్షణాలను చెప్పండి',speakAnswer:'సమాధానం చెప్పండి',change:'సమస్యను మార్చండి',firstQuestion:'ఈరోజు మీకు ఏ సమస్య ఉంది?',patientHas:'నాకు {disease} ఉంది.',complete:'ధన్యవాదాలు. {doctor} కోసం మీ క్లినికల్ వివరాలను సిద్ధం చేశాను. ఇప్పుడు పాత నివేదికలను అప్‌లోడ్ చేయండి లేదా అపాయింట్‌మెంట్ కొనసాగించండి.',proceed:'నివేదికలు అప్‌లోడ్ చేయడానికి కొనసాగండి',previous:'మునుపటి: సమయం ఎంచుకోండి',next:'తర్వాత: నివేదికలు అప్‌లోడ్ చేయండి'},
  bn:{title:'আপনার কী সমস্যা হচ্ছে?',subtitle:'প্রযোজ্য সব নির্বাচন করুন, অথবা নিজের ভাষায় বলুন/লিখুন।',fever:'জ্বর',headache:'মাথাব্যথা',stomach:'পেট ব্যথা',cough:'কাশি / সর্দি',bodypain:'শরীর ব্যথা',symptomPlaceholder:'লক্ষণ বা বিস্তারিত লিখুন (ঐচ্ছিক)',answerPlaceholder:'উত্তর বলতেও বা লিখতেও পারেন…',speakSymptoms:'লক্ষণ বলুন',speakAnswer:'উত্তর বলুন',change:'সমস্যা পরিবর্তন করুন',firstQuestion:'আজ আপনার কী সমস্যা হচ্ছে?',patientHas:'আমার {disease} হয়েছে।',complete:'ধন্যবাদ। {doctor}-এর জন্য আপনার ক্লিনিক্যাল তথ্য প্রস্তুত করেছি। এখন আগের রিপোর্ট আপলোড করুন বা অ্যাপয়েন্টমেন্ট চালিয়ে যান।',proceed:'রিপোর্ট আপলোড করতে এগিয়ে যান',previous:'আগের: সময় নির্বাচন',next:'পরবর্তী: রিপোর্ট আপলোড'},
  mr:{title:'तुम्हाला काय त्रास होत आहे?',subtitle:'लागू असलेले सर्व पर्याय निवडा किंवा तुमच्या शब्दांत बोला/लिहा.',fever:'ताप',headache:'डोकेदुखी',stomach:'पोटदुखी',cough:'खोकला / सर्दी',bodypain:'अंगदुखी',symptomPlaceholder:'लक्षणे किंवा तपशील लिहा (ऐच्छिक)',answerPlaceholder:'उत्तर बोलू किंवा लिहू शकता…',speakSymptoms:'लक्षणे सांगा',speakAnswer:'उत्तर सांगा',change:'समस्या बदला',firstQuestion:'आज तुम्हाला काय त्रास होत आहे?',patientHas:'मला {disease} आहे.',complete:'धन्यवाद. {doctor} साठी तुमची क्लिनिकल माहिती तयार केली आहे. आता जुने अहवाल अपलोड करा किंवा अपॉइंटमेंट पुढे सुरू ठेवा.',proceed:'अहवाल अपलोड करण्यासाठी पुढे जा',previous:'मागील: वेळ निवडा',next:'पुढील: अहवाल अपलोड करा'},
  gu:{title:'તમને શું તકલીફ છે?',subtitle:'લાગુ પડતા બધા વિકલ્પ પસંદ કરો અથવા તમારા શબ્દોમાં બોલો/લખો.',fever:'તાવ',headache:'માથાનો દુખાવો',stomach:'પેટનો દુખાવો',cough:'ઉધરસ / શરદી',bodypain:'શરીરનો દુખાવો',symptomPlaceholder:'લક્ષણો અથવા વિગતો લખો (વૈકલ્પિક)',answerPlaceholder:'જવાબ બોલી અથવા લખી પણ શકો છો…',speakSymptoms:'લક્ષણો બોલો',speakAnswer:'જવાબ બોલો',change:'સમस्या બદલો',firstQuestion:'આજે તમને શું તકલીફ છે?',patientHas:'મને {disease} છે.',complete:'આભાર. {doctor} માટે તમારી ક્લિનિકલ માહિતી તૈયાર કરી છે. હવે જૂના રિપોર્ટ અપલોડ કરો અથવા અપોઇન્ટમેન્ટ ચાલુ રાખો.',proceed:'રિપોર્ટ અપલોડ કરવા આગળ વધો',previous:'પાછળ: સમય પસંદ કરો',next:'આગળ: રિપોર્ટ અપલોડ કરો'},
  kn:{title:'ನಿಮಗೆ ಯಾವ ಸಮಸ್ಯೆ ಇದೆ?',subtitle:'ಅನ್ವಯಿಸುವ ಎಲ್ಲವನ್ನೂ ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ನಿಮ್ಮ ಮಾತಿನಲ್ಲಿ ಹೇಳಿ/ಟೈಪ್ ಮಾಡಿ.',fever:'ಜ್ವರ',headache:'ತಲೆನೋವು',stomach:'ಹೊಟ್ಟೆ ನೋವು',cough:'ಕೆಮ್ಮು / ಶೀತ',bodypain:'ದೇಹ ನೋವು',symptomPlaceholder:'ಲಕ್ಷಣಗಳು ಅಥವಾ ವಿವರಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ (ಐಚ್ಛಿಕ)',answerPlaceholder:'ಉತ್ತರವನ್ನು ಹೇಳಬಹುದು ಅಥವಾ ಟೈಪ್ ಮಾಡಬಹುದು…',speakSymptoms:'ಲಕ್ಷಣಗಳನ್ನು ಹೇಳಿ',speakAnswer:'ಉತ್ತರ ಹೇಳಿ',change:'ಸಮಸ್ಯೆ ಬದಲಿಸಿ',firstQuestion:'ಇಂದು ನಿಮಗೆ ಯಾವ ಸಮಸ್ಯೆ ಇದೆ?',patientHas:'ನನಗೆ {disease} ಇದೆ.',complete:'ಧನ್ಯವಾದಗಳು. {doctor} ಗಾಗಿ ನಿಮ್ಮ ಕ್ಲಿನಿಕಲ್ ವಿವರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. ಈಗ ಹಳೆಯ ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಮುಂದುವರಿಸಿ.',proceed:'ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಮುಂದುವರಿಸಿ',previous:'ಹಿಂದೆ: ಸಮಯ ಆಯ್ಕೆ',next:'ಮುಂದೆ: ವರದಿ ಅಪ್‌ಲೋಡ್'},
  ml:{title:'നിങ്ങൾക്ക് എന്ത് പ്രശ്നമാണ്?',subtitle:'ബാധകമായ എല്ലാം തിരഞ്ഞെടുക്കുക, അല്ലെങ്കിൽ സ്വന്തം വാക്കുകളിൽ പറയുക/ടൈപ്പ് ചെയ്യുക.',fever:'പനി',headache:'തലവേദന',stomach:'വയറുവേദന',cough:'ചുമ / ജലദോഷം',bodypain:'ശരീരവേദന',symptomPlaceholder:'ലക്ഷണങ്ങളോ വിവരങ്ങളോ ടൈപ്പ് ചെയ്യുക (ഐച്ഛികം)',answerPlaceholder:'ഉത്തരം പറയുകയോ ടൈപ്പ് ചെയ്യുകയോ ചെയ്യാം…',speakSymptoms:'ലക്ഷണങ്ങൾ പറയുക',speakAnswer:'ഉത്തരം പറയുക',change:'പ്രശ്നം മാറ്റുക',firstQuestion:'ഇന്ന് നിങ്ങൾക്ക് എന്ത് പ്രശ്നമാണ്?',patientHas:'എനിക്ക് {disease} ഉണ്ട്.',complete:'നന്ദി. {doctor} നുള്ള ക്ലിനിക്കൽ വിവരങ്ങൾ തയ്യാറാക്കി. ഇനി പഴയ റിപ്പോർട്ടുകൾ അപ്‌ലോഡ് ചെയ്യുകയോ അപ്പോയിന്റ്മെന്റ് തുടരുകയോ ചെയ്യാം.',proceed:'റിപ്പോർട്ടുകൾ അപ്‌ലോഡ് ചെയ്യാൻ തുടരുക',previous:'മുമ്പ്: സമയം തിരഞ്ഞെടുക്കുക',next:'അടുത്തത്: റിപ്പോർട്ട് അപ്‌ലോഡ്'}
};

const AI_STATUS_COPY = {
  en: { unavailable: 'The clinical AI could not load. Check the connection and try again.', retry: 'Retry AI' },
  hi: { unavailable: 'क्लिनिकल AI लोड नहीं हो सका। कनेक्शन जाँचकर फिर प्रयास करें।', retry: 'AI फिर चलाएँ' },
  ta: { unavailable: 'மருத்துவ AI ஏற்றப்படவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும்.', retry: 'AI-ஐ மீண்டும் முயலவும்' },
  te: { unavailable: 'క్లినికల్ AI లోడ్ కాలేదు. కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.', retry: 'AIని మళ్లీ ప్రయత్నించండి' },
  bn: { unavailable: 'ক্লিনিক্যাল AI লোড হয়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', retry: 'AI আবার চেষ্টা করুন' },
  mr: { unavailable: 'क्लिनिकल AI लोड झाले नाही. कनेक्शन तपासून पुन्हा प्रयत्न करा.', retry: 'AI पुन्हा वापरा' },
  gu: { unavailable: 'ક્લિનિકલ AI લોડ થઈ શક્યું નથી. કનેક્શન તપાસીને ફરી પ્રયાસ કરો.', retry: 'AI ફરી અજમાવો' },
  kn: { unavailable: 'ಕ್ಲಿನಿಕಲ್ AI ಲೋಡ್ ಆಗಲಿಲ್ಲ. ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', retry: 'AI ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' },
  ml: { unavailable: 'ക്ലിനിക്കൽ AI ലോഡ് ചെയ്യാനായില്ല. കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.', retry: 'AI വീണ്ടും ശ്രമിക്കുക' },
};

export default function ClinicalAnamnesisChat({
  doctor = {},
  hospital = {},
  patient = {},
  initialSymptoms = [],
  initialNotes = '',
  onUpdateCaseDetails = () => {},
  onPrevious = () => {},
  onNext = () => {},
  language = 'en'
}) {
  const { isListening, toggleListening, setOnTranscript, clearOnTranscript } = useVoiceNav();
  const languageCode = CHAT_COPY[language] ? language : 'en';
  const c = CHAT_COPY[languageCode];
  const aiCopy = AI_STATUS_COPY[languageCode];
  
  // Determine if Doctor is Ayurvedic / AYUSH vs Allopathic
  const docName = String(doctor?.name || '').toLowerCase();
  const docSpec = String(doctor?.specialty || doctor?.speciality || '').toLowerCase();
  const docDeg = String(doctor?.degrees || '').toLowerCase();
  const docSys = String(doctor?.careSystem || doctor?.system || '').toLowerCase();
  const hospName = String(hospital?.name || '').toLowerCase();
  const hospType = String(hospital?.type || '').toUpperCase();

  const isAyurvedic = Boolean(
    docSpec.includes('ayurved') ||
    docSpec.includes('ayush') ||
    docSpec.includes('panchakarma') ||
    docSpec.includes('kayachikitsa') ||
    docSpec.includes('shalyatantra') ||
    docDeg.includes('bams') ||
    docDeg.includes('ayurved') ||
    docDeg.includes('ayush') ||
    docDeg.includes('panchakarma') ||
    docDeg.includes('vaidya') ||
    docName.includes('vaidya') ||
    docName.includes('krishnamurthy') ||
    docSys.includes('ayurved') ||
    docSys.includes('ayush') ||
    hospType === 'AYUSH' ||
    Boolean(hospital?.isAyush) ||
    hospName.includes('ayurved') ||
    hospName.includes('ayush')
  );

  const safeSymptoms = Array.isArray(initialSymptoms) ? initialSymptoms : [];
  const safeNotes = typeof initialNotes === 'string' ? initialNotes : '';

  const [selectedCards, setSelectedCards] = useState(safeSymptoms);
  const [chatStarted, setChatStarted] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStepData, setCurrentStepData] = useState(null);
  const [starterStep, setStarterStep] = useState(null);
  const [multiSelections, setMultiSelections] = useState([]);
  const [aiError, setAiError] = useState('');
  const [aiRetryToken, setAiRetryToken] = useState(0);

  const [caseSummary, setCaseSummary] = useState({
    chiefComplaints: safeSymptoms,
    location: '',
    spread: '',
    duration: '',
    severity: '',
    nature: '',
    triggers: '',
    associatedSymptoms: '',
    redFlags: '',
    // ── Complete Classical Dashavidha Pariksha (दशविध परीक्षा) ──
    prakriti: '',       // 1. Doshic Constitution
    vikriti: '',        // 2. Pathological Imbalance
    sara: '',           // 3. Tissue / Dhatu Excellence
    samhanana: '',      // 4. Body Compactness & Symmetry
    pramana: '',        // 5. Anthropometric Proportions
    satmya: '',         // 6. Habituation & Diet Compatibility
    satva: '',          // 7. Mental Fortitude & Sleep (Nidra)
    aharaShakti: '',    // 8. Food Intake Capacity & Agni
    vyayamaShakti: '',  // 9. Physical Capacity & Energy
    vaya: '',           // 10. Age Stage & Chronological Status
    medications: '',
    notes: safeNotes
  });

  const chatBottomRef = useRef(null);
  const answerRequestInFlightRef = useRef(false);

  useEffect(() => {
    if (chatStarted && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, chatStarted]);

  const prevLanguageRef = useRef(languageCode);
  const currentStepDataRef = useRef(currentStepData);
  currentStepDataRef.current = currentStepData;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Dynamically translate active chat history, current question, and options when header language changes
  useEffect(() => {
    if (prevLanguageRef.current === languageCode) return;
    prevLanguageRef.current = languageCode;

    if (!chatStarted) return;

    let isMounted = true;

    const translateSession = async () => {
      try {
        const activeMessages = messagesRef.current || [];
        const activeStepData = currentStepDataRef.current;

        // 1. Translate all messages in chat history in one fast batch
        if (activeMessages.length > 0) {
          const msgTexts = activeMessages.map(m => m.text || '');
          const { translations } = await voiceAIService.batchTranslate(msgTexts, languageCode);
          if (isMounted && Array.isArray(translations) && translations.length > 0) {
            setMessages(activeMessages.map((m, idx) => ({ ...m, text: translations[idx] || m.text })));
          }
        }

        // 2. Translate current question and option cards in one fast batch
        if (activeStepData && activeStepData.step) {
          const step = activeStepData.step;
          const optionsList = step.options || [];
          const rawTexts = [step.question || '', ...optionsList.map(o => o.text || '')];

          const { translations } = await voiceAIService.batchTranslate(rawTexts, languageCode);
          if (isMounted && Array.isArray(translations) && translations.length > 0) {
            const translatedQ = translations[0] || step.question;
            const translatedOpts = optionsList.map((opt, idx) => ({
              ...opt,
              text: translations[idx + 1] || opt.text
            }));

            setCurrentStepData(prev => {
              if (!prev || !prev.step) return prev;
              return {
                ...prev,
                step: {
                  ...prev.step,
                  question: translatedQ,
                  options: translatedOpts
                }
              };
            });

            // Narrate translated question in the newly selected language
            if (translatedQ) {
              import('../voicenav/AudioPromptManager').then(module => {
                module.default.setLanguage(languageCode, false);
                module.default.interruptWith(translatedQ, languageCode);
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn('Interactive question translation on language switch failed:', err);
      }
    };

    translateSession();

    return () => { isMounted = false; };
  }, [languageCode, chatStarted]);

  // Voice output for AI messages in the active language
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'ai' && lastMsg.text) {
        import('../voicenav/AudioPromptManager').then(module => {
          module.default.setLanguage(languageCode, false);
          module.default.interruptWith(lastMsg.text, languageCode);
        }).catch(err => console.error('Failed to load AudioPromptManager', err));
      }
    }
  }, [messages, languageCode]);

  // Sync to parent without infinite loops
  const syncToParent = (updatedSummary) => {
    const s = updatedSummary || caseSummary;
    const complaints = Array.isArray(s.chiefComplaints) ? s.chiefComplaints : [];
    
    // Formatting Doctor Case Sheet (Ayurvedic Dashavidha vs Allopathic SOCRATES)
    const formattedNotes = isAyurvedic ? [
      complaints.length ? `• मुख्य लक्षण (Chief Complaints): ${complaints.join(', ')}` : '',
      s.vikriti ? `• १. विकृति (Current Imbalance): ${s.vikriti}` : '',
      s.prakriti ? `• २. प्रकृति (Natural Doshic Type): ${s.prakriti}` : '',
      s.aharaShakti ? `• ३. आहार शक्ति एवं अग्नि (Intake & Agni): ${s.aharaShakti}` : '',
      s.satva ? `• ४. सत्त्व एवं मानस (Mental Strength & Sleep): ${s.satva}` : '',
      s.vyayamaShakti ? `• ५. व्यायाम शक्ति एवं बल (Physical Capacity): ${s.vyayamaShakti}` : '',
      s.sara ? `• ६. धातु सार (Tissue Excellence): ${s.sara}` : '',
      s.samhanana ? `• ७. संहनन (Body Compactness): ${s.samhanana}` : '',
      s.satmya ? `• ८. सात्म्य एवं देश (Dietary Habituation): ${s.satmya}` : '',
      s.pramana ? `• ९. प्रमाण (Body Proportions): ${s.pramana}` : '',
      s.vaya ? `• १०. वय (Age Stage): ${s.vaya}` : '',
      s.location ? `• स्थान (Location): ${s.location}` : '',
      s.duration ? `• काल (Duration): ${s.duration}` : '',
      s.medications ? `• पूर्व औषधि (Prior Medications): ${s.medications}` : '',
      s.notes ? `• रोगी कथन (Patient Notes): ${s.notes}` : ''
    ].filter(Boolean).join('\n') : [
      complaints.length ? `• Chief Complaints: ${complaints.join(', ')}` : '',
      s.location ? `• Location / Site: ${s.location}` : '',
      s.spread ? `• Radiation / Spread: ${s.spread}` : '',
      s.duration ? `• Duration / Onset: ${s.duration}` : '',
      s.severity ? `• Severity: ${s.severity}` : '',
      s.nature ? `• Nature / Character: ${s.nature}` : '',
      s.triggers ? `• Exacerbating / Relieving Factors: ${s.triggers}` : '',
      s.associatedSymptoms ? `• Associated Symptoms: ${s.associatedSymptoms}` : '',
      s.redFlags ? `• Red Flags / Warning Signs: ${s.redFlags}` : '',
      s.medications ? `• Prior Medication / History: ${s.medications}` : '',
      s.notes ? `• Patient Statement: ${s.notes}` : ''
    ].filter(Boolean).join('\n');

    onUpdateCaseDetails?.({
      symptoms: complaints,
      notes: formattedNotes || s.notes || ''
    });
  };

  // ── DYNAMIC COMPLAINT-AWARE ADAPTIVE CLINICAL SYNTHESIZER ──
  // When Gemini has a temporary delay, dynamically synthesizes a complaint-specific
  // question using the patient's exact stated disease and language. Gemini immediately
  // takes over on the next step.
  const generateAdaptiveClinicalStep = async (diseaseName, stepIndex = 0) => {
    const isAyur = isAyurvedic;
    const disease = diseaseName || 'health complaint';

    const templates = isAyur ? [
      {
        q: `कृपया बताएं कि आपको ${disease} की यह समस्या कब से है और आपके खान-पान या पाचन (Agni) में क्या बदलाव आया है?`,
        qEn: `How long have you been experiencing this ${disease}, and how has your appetite / digestion (Agni) been affected?`,
        field: 'duration',
        options: [
          { text: "Started recently (1 to 3 days ago)", icon: ClockIcon },
          { text: "1 to 2 weeks, gradually worsening", icon: ClockIcon },
          { text: "Chronic issue for over a month", icon: ClockIcon },
          { text: "Comes and goes periodically", icon: MoonIcon }
        ]
      },
      {
        q: `इस ${disease} के दौरान आपकी शारीरिक ऊर्जा, नींद (Nidra) और सहनशक्ति कैसी है?`,
        qEn: `During this ${disease}, how is your physical stamina, energy, and sleep pattern (Nidra)?`,
        field: 'vikriti',
        options: [
          { text: "Normal energy with undisturbed sleep", icon: TargetIcon },
          { text: "Restless sleep and low stamina", icon: MoonIcon },
          { text: "Severe lethargy and heaviness in body", icon: BodyPainIcon },
          { text: "Disturbed by stress and anxiety", icon: WindIcon }
        ]
      },
      {
        q: `क्या ठंडे, गर्म या मसालेदार आहार से इस ${disease} में बदलाव आता है (Satmya)?`,
        qEn: `Do cold, hot, dry, or spicy foods/climates worsen or relieve this ${disease} (Satmya)?`,
        field: 'triggers',
        options: [
          { text: "Aggravated by cold food or cold weather", icon: WindIcon },
          { text: "Aggravated by spicy, oily, or fried foods", icon: FlameIcon },
          { text: "Relieved by warm, freshly cooked foods", icon: Leaf },
          { text: "No clear dietary trigger noticed", icon: TargetIcon }
        ]
      }
    ] : [
      {
        q: `Could you describe when this ${disease} first started and how it has developed over time?`,
        field: 'duration',
        options: [
          { text: "Started recently (< 24 to 48 hours ago)", icon: ClockIcon },
          { text: "Started 1 to 2 weeks ago, gradually worsening", icon: ClockIcon },
          { text: "Chronic issue persisting over 3-4 weeks", icon: ClockIcon },
          { text: "Recurrent episodes that come and go", icon: MoonIcon }
        ]
      },
      {
        q: `Where is this ${disease} predominantly felt, and does the sensation spread or radiate anywhere?`,
        field: 'location',
        options: [
          { text: "Localized strictly to one specific area", icon: TargetIcon },
          { text: "Radiates or spreads to surrounding areas", icon: ChestRadiateIcon },
          { text: "Generalized discomfort across the body", icon: BodyPainIcon },
          { text: "Shifts from one place to another", icon: WindIcon }
        ]
      },
      {
        q: `How would you describe the severity of this ${disease} and its impact on your normal activities?`,
        field: 'severity',
        options: [
          { text: "Mild — manageable with normal daily routine", icon: TargetIcon },
          { text: "Moderate — bothersome, affects sleep or work", icon: MoonIcon },
          { text: "Severe — painful, significantly limiting activity", icon: FlameIcon },
          { text: "Severe episodes with sudden spikes", icon: ChestRadiateIcon }
        ]
      },
      {
        q: `Have you taken any medications or treatments for this ${disease} so far?`,
        field: 'medications',
        options: [
          { text: "Took over-the-counter medicine with temporary relief", icon: PillIcon },
          { text: "Took home remedies / herbal solutions", icon: Leaf },
          { text: "Took previously prescribed medicines", icon: PillIcon },
          { text: "Have not taken any medications yet", icon: TargetIcon }
        ]
      }
    ];

    const template = templates[Math.min(stepIndex, templates.length - 1)];
    let question = template.q;
    let options = template.options;

    // Auto-translate question and options to selected languageCode if non-English
    if (languageCode !== 'en') {
      try {
        const rawTexts = [template.qEn || template.q, ...options.map(o => o.text)];
        const { translations } = await voiceAIService.batchTranslate(rawTexts, languageCode);
        if (translations && translations.length === rawTexts.length) {
          question = translations[0];
          options = options.map((o, idx) => ({ ...o, text: translations[idx + 1] || o.text }));
        }
      } catch (e) {
        console.warn('Fallback dynamic synthesis notice:', e);
      }
    }

    return {
      question,
      options,
      responseType: 'single_choice',
      field: template.field,
      isFinished: false
    };
  };

  // ── DYNAMIC AI QUESTION & OPTION GENERATOR (GEMINI + CLINICAL GRAPH) ──
  const fetchNextAiStep = async (disease, history, latestInput, phase = 'interview', summary = caseSummary) => {
    try {
      const questionCount = history.filter(item => item.sender === 'ai' && item.stepIndex !== undefined).length;
      const requestStep = (requireTouchOptions = false) => voiceAIService.anamnesis({
        disease, history, latestInput, language: languageCode,
        doctorName: doctor?.name || 'Attending Physician',
        doctorSpecialty: doctor?.specialty || doctor?.speciality || 'General Medicine',
        isAyurvedic, patient: { age: patient?.age || '', gender: patient?.gender || '' },
        caseSummary: summary, questionCount, phase, requireTouchOptions,
      });
      let parsed = await requestStep(false);
      let validOptions = Array.isArray(parsed?.options)
        ? parsed.options.filter(option => option && String(option.text || '').trim()).slice(0, 8)
        : [];
      // The structured schema normally guarantees cards. Retry only once when
      // Gemini returned a question without usable choices.
      if (!parsed?.isFinished && validOptions.length < 2) {
        parsed = await requestStep(true);
        validOptions = Array.isArray(parsed?.options)
          ? parsed.options.filter(option => option && String(option.text || '').trim()).slice(0, 8)
          : [];
      }
      if (parsed && (parsed.isFinished || String(parsed.question || '').trim())) {
        if (!parsed.isFinished && validOptions.length < 2) throw new Error('AI returned no usable touch options');
        const normalizedQuestion = String(parsed.question || '').toLocaleLowerCase(languageCode).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
        const alreadyAsked = !parsed.isFinished && history.some(message =>
          message.sender === 'ai' && normalizedQuestion &&
          String(message.text || '').toLocaleLowerCase(languageCode).replace(/[^\p{L}\p{N}]+/gu, ' ').trim() === normalizedQuestion
        );
        if (alreadyAsked) {
          return {
            question: '', responseType: 'free_text', options: [], field: 'notes', isFinished: true,
            completionMessage: c.complete.replace('{doctor}', doctor?.name || 'the doctor'), caseSummaryUpdate: {}
          };
        }
        setAiError('');
        let resolvedQuestion = String(parsed.question || '').trim();
        let resolvedOptions = validOptions.map(option => ({ text: String(option.text).trim(), icon: getIconFromType(option.iconType) }));

        // Ensure all 9 Indian languages: if languageCode is non-English, auto-translate English options
        if (languageCode !== 'en' && resolvedOptions.some(o => /[a-zA-Z]{3,}/.test(o.text))) {
          try {
            const rawTexts = resolvedOptions.map(o => o.text);
            const { translations } = await voiceAIService.batchTranslate(rawTexts, languageCode);
            if (translations && translations.length === resolvedOptions.length) {
              resolvedOptions = resolvedOptions.map((o, idx) => ({ ...o, text: translations[idx] || o.text }));
            }
          } catch (e) {
            console.warn('Auto option translation notice:', e);
          }
        }

        // If question contains English words and target language is non-English, translate question too
        if (languageCode !== 'en' && /[a-zA-Z]{4,}/.test(resolvedQuestion)) {
          try {
            const resQ = await voiceAIService.translate(resolvedQuestion, languageCode);
            if (resQ?.text) resolvedQuestion = resQ.text;
          } catch (e) {}
        }

        return {
          question: resolvedQuestion,
          responseType: ['single_choice', 'multiple_choice', 'free_text', 'scale'].includes(parsed.responseType)
            ? parsed.responseType
            : (resolvedOptions.length ? 'single_choice' : 'free_text'),
          options: resolvedOptions,
          field: parsed.capturedField || 'notes',
          isFinished: Boolean(parsed.isFinished),
          completionMessage: parsed.completionMessage,
          caseSummaryUpdate: parsed.caseSummaryUpdate || {},
        };
      }
    } catch (err) {
      console.warn('Protected clinical AI dynamic query error.', err);
      setAiError(err instanceof Error ? err.message : 'Clinical AI unavailable');
    }
    return null;
  };

  const getIconFromType = (iconType) => {
    switch (iconType) {
      case 'target': return TargetIcon;
      case 'chest': return ChestRadiateIcon;
      case 'back': return BackSpineIcon;
      case 'shoulder': return ShoulderJointIcon;
      case 'clock': return ClockIcon;
      case 'flame': return FlameIcon;
      case 'pill': return PillIcon;
      case 'moon': return MoonIcon;
      case 'wind': return WindIcon;
      case 'thermometer': return ThermometerIcon;
      case 'stomach': return StomachIcon;
      case 'headache': return HeadacheIcon;
      case 'cough': return CoughIcon;
      case 'bodypain': return BodyPainIcon;
      case 'leaf': return Leaf;
      default: return QuestionPersonIcon;
    }
  };

  // Gemini proposes the opening complaint tiles from the selected doctor and
  // patient context. The familiar generic set is used only if AI is offline.
  useEffect(() => {
    let cancelled = false;
    setStarterStep(null);
    fetchNextAiStep('', [], '', 'chief_complaint').then(step => {
      if (!cancelled) setStarterStep(step);
    });
    return () => { cancelled = true; };
  }, [doctor?.id, doctor?.name, doctor?.specialty, doctor?.speciality, isAyurvedic, patient?.age, patient?.gender, languageCode, aiRetryToken]);

  // Start the interactive chat (100% AI Driven for ANY disease entered)
  const startConsultationChat = async (symptomList, customText = '') => {
    if (answerRequestInFlightRef.current) return;
    answerRequestInFlightRef.current = true;
    setChatStarted(true);
    setMultiSelections([]);
    const diseaseName = customText ? customText.trim() : (Array.isArray(symptomList) && symptomList.length ? symptomList[symptomList.length - 1] : 'General Discomfort');
    const symptoms = [diseaseName];
    setSelectedCards([diseaseName]);

    const updatedSummary = {
      ...caseSummary,
      chiefComplaints: symptoms,
      notes: customText || caseSummary.notes
    };
    setCaseSummary(updatedSummary);
    syncToParent(updatedSummary);

    // Initial message history
    const initialMsgs = [
      { sender: 'ai', text: c.firstQuestion },
      { sender: 'user', text: customText ? customText : c.patientHas.replace('{disease}', diseaseName) }
    ];

    setIsTyping(true);
    setMessages(initialMsgs);

    // Dynamically generate question #1 via Gemini for this specific disease!
    const aiFirstStep = await fetchNextAiStep(diseaseName, initialMsgs, diseaseName, 'interview', updatedSummary);

    setIsTyping(false);
    answerRequestInFlightRef.current = false;
    const stepToUse = aiFirstStep || await generateAdaptiveClinicalStep(diseaseName, 0);

    if (stepToUse?.isFinished) {
      setMessages([...initialMsgs, {
        sender: 'ai',
        text: stepToUse.completionMessage || c.complete.replace('{doctor}', doctor?.name || 'the doctor'),
        isFinal: true
      }]);
      setCurrentStepData(null);
      return;
    }

    const firstAiMsg = {
      sender: 'ai',
      text: stepToUse.question,
      stepIndex: 0
    };

    setMessages([...initialMsgs, firstAiMsg]);
    setCurrentStepData({
      stepIndex: 0,
      step: stepToUse,
      disease: diseaseName,
      isAiDriven: true
    });
  };

  // Handle user selecting an option card or typing text (100% AI Dynamic Loop)
  const handleUserChoice = async (optionText) => {
    if (!optionText.trim() || answerRequestInFlightRef.current) return;
    answerRequestInFlightRef.current = true;

    const userMsg = { sender: 'user', text: optionText };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInputVal('');
    setMultiSelections([]);

    let answerSummary = caseSummary;
    if (currentStepData && currentStepData.step) {
      const field = currentStepData.step.field || 'notes';
      answerSummary = { ...caseSummary, [field]: optionText };
      setCaseSummary(answerSummary);
      syncToParent(answerSummary);
    }

    setIsTyping(true);

    const nextIdx = currentStepData ? currentStepData.stepIndex + 1 : 0;
    const disease = currentStepData?.disease || caseSummary.chiefComplaints.join(', ') || 'health condition';

    const safetyCeiling = isAyurvedic ? 12 : 8;
    if (nextIdx >= safetyCeiling) {
      setIsTyping(false);
      answerRequestInFlightRef.current = false;
      setMessages([...nextMsgs, {
        sender: 'ai', text: c.complete.replace('{doctor}', doctor?.name || 'the doctor'), isFinal: true
      }]);
      setCurrentStepData(null);
      return;
    }

    // Gemini dynamic clinical intelligence
    let nextStepObj = null;
    let isFinished = false;

    const dynamicAi = await fetchNextAiStep(disease, nextMsgs, optionText, 'interview', answerSummary);
    if (dynamicAi) {
      nextStepObj = dynamicAi;
      isFinished = Boolean(dynamicAi.isFinished);
      if (dynamicAi.caseSummaryUpdate && Object.keys(dynamicAi.caseSummaryUpdate).length) {
        const updated = { ...answerSummary, ...dynamicAi.caseSummaryUpdate };
        setCaseSummary(updated);
        syncToParent(updated);
      }
    } else {
      // Resilience fallback: generate adaptive clinical step specifically for this disease
      nextStepObj = await generateAdaptiveClinicalStep(disease, nextIdx);
    }

    setIsTyping(false);
    answerRequestInFlightRef.current = false;

    if (nextStepObj && !isFinished) {
      const nextAiMsg = {
        sender: 'ai',
        text: nextStepObj.question,
        stepIndex: nextIdx
      };
      setMessages([...nextMsgs, nextAiMsg]);
      setCurrentStepData({
        stepIndex: nextIdx,
        step: nextStepObj,
        disease,
        isAiDriven: true
      });
    } else {
      // Complete triage flow
      const finalAiMsg = {
        sender: 'ai',
        text: nextStepObj?.completionMessage || c.complete.replace('{doctor}', doctor?.name || 'the doctor'),
        isFinal: true
      };
      setMessages([...nextMsgs, finalAiMsg]);
      setCurrentStepData(null);
    }
  };

  const retryClinicalAi = async () => {
    if (!chatStarted) {
      setAiRetryToken(value => value + 1);
      return;
    }
    const disease = currentStepData?.disease || caseSummary.chiefComplaints.join(', ');
    const lastUserMessage = [...messages].reverse().find(message => message.sender === 'user');
    setIsTyping(true);
    const step = await fetchNextAiStep(disease, messages, lastUserMessage?.text || disease, 'interview', caseSummary);
    setIsTyping(false);
    if (!step) return;
    if (step.isFinished) {
      setMessages(previous => [...previous, { sender: 'ai', text: step.completionMessage || c.complete.replace('{doctor}', doctor?.name || 'the doctor'), isFinal: true }]);
      setCurrentStepData(null);
      return;
    }
    setMessages(previous => {
      const withoutUnavailable = previous[previous.length - 1]?.sender === 'ai' ? previous.slice(0, -1) : previous;
      return [...withoutUnavailable, { sender: 'ai', text: step.question, stepIndex: currentStepData?.stepIndex || 0, flowKey: currentStepData?.flowKey }];
    });
    setCurrentStepData(previous => ({
      ...(previous || {}), step, disease, isAiDriven: true
    }));
  };

  useEffect(() => {
    setOnTranscript?.((spokenText) => {
      const value = String(spokenText || '').trim();
      if (!value) return;
      if (chatStarted) handleUserChoice(value);
      else startConsultationChat(selectedCards, value);
    });
    return () => clearOnTranscript?.();
  }, [chatStarted, selectedCards, language, currentStepData, messages]);

  const starterOptions = starterStep?.options?.length
    ? starterStep.options
    : INITIAL_PROBLEMS.map(problem => ({
        id: problem.id,
        text: c[problem.id],
        icon: problem.icon,
      }));
  const starterQuestion = starterStep?.question || c.title;

  return (
    <div style={{ width: '100%' }}>
      {aiError && (
        <div role="alert" style={{
          marginBottom: '1rem', padding: '12px 16px', borderRadius: '12px', border: '1px solid #fed7aa',
          backgroundColor: '#fff7ed', color: '#9a3412', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px', fontWeight: '650'
        }}>
          <span>{aiCopy.unavailable}</span>
          <button type="button" onClick={retryClinicalAi} style={{
            border: '1px solid #fb923c', backgroundColor: '#fff', color: '#9a3412', borderRadius: '9px',
            padding: '7px 12px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>{aiCopy.retry}</button>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────
          INITIAL SCREEN: 5 CARDS IN A ROW + FULL-WIDTH INPUT BAR
          ───────────────────────────────────────────────────────────────── */}
      {!chatStarted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Card Container */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #eef2f6',
            padding: '2.5rem 2.25rem 2.25rem 2.25rem',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.3px'
            }}>
              {starterQuestion}
            </h2>
            <p style={{ margin: '0 0 2.25rem 0', fontSize: '0.925rem', color: '#64748b', fontWeight: '500' }}>
              {c.subtitle}
            </p>

            {/* AI-tailored complaint suggestions; typing is always available. */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1.25rem'
            }}>
              {starterOptions.map((prob, index) => {
                const IconComponent = prob.icon || QuestionPersonIcon;
                const problemLabel = prob.text || c[prob.id];
                const isSelected = selectedCards.includes(problemLabel);

                return (
                  <button
                    key={prob.id || `${problemLabel}-${index}`}
                    type="button"
                    data-voice-option
                    aria-label={problemLabel}
                    onClick={() => {
                      const updated = [problemLabel];
                      setSelectedCards(updated);
                      startConsultationChat(updated);
                    }}
                    style={{
                      backgroundColor: isSelected ? '#f0fdf9' : '#ffffff',
                      border: isSelected ? '1.5px solid #059669' : '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '2.25rem 1rem 1.75rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected
                        ? '0 6px 18px rgba(5, 150, 105, 0.12)'
                        : '0 1px 4px rgba(0,0,0,0.01)',
                      transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#059669';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.08)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.01)';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={52} color="#059669" />
                    </div>

                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: isSelected ? '#065f46' : '#0f172a',
                      letterSpacing: '-0.2px'
                    }}>
                      {problemLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full-width Custom Input bar at bottom matching screenshot */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputVal.trim()) {
                startConsultationChat(selectedCards, inputVal.trim());
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '14px 20px',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s ease'
            }}
          >
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={c.symptomPlaceholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.95rem',
                color: '#0f172a',
                padding: '0',
                backgroundColor: 'transparent'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={() => toggleListening()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isListening ? '#ef4444' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title={c.speakSymptoms}
                aria-label={c.speakSymptoms}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputVal.trim() && selectedCards.length === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: (inputVal.trim() || selectedCards.length > 0) ? 'pointer' : 'default',
                  color: (inputVal.trim() || selectedCards.length > 0) ? '#059669' : '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  transition: 'color 0.2s ease'
                }}
              >
                <Send size={22} color={inputVal.trim() ? '#059669' : '#10b981'} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────
           INTERACTIVE AI CHAT VIEW (MATCHING USER SCREENSHOT 2)
           ───────────────────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Chat Container Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #eef2f6',
            padding: '2.5rem 2.25rem 2rem 2.25rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            minHeight: '480px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header reset button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setChatStarted(false);
                  setMessages([]);
                  setCurrentStepData(null);
                }}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: '#64748b',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={13} />
                <span>{c.change}</span>
              </button>
            </div>

            {/* Chat Messages Feed */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              flex: 1
            }}>
              {messages.map((m, idx) => {
                const isAi = m.sender === 'ai';

                if (isAi) {
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      {/* Cute Green AI Robot Avatar */}
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#e6f7ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid #bbf7d0'
                      }}>
                        <Bot size={22} color="#059669" />
                      </div>

                      {/* AI Chat Bubble */}
                      <div style={{
                        backgroundColor: '#eaf7ee',
                        color: '#1e293b',
                        padding: '16px 22px',
                        borderRadius: '18px',
                        fontSize: '1.025rem',
                        lineHeight: '1.5',
                        maxWidth: '82%',
                        whiteSpace: 'pre-line',
                        fontWeight: '500'
                      }}>
                        {m.text}
                      </div>
                    </div>
                  );
                }

                // User Bubble (Light Soft Blue on the right)
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: '14px' }}>
                    {/* User Chat Bubble */}
                    <div style={{
                      backgroundColor: '#e0edff',
                      color: '#1e293b',
                      padding: '16px 22px',
                      borderRadius: '18px',
                      fontSize: '1.025rem',
                      lineHeight: '1.5',
                      maxWidth: '82%',
                      fontWeight: '500'
                    }}>
                      {m.text}
                    </div>

                    {/* Blue User Avatar */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#ffffff'
                    }}>
                      <User size={20} />
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#e6f7ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid #bbf7d0'
                  }}>
                    <Bot size={22} color="#059669" />
                  </div>
                  <div style={{
                    backgroundColor: '#eaf7ee',
                    padding: '14px 20px',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669', animation: 'pulse 1s infinite' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669', animation: 'pulse 1s infinite 0.2s' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669', animation: 'pulse 1s infinite 0.4s' }} />
                  </div>
                </div>
              )}

              {/* The AI selects both the response control and a clinically useful option count. */}
              {!isTyping && currentStepData && currentStepData.step && currentStepData.step.options?.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fit, minmax(${currentStepData.step.options.length <= 3 ? '210px' : '160px'}, 1fr))`,
                  gap: '1.15rem',
                  marginTop: '0.75rem'
                }}>
                  {currentStepData.step.options.map((opt, oIdx) => {
                    const IconComp = opt.icon || TargetIcon;
                    const isMultiple = currentStepData.step.responseType === 'multiple_choice';
                    const isSelected = multiSelections.includes(opt.text);

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        data-voice-option
                        aria-label={opt.text}
                        aria-pressed={isMultiple ? isSelected : undefined}
                        onClick={() => {
                          if (!isMultiple) {
                            handleUserChoice(opt.text);
                            return;
                          }
                          setMultiSelections(current => current.includes(opt.text)
                            ? current.filter(value => value !== opt.text)
                            : [...current, opt.text]);
                        }}
                        style={{
                          backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                          border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '1.75rem 0.85rem 1.4rem 0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#059669';
                          e.currentTarget.style.backgroundColor = '#f0fdf9';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <IconComp size={44} color="#059669" />
                        </div>

                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: '#1e293b',
                          textAlign: 'center',
                          lineHeight: '1.3'
                        }}>
                          {opt.text}
                        </div>
                      </button>
                    );
                  })}
                  {currentStepData.step.responseType === 'multiple_choice' && (
                    <button
                      type="button"
                      disabled={!multiSelections.length}
                      onClick={() => handleUserChoice(multiSelections.join(', '))}
                      style={{
                        gridColumn: '1 / -1', justifySelf: 'center', border: 'none', borderRadius: '12px',
                        padding: '12px 28px', fontWeight: '800', color: '#fff',
                        background: multiSelections.length ? '#059669' : '#94a3b8',
                        cursor: multiSelections.length ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {(c.next || 'Continue').split(':')[0]} ({multiSelections.length})
                    </button>
                  )}
                </div>
              )}

              {/* Proceed Action Pill when completed */}
              {!isTyping && !currentStepData && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => onNext?.()}
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '14px 32px',
                      fontSize: '1rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 6px 20px rgba(12, 78, 71, 0.25)'
                    }}
                  >
                    <span>{c.proceed}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          </div>

          {/* Full-width Sleek Input bar at bottom matching screenshot */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputVal.trim()) {
                handleUserChoice(inputVal.trim());
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '14px 20px',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={c.answerPlaceholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.95rem',
                color: '#0f172a',
                padding: '0',
                backgroundColor: 'transparent'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => toggleListening()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isListening ? '#ef4444' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title={c.speakAnswer}
                aria-label={c.speakAnswer}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                type="submit"
                disabled={!inputVal.trim()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: inputVal.trim() ? 'pointer' : 'default',
                  color: inputVal.trim() ? '#059669' : '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <Send size={22} color={inputVal.trim() ? '#059669' : '#cbd5e1'} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── BOTTOM NAVIGATION ROW ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '1.5rem',
        marginTop: '1.75rem'
      }}>
        <button
          type="button"
          onClick={() => onPrevious?.()}
          data-voice-action="back"
          style={{
            backgroundColor: '#ffffff',
            color: '#334155',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '0.9rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <ArrowLeft size={16} />
          <span>{c.previous}</span>
        </button>

        <button
          type="button"
          onClick={() => onNext?.()}
          data-voice-action="next"
          style={{
            background: '#059669',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 28px',
            fontSize: '0.95rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(12, 78, 71, 0.25)',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(12, 78, 71, 0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(12, 78, 71, 0.25)';
          }}
        >
          <span>{c.next}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
