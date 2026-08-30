import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Building2, CheckCircle2, ChevronDown, Clock3, ExternalLink,
  FileQuestion, Globe2, Headphones, LifeBuoy, Mail, MessageSquareText, Phone,
  RefreshCw, Send, ShieldCheck, TicketCheck, X
} from 'lucide-react';
import { db } from '../lib/db';
import './HelpSupportTab.css';

const COPY = {
  en: {
    title: 'Help & Support', subtitle: 'Verified help, real hospital contacts and support requests in one place.',
    support: 'Support Centre', supportLine: 'We are here when you need us.', emergency: 'Emergency help',
    emergencyNote: 'For an immediate medical, police, fire or rescue emergency in India, call 112.',
    verified: 'Verified source', available: 'Available', hospitals: 'Verified hospital contacts',
    hospitalsDesc: 'Only contacts verified in the hospital directory are shown.', noHospitals: 'No hospital has published a verified support contact yet.',
    request: 'Send support request', requests: 'My support requests', requestDesc: 'Your request is stored securely and can be assigned to the appropriate hospital or support team.',
    category: 'What do you need help with?', hospital: 'Related hospital (optional)', subject: 'Subject', message: 'Describe the issue', contact: 'Preferred response',
    submit: 'Submit request', submitting: 'Submitting…', success: 'Support request submitted successfully.', choose: 'Select', general: 'Swasthya Setu support',
    faqs: 'Frequently asked questions', noFaqs: 'No help articles have been published yet.', status: 'Status', created: 'Created',
    phone: 'Phone', email: 'Email', website: 'Website', viewMore: 'View more hospitals', viewLess: 'Show fewer', close: 'Close',
    appointment: 'Appointment', medical_record: 'Medical record', donation: 'Donation', community: 'Community', technical: 'Technical issue', accessibility: 'Accessibility or voice', feedback: 'Feedback', other: 'Other',
    in_app: 'In app', call: 'Call', sendEmail: 'Email', loading: 'Loading verified support information…', retry: 'Retry', privacy: 'Your support messages are stored in Supabase and are visible only through the support workflow.',
    new: 'New', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed', noRequests: 'You have not sent a support request yet.'
  },
  hi: {
    title: 'सहायता और समर्थन', subtitle: 'सत्यापित सहायता, वास्तविक अस्पताल संपर्क और सहायता अनुरोध एक ही स्थान पर।', support: 'सहायता केंद्र', supportLine: 'जब भी ज़रूरत हो, हम आपके साथ हैं।', emergency: 'आपातकालीन सहायता', emergencyNote: 'भारत में तत्काल चिकित्सा, पुलिस, अग्निशमन या बचाव आपातकाल के लिए 112 पर कॉल करें।', verified: 'सत्यापित स्रोत', available: 'उपलब्ध', hospitals: 'सत्यापित अस्पताल संपर्क', hospitalsDesc: 'केवल अस्पताल निर्देशिका में सत्यापित संपर्क दिखाए जाते हैं।', noHospitals: 'अभी किसी अस्पताल ने सत्यापित सहायता संपर्क प्रकाशित नहीं किया है।', request: 'सहायता अनुरोध भेजें', requests: 'मेरे सहायता अनुरोध', requestDesc: 'आपका अनुरोध सुरक्षित रूप से संग्रहित होगा और उचित अस्पताल या सहायता टीम को सौंपा जा सकेगा।', category: 'आपको किस विषय में सहायता चाहिए?', hospital: 'संबंधित अस्पताल (वैकल्पिक)', subject: 'विषय', message: 'समस्या का वर्णन करें', contact: 'उत्तर का पसंदीदा माध्यम', submit: 'अनुरोध जमा करें', submitting: 'जमा हो रहा है…', success: 'सहायता अनुरोध सफलतापूर्वक जमा हुआ।', choose: 'चुनें', general: 'स्वास्थ्य सेतु सहायता', faqs: 'अक्सर पूछे जाने वाले प्रश्न', noFaqs: 'अभी कोई सहायता लेख प्रकाशित नहीं हुआ है।', status: 'स्थिति', created: 'बनाया गया', phone: 'फोन', email: 'ईमेल', website: 'वेबसाइट', viewMore: 'और अस्पताल देखें', viewLess: 'कम दिखाएँ', close: 'बंद करें', appointment: 'अपॉइंटमेंट', medical_record: 'मेडिकल रिकॉर्ड', donation: 'दान', community: 'समुदाय', technical: 'तकनीकी समस्या', accessibility: 'सुलभता या आवाज़', feedback: 'प्रतिक्रिया', other: 'अन्य', in_app: 'ऐप में', call: 'कॉल', sendEmail: 'ईमेल', loading: 'सत्यापित सहायता जानकारी लोड हो रही है…', retry: 'फिर कोशिश करें', privacy: 'आपके सहायता संदेश Supabase में सुरक्षित रहते हैं और केवल सहायता कार्यप्रवाह से देखे जाते हैं।', new: 'नया', assigned: 'सौंपा गया', in_progress: 'कार्य जारी', resolved: 'समाधान हुआ', closed: 'बंद', noRequests: 'आपने अभी कोई सहायता अनुरोध नहीं भेजा है।'
  },
  ta: {
    title: 'உதவி மற்றும் ஆதரவு', subtitle: 'சரிபார்க்கப்பட்ட உதவி, உண்மையான மருத்துவமனை தொடர்புகள் மற்றும் ஆதரவு கோரிக்கைகள் ஒரே இடத்தில்.', support: 'ஆதரவு மையம்', supportLine: 'உங்களுக்குத் தேவைப்படும் போது நாங்கள் இருக்கிறோம்.', emergency: 'அவசர உதவி', emergencyNote: 'இந்தியாவில் உடனடி மருத்துவம், காவல், தீயணைப்பு அல்லது மீட்பு அவசரத்திற்கு 112-ஐ அழைக்கவும்.', verified: 'சரிபார்க்கப்பட்ட மூலம்', available: 'கிடைக்கும்', hospitals: 'சரிபார்க்கப்பட்ட மருத்துவமனை தொடர்புகள்', hospitalsDesc: 'மருத்துவமனை அடைவில் சரிபார்க்கப்பட்ட தொடர்புகள் மட்டுமே காட்டப்படும்.', noHospitals: 'எந்த மருத்துவமனையும் இன்னும் சரிபார்க்கப்பட்ட தொடர்பை வெளியிடவில்லை.', request: 'ஆதரவு கோரிக்கை அனுப்பு', requests: 'எனது ஆதரவு கோரிக்கைகள்', requestDesc: 'உங்கள் கோரிக்கை பாதுகாப்பாகச் சேமிக்கப்பட்டு சரியான குழுவிற்கு ஒதுக்கப்படும்.', category: 'எதில் உதவி வேண்டும்?', hospital: 'தொடர்புடைய மருத்துவமனை (விருப்பம்)', subject: 'பொருள்', message: 'சிக்கலை விவரிக்கவும்', contact: 'விருப்பமான பதில் முறை', submit: 'கோரிக்கையைச் சமர்ப்பி', submitting: 'சமர்ப்பிக்கிறது…', success: 'ஆதரவு கோரிக்கை வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது.', choose: 'தேர்ந்தெடு', general: 'ஸ்வாஸ்த்ய சேது ஆதரவு', faqs: 'அடிக்கடி கேட்கப்படும் கேள்விகள்', noFaqs: 'உதவி கட்டுரைகள் இன்னும் வெளியிடப்படவில்லை.', status: 'நிலை', created: 'உருவாக்கப்பட்டது', phone: 'தொலைபேசி', email: 'மின்னஞ்சல்', website: 'இணையதளம்', viewMore: 'மேலும் மருத்துவமனைகள்', viewLess: 'குறைவாகக் காட்டு', close: 'மூடு', appointment: 'முன்பதிவு', medical_record: 'மருத்துவப் பதிவு', donation: 'நன்கொடை', community: 'சமூகம்', technical: 'தொழில்நுட்பச் சிக்கல்', accessibility: 'அணுகல் அல்லது குரல்', feedback: 'கருத்து', other: 'மற்றவை', in_app: 'செயலியில்', call: 'அழைப்பு', sendEmail: 'மின்னஞ்சல்', loading: 'சரிபார்க்கப்பட்ட தகவல் ஏற்றப்படுகிறது…', retry: 'மீண்டும் முயற்சி', privacy: 'உங்கள் ஆதரவு செய்திகள் Supabase-ல் பாதுகாப்பாகச் சேமிக்கப்படும்.', new: 'புதியது', assigned: 'ஒதுக்கப்பட்டது', in_progress: 'செயல்பாட்டில்', resolved: 'தீர்க்கப்பட்டது', closed: 'மூடப்பட்டது', noRequests: 'நீங்கள் இன்னும் ஆதரவு கோரிக்கை அனுப்பவில்லை.'
  },
  te: {
    title: 'సహాయం & మద్దతు', subtitle: 'ధృవీకరించిన సహాయం, నిజమైన ఆసుపత్రి సంప్రదింపులు మరియు మద్దతు అభ్యర్థనలు ఒకేచోట.', support: 'మద్దతు కేంద్రం', supportLine: 'మీకు అవసరమైనప్పుడు మేమున్నాము.', emergency: 'అత్యవసర సహాయం', emergencyNote: 'భారతదేశంలో తక్షణ వైద్య, పోలీసు, అగ్నిమాపక లేదా రక్షణ అత్యవసరానికి 112కు కాల్ చేయండి.', verified: 'ధృవీకరించిన మూలం', available: 'అందుబాటులో', hospitals: 'ధృవీకరించిన ఆసుపత్రి సంప్రదింపులు', hospitalsDesc: 'ఆసుపత్రి డైరెక్టరీలో ధృవీకరించినవి మాత్రమే చూపబడతాయి.', noHospitals: 'ఏ ఆసుపత్రి ఇంకా ధృవీకరించిన మద్దతు సంప్రదింపును ప్రచురించలేదు.', request: 'మద్దతు అభ్యర్థన పంపండి', requests: 'నా మద్దతు అభ్యర్థనలు', requestDesc: 'మీ అభ్యర్థన సురక్షితంగా నిల్వై సరైన బృందానికి కేటాయించబడుతుంది.', category: 'మీకు ఏ విషయంలో సహాయం కావాలి?', hospital: 'సంబంధిత ఆసుపత్రి (ఐచ్ఛికం)', subject: 'విషయం', message: 'సమస్యను వివరించండి', contact: 'ఇష్టమైన స్పందన విధానం', submit: 'అభ్యర్థన సమర్పించండి', submitting: 'సమర్పిస్తోంది…', success: 'మద్దతు అభ్యర్థన విజయవంతంగా సమర్పించబడింది.', choose: 'ఎంచుకోండి', general: 'స్వాస్థ్య సేతు మద్దతు', faqs: 'తరచుగా అడిగే ప్రశ్నలు', noFaqs: 'సహాయ వ్యాసాలు ఇంకా ప్రచురించలేదు.', status: 'స్థితి', created: 'సృష్టించబడింది', phone: 'ఫోన్', email: 'ఇమెయిల్', website: 'వెబ్‌సైట్', viewMore: 'మరిన్ని ఆసుపత్రులు', viewLess: 'తక్కువ చూపు', close: 'మూసివేయి', appointment: 'అపాయింట్‌మెంట్', medical_record: 'వైద్య రికార్డు', donation: 'విరాళం', community: 'సంఘం', technical: 'సాంకేతిక సమస్య', accessibility: 'ప్రాప్యత లేదా వాయిస్', feedback: 'అభిప్రాయం', other: 'ఇతర', in_app: 'యాప్‌లో', call: 'కాల్', sendEmail: 'ఇమెయిల్', loading: 'ధృవీకరించిన సమాచారం లోడ్ అవుతోంది…', retry: 'మళ్లీ ప్రయత్నించండి', privacy: 'మీ మద్దతు సందేశాలు Supabaseలో సురక్షితంగా నిల్వవుతాయి.', new: 'కొత్తది', assigned: 'కేటాయించబడింది', in_progress: 'పనిలో ఉంది', resolved: 'పరిష్కరించబడింది', closed: 'మూసివేయబడింది', noRequests: 'మీరు ఇంకా మద్దతు అభ్యర్థన పంపలేదు.'
  },
  bn: {
    title: 'সহায়তা ও সমর্থন', subtitle: 'যাচাইকৃত সহায়তা, বাস্তব হাসপাতাল যোগাযোগ ও সহায়তা অনুরোধ এক জায়গায়।', support: 'সহায়তা কেন্দ্র', supportLine: 'প্রয়োজনের সময় আমরা আপনার পাশে আছি।', emergency: 'জরুরি সহায়তা', emergencyNote: 'ভারতে তাৎক্ষণিক চিকিৎসা, পুলিশ, দমকল বা উদ্ধার জরুরিতে ১১২ নম্বরে কল করুন।', verified: 'যাচাইকৃত উৎস', available: 'উপলব্ধ', hospitals: 'যাচাইকৃত হাসপাতাল যোগাযোগ', hospitalsDesc: 'হাসপাতাল ডিরেক্টরিতে যাচাইকৃত যোগাযোগই শুধু দেখানো হয়।', noHospitals: 'কোনো হাসপাতাল এখনও যাচাইকৃত সহায়তা যোগাযোগ প্রকাশ করেনি।', request: 'সহায়তা অনুরোধ পাঠান', requests: 'আমার সহায়তা অনুরোধ', requestDesc: 'আপনার অনুরোধ নিরাপদে সংরক্ষিত হয়ে উপযুক্ত দলের কাছে যাবে।', category: 'কী বিষয়ে সহায়তা দরকার?', hospital: 'সংশ্লিষ্ট হাসপাতাল (ঐচ্ছিক)', subject: 'বিষয়', message: 'সমস্যা বর্ণনা করুন', contact: 'উত্তরের পছন্দের মাধ্যম', submit: 'অনুরোধ জমা দিন', submitting: 'জমা হচ্ছে…', success: 'সহায়তা অনুরোধ সফলভাবে জমা হয়েছে।', choose: 'নির্বাচন করুন', general: 'স্বাস্থ্য সেতু সহায়তা', faqs: 'সচরাচর জিজ্ঞাসিত প্রশ্ন', noFaqs: 'কোনো সহায়তা নিবন্ধ এখনও প্রকাশিত হয়নি।', status: 'অবস্থা', created: 'তৈরি', phone: 'ফোন', email: 'ইমেল', website: 'ওয়েবসাইট', viewMore: 'আরও হাসপাতাল', viewLess: 'কম দেখান', close: 'বন্ধ করুন', appointment: 'অ্যাপয়েন্টমেন্ট', medical_record: 'মেডিকেল রেকর্ড', donation: 'দান', community: 'কমিউনিটি', technical: 'প্রযুক্তিগত সমস্যা', accessibility: 'অ্যাক্সেসিবিলিটি বা ভয়েস', feedback: 'মতামত', other: 'অন্যান্য', in_app: 'অ্যাপে', call: 'কল', sendEmail: 'ইমেল', loading: 'যাচাইকৃত তথ্য লোড হচ্ছে…', retry: 'আবার চেষ্টা', privacy: 'আপনার সহায়তা বার্তা Supabase-এ নিরাপদে সংরক্ষিত থাকে।', new: 'নতুন', assigned: 'বরাদ্দ', in_progress: 'চলছে', resolved: 'সমাধান হয়েছে', closed: 'বন্ধ', noRequests: 'আপনি এখনও কোনো সহায়তা অনুরোধ পাঠাননি।'
  },
  mr: {
    title: 'मदत आणि समर्थन', subtitle: 'सत्यापित मदत, खरे रुग्णालय संपर्क आणि मदत विनंत्या एकाच ठिकाणी.', support: 'मदत केंद्र', supportLine: 'गरज असेल तेव्हा आम्ही तुमच्यासोबत आहोत.', emergency: 'आपत्कालीन मदत', emergencyNote: 'भारतात तातडीच्या वैद्यकीय, पोलीस, अग्निशमन किंवा बचाव आपत्कालासाठी 112 वर कॉल करा.', verified: 'सत्यापित स्रोत', available: 'उपलब्ध', hospitals: 'सत्यापित रुग्णालय संपर्क', hospitalsDesc: 'रुग्णालय निर्देशिकेत सत्यापित संपर्कच दाखवले जातात.', noHospitals: 'अद्याप कोणत्याही रुग्णालयाने सत्यापित मदत संपर्क प्रकाशित केलेला नाही.', request: 'मदत विनंती पाठवा', requests: 'माझ्या मदत विनंत्या', requestDesc: 'तुमची विनंती सुरक्षितपणे साठवून योग्य संघाकडे दिली जाईल.', category: 'कशासाठी मदत हवी?', hospital: 'संबंधित रुग्णालय (ऐच्छिक)', subject: 'विषय', message: 'समस्या सांगा', contact: 'उत्तराचे पसंतीचे माध्यम', submit: 'विनंती जमा करा', submitting: 'जमा होत आहे…', success: 'मदत विनंती यशस्वीपणे जमा झाली.', choose: 'निवडा', general: 'स्वास्थ्य सेतू मदत', faqs: 'वारंवार विचारले जाणारे प्रश्न', noFaqs: 'अद्याप मदत लेख प्रकाशित नाहीत.', status: 'स्थिती', created: 'तयार', phone: 'फोन', email: 'ईमेल', website: 'वेबसाइट', viewMore: 'अधिक रुग्णालये', viewLess: 'कमी दाखवा', close: 'बंद', appointment: 'अपॉइंटमेंट', medical_record: 'वैद्यकीय नोंद', donation: 'देणगी', community: 'समुदाय', technical: 'तांत्रिक समस्या', accessibility: 'सुलभता किंवा आवाज', feedback: 'अभिप्राय', other: 'इतर', in_app: 'अॅपमध्ये', call: 'कॉल', sendEmail: 'ईमेल', loading: 'सत्यापित माहिती लोड होत आहे…', retry: 'पुन्हा प्रयत्न', privacy: 'तुमचे मदत संदेश Supabase मध्ये सुरक्षित साठवले जातात.', new: 'नवीन', assigned: 'सोपवले', in_progress: 'काम सुरू', resolved: 'सोडवले', closed: 'बंद', noRequests: 'तुम्ही अजून मदत विनंती पाठवलेली नाही.'
  },
  gu: {
    title: 'મદદ અને સહાય', subtitle: 'ચકાસેલી મદદ, સાચા હોસ્પિટલ સંપર્કો અને સહાય વિનંતીઓ એક જગ્યાએ.', support: 'સહાય કેન્દ્ર', supportLine: 'જ્યારે જરૂર હોય ત્યારે અમે તમારી સાથે છીએ.', emergency: 'કટોકટીની મદદ', emergencyNote: 'ભારતમાં તાત્કાલિક તબીબી, પોલીસ, ફાયર અથવા બચાવ કટોકટી માટે 112 પર કૉલ કરો.', verified: 'ચકાસેલો સ્રોત', available: 'ઉપલબ્ધ', hospitals: 'ચકાસેલા હોસ્પિટલ સંપર્કો', hospitalsDesc: 'હોસ્પિટલ ડિરેક્ટરીમાં ચકાસેલા સંપર્કો જ બતાવવામાં આવે છે.', noHospitals: 'હજુ કોઈ હોસ્પિટલે ચકાસેલો સહાય સંપર્ક પ્રકાશિત કર્યો નથી.', request: 'સહાય વિનંતી મોકલો', requests: 'મારી સહાય વિનંતીઓ', requestDesc: 'તમારી વિનંતી સુરક્ષિત રીતે સંગ્રહિત થઈ યોગ્ય ટીમને સોંપાશે.', category: 'શામાં મદદ જોઈએ?', hospital: 'સંબંધિત હોસ્પિટલ (વૈકલ્પિક)', subject: 'વિષય', message: 'સમસ્યા વર્ણવો', contact: 'જવાબનું પસંદગીનું માધ્યમ', submit: 'વિનંતી સબમિટ કરો', submitting: 'સબમિટ થઈ રહ્યું છે…', success: 'સહાય વિનંતી સફળતાપૂર્વક સબમિટ થઈ.', choose: 'પસંદ કરો', general: 'સ્વાસ્થ્ય સેતુ સહાય', faqs: 'વારંવાર પૂછાતા પ્રશ્નો', noFaqs: 'હજુ કોઈ સહાય લેખ પ્રકાશિત નથી.', status: 'સ્થિતિ', created: 'બનાવ્યું', phone: 'ફોન', email: 'ઇમેલ', website: 'વેબસાઇટ', viewMore: 'વધુ હોસ્પિટલો', viewLess: 'ઓછું બતાવો', close: 'બંધ', appointment: 'એપોઇન્ટમેન્ટ', medical_record: 'મેડિકલ રેકોર્ડ', donation: 'દાન', community: 'સમુદાય', technical: 'ટેકનિકલ સમસ્યા', accessibility: 'ઍક્સેસિબિલિટી અથવા અવાજ', feedback: 'પ્રતિસાદ', other: 'અન્ય', in_app: 'ઍપમાં', call: 'કૉલ', sendEmail: 'ઇમેલ', loading: 'ચકાસેલી માહિતી લોડ થાય છે…', retry: 'ફરી પ્રયાસ', privacy: 'તમારા સહાય સંદેશા Supabaseમાં સુરક્ષિત સંગ્રહિત થાય છે.', new: 'નવું', assigned: 'સોંપાયું', in_progress: 'ચાલુ', resolved: 'ઉકેલાયું', closed: 'બંધ', noRequests: 'તમે હજુ કોઈ સહાય વિનંતી મોકલી નથી.'
  },
  kn: {
    title: 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ', subtitle: 'ಪರಿಶೀಲಿತ ಸಹಾಯ, ನೈಜ ಆಸ್ಪತ್ರೆ ಸಂಪರ್ಕಗಳು ಮತ್ತು ಬೆಂಬಲ ವಿನಂತಿಗಳು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ.', support: 'ಬೆಂಬಲ ಕೇಂದ್ರ', supportLine: 'ನಿಮಗೆ ಬೇಕಾದಾಗ ನಾವು ಇಲ್ಲಿದ್ದೇವೆ.', emergency: 'ತುರ್ತು ಸಹಾಯ', emergencyNote: 'ಭಾರತದಲ್ಲಿ ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ, ಪೊಲೀಸ್, ಅಗ್ನಿಶಾಮಕ ಅಥವಾ ರಕ್ಷಣಾ ತುರ್ತಿಗೆ 112ಕ್ಕೆ ಕರೆ ಮಾಡಿ.', verified: 'ಪರಿಶೀಲಿತ ಮೂಲ', available: 'ಲಭ್ಯ', hospitals: 'ಪರಿಶೀಲಿತ ಆಸ್ಪತ್ರೆ ಸಂಪರ್ಕಗಳು', hospitalsDesc: 'ಆಸ್ಪತ್ರೆ ಡೈರೆಕ್ಟರಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಸಂಪರ್ಕಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸಲಾಗುತ್ತದೆ.', noHospitals: 'ಯಾವ ಆಸ್ಪತ್ರೆಯೂ ಇನ್ನೂ ಪರಿಶೀಲಿತ ಬೆಂಬಲ ಸಂಪರ್ಕ ಪ್ರಕಟಿಸಿಲ್ಲ.', request: 'ಬೆಂಬಲ ವಿನಂತಿ ಕಳುಹಿಸಿ', requests: 'ನನ್ನ ಬೆಂಬಲ ವಿನಂತಿಗಳು', requestDesc: 'ನಿಮ್ಮ ವಿನಂತಿ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹವಾಗಿ ಸರಿಯಾದ ತಂಡಕ್ಕೆ ನಿಯೋಜಿಸಲಾಗುತ್ತದೆ.', category: 'ಯಾವ ವಿಷಯದಲ್ಲಿ ಸಹಾಯ ಬೇಕು?', hospital: 'ಸಂಬಂಧಿತ ಆಸ್ಪತ್ರೆ (ಐಚ್ಛಿಕ)', subject: 'ವಿಷಯ', message: 'ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ', contact: 'ಉತ್ತರದ ಆದ್ಯತೆಯ ವಿಧಾನ', submit: 'ವಿನಂತಿ ಸಲ್ಲಿಸಿ', submitting: 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…', success: 'ಬೆಂಬಲ ವಿನಂತಿ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.', choose: 'ಆಯ್ಕೆ ಮಾಡಿ', general: 'ಸ್ವಾಸ್ಥ್ಯ ಸೇತು ಬೆಂಬಲ', faqs: 'ಪದೇ ಪದೇ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು', noFaqs: 'ಯಾವುದೇ ಸಹಾಯ ಲೇಖನ ಇನ್ನೂ ಪ್ರಕಟವಾಗಿಲ್ಲ.', status: 'ಸ್ಥಿತಿ', created: 'ರಚಿಸಲಾಗಿದೆ', phone: 'ದೂರವಾಣಿ', email: 'ಇಮೇಲ್', website: 'ಜಾಲತಾಣ', viewMore: 'ಇನ್ನಷ್ಟು ಆಸ್ಪತ್ರೆಗಳು', viewLess: 'ಕಡಿಮೆ ತೋರಿಸಿ', close: 'ಮುಚ್ಚಿ', appointment: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್', medical_record: 'ವೈದ್ಯಕೀಯ ದಾಖಲೆ', donation: 'ದೇಣಿಗೆ', community: 'ಸಮುದಾಯ', technical: 'ತಾಂತ್ರಿಕ ಸಮಸ್ಯೆ', accessibility: 'ಪ್ರವೇಶ ಅಥವಾ ಧ್ವನಿ', feedback: 'ಪ್ರತಿಕ್ರಿಯೆ', other: 'ಇತರೆ', in_app: 'ಆ್ಯಪ್‌ನಲ್ಲಿ', call: 'ಕರೆ', sendEmail: 'ಇಮೇಲ್', loading: 'ಪರಿಶೀಲಿತ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ…', retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', privacy: 'ನಿಮ್ಮ ಬೆಂಬಲ ಸಂದೇಶಗಳು Supabaseನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹವಾಗುತ್ತವೆ.', new: 'ಹೊಸದು', assigned: 'ನಿಯೋಜಿಸಲಾಗಿದೆ', in_progress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ', resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ', closed: 'ಮುಚ್ಚಲಾಗಿದೆ', noRequests: 'ನೀವು ಇನ್ನೂ ಬೆಂಬಲ ವಿನಂತಿ ಕಳುಹಿಸಿಲ್ಲ.'
  },
  ml: {
    title: 'സഹായവും പിന്തുണയും', subtitle: 'പരിശോധിച്ച സഹായം, യഥാർത്ഥ ആശുപത്രി ബന്ധങ്ങൾ, പിന്തുണ അഭ്യർത്ഥനകൾ എല്ലാം ഒരിടത്ത്.', support: 'പിന്തുണാ കേന്ദ്രം', supportLine: 'ആവശ്യമുള്ളപ്പോൾ ഞങ്ങൾ നിങ്ങളോടൊപ്പമുണ്ട്.', emergency: 'അടിയന്തര സഹായം', emergencyNote: 'ഇന്ത്യയിൽ അടിയന്തര മെഡിക്കൽ, പോലീസ്, അഗ്നിശമന അല്ലെങ്കിൽ രക്ഷാപ്രവർത്തന സഹായത്തിന് 112 വിളിക്കുക.', verified: 'പരിശോധിച്ച ഉറവിടം', available: 'ലഭ്യം', hospitals: 'പരിശോധിച്ച ആശുപത്രി ബന്ധങ്ങൾ', hospitalsDesc: 'ആശുപത്രി ഡയറക്ടറിയിൽ പരിശോധിച്ച ബന്ധങ്ങൾ മാത്രമാണ് കാണിക്കുന്നത്.', noHospitals: 'ഒരു ആശുപത്രിയും ഇതുവരെ പരിശോധിച്ച പിന്തുണാ ബന്ധം പ്രസിദ്ധീകരിച്ചിട്ടില്ല.', request: 'പിന്തുണാ അഭ്യർത്ഥന അയയ്ക്കുക', requests: 'എന്റെ പിന്തുണാ അഭ്യർത്ഥനകൾ', requestDesc: 'നിങ്ങളുടെ അഭ്യർത്ഥന സുരക്ഷിതമായി സൂക്ഷിച്ച് ശരിയായ ടീമിന് നൽകും.', category: 'എന്തിലാണ് സഹായം വേണ്ടത്?', hospital: 'ബന്ധപ്പെട്ട ആശുപത്രി (ഐച്ഛികം)', subject: 'വിഷയം', message: 'പ്രശ്നം വിവരിക്കുക', contact: 'മറുപടിയുടെ ഇഷ്ട മാർഗം', submit: 'അഭ്യർത്ഥന സമർപ്പിക്കുക', submitting: 'സമർപ്പിക്കുന്നു…', success: 'പിന്തുണാ അഭ്യർത്ഥന വിജയകരമായി സമർപ്പിച്ചു.', choose: 'തിരഞ്ഞെടുക്കുക', general: 'സ്വാസ്ഥ്യ സേതു പിന്തുണ', faqs: 'പതിവായി ചോദിക്കുന്ന ചോദ്യങ്ങൾ', noFaqs: 'സഹായ ലേഖനങ്ങളൊന്നും ഇതുവരെ പ്രസിദ്ധീകരിച്ചിട്ടില്ല.', status: 'സ്ഥിതി', created: 'സൃഷ്ടിച്ചത്', phone: 'ഫോൺ', email: 'ഇമെയിൽ', website: 'വെബ്സൈറ്റ്', viewMore: 'കൂടുതൽ ആശുപത്രികൾ', viewLess: 'കുറച്ച് കാണിക്കുക', close: 'അടയ്ക്കുക', appointment: 'അപ്പോയിന്റ്മെന്റ്', medical_record: 'മെഡിക്കൽ രേഖ', donation: 'സംഭാവന', community: 'സമൂഹം', technical: 'സാങ്കേതിക പ്രശ്നം', accessibility: 'ആക്സസിബിലിറ്റി അല്ലെങ്കിൽ ശബ്ദം', feedback: 'അഭിപ്രായം', other: 'മറ്റുള്ളവ', in_app: 'ആപ്പിൽ', call: 'വിളിക്കുക', sendEmail: 'ഇമെയിൽ', loading: 'പരിശോധിച്ച വിവരം ലോഡ് ചെയ്യുന്നു…', retry: 'വീണ്ടും ശ്രമിക്കുക', privacy: 'നിങ്ങളുടെ പിന്തുണാ സന്ദേശങ്ങൾ Supabase-ൽ സുരക്ഷിതമായി സൂക്ഷിക്കുന്നു.', new: 'പുതിയത്', assigned: 'നിയോഗിച്ചു', in_progress: 'പുരോഗതിയിൽ', resolved: 'പരിഹരിച്ചു', closed: 'അടച്ചു', noRequests: 'നിങ്ങൾ ഇതുവരെ പിന്തുണാ അഭ്യർത്ഥന അയച്ചിട്ടില്ല.'
  }
};

const CATEGORIES = ['appointment','medical_record','donation','community','technical','accessibility','feedback','other'];

export default function HelpSupportTab({ patientId, language = 'en' }) {
  const c = COPY[language] || COPY.en;
  const [channels, setChannels] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ category: 'appointment', hospitalId: '', subject: '', message: '', preferredContact: 'in_app' });

  const load = async () => {
    setLoading(true); setError('');
    const [channelResult, hospitalResult, faqResult, requestResult] = await Promise.all([
      db.support.getChannels(), db.support.getHospitals(), db.support.getFaqs(), db.support.getRequests(patientId)
    ]);
    const firstError = [channelResult, hospitalResult, faqResult, requestResult].find(result => result.error)?.error;
    setChannels(channelResult.data || []); setHospitals(hospitalResult.data || []);
    setFaqs(faqResult.data || []); setRequests(requestResult.data || []);
    if (firstError) setError(firstError.message || String(firstError));
    setLoading(false);
  };

  useEffect(() => { load(); }, [patientId]);
  const localized = (row, field) => row?.[`${field}_i18n`]?.[language] || row?.[field] || '';
  const emergency = channels.find(channel => channel.channel_type === 'emergency');
  const otherChannels = channels.filter(channel => channel.id !== emergency?.id);
  const visibleHospitals = showAll ? hospitals : hospitals.slice(0, 5);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(language === 'en' ? 'en-IN' : `${language}-IN`, { dateStyle: 'medium', timeStyle: 'short' }), [language]);

  const submit = async event => {
    event.preventDefault(); setSaving(true); setNotice('');
    const { data, error: requestError } = await db.support.createRequest({
      patientId, hospitalId: form.hospitalId || null, category: form.category,
      subject: form.subject, message: form.message, preferredContact: form.preferredContact, language
    });
    setSaving(false);
    if (requestError) { setNotice(requestError.message || String(requestError)); return; }
    setRequests(previous => [data, ...previous]);
    setForm({ category: 'appointment', hospitalId: '', subject: '', message: '', preferredContact: 'in_app' });
    setNotice(c.success); setTimeout(() => { setShowForm(false); setNotice(''); }, 1200);
  };

  if (loading) return <div className="help-state"><RefreshCw className="spin" size={22}/><span>{c.loading}</span></div>;

  return (
    <section className="help-support" aria-label={c.title}>
      <header className="help-page-header"><div><h1>{c.title}</h1><p>{c.subtitle}</p></div><button className="help-primary" onClick={() => setShowForm(true)} data-voice-action="support-request"><MessageSquareText size={18}/>{c.request}</button></header>

      {error && <div className="help-error"><AlertTriangle size={18}/><span>{error}</span><button onClick={load}>{c.retry}</button></div>}

      <div className="help-hero">
        <div className="help-hero-icon"><Headphones size={54}/></div>
        <div className="help-hero-copy"><span className="eyebrow">SWASTHYA SETU</span><h2>{c.support}</h2><p>{c.supportLine}</p>
          {otherChannels.length > 0 && <div className="help-channel-row">{otherChannels.map(channel => channel.phone ? <a key={channel.id} href={`tel:${channel.phone}`}><Phone size={17}/>{channel.phone}</a> : channel.email ? <a key={channel.id} href={`mailto:${channel.email}`}><Mail size={17}/>{localized(channel,'label')}</a> : <a key={channel.id} href={channel.url} target="_blank" rel="noreferrer"><Globe2 size={17}/>{localized(channel,'label')}</a>)}</div>}
        </div>
        {emergency && <div className="help-emergency"><div className="help-verified"><ShieldCheck size={16}/>{c.verified}</div><h3>{c.emergency}</h3><a href={`tel:${emergency.phone}`} aria-label={`${c.call} ${emergency.phone}`}><Phone size={24}/>{emergency.phone}</a><span><Clock3 size={15}/>{emergency.hours || c.available}</span>{emergency.verified_source_url && <a className="source-link" href={emergency.verified_source_url} target="_blank" rel="noreferrer">{c.verified}<ExternalLink size={13}/></a>}</div>}
      </div>
      <div className="help-emergency-note"><LifeBuoy size={18}/>{c.emergencyNote}</div>

      <div className="help-columns">
        <div className="help-panel"><div className="help-panel-title"><div><h2>{c.hospitals}</h2><p>{c.hospitalsDesc}</p></div><Building2 size={24}/></div>
          {visibleHospitals.length ? <div className="hospital-contact-list">{visibleHospitals.map(hospital => <article key={hospital.id} className="hospital-contact"><div><h3>{hospital.name}</h3><p><Building2 size={14}/>{[hospital.city,hospital.state].filter(Boolean).join(', ') || hospital.address}</p>{hospital.support_hours && <small><Clock3 size={13}/>{hospital.support_hours}</small>}</div><div className="contact-actions">{(hospital.emergency_phone || hospital.support_phone) && <a href={`tel:${hospital.emergency_phone || hospital.support_phone}`} title={c.phone}><Phone size={18}/></a>}{hospital.support_email && <a href={`mailto:${hospital.support_email}`} title={c.email}><Mail size={18}/></a>}{hospital.website_url && <a href={hospital.website_url} target="_blank" rel="noreferrer" title={c.website}><ExternalLink size={18}/></a>}</div></article>)}</div> : <div className="help-empty"><Building2 size={32}/><p>{c.noHospitals}</p></div>}
          {hospitals.length > 5 && <button className="help-secondary wide" onClick={() => setShowAll(value => !value)}>{showAll ? c.viewLess : c.viewMore}<ChevronDown size={17} className={showAll ? 'rotate' : ''}/></button>}
        </div>

        <div className="help-panel"><div className="help-panel-title"><div><h2>{c.requests}</h2><p>{c.requestDesc}</p></div><TicketCheck size={24}/></div>
          {requests.length ? <div className="request-list">{requests.slice(0,5).map(request => <article key={request.id}><div><h3>{request.subject}</h3><p>{hospitals.find(item => item.id === request.hospital_id)?.name || c.general} · {c[request.category] || request.category}</p></div><div className={`request-status status-${request.status}`}><span>{c[request.status] || request.status}</span><small>{dateFormatter.format(new Date(request.created_at))}</small></div></article>)}</div> : <div className="help-empty"><FileQuestion size={32}/><p>{c.noRequests}</p></div>}
          <button className="help-primary wide" onClick={() => setShowForm(true)}><Send size={17}/>{c.request}</button>
        </div>
      </div>

      <div className="help-panel faq-panel"><div className="help-panel-title"><h2>{c.faqs}</h2><FileQuestion size={24}/></div>{faqs.length ? <div className="faq-list">{faqs.map(faq => <article key={faq.id}><button onClick={() => setExpanded(expanded === faq.id ? null : faq.id)} aria-expanded={expanded === faq.id}><span>{localized(faq,'question')}</span><ChevronDown size={18} className={expanded === faq.id ? 'rotate' : ''}/></button>{expanded === faq.id && <p>{localized(faq,'answer')}</p>}</article>)}</div> : <div className="help-empty compact"><p>{c.noFaqs}</p></div>}</div>
      <div className="help-privacy"><ShieldCheck size={20}/><span>{c.privacy}</span></div>

      {showForm && <div className="help-modal-backdrop" role="presentation"><div className="help-modal" role="dialog" aria-modal="true" aria-labelledby="support-form-title"><div className="help-modal-head"><div><h2 id="support-form-title">{c.request}</h2><p>{c.requestDesc}</p></div><button onClick={() => setShowForm(false)} aria-label={c.close}><X size={20}/></button></div><form onSubmit={submit}>
        <label>{c.category}<select value={form.category} onChange={event => setForm({...form,category:event.target.value})}>{CATEGORIES.map(category => <option key={category} value={category}>{c[category]}</option>)}</select></label>
        <label>{c.hospital}<select value={form.hospitalId} onChange={event => setForm({...form,hospitalId:event.target.value})}><option value="">{c.general}</option>{hospitals.map(hospital => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}</select></label>
        <label>{c.subject}<input required minLength={3} maxLength={180} value={form.subject} onChange={event => setForm({...form,subject:event.target.value})}/></label>
        <label>{c.message}<textarea required minLength={10} maxLength={4000} rows={5} value={form.message} onChange={event => setForm({...form,message:event.target.value})}/></label>
        <fieldset><legend>{c.contact}</legend>{['in_app','phone','email'].map(method => <label className="radio" key={method}><input type="radio" name="contact" value={method} checked={form.preferredContact === method} onChange={() => setForm({...form,preferredContact:method})}/>{c[method === 'phone' ? 'call' : method === 'email' ? 'sendEmail' : method]}</label>)}</fieldset>
        {notice && <div className={notice === c.success ? 'form-notice success' : 'form-notice'}>{notice === c.success && <CheckCircle2 size={17}/>} {notice}</div>}
        <div className="help-modal-actions"><button type="button" className="help-secondary" onClick={() => setShowForm(false)}>{c.close}</button><button type="submit" className="help-primary" disabled={saving || !patientId}>{saving ? c.submitting : c.submit}</button></div>
      </form></div></div>}
    </section>
  );
}
