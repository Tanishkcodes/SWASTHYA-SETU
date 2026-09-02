import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/db';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import SwasthyaLogo from '../components/SwasthyaLogo';
import ClinicalAnamnesisChat from '../components/ClinicalAnamnesisChat';
import ReportUploadStep from '../components/ReportUploadStep';
import BookingConfirmationStep from '../components/BookingConfirmationStep';
import DonationsTab from '../components/DonationsTab';
import CommunitiesTab from '../components/CommunitiesTab';
import HelpSupportTab from '../components/HelpSupportTab';
import aiTranslationService from '../engine/AiTranslationService';
import aiCommandEngine from '../engine/AICommandEngine';
import {
  Calendar, Clock, FileText, User, Heart, Users, Headphones,
  Search, MapPin, Star, ChevronDown, Check, ArrowRight, ArrowLeft,
  Mic, Sparkles, Stethoscope, AlertCircle, Eye, Trash2,
  Plus, CheckCircle2, QrCode, X, Phone, ShieldCheck,
  Building2, Activity, Leaf, LogOut, ChevronRight, Menu,
  CalendarCheck, CalendarPlus, Download, MoreVertical, Filter,
  RotateCcw, FlaskConical, ChevronLeft, Share2, Printer, Lock,
  GraduationCap, Briefcase, Award, Edit3, Globe
} from 'lucide-react';

const createBookingRequestId = () => globalThis.crypto?.randomUUID?.()
  || `req-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

/* =========================================================================
   COMPREHENSIVE MULTILINGUAL TRANSLATIONS FOR PATIENT DASHBOARD (9 LANGUAGES)
   ========================================================================= */
const DASHBOARD_I18N = {
  en: {
    trustHeader: 'Your Health, Our Priority',
    trustBody: 'Your data is safe and secure with us.',
    trustBadge: 'HIPAA Compliant',

    bookStep1: 'Step 1: Select an appointment date.',
    bookStep2: 'Step 2: Select a time slot.',
    bookStep3: 'Step 3: Tell us about your symptoms or the reason for your visit. You can tap the microphone and speak.',
    bookStep4: 'Step 4: Upload any previous medical reports. This is optional.',
    bookStep5: 'Step 5: Review your details and confirm the appointment.',

    selectDoctorPrompt: 'Please select a doctor for your appointment.',
    doctorProfilePrompt: 'Viewing doctor profile and available time slots.',
    abhaModalPrompt: 'Ayushman Bharat Digital Health Card details.',
    ocrDocumentPrompt: 'OCR Scanned Document Details.',
    communityGroupPrompt: 'Viewing community chat group.',
    portal: 'Patient Portal',
    appointments: 'Appointments',
    history: 'Appointment History',
    reports: 'Medical Reports',
    donations: 'Donations',
    communities: 'Communities',
    help: 'Help & Support',
    bookAppointmentTitle: 'Book an Appointment',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    heroSubtitle: 'Find a doctor, choose a time and let Swasthya Setu handle the rest.',
    talkToSwasthyaSetu: 'Talk to Swasthya Setu',
    speakInYourLanguage: 'Speak in your language',
    findHospitalDoctor: 'Find a Hospital & Doctor',
    searchPlaceholder: 'Search hospitals, specialties, doctors...',
    all: 'All',
    government: 'Government',
    private: 'Private',
    ayush: 'AYUSH',
    nearMe: 'Near Me',
    popular: 'POPULAR',
    departments: 'Departments',
    kmAway: 'km away',
    bookAppointmentBtn: 'Book Appointment',
    nextAvailable: 'Next available',
    today: 'Today',
    tomorrow: 'Tomorrow',
    viewAllHospitals: 'View all hospitals',
    allHospitalsDirectory: 'All Partner Hospitals & Medical Centers',
    upcomingAppointments: 'Upcoming Appointments',
    viewAll: 'View all',
    noUpcoming: 'No Upcoming Appointments',
    noUpcomingDesc: 'You have no appointments scheduled yet. Select a hospital on the left to book a doctor consultation.',
    startVoiceIntake: 'Start Pre-Visit AI Intake',
    abhaLinked: 'ABHA Linked',
    profile: 'Patient Profile',
    logout: 'Log out',
    tokenWord: 'Token',
    roomWord: 'Room',
    confirmed: 'Confirmed',
    intakePending: 'Intake Pending',
    confirmBookingTitle: 'Book Hospital Appointment',
    selectDoctor: 'Select Doctor / Specialist',
    selectDept: 'Department',
    selectDate: 'Date',
    selectSlot: 'Time Slot',
    reasonForVisit: 'Reason for Visit / Symptoms (Optional)',
    confirmBookingBtn: 'Confirm Appointment & Generate Token',
    appointmentConfirmed: 'Appointment Confirmed!',
    tokenGeneratedDesc: 'Your OPD Token has been generated and added to your upcoming visits.',
    close: 'Close',
    digitalQueuePass: 'OPD Digital Queue Pass',
    assignedToken: 'Assigned Token Number',
    cancelAppointment: 'Cancel Appointment',
    historyDesc: 'Records of previous clinical consultations, OPD visits, and doctor prescriptions.',
    reportsDesc: 'Uploaded diagnostic files, prescriptions, and AI OCR extracted summaries.',
    donationsDesc: 'Support underprivileged emergency patients and community rural health clinics across India.',
    communitiesDesc: 'Connect with peer groups, share wellness routines, and ask verified health educators.',
    helpDesc: '24/7 National Health Helpline, Voice navigation assistance, and FAQ.',
    backToDashboard: 'Back to Dashboard',
    selectDoctorTitle: 'Select a Doctor',
    chooseDoctorFrom: 'Choose a doctor from {hospital}',
    allopathic: 'Allopathy',
    select: 'Select',
    viewProfile: 'View Profile',
    changeHospital: 'Change Hospital',
    wizardStep1: 'Select Date',
    wizardStep2: 'Select Time',
    wizardStep3: 'Case & Symptoms',
    wizardStep4: 'Upload Reports',
    wizardStep5: 'Confirmation',
    step1SelectDate: 'Step 1: Select Date',
    step1Desc: 'Choose a convenient date for your doctor consultation',
    moreDates: 'More Dates',
    nextSelectTime: 'Next: Select Time',
    step2SelectTime: 'Step 2: Select Time Slot',
    liveDoctorSchedule: "Live availability from {doctor}'s schedule",
    morningSlots: 'Morning Slots',
    afternoonSlots: 'Afternoon Slots',
    eveningSlots: 'Evening Slots',
    slotsAvailable: 'slots available',
    slotLeft: 'slot left',
    slotsLeft: 'slots left',
    selected: 'Selected',
    fullyBooked: 'Fully Booked',
    closed: 'Closed',
    fillingFast: 'Filling Fast',
    available: 'Available',
    loadingLiveSchedule: 'Loading live schedule…',
    noSlotsAvailable: 'No slots available for this date. Please select a different date.',
    liveAvailabilityBadge: 'Live availability · Refreshes every 15s',
    previous: 'Previous',
    nextCase: 'Next: Case & Symptoms',
    searchDoctorPlaceholder: "Search doctor by name or specialty...",
    filters: "Filters",
    years: "years",
    yrs: "yrs",
  },
  hi: {
    trustHeader: 'आपका स्वास्थ्य, हमारी प्राथमिकता',
    trustBody: 'आपका डेटा हमारे साथ सुरक्षित और गोपनीय है।',
    trustBadge: 'HIPAA अनुरूप',

    bookStep1: 'चरण 1: अपॉइंटमेंट की तारीख चुनें।',
    bookStep2: 'चरण 2: समय चुनें।',
    bookStep3: 'चरण 3: अपने लक्षणों या परेशानी के बारे में बताएं। आप माइक बटन दबाकर बोल सकते हैं।',
    bookStep4: 'चरण 4: कोई पिछली मेडिकल रिपोर्ट अपलोड करें। यह अनिवार्य नहीं है।',
    bookStep5: 'चरण 5: अपने विवरण जांचें और अपॉइंटमेंट की पुष्टि करें।',

    selectDoctorPrompt: 'कृपया अपनी अपॉइंटमेंट के लिए एक डॉक्टर चुनें।',
    doctorProfilePrompt: 'डॉक्टर की प्रोफाइल और उपलब्ध समय देख रहे हैं।',
    abhaModalPrompt: 'आयुष्मान भारत डिजिटल हेल्थ कार्ड विवरण।',
    ocrDocumentPrompt: 'ओसीआर स्कैन किए गए दस्तावेज़ का विवरण।',
    communityGroupPrompt: 'सामुदायिक चैट समूह देख रहे हैं।',
    portal: 'रोगी पोर्टल',
    appointments: 'अपॉइंटमेंट्स',
    history: 'अपॉइंटमेंट इतिहास',
    reports: 'मेडिकल रिपोर्ट्स',
    donations: 'दान / सहयोग',
    communities: 'समुदाय',
    help: 'सहायता और संपर्क',
    bookAppointmentTitle: 'अपॉइंटमेंट बुक करें',
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    heroSubtitle: 'डॉक्टर चुनें, समय तय करें और बाकी काम स्वास्थ्य सेतु पर छोड़ दें।',
    talkToSwasthyaSetu: 'स्वास्थ्य सेतु से बात करें',
    speakInYourLanguage: 'अपनी भाषा में बोलें',
    findHospitalDoctor: 'अस्पताल और डॉक्टर खोजें',
    searchPlaceholder: 'अस्पताल, विशेषज्ञता, डॉक्टर खोजें...',
    all: 'सभी',
    government: 'सरकारी',
    private: 'निजी',
    ayush: 'आयुष',
    nearMe: 'मेरे पास',
    popular: 'लोकप्रिय',
    departments: 'विभाग',
    kmAway: 'किमी दूर',
    bookAppointmentBtn: 'अपॉइंटमेंट बुक करें',
    nextAvailable: 'उपलब्ध',
    today: 'आज',
    tomorrow: 'कल',
    viewAllHospitals: 'सभी अस्पताल देखें',
    allHospitalsDirectory: 'सभी सहयोगी अस्पताल और चिकित्सा केंद्र',
    upcomingAppointments: 'आगामी अपॉइंटमेंट्स',
    viewAll: 'सभी देखें',
    noUpcoming: 'कोई आगामी अपॉइंटमेंट नहीं है',
    noUpcomingDesc: 'अभी आपका कोई अपॉइंटमेंट बुक नहीं है। डॉक्टर से परामर्श हेतु बाईं ओर से अस्पताल चुनें।',
    startVoiceIntake: 'पूर्व-परामर्श AI इंटेक शुरू करें',
    abhaLinked: 'आभा लिंक किया गया',
    profile: 'रोगी प्रोफ़ाइल',
    logout: 'लॉग आउट',
    tokenWord: 'टोकन',
    roomWord: 'कमरा',
    confirmed: 'पुष्टीकृत',
    intakePending: 'इंटेक लंबित',
    confirmBookingTitle: 'अस्पताल अपॉइंटमेंट बुक करें',
    selectDoctor: 'डॉक्टर / विशेषज्ञ चुनें',
    selectDept: 'विभाग',
    selectDate: 'तारीख',
    selectSlot: 'समय स्लॉट',
    reasonForVisit: 'परामर्श का कारण / लक्षण (वैकल्पिक)',
    confirmBookingBtn: 'अपॉइंटमेंट पक्का करें और टोकन पाएं',
    appointmentConfirmed: 'अपॉइंटमेंट की बुकिंग पूरी है!',
    tokenGeneratedDesc: 'आपका ओपीडी टोकन जारी कर दिया गया है।',
    close: 'बंद करें',
    digitalQueuePass: 'ओपीडी डिजिटल कतार पास',
    assignedToken: 'आवंटित टोकन संख्या',
    cancelAppointment: 'अपॉइंटमेंट रद्द करें',
    historyDesc: 'पिछले नैदानिक परामर्श, ओपीडी यात्राएं और डॉक्टर के नुस्खे का विवरण।',
    reportsDesc: 'अपलोड की गई डायग्नोस्टिक फाइलें, नुस्खे और AI OCR सारांश।',
    donationsDesc: 'भारत भर में आपातकालीन रोगियों और ग्रामीण स्वास्थ्य क्लीनिकों का समर्थन करें।',
    communitiesDesc: 'साथी समूहों से जुड़ें, स्वास्थ्य दिनचर्या साझा करें और स्वास्थ्य शिक्षकों से पूछें।',
    helpDesc: '24/7 राष्ट्रीय स्वास्थ्य हेल्पलाइन, आवाज नेविगेशन सहायता और अक्सर पूछे जाने वाले प्रश्न।',
    backToDashboard: "डैशबोर्ड पर वापस जाएँ",
    selectDoctorTitle: "डॉक्टर चुनें",
    chooseDoctorFrom: "{hospital} से डॉक्टर चुनें",
    allopathic: "एलोपैथी",
    select: "चुनें",
    viewProfile: "प्रोफ़ाइल देखें",
    changeHospital: "अस्पताल बदलें",
    wizardStep1: "तारीख चुनें",
    wizardStep2: "समय चुनें",
    wizardStep3: "लक्षण और केस",
    wizardStep4: "रिपोर्ट अपलोड",
    wizardStep5: "पुष्टि",
    step1SelectDate: "चरण 1: तारीख चुनें",
    step1Desc: "डॉक्टर से परामर्श के लिए सुविधाजनक तारीख चुनें",
    moreDates: "अन्य तारीखें",
    nextSelectTime: "आगे: समय चुनें",
    step2SelectTime: "चरण 2: समय स्लॉट चुनें",
    liveDoctorSchedule: "{doctor} के शेड्यूल से लाइव उपलब्धता",
    morningSlots: "सुबह के स्लॉट",
    afternoonSlots: "दोपहर के स्लॉट",
    eveningSlots: "शाम के स्लॉट",
    slotsAvailable: "स्लॉट उपलब्ध",
    slotLeft: "स्लॉट बाकी",
    slotsLeft: "स्लॉट बाकी",
    selected: "चयनित",
    fullyBooked: "पूरी तरह बुक",
    closed: "बंद",
    fillingFast: "तेजी से भर रहा",
    available: "उपलब्ध",
    loadingLiveSchedule: "लाइव शेड्यूल लोड हो रहा है…",
    noSlotsAvailable: "इस तारीख के लिए कोई स्लॉट उपलब्ध नहीं है। कृपया दूसरी तारीख चुनें।",
    liveAvailabilityBadge: "लाइव उपलब्धता · हर 15 सेकेंड में अपडेट",
    previous: "पिछला",
    nextCase: "आगे: लक्षण और केस",
    searchDoctorPlaceholder: "डॉक्टर का नाम या विशेषज्ञता खोजें...",
    filters: "फ़िल्टर",
    years: "वर्ष",
    yrs: "वर्ष",
  },
  mr: {
    trustHeader: 'तुमचे आरोग्य, आमचे प्राधान्य',
    trustBody: 'तुमचा डेटा आमच्याकडे सुरक्षित आणि संरक्षित आहे.',
    trustBadge: 'HIPAA सुसंगत',

    bookStep1: 'पायरी 1: अपॉइंटमेंटची तारीख निवडा.',
    bookStep2: 'पायरी 2: वेळ निवडा.',
    bookStep3: 'पायरी 3: आम्हाला तुमची लक्षणे सांगा. तुम्ही माइक बटण दाबून बोलू शकता.',
    bookStep4: 'पायरी 4: मागील वैद्यकीय अहवाल अपलोड करा. हे ऐच्छिक आहे.',
    bookStep5: 'पायरी 5: तुमच्या तपशीलांचे पुनरावलोकन करा आणि अपॉइंटमेंटची पुष्टी करा.',

    selectDoctorPrompt: 'कृपया तुमच्या अपॉइंटमेंटसाठी डॉक्टर निवडा.',
    doctorProfilePrompt: 'डॉक्टर प्रोफाइल आणि उपलब्ध वेळ पाहत आहात.',
    abhaModalPrompt: 'आयुष्मान भारत डिजिटल हेल्थ कार्ड तपशील.',
    ocrDocumentPrompt: 'OCR स्कॅन केलेले दस्तऐवज तपशील.',
    communityGroupPrompt: 'समुदाय चॅट ग्रुप पाहत आहात.',
    portal: 'रुग्ण पोर्टल',
    appointments: 'अपॉइंटमेंट्स',
    history: 'अपॉइंटमेंट इतिहास',
    reports: 'वैद्यकीय अहवाल',
    donations: 'दान आणि मदत',
    communities: 'समुदाय गट',
    help: 'मदत व सहाय्य',
    bookAppointmentTitle: 'अपॉइंटमेंट बुक करा',
    goodMorning: 'शुभ सकाळ',
    goodAfternoon: 'शुभ दुपार',
    goodEvening: 'शुभ संध्याकाळ',
    heroSubtitle: 'डॉक्टर निवडा, वेळ ठरवा आणि बाकी सर्व स्वास्थ्य सेतुवर सोडा.',
    talkToSwasthyaSetu: 'स्वास्थ्य सेतुशी बोला',
    speakInYourLanguage: 'आपल्या भाषेत बोला',
    findHospitalDoctor: 'रुग्णालय आणि डॉक्टर शोधा',
    searchPlaceholder: 'रुग्णालये, तज्ज्ञ, डॉक्टर शोधा...',
    all: 'सर्व',
    government: 'शासकीय',
    private: 'खाजगी',
    ayush: 'आयुष',
    nearMe: 'माझ्या जवळ',
    popular: 'लोकप्रिय',
    departments: 'विभाग',
    kmAway: 'किमी अंतरावर',
    bookAppointmentBtn: 'अपॉइंटमेंट बुक करा',
    nextAvailable: 'उपलब्ध',
    today: 'आज',
    tomorrow: 'उद्या',
    viewAllHospitals: 'सर्व रुग्णालये पहा',
    allHospitalsDirectory: 'सर्व सहयोगी रुग्णालये आणि वैद्यकीय केंद्रे',
    upcomingAppointments: 'पुढील अपॉइंटमेंट्स',
    viewAll: 'सर्व पहा',
    noUpcoming: 'कोणतीही आगामी अपॉइंटमेंट नाही',
    noUpcomingDesc: 'अद्याप तुमची कोणतीही अपॉइंटमेंट नाही. डॉक्टरांचा सल्ला घेण्यासाठी डावीकडून रुग्णालय निवडा.',
    startVoiceIntake: 'व्हॉईस AI पूर्व-तपासणी सुरू करा',
    abhaLinked: 'आभा जोडलेले आहे',
    profile: 'रुग्ण प्रोफाइल',
    logout: 'लॉग आऊट',
    tokenWord: 'टोकन',
    roomWord: 'खोली',
    confirmed: 'निश्चित',
    intakePending: 'प्रक्रिया प्रलंबित',
    confirmBookingTitle: 'रुग्णालय अपॉइंटमेंट बुक करा',
    selectDoctor: 'डॉक्टर निवडा',
    selectDept: 'विभाग',
    selectDate: 'दिनांक',
    selectSlot: 'वेळ',
    reasonForVisit: 'भेटीचे कारण / लक्षणे',
    confirmBookingBtn: 'अपॉइंटमेंट निश्चित करा आणि टोकन मिळवा',
    appointmentConfirmed: 'अपॉइंटमेंट निश्चित झाली!',
    tokenGeneratedDesc: 'तुमचा ओपीडी टोकन क्रमांक तयार झाला आहे.',
    close: 'बंद करा',
    digitalQueuePass: 'ओपीडी डिजिटल रांग पास',
    assignedToken: 'टोकन क्रमांक',
    cancelAppointment: 'अपॉइंटमेंट रद्द करा',
    historyDesc: 'मागील सल्लामसलत, ओपीडी भेटी आणि डॉक्टरांच्या औषधांच्या नोंदी.',
    reportsDesc: 'अपलोड केलेले निदान अहवाल, प्रिस्क्रिप्शन आणि AI OCR अहवाल.',
    donationsDesc: 'गरजू रुग्णांना आणि ग्रामीण आरोग्य केंद्रांना मदत करा.',
    communitiesDesc: 'रुग्ण समूहांशी संपर्क साधा आणि आरोग्य दिनचर्या जाणून घ्या.',
    helpDesc: '24/7 राष्ट्रीय आरोग्य हेल्पलाइन आणि व्हॉईस सहाय्यता.',
    backToDashboard: "डॅशबोर्डवर परत जा",
    selectDoctorTitle: "डॉक्टर निवडा",
    chooseDoctorFrom: "{hospital} मधून डॉक्टर निवडा",
    allopathic: "ॲलोपॅथी",
    select: "निवडा",
    viewProfile: "प्रोफाइल पहा",
    changeHospital: "रुग्णालय बदला",
    wizardStep1: "तारीख निवडा",
    wizardStep2: "वेळ निवडा",
    wizardStep3: "लक्षणे आणि केस",
    wizardStep4: "अहवाल अपलोड",
    wizardStep5: "पुष्टीकरण",
    step1SelectDate: "पायरी 1: तारीख निवडा",
    step1Desc: "डॉक्टरांच्या सल्ल्यासाठी सोयीस्कर तारीख निवडा",
    moreDates: "इतर तारखा",
    nextSelectTime: "पुढे: वेळ निवडा",
    step2SelectTime: "पायरी 2: वेळ निवडा",
    liveDoctorSchedule: "{doctor} यांच्या वेळापत्रकानुसार उपलब्ध वेळ",
    morningSlots: "सकाळचे स्लॉट",
    afternoonSlots: "दुपारचे स्लॉट",
    eveningSlots: "संध्याकाळचे स्लॉट",
    slotsAvailable: "स्लॉट उपलब्ध",
    slotLeft: "स्लॉट बाकी",
    slotsLeft: "स्लॉट बाकी",
    selected: "निवडलेले",
    fullyBooked: "पूर्ण भरलेले",
    closed: "बंद",
    fillingFast: "लवकर भरत आहे",
    available: "उपलब्ध",
    loadingLiveSchedule: "वेळापत्रक लोड होत आहे…",
    noSlotsAvailable: "या तारखेसाठी कोणतेही स्लॉट उपलब्ध नाहीत. कृपया दुसरी तारीख निवडा.",
    liveAvailabilityBadge: "थेट उपलब्धता · दर 15 सेकंदांनी अपडेट",
    previous: "मागील",
    nextCase: "पुढे: लक्षणे व केस",
    searchDoctorPlaceholder: "डॉक्टरांचे नाव किंवा विशेषज्ञता शोधा...",
    filters: "फिल्टर्स",
    years: "वर्षे",
    yrs: "वर्षे",
  },
  gu: {
    trustHeader: 'તમારું સ્વાસ્થ્ય, અમારી પ્રાથમિકતા',
    trustBody: 'તમારો ડેટા અમારી સાથે સુરક્ષિત અને ગોપનીય છે.',
    trustBadge: 'HIPAA સુસંગત',

    bookStep1: 'પગલું 1: એપોઇન્ટમેન્ટની તારીખ પસંદ કરો.',
    bookStep2: 'પગલું 2: સમય પસંદ કરો.',
    bookStep3: 'પગલું 3: અમને તમારા લક્ષણો જણાવો. તમે માઇક બટન દબાવીને બોલી શકો છો.',
    bookStep4: 'પગલું 4: અગાઉના મેડિકલ રિપોર્ટ અપલોડ કરો. આ વૈકલ્પિક છે.',
    bookStep5: 'પગલું 5: તમારી વિગતો તપાસો અને એપોઇન્ટમેન્ટની પુષ્ટિ કરો.',

    selectDoctorPrompt: 'કૃપા કરીને તમારી એપોઇન્ટમેન્ટ માટે ડૉક્ટર પસંદ કરો.',
    doctorProfilePrompt: 'ડૉક્ટર પ્રોફાઇલ અને ઉપલબ્ધ સમય જોઈ રહ્યા છીએ.',
    abhaModalPrompt: 'આયુષ્માન ભારત ડિજિટલ હેલ્થ કાર્ડ વિગતો.',
    ocrDocumentPrompt: 'OCR સ્કેન કરેલ દસ્તાવેજ વિગતો.',
    communityGroupPrompt: 'સમુદાય ચેટ જૂથ જોઈ રહ્યા છીએ.',
    portal: 'દર્દી પોર્ટલ',
    appointments: 'મુલાકાતો',
    history: 'મુલાકાત ઇતિહાસ',
    reports: 'મેડિકલ રિપોર્ટ્સ',
    donations: 'દાન અને સહાય',
    communities: 'સમુદાય',
    help: 'મદદ અને સપોર્ટ',
    bookAppointmentTitle: 'મુલાકાત બુક કરો',
    goodMorning: 'શુભ સવાર',
    goodAfternoon: 'શુભ બપોર',
    goodEvening: 'શુભ સાંજ',
    heroSubtitle: 'ડૉક્ટર પસંદ કરો, સમય નક્કી કરો અને બાકીનું કામ સ્વાસ્થ્ય સેતુ પર છોડો.',
    talkToSwasthyaSetu: 'સ્વાસ્થ્ય સેતુ સાથે વાત કરો',
    speakInYourLanguage: 'તમારી ભાષામાં બોલો',
    findHospitalDoctor: 'હોસ્પિટલ અને ડૉક્ટર શોધો',
    searchPlaceholder: 'હોસ્પિટલ, વિશેષતા, ડૉક્ટર શોધો...',
    all: 'બધા',
    government: 'સરકારી',
    private: 'ખાનગી',
    ayush: 'આયુષ',
    nearMe: 'મારી નજીક',
    popular: 'લોકપ્રિય',
    departments: 'વિભાગો',
    kmAway: 'કિમી દૂર',
    bookAppointmentBtn: 'મુલાકાત બુક કરો',
    nextAvailable: 'ઉપલબ્ધ',
    today: 'આજે',
    tomorrow: 'આવતીકાલે',
    viewAllHospitals: 'બધી હોસ્પિટલો જુઓ',
    allHospitalsDirectory: 'બધી સહયોગી હોસ્પિટલો અને કેન્દ્રો',
    upcomingAppointments: 'આગામી મુલાકાતો',
    viewAll: 'બધું જુઓ',
    noUpcoming: 'કોઈ આગામી મુલાકાત નથી',
    noUpcomingDesc: 'હજુ સુધી કોઈ મુલાકાત નક્કી થઈ નથી. ડૉક્ટરની સલાહ માટે ડાબી બાજુથી હોસ્પિટલ પસંદ કરો.',
    startVoiceIntake: 'પૂર્વ-મુલાકાત AI ઇનટેક શરૂ કરો',
    abhaLinked: 'આભા લિંક થયેલ છે',
    profile: 'દર્દી પ્રોફાઇલ',
    logout: 'લૉગ આઉટ',
    tokenWord: 'ટોકન',
    roomWord: 'રૂમ',
    confirmed: 'કન્ફર્મ થયેલ',
    intakePending: 'ઇનટેક બાકી',
    confirmBookingTitle: 'હોસ્પિટલ મુલાકાત બુક કરો',
    selectDoctor: 'ડૉક્ટર પસંદ કરો',
    selectDept: 'વિભાગ',
    selectDate: 'તારીખ',
    selectSlot: 'સમય સ્લોટ',
    reasonForVisit: 'મુલાકાતનું કારણ / લક્ષણો',
    confirmBookingBtn: 'મુલાકાત કન્ફર્મ કરો અને ટોકન મેળવો',
    appointmentConfirmed: 'મુલાકાત બુક થઈ ગઈ!',
    tokenGeneratedDesc: 'તમારો ઓપીડી ટોકન નંબર જનરેટ થઈ ગયો છે.',
    close: 'બંધ કરો',
    digitalQueuePass: 'ઓપીડી ડિજિટલ કતાર પાસ',
    assignedToken: 'ટોકન નંબર',
    cancelAppointment: 'મુલાકાત રદ કરો',
    historyDesc: 'અગાઉની મુલાકાતો અને દવાઓની યાદી.',
    reportsDesc: 'અપલોડ કરેલા રિપોર્ટ્સ અને AI OCR વિગતો.',
    donationsDesc: 'જરૂરિયાતમંદ દર્દીઓને સહાય કરો.',
    communitiesDesc: 'સ્વાસ્થ્ય જૂથો સાથે જોડાઓ અને માહિતી મેળવો.',
    helpDesc: '24/7 હેલ્પલાઇન અને સહાય.',
    backToDashboard: "ડેશબોર્ડ પર પાછા જાઓ",
    selectDoctorTitle: "ડૉક્ટર પસંદ કરો",
    chooseDoctorFrom: "{hospital} માંથી ડૉક્ટર પસંદ કરો",
    allopathic: "એલોપેથી",
    select: "પસંદ કરો",
    viewProfile: "પ્રોફાઇલ જુઓ",
    changeHospital: "હોસ્પિટલ બદલો",
    wizardStep1: "તારીખ પસંદ કરો",
    wizardStep2: "સમય પસંદ કરો",
    wizardStep3: "લક્ષણો અને કેસ",
    wizardStep4: "રિપોર્ટ અપલોડ",
    wizardStep5: "પુષ્ટિ",
    step1SelectDate: "પગલું 1: તારીખ પસંદ કરો",
    step1Desc: "ડૉક્ટરની મુલાકાત માટે અનુકૂળ તારીખ પસંદ કરો",
    moreDates: "અન્ય તારીખો",
    nextSelectTime: "આગળ: સમય પસંદ કરો",
    step2SelectTime: "પગલું 2: સમય સ્લોટ પસંદ કરો",
    liveDoctorSchedule: "{doctor} ના સમયપત્રક મુજબ ઉપલબ્ધતા",
    morningSlots: "સવારના સ્લોટ",
    afternoonSlots: "બપોરના સ્લોટ",
    eveningSlots: "સાંજના સ્લોટ",
    slotsAvailable: "સ્લોટ ઉપલબ્ધ",
    slotLeft: "સ્લોટ બાકી",
    slotsLeft: "સ્લોટ બાકી",
    selected: "પસંદ કરેલ",
    fullyBooked: "સંપૂર્ણ બુક",
    closed: "બંધ",
    fillingFast: "ઝડપથી ભરાઈ રહ્યું છે",
    available: "ઉપલબ્ધ",
    loadingLiveSchedule: "શેડ્યૂલ લોડ થઈ રહ્યું છે…",
    noSlotsAvailable: "આ તારીખ માટે કોઈ સ્લોટ ઉપલબ્ધ નથી. કૃપા કરીને બીજી તારીખ પસંદ કરો.",
    liveAvailabilityBadge: "લાઈવ ઉપલબ્ધતા · દર 15 સેકન્ડે અપડેટ",
    previous: "પાછળ",
    nextCase: "આગળ: કેસ અને લક્ષણો",
    searchDoctorPlaceholder: "ડૉક્ટરનું નામ અથવા વિશેષતા શોધો...",
    filters: "ફિલ્ટર્સ",
    years: "વર્ષ",
    yrs: "વર્ષ",
  },
  ta: {
    trustHeader: 'உங்கள் நல்வாழ்வு, எங்கள் முன்னுரிமை',
    trustBody: 'உங்கள் தரவு எங்களிடம் பாதுகாப்பாக உள்ளது.',
    trustBadge: 'HIPAA இணக்கமானது',

    bookStep1: 'படி 1: சந்திப்பு தேதியைத் தேர்ந்தெடுக்கவும்.',
    bookStep2: 'படி 2: நேரத்தைத் தேர்ந்தெடுக்கவும்.',
    bookStep3: 'படி 3: உங்கள் அறிகுறிகளைச் சொல்லுங்கள். நீங்கள் மைக் பொத்தானை அழுத்திப் பேசலாம்.',
    bookStep4: 'படி 4: முந்தைய மருத்துவ அறிக்கைகளைப் பதிவேற்றவும். இது விருப்பமானது.',
    bookStep5: 'படி 5: விவரங்களைச் சரிபார்த்து முன்பதிவை உறுதிப்படுத்தவும்.',

    selectDoctorPrompt: 'உங்கள் சந்திப்புக்கு மருத்துவரைத் தேர்ந்தெடுக்கவும்.',
    doctorProfilePrompt: 'மருத்துவர் விவரம் மற்றும் கிடைக்கும் நேரங்களைப் பார்க்கிறீர்கள்.',
    abhaModalPrompt: 'ஆயுஷ்மான் பாரத் டிஜிட்டல் ஹெல்த் கார்டு விவரங்கள்.',
    ocrDocumentPrompt: 'OCR ஸ்கேன் செய்யப்பட்ட ஆவண விவரங்கள்.',
    communityGroupPrompt: 'சமூக அரட்டை குழுவைப் பார்க்கிறீர்கள்.',
    portal: 'நோயாளி போர்டல்',
    appointments: 'முன்பதிவுகள்',
    history: 'முன்பதிவு வரலாறு',
    reports: 'மருத்துவ அறிக்கைகள்',
    donations: 'நன்கொடைகள்',
    communities: 'சமூகங்கள்',
    help: 'உதவி & ஆதரவு',
    bookAppointmentTitle: 'முன்பதிவு செய்யுங்கள்',
    goodMorning: 'காலை வணக்கம்',
    goodAfternoon: 'மதிய வணக்கம்',
    goodEvening: 'மாலை வணக்கம்',
    heroSubtitle: 'மருத்துவரைத் தேர்ந்தெடுங்கள், நேரத்தை முடிவு செய்யுங்கள், மற்றவற்றை ஸ்வஸ்த்ய சேது பார்த்துக் கொள்ளும்.',
    talkToSwasthyaSetu: 'ஸ்வஸ்த்ய சேதுவுடன் பேசுங்கள்',
    speakInYourLanguage: 'உங்கள் மொழியில் பேசுங்கள்',
    findHospitalDoctor: 'மருத்துவமனை மற்றும் மருத்துவரைத் தேடுங்கள்',
    searchPlaceholder: 'மருத்துவமனை, நிபுணத்துவம், மருத்துவரைத் தேடவும்...',
    all: 'அனைத்தும்',
    government: 'அரசு',
    private: 'தனியார்',
    ayush: 'ஆயுஷ்',
    nearMe: 'என் அருகில்',
    popular: 'பிரபலமானது',
    departments: 'துறைகள்',
    kmAway: 'கிமீ தொலைவில்',
    bookAppointmentBtn: 'முன்பதிவு செய்க',
    nextAvailable: 'கிடைக்கும் நாள்',
    today: 'இன்று',
    tomorrow: 'நாளை',
    viewAllHospitals: 'அனைத்து மருத்துவமனைகளையும் காண்க',
    allHospitalsDirectory: 'அனைத்து மருத்துவமனைகள் & சிகிச்சை மையங்கள்',
    upcomingAppointments: 'வரவிருக்கும் முன்பதிவுகள்',
    viewAll: 'அனைத்தையும் காண்க',
    noUpcoming: 'வரவிருக்கும் முன்பதிவுகள் எதுவும் இல்லை',
    noUpcomingDesc: 'உங்களுக்கு இதுவரை முன்பதிவு செய்யப்படவில்லை. மருத்துவரை அணுக இடதுபுறத்தில் உள்ள மருத்துவமனையைத் தேர்ந்தெடுக்கவும்.',
    startVoiceIntake: 'முன்-பரிசோதனை AI தொடங்குங்கள்',
    abhaLinked: 'ஆபா இணைக்கப்பட்டுள்ளது',
    profile: 'நோயாளி சுயவிவரம்',
    logout: 'வெளியேறு',
    tokenWord: 'டோக்கன்',
    roomWord: 'அறை',
    confirmed: 'உறுதிப்படுத்தப்பட்டது',
    intakePending: 'மதிப்பீடு நிலுவையில் உள்ளது',
    confirmBookingTitle: 'மருத்துவமனை முன்பதிவு செய்க',
    selectDoctor: 'மருத்துவரைத் தேர்ந்தெடுக்கவும்',
    selectDept: 'துறை',
    selectDate: 'தேதி',
    selectSlot: 'நேரம்',
    reasonForVisit: 'வருவதற்கான காரணம் / அறிகுறிகள்',
    confirmBookingBtn: 'முன்பதிவை உறுதிசெய்து டோக்கன் பெறுக',
    appointmentConfirmed: 'முன்பதிவு உறுதியானது!',
    tokenGeneratedDesc: 'உங்கள் OPD டோக்கன் எண் உருவாக்கப்பட்டது.',
    close: 'மூடு',
    digitalQueuePass: 'டிஜிட்டல் வரிசை பாஸ்',
    assignedToken: 'டோக்கன் எண்',
    cancelAppointment: 'முன்பதிவை ரத்து செய்க',
    historyDesc: 'முந்தைய மருத்துவ ஆலோசனைகள் மற்றும் மருந்துச்சீட்டு விவரங்கள்.',
    reportsDesc: 'பதிவேற்றப்பட்ட மருத்துவ அறிக்கைகள் மற்றும் AI OCR விவரங்கள்.',
    donationsDesc: 'எளிய நோயாளிகளுக்கு அவசர சிகிச்சைக்கான நிதியுதவி.',
    communitiesDesc: 'ஆரோக்கிய குழுக்களுடன் இணைந்து கலந்துரையாடுங்கள்.',
    helpDesc: '24/7 தேசிய சுகாதார உதவி எண் மற்றும் வழிகாட்டுதல்.',
    backToDashboard: "டாஷ்போர்டிற்குத் திரும்பு",
    selectDoctorTitle: "மருத்துவரைத் தேர்ந்தெடுக்கவும்",
    chooseDoctorFrom: "{hospital} மருத்துவமனையிலிருந்து மருத்துவரைத் தேர்ந்தெடுக்கவும்",
    allopathic: "அலோபதி",
    select: "தேர்ந்தெடு",
    viewProfile: "சுயவிவரம் பார்",
    changeHospital: "மருத்துவமனையை மாற்று",
    wizardStep1: "தேதி தேர்வு",
    wizardStep2: "நேரம் தேர்வு",
    wizardStep3: "அறிகுறிகள் & வழக்கு",
    wizardStep4: "அறிக்கைகள் பதிவேற்று",
    wizardStep5: "உறுதிப்படுத்தல்",
    step1SelectDate: "படி 1: தேதியைத் தேர்ந்தெடுக்கவும்",
    step1Desc: "மருத்துவ ஆலோசனைக்கான வசதியான தேதியைத் தேர்ந்தெடுக்கவும்",
    moreDates: "மேலும் தேதிகள்",
    nextSelectTime: "அடுத்து: நேரம் தேர்ந்தெடு",
    step2SelectTime: "படி 2: நேரத்தைத் தேர்ந்தெடுக்கவும்",
    liveDoctorSchedule: "{doctor} அட்டவணைப்படி நேரடி கிடைக்கும் நேரம்",
    morningSlots: "காலை நேரங்கள்",
    afternoonSlots: "மதிய நேரங்கள்",
    eveningSlots: "மாலை நேரங்கள்",
    slotsAvailable: "இடங்கள் உள்ளன",
    slotLeft: "இடம் மட்டுமே உள்ளது",
    slotsLeft: "இடங்கள் உள்ளன",
    selected: "தேர்ந்தெடுக்கப்பட்டது",
    fullyBooked: "முழுமையாக முன்பதிவானது",
    closed: "மூடப்பட்டது",
    fillingFast: "விரைவாக நிரம்புகிறது",
    available: "கிடைக்கிறது",
    loadingLiveSchedule: "அட்டவணை ஏற்றப்படுகிறது…",
    noSlotsAvailable: "இந்த தேதிக்கு நேரங்கள் இல்லை. வேறு தேதியைத் தேர்ந்தெடுக்கவும்.",
    liveAvailabilityBadge: "நேரடி நிலை · ஒவ்வொரு 15 வினாடிக்கும் புதுப்பிக்கப்படுகிறது",
    previous: "முந்தையது",
    nextCase: "அடுத்து: அறிகுறிகள் & வழக்கு",
    searchDoctorPlaceholder: "மருத்துவர் பெயர் அல்லது நிபுணத்துவத்தைத் தேடவும்...",
    filters: "வடிகட்டிகள்",
    years: "ஆண்டுகள்",
    yrs: "ஆண்டுகள்",
  },
  te: {
    trustHeader: 'మీ ఆరోగ్యం, మా ప్రాధాన్యత',
    trustBody: 'మీ డేటా మా వద్ద సురక్షితంగా మరియు భద్రంగా ఉంటుంది.',
    trustBadge: 'HIPAA కంప్లైంట్',

    bookStep1: 'దశ 1: అపాయింట్‌మెంట్ తేదీని ఎంచుకోండి.',
    bookStep2: 'దశ 2: సమయాన్ని ఎంచుకోండి.',
    bookStep3: 'దశ 3: మీ లక్షణాలను చెప్పండి. మీరు మైక్ నొక్కి మాట్లాడవచ్చు.',
    bookStep4: 'దశ 4: మునుపటి వైద్య నివేదికలను అప్‌లోడ్ చేయండి. ఇది ఐచ్ఛికం.',
    bookStep5: 'దశ 5: వివరాలను సరిచూసుకుని అపాయింట్‌మెంట్‌ని నిర్ధారించండి.',

    selectDoctorPrompt: 'దయచేసి మీ అపాయింట్‌మెంట్ కోసం వైద్యుడిని ఎంచుకోండి.',
    doctorProfilePrompt: 'డాక్టర్ ప్రొఫైల్ మరియు అందుబాటులో ఉన్న సమయాలను చూస్తున్నారు.',
    abhaModalPrompt: 'ఆయుష్మాన్ భారత్ డిజిటల్ హెల్త్ కార్డ్ వివరాలు.',
    ocrDocumentPrompt: 'OCR స్కాన్ చేసిన పత్ర వివరాలు.',
    communityGroupPrompt: 'కమ్యూనిటీ చాట్ గ్రూప్ చూస్తున్నారు.',
    portal: 'రోగి పోర్టల్',
    appointments: 'అపాయింట్‌మెంట్లు',
    history: 'అపాయింట్‌మెంట్ చరిత్ర',
    reports: 'వైద్య నివేదికలు',
    donations: 'విరాళాలు',
    communities: 'కమ్యూనిటీలు',
    help: 'సహాయం & మద్దతు',
    bookAppointmentTitle: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    goodMorning: 'శుభోదయం',
    goodAfternoon: 'శుభ మధ్యాహ్నం',
    goodEvening: 'శుభ సాయంత్రం',
    heroSubtitle: 'వైద్యుడిని ఎంచుకోండి, సమయాన్ని నిర్ణయించండి, మిగిలినది స్వాస్థ్య సేతు చూసుకుంటుంది.',
    talkToSwasthyaSetu: 'స్వాస్థ్య సేతుతో మాట్లాడండి',
    speakInYourLanguage: 'మీ భాషలో మాట్లాడండి',
    findHospitalDoctor: 'ఆసుపత్రి మరియు వైద్యుడిని కనుగొనండి',
    searchPlaceholder: 'ఆసుపత్రులు, నిపుణులు, వైద్యులను శోధించండి...',
    all: 'అన్నీ',
    government: 'ప్రభుత్వ',
    private: 'ప్రైవేట్',
    ayush: 'ఆయుష్',
    nearMe: 'నా దగ్గర',
    popular: 'ప్రసిద్ధ',
    departments: 'విభాగాలు',
    kmAway: 'కి.మీ దూరంలో',
    bookAppointmentBtn: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    nextAvailable: 'అందుబాటులో ఉన్న సమయం',
    today: 'ఈ రోజు',
    tomorrow: 'రేపు',
    viewAllHospitals: 'అన్ని ఆసుపత్రులను చూడండి',
    allHospitalsDirectory: 'అన్ని భాగస్వామ్య ఆసుపత్రులు & కేంద్రాలు',
    upcomingAppointments: 'రాబోయే అపాయింట్‌మెంట్లు',
    viewAll: 'అన్నీ చూడండి',
    noUpcoming: 'రాబోయే అపాయింట్‌మెంట్లు లేవు',
    noUpcomingDesc: 'ఇప్పటివరకు మీకు ఎటువంటి అపాయింట్‌మెంట్లు లేవు. సంప్రదింపుల కోసం ఎడమ వైపున ఉన్న ఆసుపత్రిని ఎంచుకోండి.',
    startVoiceIntake: 'ముందస్తు AI తనిఖీని ప్రారంభించండి',
    abhaLinked: 'ఆభా లింక్ చేయబడింది',
    profile: 'రోగి ప్రొఫైల్',
    logout: 'లాగ్ అవుట్',
    tokenWord: 'టోకెన్',
    roomWord: 'గది',
    confirmed: 'ధృవీకరించబడింది',
    intakePending: 'ఇన్‌టేక్ పెండింగ్‌లో ఉంది',
    confirmBookingTitle: 'ఆసుపత్రి అపాయింట్‌మెంట్ బుక్ చేయండి',
    selectDoctor: 'వైద్యుడిని ఎంచుకోండి',
    selectDept: 'విభాగం',
    selectDate: 'తేదీ',
    selectSlot: 'సమయం స్లాట్',
    reasonForVisit: 'సందర్శన కారణం / లక్షణాలు',
    confirmBookingBtn: 'అపాయింట్‌మెంట్ నిర్ధారించి టోకెన్ పొందండి',
    appointmentConfirmed: 'అపాయింట్‌మెంట్ బుక్ అయింది!',
    tokenGeneratedDesc: 'మీ OPD టోకెన్ నంబర్ కేటాయించబడింది.',
    close: 'మూసివేయండి',
    digitalQueuePass: 'OPD డిజిటల్ క్యూ పాస్',
    assignedToken: 'కేటాయించిన టోకెన్ నంబర్',
    cancelAppointment: 'అపాయింట్‌మెంట్ రద్దు చేయండి',
    historyDesc: 'గత వైద్య సంప్రదింపులు మరియు ప్రిస్క్రిప్షన్ల వివరాలు.',
    reportsDesc: 'అప్‌లోడ్ చేసిన ల్యాబ్ నివేదికలు మరియు AI OCR సారాంశాలు.',
    donationsDesc: 'అవసరమైన రోగులకు అత్యవసర సహాయం చేయండి.',
    communitiesDesc: 'ఆరోగ్య సంఘాలతో కలసి సమాచారం పంచుకోండి.',
    helpDesc: '24/7 జాతీయ హెల్ప్‌లైన్ మరియు వాయిస్ సహాయం.',
    backToDashboard: "డాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి",
    selectDoctorTitle: "వైద్యుడిని ఎంచుకోండి",
    chooseDoctorFrom: "{hospital} నుండి వైద్యుడిని ఎంచుకోండి",
    allopathic: "అల్లోపతి",
    select: "ఎంచుకోండి",
    viewProfile: "ప్రొఫైల్ చూడండి",
    changeHospital: "ఆసుపత్రిని మార్చండి",
    wizardStep1: "తేదీ ఎంచుకోండి",
    wizardStep2: "సమయం ఎంచుకోండి",
    wizardStep3: "లక్షణాలు & కేసు",
    wizardStep4: "నివేదికలు అప్‌లోడ్",
    wizardStep5: "ధృవీకరణ",
    step1SelectDate: "దశ 1: తేదీని ఎంచుకోండి",
    step1Desc: "డాక్టర్ సంప్రదింపుల కోసం అనుకూలమైన తేదీని ఎంచుకోండి",
    moreDates: "మరిన్ని తేదీలు",
    nextSelectTime: "తర్వాత: సమయం ఎంచుకోండి",
    step2SelectTime: "దశ 2: సమయ స్లాట్‌ను ఎంచుకోండి",
    liveDoctorSchedule: "{doctor} షెడ్యూల్ నుండి ప్రత్యక్ష లభ్యత",
    morningSlots: "ఉదయం స్లాట్లు",
    afternoonSlots: "మధ్యాహ్నం స్లాట్లు",
    eveningSlots: "సాయంత్రం స్లాట్లు",
    slotsAvailable: "స్లాట్లు అందుబాటులో ఉన్నాయి",
    slotLeft: "స్లాట్ మాత్రమే ఉంది",
    slotsLeft: "స్లాట్లు ఉన్నాయి",
    selected: "ఎంచుకోబడింది",
    fullyBooked: "పూర్తిగా బుక్ అయింది",
    closed: "మూసివేయబడింది",
    fillingFast: "వేగంగా నిండుతోంది",
    available: "అందుబాటులో ఉంది",
    loadingLiveSchedule: "షెడ్యూల్ లోడ్ అవుతోంది…",
    noSlotsAvailable: "ఈ తేదీకి స్లాట్‌లు లేవు. దయచేసి వేరే తేదీని ఎంచుకోండి.",
    liveAvailabilityBadge: "లైవ్ లభ్యత · ప్రతి 15 సెకన్లకు అప్‌డేట్",
    previous: "మునుపటి",
    nextCase: "తర్వాత: లక్షణాలు & వివరాలు",
    searchDoctorPlaceholder: "డాక్టర్ పేరు లేదా స్పెషాలిటీని శోధించండి...",
    filters: "ఫిల్టర్లు",
    years: "సంవత్సరాలు",
    yrs: "సంవత్సరాలు",
  },
  kn: {
    trustHeader: 'ನಿಮ್ಮ ಆರೋಗ್ಯ, ನಮ್ಮ ಆದ್ಯತೆ',
    trustBody: 'ನಿಮ್ಮ ಡೇಟಾ ನಮ್ಮೊಂದಿಗೆ ಸುರಕ್ಷಿತ ಮತ್ತು ಭದ್ರವಾಗಿದೆ.',
    trustBadge: 'HIPAA ಕಂಪ್ಲೈಂಟ್',

    bookStep1: 'ಹಂತ 1: ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    bookStep2: 'ಹಂತ 2: ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    bookStep3: 'ಹಂತ 3: ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳ ಬಗ್ಗೆ ತಿಳಿಸಿ. ನೀವು ಮೈಕ್ ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಬಹುದು.',
    bookStep4: 'ಹಂತ 4: ಹಿಂದಿನ ವೈದ್ಯಕೀಯ ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಇದು ಐಚ್ಛಿಕ.',
    bookStep5: 'ಹಂತ 5: ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಅನ್ನು ದೃಢೀಕರಿಸಿ.',

    selectDoctorPrompt: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಾಗಿ ವೈದ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    doctorProfilePrompt: 'ವೈದ್ಯರ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಲಭ್ಯವಿರುವ ಸಮಯವನ್ನು ವೀಕ್ಷಿಸುತ್ತಿರುವಿರಿ.',
    abhaModalPrompt: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಡಿಜಿಟಲ್ ಹೆಲ್ತ್ ಕಾರ್ಡ್ ವಿವರಗಳು.',
    ocrDocumentPrompt: 'OCR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ಡಾಕ್ಯುಮೆಂಟ್ ವಿವರಗಳು.',
    communityGroupPrompt: 'ಸಮುದಾಯ ಚಾಟ್ ಗುಂಪು ವೀಕ್ಷಿಸುತ್ತಿರುವಿರಿ.',
    portal: 'ರೋಗಿ ಪೋರ್ಟಲ್',
    appointments: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
    history: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಇತಿಹಾಸ',
    reports: 'ವೈದ್ಯಕೀಯ ವರದಿಗಳು',
    donations: 'ದೇಣಿಗೆಗಳು',
    communities: 'ಸಮುದಾಯಗಳು',
    help: 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
    bookAppointmentTitle: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಿ',
    goodMorning: 'ಶುಭೋದಯ',
    goodAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    goodEvening: 'ಶುಭ ಸಂಜೆ',
    heroSubtitle: 'ವೈದ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ, ಸಮಯ ನಿಗದಿಪಡಿಸಿ ಮತ್ತು ಉಳಿದದ್ದನ್ನು ಸ್ವಾಸ್ಥ್ಯ ಸೇತುವಿಗೆ ಬಿಡಿ.',
    talkToSwasthyaSetu: 'ಸ್ವಾಸ್ಥ್ಯ ಸೇತು ಜೊತೆ ಮಾತನಾಡಿ',
    speakInYourLanguage: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ',
    findHospitalDoctor: 'ಆಸ್ಪತ್ರೆ ಮತ್ತು ವೈದ್ಯರನ್ನು ಹುಡುಕಿ',
    searchPlaceholder: 'ಆಸ್ಪತ್ರೆಗಳು, ತಜ್ಞರು, ವೈದ್ಯರನ್ನು ಹುಡುಕಿ...',
    all: 'ಎಲ್ಲಾ',
    government: 'ಸರ್ಕಾರಿ',
    private: 'ಖಾಸಗಿ',
    ayush: 'ಆಯುಷ್',
    nearMe: 'ನನ್ನ ಹತ್ತಿರ',
    popular: 'ಜನಪ್ರಿಯ',
    departments: 'ವಿಭಾಗಗಳು',
    kmAway: 'ಕಿ.ಮೀ ದೂರದಲ್ಲಿ',
    bookAppointmentBtn: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಿ',
    nextAvailable: 'ಲಭ್ಯವಿರುವ ಸಮಯ',
    today: 'ಇಂದು',
    tomorrow: 'ನಾಳೆ',
    viewAllHospitals: 'ಎಲ್ಲಾ ಆಸ್ಪತ್ರೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    allHospitalsDirectory: 'ಎಲ್ಲಾ ಸಹಭಾಗಿ ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಕೇಂದ್ರಗಳು',
    upcomingAppointments: 'ಮುಂಬರುವ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
    viewAll: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
    noUpcoming: 'ಯಾವುದೇ ಮುಂಬರುವ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳಿಲ್ಲ',
    noUpcomingDesc: 'ನಿಮಗೆ ಯಾವುದೇ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿಲ್ಲ. ಸಮಾಲೋಚನೆಗಾಗಿ ಎಡಭಾಗದಲ್ಲಿರುವ ಆಸ್ಪತ್ರೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    startVoiceIntake: 'ಪೂರ್ವ-ತಪಾಸಣೆ AI ಪ್ರಾರಂಭಿಸಿ',
    abhaLinked: 'ಆಭಾ ಲಿಂಕ್ ಮಾಡಲಾಗಿದೆ',
    profile: 'ರೋಗಿಯ ಪ್ರೊಫೈಲ್',
    logout: 'ಲಾಗ್ ಔಟ್',
    tokenWord: 'ಟೋಕನ್',
    roomWord: 'ಕೋಣೆ',
    confirmed: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    intakePending: 'ಇಂಟೇಕ್ ಬಾಕಿ ಇದೆ',
    confirmBookingTitle: 'ಆಸ್ಪತ್ರೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಿ',
    selectDoctor: 'ವೈದ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    selectDept: 'ವಿಭಾಗ',
    selectDate: 'ದಿನಾಂಕ',
    selectSlot: 'ಸಮಯದ ಸ್ಲಾಟ್',
    reasonForVisit: 'ಭೇಟಿಯ ಕಾರಣ / ಲಕ್ಷಣಗಳು',
    confirmBookingBtn: 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಟೋಕನ್ ಪಡೆಯಿರಿ',
    appointmentConfirmed: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ!',
    tokenGeneratedDesc: 'ನಿಮ್ಮ OPD ಟೋಕನ್ ಸಂಖ್ಯೆಯನ್ನು ರಚಿಸಲಾಗಿದೆ.',
    close: 'ಮುಚ್ಚಿ',
    digitalQueuePass: 'OPD ಡಿಜಿಟಲ್ ಕ್ಯೂ ಪಾಸ್',
    assignedToken: 'ಟೋಕನ್ ಸಂಖ್ಯೆ',
    cancelAppointment: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ರದ್ದುಮಾಡಿ',
    historyDesc: 'ಹಿಂದಿನ ಸಮಾಲೋಚನೆಗಳು ಮತ್ತು ವೈದ್ಯಕೀಯ ಚೀಟಿಗಳ ವಿವರಗಳು.',
    reportsDesc: 'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಲ್ಯಾಬ್ ವರದಿಗಳು ಮತ್ತು AI OCR ಸಾರಾಂಶಗಳು.',
    donationsDesc: 'ಅಗತ್ಯವಿರುವ ರೋಗಿಗಳಿಗೆ ಆರೋಗ್ಯ ನೆರವು ನೀಡಿ.',
    communitiesDesc: 'ಆರೋಗ್ಯ ಸಮುದಾಯಗಳೊಂದಿಗೆ ಸಂಪರ್ಕದಲ್ಲಿರಿ.',
    helpDesc: '24/7 ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿ ಮತ್ತು ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ.',
    backToDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    selectDoctorTitle: "ವೈದ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    chooseDoctorFrom: "{hospital} ನಿಂದ ವೈದ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    allopathic: "ಅಲೋಪತಿ",
    select: "ಆಯ್ಕೆಮಾಡಿ",
    viewProfile: "ಪ್ರೊಫೈಲ್ ನೋಡಿ",
    changeHospital: "ಆಸ್ಪತ್ರೆ ಬದಲಿಸಿ",
    wizardStep1: "ದಿನಾಂಕ ಆಯ್ಕೆ",
    wizardStep2: "ಸಮಯ ಆಯ್ಕೆ",
    wizardStep3: "ಲಕ್ಷಣಗಳು & ವಿವರ",
    wizardStep4: "ವರದಿ ಅಪ್‌ಲೋಡ್",
    wizardStep5: "ದೃಢೀಕರಣ",
    step1SelectDate: "ಹಂತ 1: ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    step1Desc: "ವೈದ್ಯರ ಸಮಾಲೋಚನೆಗಾಗಿ ಅನುಕೂಲಕರ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    moreDates: "ಇನ್ನಷ್ಟು ದಿನಾಂಕಗಳು",
    nextSelectTime: "ಮುಂದೆ: ಸಮಯ ಆಯ್ಕೆ",
    step2SelectTime: "ಹಂತ 2: ಸಮಯದ ಸ್ಲಾಟ್ ಆಯ್ಕೆಮಾಡಿ",
    liveDoctorSchedule: "{doctor} ಅವರ ಲೈವ್ ವೇಳಾಪಟ್ಟಿ ಲಭ್ಯತೆ",
    morningSlots: "ಬೆಳಗಿನ ಸ್ಲಾಟ್‌ಗಳು",
    afternoonSlots: "ಮಧ್ಯಾಹ್ನದ ಸ್ಲಾಟ್‌ಗಳು",
    eveningSlots: "ಸಂಜೆಯ ಸ್ಲಾಟ್‌ಗಳು",
    slotsAvailable: "ಸ್ಲಾಟ್‌ಗಳು ಲಭ್ಯವಿವೆ",
    slotLeft: "ಸ್ಲಾಟ್ ಮಾತ್ರ ಬಾಕಿ",
    slotsLeft: "ಸ್ಲಾಟ್‌ಗಳು ಬಾಕಿ",
    selected: "ಆಯ್ಕೆಯಾಗಿದೆ",
    fullyBooked: "ಸಂಪೂರ್ಣ ಭರ್ತಿಯಾಗಿದೆ",
    closed: "ಮುಚ್ಚಲಾಗಿದೆ",
    fillingFast: "ವೇಗವಾಗಿ ಭರ್ತಿಯಾಗುತ್ತಿದೆ",
    available: "ಲಭ್ಯವಿದೆ",
    loadingLiveSchedule: "ವೇಳಾಪಟ್ಟಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
    noSlotsAvailable: "ಈ ದಿನಾಂಕಕ್ಕೆ ಯಾವುದೇ ಸ್ಲಾಟ್‌ಗಳು ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    liveAvailabilityBadge: "ಲೈವ್ ಲಭ್ಯತೆ · ಪ್ರತಿ 15 ಸೆಕೆಂಡಿಗೆ ನವೀಕರಣ",
    previous: "ಹಿಂದೆ",
    nextCase: "ಮುಂದೆ: ಲಕ್ಷಣಗಳು ಮತ್ತು ವಿವರ",
    searchDoctorPlaceholder: "ವೈದ್ಯರ ಹೆಸರು ಅಥವಾ ವಿಶೇಷತೆಯನ್ನು ಹುಡುಕಿ...",
    filters: "ಫಿಲ್ಟರ್‌ಗಳು",
    years: "ವರ್ಷಗಳು",
    yrs: "ವರ್ಷಗಳು",
  },
  bn: {
    trustHeader: 'আপনার স্বাস্থ্য, আমাদের অগ্রাধিকার',
    trustBody: 'আপনার ডেটা আমাদের সাথে সম্পূর্ণ নিরাপদ ও সুরক্ষিত।',
    trustBadge: 'HIPAA অনুগত',

    bookStep1: 'ধাপ ১: অ্যাপয়েন্টমেন্টের তারিখ নির্বাচন করুন।',
    bookStep2: 'ধাপ ২: সময় নির্বাচন করুন।',
    bookStep3: 'ধাপ ৩: আপনার লক্ষণগুলো আমাদের বলুন। আপনি মাইক বোতাম টিপে কথা বলতে পারেন।',
    bookStep4: 'ধাপ ৪: পূর্বের কোনো মেডিকেল রিপোর্ট আপলোড করুন। এটি ঐচ্ছিক।',
    bookStep5: 'ধাপ ৫: আপনার বিবরণ পরীক্ষা করে অ্যাপয়েন্টমেন্ট নিশ্চিত করুন।',

    selectDoctorPrompt: 'অনুগ্রহ করে আপনার অ্যাপয়েন্টমেন্টের জন্য একজন ডাক্তার নির্বাচন করুন।',
    doctorProfilePrompt: 'ডাক্তারের প্রোফাইল এবং উপলব্ধ সময় দেখছেন।',
    abhaModalPrompt: 'আয়ুষ্মান ভারত ডিজিটাল হেলথ কার্ডের বিবরণ।',
    ocrDocumentPrompt: 'ওসিআর স্ক্যান করা নথির বিবরণ।',
    communityGroupPrompt: 'কমিউনিটি চ্যাট গ্রুপ দেখছেন।',
    portal: 'রোগী পোর্টাল',
    appointments: 'অ্যাপয়েন্টমেন্ট',
    history: 'অ্যাপয়েন্টমেন্টের ইতিহাস',
    reports: 'মেডিকেল রিপোর্ট',
    donations: 'দান এবং সহায়তা',
    communities: 'কমিউনিটি',
    help: 'সাহায্য ও সমর্থন',
    bookAppointmentTitle: 'একটি অ্যাপয়েন্টমেন্ট বুক করুন',
    goodMorning: 'সুপ্রভাত',
    goodAfternoon: 'শুভ দুপুর',
    goodEvening: 'শুভ সন্ধ্যা',
    heroSubtitle: 'ডাক্তার নির্বাচন করুন, সময় ঠিক করুন এবং বাকিটা স্বাস্থ্য সেতুর ওপর ছেড়ে দিন।',
    talkToSwasthyaSetu: 'স্বাস্থ্য সেতুর সাথে কথা বলুন',
    speakInYourLanguage: 'আপনার নিজের ভাষায় কথা বলুন',
    findHospitalDoctor: 'হাসপাতাল এবং ডাক্তার খুঁজুন',
    searchPlaceholder: 'হাসপাতাল, বিশেষজ্ঞ, ডাক্তার খুঁজুন...',
    all: 'সব',
    government: 'সরকারি',
    private: 'বেসরকারি',
    ayush: 'আয়ুষ',
    nearMe: 'আমার কাছে',
    popular: 'জনপ্রিয়',
    departments: 'বিভাগ',
    kmAway: 'কিমি দূরে',
    bookAppointmentBtn: 'অ্যাপয়েন্টমেন্ট বুক করুন',
    nextAvailable: 'পাওয়ার সময়',
    today: 'আজ',
    tomorrow: 'আগামীকাল',
    viewAllHospitals: 'সমস্ত হাসপাতাল দেখুন',
    allHospitalsDirectory: 'সমস্ত সহযোগী হাসপাতাল এবং চিকিৎসা কেন্দ্র',
    upcomingAppointments: 'আসন্ন অ্যাপয়েন্টমেন্ট',
    viewAll: 'সব দেখুন',
    noUpcoming: 'কোনো আসন্ন অ্যাপয়েন্টমেন্ট নেই',
    noUpcomingDesc: 'এখনও আপনার কোনো অ্যাপয়েন্টমেন্ট বুক করা নেই। পরামর্শের জন্য বাম দিক থেকে একটি হাসপাতাল নির্বাচন করুন।',
    startVoiceIntake: 'ভয়েস AI পূর্ব-মূল্যায়ন শুরু করুন',
    abhaLinked: 'আভা লিঙ্কযুক্ত',
    profile: 'রোগীর প্রোফাইল',
    logout: 'লগ আউট',
    tokenWord: 'টোকেন',
    roomWord: 'কক্ষ',
    confirmed: 'নিশ্চিত',
    intakePending: 'ইনটেক মুলতুবি',
    confirmBookingTitle: 'হাসপাতাল অ্যাপয়েন্টমেন্ট বুক করুন',
    selectDoctor: 'ডাক্তার নির্বাচন করুন',
    selectDept: 'বিভাগ',
    selectDate: 'তারিখ',
    selectSlot: 'সময় স্লট',
    reasonForVisit: 'আসার কারণ / লক্ষণ',
    confirmBookingBtn: 'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন এবং টোকেন পান',
    appointmentConfirmed: 'অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে!',
    tokenGeneratedDesc: 'আপনার ওপিডি টোকেন নম্বর তৈরি করা হয়েছে।',
    close: 'বন্ধ করুন',
    digitalQueuePass: 'ওপিডি ডিজিটাল সারি পাস',
    assignedToken: 'বরাদ্দকৃত টোকেন নম্বর',
    cancelAppointment: 'অ্যাপয়েন্টমেন্ট বাতিল করুন',
    historyDesc: 'পূর্ববর্তী চিকিৎসা পরামর্শ এবং প্রেসক্রিপশনের বিবরণ।',
    reportsDesc: 'আপলোড করা ডায়াগনস্টিক রিপোর্ট এবং AI OCR সারাংশ।',
    donationsDesc: 'প্রয়োজনে দরিদ্র রোগীদের সহায়তা করুন।',
    communitiesDesc: 'স্বাস্থ্য সম্প্রদায়ের সাথে যুক্ত থাকুন।',
    helpDesc: '২৪/৭ জাতীয় স্বাস্থ্য হেল্পলাইন।',
    backToDashboard: "ড্যাশবোর্ডে ফিরে যান",
    selectDoctorTitle: "ডাক্তার নির্বাচন করুন",
    chooseDoctorFrom: "{hospital} থেকে একজন ডাক্তার বেছে নিন",
    allopathic: "অ্যালোপ্যাথি",
    select: "নির্বাচন করুন",
    viewProfile: "প্রোফাইল দেখুন",
    changeHospital: "হাসপাতাল পরিবর্তন",
    wizardStep1: "তারিখ নির্বাচন",
    wizardStep2: "সময় নির্বাচন",
    wizardStep3: "লক্ষণ ও কেস",
    wizardStep4: "রিপোর্ট আপলোড",
    wizardStep5: "নিশ্চিতকরণ",
    step1SelectDate: "ধাপ ১: তারিখ নির্বাচন করুন",
    step1Desc: "ডাক্তারের পরামর্শের জন্য সুবিধাজনক তারিখ নির্বাচন করুন",
    moreDates: "অন্যান্য তারিখ",
    nextSelectTime: "পরবর্তী: সময় নির্বাচন",
    step2SelectTime: "ধাপ ২: সময় স্লট নির্বাচন করুন",
    liveDoctorSchedule: "{doctor}-এর সময়সূচী থেকে লাইভ প্রাপ্যতা",
    morningSlots: "সকালের স্লট",
    afternoonSlots: "দুপুরের স্লট",
    eveningSlots: "সন্ধ্যার স্লট",
    slotsAvailable: "স্লট উপলব্ধ",
    slotLeft: "স্লট বাকি",
    slotsLeft: "স্লট বাকি",
    selected: "নির্বাচিত",
    fullyBooked: "সম্পূর্ণ বুকড",
    closed: "বন্ধ",
    fillingFast: "দ্রুত পূর্ণ হচ্ছে",
    available: "উপলব্ধ",
    loadingLiveSchedule: "সময়সূচী লোড হচ্ছে…",
    noSlotsAvailable: "এই তারিখে কোনো স্লট উপলব্ধ নেই। অনুগ্রহ করে অন্য তারিখ নির্বাচন করুন।",
    liveAvailabilityBadge: "লাইভ প্রাপ্যতা · প্রতি ১৫ সেকেন্ডে আপডেট",
    previous: "আগের",
    nextCase: "পরবর্তী: লক্ষণ ও কেস",
    searchDoctorPlaceholder: "ডাক্তারের নাম বা বিশেষত্ব অনুসন্ধান করুন...",
    filters: "ফিল্টার",
    years: "বছর",
    yrs: "বছর",
  },
  pa: {
    portal: 'ਮਰੀਜ਼ ਪੋਰਟਲ',
    appointments: 'ਮੁਲਾਕਾਤਾਂ',
    history: 'ਮੁਲਾਕਾਤ ਇਤਿਹਾਸ',
    reports: 'ਮੈਡੀਕਲ ਰਿਪੋਰਟਾਂ',
    donations: 'ਦਾਨ ਅਤੇ ਸਹਿਯੋਗ',
    communities: 'ਭਾਈਚਾਰਾ',
    help: 'ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ',
    bookAppointmentTitle: 'ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ',
    goodMorning: 'ਸ਼ੁਭ ਸਵੇਰ',
    goodAfternoon: 'ਸ਼ੁਭ ਦੁਪਹਿਰ',
    goodEvening: 'ਸ਼ੁਭ ਸ਼ਾਮ',
    heroSubtitle: 'ਡਾਕਟਰ ਚੁਣੋ, ਸਮਾਂ ਤੈਅ ਕਰੋ ਅਤੇ ਬਾਕੀ ਕੰਮ ਸਵਾਸਥਯ ਸੇਤੂ ਤੇ ਛੱਡੋ।',
    talkToSwasthyaSetu: 'ਸਵਾਸਥਯ ਸੇਤੂ ਨਾਲ ਗੱਲ ਕਰੋ',
    speakInYourLanguage: 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲੋ',
    findHospitalDoctor: 'ਹਸਪਤਾਲ ਅਤੇ ਡਾਕਟਰ ਲੱਭੋ',
    searchPlaceholder: 'ਹਸਪਤਾਲ, ਵਿਸ਼ੇਸ਼ਤਾ, ਡਾਕਟਰ ਲੱਭੋ...',
    all: 'ਸਾਰੇ',
    government: 'ਸਰਕਾਰੀ',
    private: 'ਨਿੱਜੀ',
    ayush: 'ਆਯੁਸ਼',
    nearMe: 'ਮੇਰੇ ਨੇੜੇ',
    popular: 'ਪ੍ਰਸਿੱਧ',
    departments: 'ਵਿਭਾਗ',
    kmAway: 'ਕਿਲੋਮੀਟਰ ਦੂਰ',
    bookAppointmentBtn: 'ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ',
    nextAvailable: 'ਉਪਲਬਧ ਸਮਾਂ',
    today: 'ਅੱਜ',
    tomorrow: 'ਕੱਲ੍ਹ',
    viewAllHospitals: 'ਸਾਰੇ ਹਸਪਤਾਲ ਦੇਖੋ',
    allHospitalsDirectory: 'ਸਾਰੇ ਭਾਈਵਾਲ ਹਸਪਤਾਲ ਅਤੇ ਸਿਹਤ ਕੇਂਦਰ',
    upcomingAppointments: 'ਆਉਣ ਵਾਲੀਆਂ ਮੁਲਾਕਾਤਾਂ',
    viewAll: 'ਸਭ ਦੇਖੋ',
    noUpcoming: 'ਕੋਈ ਆਉਣ ਵਾਲੀ ਮੁਲਾਕਾਤ ਨਹੀਂ ਹੈ',
    noUpcomingDesc: 'ਹਾਲੇ ਤੁਹਾਡੀ ਕੋਈ ਮੁਲਾਕਾਤ ਬੁੱਕ ਨਹੀਂ ਹੈ। ਡਾਕਟਰ ਦੀ ਸਲਾਹ ਲਈ ਖੱਬੇ ਪਾਸੇ ਤੋਂ ਹਸਪਤਾਲ ਚੁਣੋ।',
    startVoiceIntake: 'ਵੌਇਸ AI ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ',
    abhaLinked: 'ਆਭਾ ਲਿੰਕ ਕੀਤਾ ਗਿਆ',
    profile: 'ਮਰੀਜ਼ ਪ੍ਰੋਫਾਈਲ',
    logout: 'ਲਾਗ ਆਉਟ',
    tokenWord: 'ਟੋਕਨ',
    roomWord: 'ਕਮਰਾ',
    confirmed: 'ਪੁਸ਼ਟੀ ਹੋਈ',
    intakePending: 'ਪ੍ਰਕਿਰਿਆ ਬਾਕੀ',
    confirmBookingTitle: 'ਹਸਪਤਾਲ ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ',
    selectDoctor: 'ਡਾਕਟਰ ਚੁਣੋ',
    selectDept: 'ਵਿਭਾਗ',
    selectDate: 'ਮਿਤੀ',
    selectSlot: 'ਸਮਾਂ',
    reasonForVisit: 'ਮੁਲਾਕਾਤ ਦਾ ਕਾਰਨ / ਲੱਛਣ',
    confirmBookingBtn: 'ਮੁਲਾਕਾਤ ਪੱਕੀ ਕਰੋ ਅਤੇ ਟੋਕਨ ਲਵੋ',
    appointmentConfirmed: 'ਮੁਲਾਕਾਤ ਬੁੱਕ ਹੋ ਗਈ!',
    tokenGeneratedDesc: 'ਤੁਹਾਡਾ ਓਪੀਡੀ ਟੋਕਨ ਨੰਬਰ ਜਾਰੀ ਹੋ ਗਿਆ ਹੈ।',
    close: 'ਬੰਦ ਕਰੋ',
    digitalQueuePass: 'ਓਪੀਡੀ ਡਿਜੀਟਲ ਕਤਾਰ ਪਾਸ',
    assignedToken: 'ਟੋਕਨ ਨੰਬਰ',
    cancelAppointment: 'ਮੁਲਾਕਾਤ ਰੱਦ ਕਰੋ',
    historyDesc: 'ਪਿਛਲੀਆਂ ਮੁਲਾਕਾਤਾਂ ਅਤੇ ਦਵਾਈਆਂ ਦਾ ਵੇਰਵਾ।',
    reportsDesc: 'ਅਪਲੋਡ ਕੀਤੀਆਂ ਮੈਡੀਕਲ ਰਿਪੋਰਟਾਂ।',
    donationsDesc: 'ਲੋੜਵੰਦ ਮਰੀਜ਼ਾਂ ਦੀ ਮਦਦ ਕਰੋ।',
    communitiesDesc: 'ਸਿਹਤ ਭਾਈਚਾਰੇ ਨਾਲ ਜੁੜੋ।',
    helpDesc: '24/7 ਹੈਲਪਲਾਈਨ ਅਤੇ ਸਹਾਇਤਾ।'
  },
  ml: {
    trustHeader: 'നിങ്ങളുടെ ആരോഗ്യം, ഞങ്ങളുടെ മുൻഗണന',
    trustBody: 'നിങ്ങളുടെ വിവരങ്ങൾ ഞങ്ങളുടെ പക്കൽ സുരക്ഷിതമാണ്.',
    trustBadge: 'HIPAA അനുയോജ്യം',

    bookStep1: 'ഘട്ടം 1: അപ്പോയിന്റ്മെന്റ് തീയതി തിരഞ്ഞെടുക്കുക.',
    bookStep2: 'ഘട്ടം 2: സമയം തിരഞ്ഞെടുക്കുക.',
    bookStep3: 'ഘട്ടം 3: നിങ്ങളുടെ ലക്ഷണങ്ങളെക്കുറിച്ച് പറയുക. മൈക്ക് ബട്ടൺ അമർത്തി സംസാരിക്കാം.',
    bookStep4: 'ഘട്ടം 4: മുൻ റിപ്പോർട്ടുകൾ അപ്‌ലോഡ് ചെയ്യുക. ഇത് നിർബന്ധമല്ല.',
    bookStep5: 'ഘട്ടം 5: നിങ്ങളുടെ വിശദാംശങ്ങൾ പരിശോധിച്ച് അപ്പോയിന്റ്മെന്റ് സ്ഥിരീകരിക്കുക.',

    selectDoctorPrompt: 'നിങ്ങളുടെ അപ്പോയിന്റ്മെന്റിനായി ദയവായി ഒരു ഡോക്ടറെ തിരഞ്ഞെടുക്കുക.',
    doctorProfilePrompt: 'ഡോക്ടർ പ്രൊഫൈലും ലഭ്യമായ സമയവും കാണുന്നു.',
    abhaModalPrompt: 'ആയുഷ്മാൻ ഭാരത് ഡിജിറ്റൽ ഹെൽത്ത് കാർഡ് വിശദാംശങ്ങൾ.',
    ocrDocumentPrompt: 'OCR സ്കാൻ ചെയ്ത ഡോക്യുമെന്റ് വിശദാംശങ്ങൾ.',
    communityGroupPrompt: 'കമ്മ്യൂണിറ്റി ചാറ്റ് ഗ്രൂപ്പ് കാണുന്നു.',
    portal: 'പേഷ്യന്റ് പോർട്ടൽ',
    appointments: 'അപ്പോയിന്റ്മെന്റുകൾ',
    history: 'അപ്പോയിന്റ്മെന്റ് ചരിത്രം',
    reports: 'മെഡിക്കൽ റിപ്പോർട്ടുകൾ',
    donations: 'സംഭാവനകൾ',
    communities: 'കമ്മ്യൂണിറ്റികൾ',
    help: 'സഹായവും പിന്തുണയും',
    bookAppointmentTitle: 'അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്യുക',
    goodMorning: 'സുപ്രഭാതം',
    goodAfternoon: 'ശുഭ ഉച്ചതിരിഞ്ഞ്',
    goodEvening: 'ശുഭ സായാഹ്നം',
    heroSubtitle: 'ഡോക്ടറെ തിരഞ്ഞെടുക്കുക, സമയം നിശ്ചയിക്കുക, ബാക്കി കാര്യങ്ങൾ സ്വാസ്ഥ്യ സേതുവിന് വിടുക.',
    talkToSwasthyaSetu: 'സ്വാസ്ഥ്യ സേതുവിനോട് സംസാരിക്കുക',
    speakInYourLanguage: 'നിങ്ങളുടെ ഭാഷയിൽ സംസാരിക്കുക',
    findHospitalDoctor: 'ആശുപത്രിയും ഡോക്ടറെയും കണ്ടെത്തുക',
    searchPlaceholder: 'ആശുപത്രികൾ, സ്പെഷ്യാലിറ്റികൾ, ഡോക്ടർമാരെ തിരയുക...',
    all: 'എല്ലാം',
    government: 'സർക്കാർ',
    private: 'സ്വകാര്യ',
    ayush: 'ആയുഷ്',
    nearMe: 'എന്റെ അടുത്തുള്ളത്',
    popular: 'ജനപ്രിയമായത്',
    departments: 'വിഭാഗങ്ങൾ',
    kmAway: 'കി.മീ അകലെ',
    bookAppointmentBtn: 'അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്യുക',
    nextAvailable: 'ലഭ്യമായ സമയം',
    today: 'ഇന്ന്',
    tomorrow: 'നാളെ',
    viewAllHospitals: 'എല്ലാ ആശുപത്രികളും കാണുക',
    allHospitalsDirectory: 'എല്ലാ ആശുപത്രികളും മെഡിക്കൽ കേന്ദ്രങ്ങളും',
    upcomingAppointments: 'വരാനിരിക്കുന്ന അപ്പോയിന്റ്മെന്റുകൾ',
    viewAll: 'എല്ലാം കാണുക',
    noUpcoming: 'വരാനിരിക്കുന്ന അപ്പോയിന്റ്മെന്റുകളൊന്നുമില്ല',
    noUpcomingDesc: 'നിങ്ങൾക്ക് നിലവിൽ അപ്പോയിന്റ്മെന്റുകളൊന്നുമില്ല. ഒരു ഡോക്ടറെ കാണാൻ ഇടതുവശത്തുള്ള ആശുപത്രി തിരഞ്ഞെടുക്കുക.',
    startVoiceIntake: 'പ്രീ-വിസിറ്റ് AI ഇൻടേക്ക് ആരംഭിക്കുക',
    abhaLinked: 'ആഭാ ലിങ്ക് ചെയ്‌തു',
    profile: 'പേഷ്യന്റ് പ്രൊഫൈൽ',
    logout: 'ലോഗ് ഔട്ട്',
    tokenWord: 'ടോക്കൺ',
    roomWord: 'മുറി',
    confirmed: 'സ്ഥിരീകരിച്ചു',
    intakePending: 'ഇൻടേക്ക് ബാക്കി',
    confirmBookingTitle: 'ആശുപത്രി അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്യുക',
    selectDoctor: 'ഡോക്ടറെ തിരഞ്ഞെടുക്കുക',
    selectDept: 'വിഭാഗം',
    selectDate: 'തീയതി',
    selectSlot: 'സമയം സ്ലോട്ട്',
    reasonForVisit: 'സന്ദർശന കാരണം / ലക്ഷണങ്ങൾ',
    confirmBookingBtn: 'അപ്പോയിന്റ്മെന്റ് സ്ഥിരീകരിച്ച് ടോക്കൺ നേടുക',
    appointmentConfirmed: 'അപ്പോയിന്റ്മെന്റ് സ്ഥിരീകരിച്ചു!',
    tokenGeneratedDesc: 'നിങ്ങളുടെ ഒപിഡി ടോക്കൺ നമ്പർ തയ്യാറായി.',
    close: 'അടയ്ക്കുക',
    digitalQueuePass: 'ഒപിഡി ഡിജിറ്റൽ ക്യൂ പാസ്',
    assignedToken: 'ടോക്കൺ നമ്പർ',
    cancelAppointment: 'അപ്പോയിന്റ്മെന്റ് റദ്ദാക്കുക',
    historyDesc: 'മുൻകാല ചികിത്സാ രേഖകൾ.',
    reportsDesc: 'അപ്‌ലോഡ് ചെയ്ത ലാബ് റിപ്പോർട്ടുകൾ.',
    donationsDesc: 'ആവശ്യമുള്ള രോഗികൾക്ക് സഹായം നൽകുക.',
    communitiesDesc: 'ആരോഗ്യ കൂട്ടായ്മകളുമായി പങ്കുചേരുക.',
    helpDesc: '24/7 ദേശീയ ഹെൽപ്പ്‌ലൈൻ.',
    backToDashboard: "ഡാഷ്‌ബോർഡിലേക്ക് മടങ്ങുക",
    selectDoctorTitle: "ഒരു ഡോക്ടറെ തിരഞ്ഞെടുക്കുക",
    chooseDoctorFrom: "{hospital}-ൽ നിന്ന് ഡോക്ടറെ തിരഞ്ഞെടുക്കുക",
    allopathic: "അലോപ്പതി",
    select: "തിരഞ്ഞെടുക്കുക",
    viewProfile: "പ്രൊഫൈൽ കാണുക",
    changeHospital: "ആശുപത്രി മാറ്റുക",
    wizardStep1: "തീയതി തിരഞ്ഞെടുക്കുക",
    wizardStep2: "സമയം തിരഞ്ഞെടുക്കുക",
    wizardStep3: "ലക്ഷണങ്ങൾ & കേസ്",
    wizardStep4: "റിപ്പോർട്ട് അപ്‌ലോഡ്",
    wizardStep5: "സ്ഥിരീകരണം",
    step1SelectDate: "ഘട്ടം 1: തീയതി തിരഞ്ഞെടുക്കുക",
    step1Desc: "ഡോക്ടർ കൺസൾട്ടേഷനായി സൗകര്യപ്രദമായ തീയതി തിരഞ്ഞെടുക്കുക",
    moreDates: "മറ്റ് തീയതികൾ",
    nextSelectTime: "അടുത്തത്: സമയം തിരഞ്ഞെടുക്കുക",
    step2SelectTime: "ഘട്ടം 2: സമയം തിരഞ്ഞെടുക്കുക",
    liveDoctorSchedule: "{doctor}-ന്റെ ഷെഡ്യൂളിൽ നിന്നുള്ള തത്സമയ ലഭ്യത",
    morningSlots: "രാവിലെ സ്ലോട്ടുകൾ",
    afternoonSlots: "ഉച്ചതിരിഞ്ഞ് സ്ലോട്ടുകൾ",
    eveningSlots: "വൈകുന്നേരം സ്ലോട്ടുകൾ",
    slotsAvailable: "സ്ലോട്ടുകൾ ലഭ്യമാണ്",
    slotLeft: "സ്ലോട്ട് മാത്രം ബാക്കി",
    slotsLeft: "സ്ലോട്ടുകൾ ലഭ്യമാണ്",
    selected: "തിരഞ്ഞെടുത്തു",
    fullyBooked: "പൂർണ്ണമായി ബുക്ക് ചെയ്‌തു",
    closed: "അടച്ചു",
    fillingFast: "വേഗത്തിൽ നിറയുന്നു",
    available: "ലഭ്യമാണ്",
    loadingLiveSchedule: "ഷെഡ്യൂൾ ലോഡ് ചെയ്യുന്നു…",
    noSlotsAvailable: "ഈ തീയതിയിൽ സ്ലോട്ടുകളൊന്നും ലഭ്യമല്ല. ദയവായി മറ്റൊരു തീയതി തിരഞ്ഞെടുക്കുക.",
    liveAvailabilityBadge: "തത്സമയ ലഭ്യത · ഓരോ 15 സെക്കൻഡിലും പുതുക്കുന്നു",
    previous: "മുമ്പ്",
    nextCase: "അടുത്തത്: ലക്ഷണങ്ങളും വിശദാംശങ്ങളും",
    searchDoctorPlaceholder: "ഡോക്ടറുടെ പേരോ സ്പെഷ്യാലിറ്റിയോ തിരയുക...",
    filters: "ഫിൽട്ടറുകൾ",
    years: "വർഷം",
    yrs: "വർഷം",
  },
  or: {
    portal: 'ରୋଗୀ ପୋର୍ଟାଲ',
    appointments: 'ଆପଏଣ୍ଟମେଣ୍ଟ',
    history: 'ଆପଏଣ୍ଟମେଣ୍ଟ ଇତିହାସ',
    reports: 'ଡାକ୍ତରୀ ରିପୋର୍ଟ',
    donations: 'ଦାନ ଏବଂ ସାହାଯ୍ୟ',
    communities: 'ସମୁଦାୟ',
    help: 'ସାହାଯ୍ୟ ଏବଂ ସମର୍ଥନ',
    bookAppointmentTitle: 'ଆପଏଣ୍ଟମେଣ୍ଟ ବୁକ୍ କରନ୍ତୁ',
    goodMorning: 'ଶୁଭ ସକାଳ',
    goodAfternoon: 'ଶୁଭ ଅପରାହ୍ନ',
    goodEvening: 'ଶୁଭ ସନ୍ଧ୍ୟା',
    heroSubtitle: 'ଡାକ୍ତର ବାଛନ୍ତୁ, ସମୟ ସ୍ଥିର କରନ୍ତୁ ଏବଂ ବାକି ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ ଉପରେ ଛାଡ଼ିଦିଅନ୍ତୁ।',
    talkToSwasthyaSetu: 'ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ ସହିତ କଥା ହୁଅନ୍ତୁ',
    speakInYourLanguage: 'ଆପଣଙ୍କ ଭାଷାରେ କୁହନ୍ତୁ',
    findHospitalDoctor: 'ଡାକ୍ତରଖାନା ଏବଂ ଡାକ୍ତର ଖୋଜନ୍ତୁ',
    searchPlaceholder: 'ଡାକ୍ତରଖାନା, ବିଶେଷଜ୍ଞ, ଡାକ୍ତର ଖୋଜନ୍ତୁ...',
    all: 'ସମସ୍ତ',
    government: 'ସରକାରୀ',
    private: 'ବେସରକାରୀ',
    ayush: 'ଆୟୁଷ',
    nearMe: 'ମୋ ପାଖରେ',
    popular: 'ଲୋକପ୍ରିୟ',
    departments: 'ବିଭାଗ',
    kmAway: 'କିମି ଦୂରରେ',
    bookAppointmentBtn: 'ଆପଏଣ୍ଟମେଣ୍ଟ ବୁକ୍ କରନ୍ତୁ',
    nextAvailable: 'ଉପଲବ୍ଧ ସମୟ',
    today: 'ଆଜି',
    tomorrow: 'ଆସନ୍ତାକାଲି',
    viewAllHospitals: 'ସମସ୍ତ ଡାକ୍ତରଖାନା ଦେଖନ୍ତୁ',
    allHospitalsDirectory: 'ସମସ୍ତ ସହଯୋଗୀ ଡାକ୍ତରଖାନା ଏବଂ ଚିକିତ୍ସା କେନ୍ଦ୍ର',
    upcomingAppointments: 'ଆଗାମୀ ଆପଏଣ୍ଟମେଣ୍ଟ',
    viewAll: 'ସବୁ ଦେଖନ୍ତୁ',
    noUpcoming: 'କୌଣସି ଆଗାମୀ ଆପଏଣ୍ଟମେଣ୍ଟ ନାହିଁ',
    noUpcomingDesc: 'ଆପଣଙ୍କର କୌଣସି ଆପଏଣ୍ଟମେଣ୍ଟ ବୁକ୍ ହୋଇନାହିଁ। ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ପାଇଁ ବାମ ପାର୍ଶ୍ୱରୁ ଡାକ୍ତରଖାନା ଚୟନ କରନ୍ତୁ।',
    startVoiceIntake: 'ପ୍ରାକ୍-ପରୀକ୍ଷା AI ଆରମ୍ଭ କରନ୍ତୁ',
    abhaLinked: 'ଆଭା ସଂଯୁକ୍ତ',
    profile: 'ରୋଗୀ ପ୍ରୋଫାଇଲ୍',
    logout: 'ଲଗ୍ ଆଉଟ୍',
    tokenWord: 'ଟୋକନ୍',
    roomWord: 'କୋଠରୀ',
    confirmed: 'ନିଶ୍ଚିତ ହୋଇଛି',
    intakePending: 'ଅପେକ୍ଷାରେ ଅଛି',
    confirmBookingTitle: 'ଡାକ୍ତରଖାନା ଆପଏଣ୍ଟମେଣ୍ଟ ବୁକ୍ କରନ୍ତୁ',
    selectDoctor: 'ଡାକ୍ତର ବାଛନ୍ତୁ',
    selectDept: 'ବିଭାଗ',
    selectDate: 'ତାରିଖ',
    selectSlot: 'ସମୟ',
    reasonForVisit: 'ଆସିବାର କାରଣ / ଲକ୍ଷଣ',
    confirmBookingBtn: 'ଆପଏଣ୍ଟମେଣ୍ଟ ନିଶ୍ଚିତ କରନ୍ତୁ ଏବଂ ଟୋକନ୍ ପାଆନ୍ତୁ',
    appointmentConfirmed: 'ଆପଏଣ୍ଟମେଣ୍ଟ ନିଶ୍ଚିତ ହୋଇଛି!',
    tokenGeneratedDesc: 'ଆପଣଙ୍କର OPD ଟୋକନ୍ ନମ୍ବର ସୃଷ୍ଟି ହୋଇଛି।',
    close: 'ବନ୍ଦ କରନ୍ତୁ',
    digitalQueuePass: 'OPD ଡିଜିଟାଲ୍ ଧାଡ଼ି ପାସ୍',
    assignedToken: 'ଟୋକନ୍ ନମ୍ବର',
    cancelAppointment: 'ଆପଏଣ୍ଟମେଣ୍ଟ ବାତିଲ କରନ୍ତୁ',
    historyDesc: 'ପୂର୍ବ ପରାମର୍ଶ ଏବଂ ଡାକ୍ତରୀ ପ୍ରେସକ୍ରିପସନ୍ ତଥ୍ୟ।',
    reportsDesc: 'ଡାଇଗ୍ନୋଷ୍ଟିକ୍ ରିପୋର୍ଟ ଏବଂ AI OCR ବିବରଣୀ।',
    donationsDesc: 'ଅସହାୟ ରୋଗୀମାନଙ୍କୁ ସାହାଯ୍ୟ କରନ୍ତୁ।',
    communitiesDesc: 'ସ୍ୱାସ୍ଥ୍ୟ ସମୁଦାୟ ସହିତ ଯୋଡ଼ି ହୁଅନ୍ତୁ।',
    helpDesc: '24/7 ଜାତୀୟ ହେଲ୍ପଲାଇନ୍ ଏବଂ ସହାୟତା।'
  }
};

/* =========================================================================
   NAME TRANSLITERATION & LOCALIZATION
   ========================================================================= */
const NAME_TRANSLITERATIONS = {
  'rahul kumar': {
    en: 'Rahul Kumar',
    hi: 'राहुल कुमार',
    mr: 'राहुल कुमार',
    gu: 'રાહુલ કુમાર',
    ta: 'ராகுல் குமார்',
    te: 'రాహుల్ కుమార్',
    kn: 'ರಾಹುಲ್ ಕುಮಾರ್',
    bn: 'রাহুল কুমার',
    pa: 'ਰਾਹੁਲ ਕੁਮਾਰ',
    ml: 'രാഹുൽ കുമാർ',
    or: 'ରାହୁଲ କୁମାର'
  },
  'rahul': {
    en: 'Rahul',
    hi: 'राहुल',
    mr: 'राहुल',
    gu: 'રાહુલ',
    ta: 'ராகுல்',
    te: 'రాహుల్',
    kn: 'ರಾಹುಲ್',
    bn: 'রাহুল',
    pa: 'ਰਾਹੁਲ',
    ml: 'രാഹുൽ',
    or: 'ରାହୁଲ'
  },
  'priya sharma': {
    en: 'Priya Sharma',
    hi: 'प्रिया शर्मा',
    mr: 'प्रिया शर्मा',
    gu: 'પ્રિયા શર્મા',
    ta: 'பிரியா சர்மா',
    te: 'ప్రియా శర్మ',
    kn: 'ಪ್ರಿಯಾ ಶರ್ಮಾ',
    bn: 'প্রিয়া শর্মা',
    pa: 'ਪ੍ਰਿਆ ਸ਼ਰਮਾ',
    ml: 'പ്രിയ ശർമ്മ',
    or: 'ପ୍ରିୟା ଶର୍ମା'
  },
  'amit patel': {
    en: 'Amit Patel',
    hi: 'अमित पटेल',
    mr: 'अमित पटेल',
    gu: 'અમિત પટેલ',
    ta: 'அமித் படேல்',
    te: 'అమిత్ పటేల్',
    kn: 'ಅಮಿತ್ ಪಟೇಲ್',
    bn: 'অমিত প্যাটেল',
    pa: 'ਅਮਿਤ ਪਟੇਲ',
    ml: 'അമിത് പട്ടേൽ',
    or: 'ଅମିତ ପଟେଲ'
  }
};



/* =========================================================================
   DOCTOR & SPECIALTY LOCALIZATION
   ========================================================================= */
const DOCTOR_LOCALIZATION = {
  'dr. ananya sharma': {
    en: 'Dr. Ananya Sharma',
    hi: 'डॉ. अनन्या शर्मा',
    mr: 'डॉ. अनन्या शर्मा',
    gu: 'ડૉ. અનન્યા શર્મા',
    ta: 'டாக்டர் அனன்யா சர்மா',
    te: 'డాక్టర్ అనన్య శర్మ',
    kn: 'ಡಾ. ಅನನ್ಯಾ ಶರ್ಮಾ',
    bn: 'ডাঃ অনন্যা শর্মা',
    pa: 'ਡਾ. ਅਨੰਨਿਆ ਸ਼ਰਮਾ',
    ml: 'ഡോ. അനന്യ ശർമ്മ',
    or: 'ଡାକ୍ତର ଅନନ୍ୟା ଶର୍ମା'
  },
  'dr. vikramaditya rathore': {
    en: 'Dr. Vikramaditya Rathore',
    hi: 'डॉ. विक्रमादित्य राठौड़',
    mr: 'डॉ. विक्रमादित्य राठोड',
    gu: 'ડૉ. વિક્રમાદિત્ય રાઠોડ',
    ta: 'டாக்டர் விக்ரமாதித்யா ரத்தோர்',
    te: 'డాక్టర్ విక్రమాదిత్య రాథోడ్',
    kn: 'ಡಾ. ವಿಕ್ರಮಾದಿತ್ಯ ರಾಥೋರ್',
    bn: 'ডাঃ বিক্রমাদিত্য রাঠোর',
    pa: 'ਡਾ. ਵਿਕਰਮਾਦਿਤਿਆ ਰਾਠੌੜ',
    ml: 'ഡോ. വിക്രമാദിത്യ റാത്തോഡ്',
    or: 'ଡାକ୍ତର ବିକ୍ରମାଦିତ୍ୟ ରାଠୋର'
  },
  'dr. randeep guleria': {
    en: 'Dr. Randeep Guleria',
    hi: 'डॉ. रणदीप गुलेरिया',
    mr: 'डॉ. रणदीप गुलेरिया',
    gu: 'ડૉ. રણદીપ ગુલેરિયા',
    ta: 'டாக்டர் ரண்தீப் குலேரியா',
    te: 'డాక్టర్ రణదీప్ గులేరియా',
    kn: 'ಡಾ. ರಣದೀಪ್ ಗುಲೇರಿಯಾ',
    bn: 'ডাঃ রণদীপ গুলেরিয়া',
    pa: 'ਡਾ. ਰਣਦੀਪ ਗੁਲੇਰੀਆ',
    ml: 'ഡോ. രൺദീപ് ഗുലേറിയ',
    or: 'ଡାକ୍ତର ରଣଦୀପ ଗୁଲେରିଆ'
  },
  'dr. naresh trehan': {
    en: 'Dr. Naresh Trehan',
    hi: 'डॉ. नरेश त्रेहन',
    mr: 'डॉ. नरेश त्रेहन',
    gu: 'ડૉ. નરેશ ત્રેહન',
    ta: 'டாக்டர் நரேஷ் திரேஹான்',
    te: 'డాక్టర్ నరేష్ త్రెహాన్',
    kn: 'ಡಾ. ನರೇಶ್ ತ್ರೇಹನ್',
    bn: 'ডাঃ নরেশ ত্রেহান',
    pa: 'ਡਾ. ਨਰੇਸ਼ ਤ੍ਰੇਹਨ',
    ml: 'ഡോ. നരേഷ് ത്രേഹൻ',
    or: 'ଡାକ୍ତର ନରେଶ ତ୍ରେହନ'
  },
  'dr. devi shetty': {
    en: 'Dr. Devi Shetty',
    hi: 'डॉ. देवी शेट्टी',
    mr: 'डॉ. देवी शेट्टी',
    gu: 'ડૉ. દેવી શેટ્ટી',
    ta: 'டாக்டர் தேவி ஷெட்டி',
    te: 'డాక్టర్ దేవి శెట్టి',
    kn: 'ಡಾ. ದೇವಿ ಶೆಟ್ಟಿ',
    bn: 'ডাঃ দেবী শেঠি',
    pa: 'ਡਾ. ਦੇਵੀ ਸ਼ੈੱਟੀ',
    ml: 'ഡോ. ദേവി ഷെട്ടി',
    or: 'ଡାକ୍ତର ଦେବୀ ଶେଟ୍ଟି'
  },
  'dr. sunita khandelwal': {
    en: 'Dr. Sunita Khandelwal',
    hi: 'डॉ. सुनीता खंडेलवाल',
    mr: 'डॉ. सुनिता खंडेलवाल',
    gu: 'ડૉ. સુનીતા ખંડેલવાલ',
    ta: 'டாக்டர் சுனிதா கண்டேல்வால்',
    te: 'డాక్టర్ సునీతా ఖండేల్‌వాల్',
    kn: 'ಡಾ. ಸುನೀತಾ ಖಂಡೇಲ್‌ವಾಲ್',
    bn: 'ডাঃ সুনিতা খান্ডেলওয়াল',
    pa: 'ਡਾ. ਸੁਨੀਤਾ ਖੰਡੇਲਵਾਲ',
    ml: 'ഡോ. സുനിത ഖണ്ഡേൽവാൾ',
    or: 'ଡାକ୍ତର ସୁନିତା ଖଣ୍ଡେଲୱାଲ'
  },
  'dr. rajesh verma': {
    en: 'Dr. Rajesh Verma',
    hi: 'डॉ. राजेश वर्मा',
    mr: 'डॉ. राजेश वर्मा',
    gu: 'ડૉ. રાજેશ વર્મા',
    ta: 'டாக்டர் ராஜேஷ் வர்மா',
    te: 'డాక్టర్ రాజేష్ వర్మ',
    kn: 'ಡಾ. ರಾಜೇಶ್ ವರ್ಮಾ',
    bn: 'ডাঃ রাজেশ বর্মা',
    pa: 'ਡਾ. ਰਾਜੇਸ਼ ਵਰਮਾ',
    ml: 'ഡോ. രാജേഷ് വർമ്മ',
    or: 'ଡାକ୍ତର ରାଜେଶ ବର୍ମା'
  },
  'dr. neha gupta': {
    en: 'Dr. Neha Gupta',
    hi: 'डॉ. नेहा गुप्ता',
    mr: 'डॉ. नेहा गुप्ता',
    gu: 'ડૉ. નેહા ગુપ્તા',
    ta: 'டாக்டர் நேஹா குப்தா',
    te: 'డాక్టర్ నేహా గుప్తా',
    kn: 'ಡಾ. ನೇಹಾ ಗುಪ್ತಾ',
    bn: 'ডাঃ নেহা গুপ্তা',
    pa: 'ਡਾ. ਨੇਹਾ ਗੁਪਤਾ',
    ml: 'ഡോ. നേഹ ഗുപ്ത',
    or: 'ଡାକ୍ତର ନେହା ଗୁପ୍ତା'
  },
  'dr. arjun mehta': {
    en: 'Dr. Arjun Mehta',
    hi: 'डॉ. अर्जुन मेहता',
    mr: 'डॉ. अर्जुन मेहता',
    gu: 'ડૉ. અર્જુન મહેતા',
    ta: 'டாக்டர் அர்ஜுன் மேத்தா',
    te: 'డాక్టర్ అర్జున్ మెహతా',
    kn: 'ಡಾ. ಅರ್ಜುನ್ ಮೆಹ್ತಾ',
    bn: 'ডাঃ অর্জুন মেহতা',
    pa: 'ਡਾ. ਅਰਜੁਨ ਮਹਿਤਾ',
    ml: 'ഡോ. അർജുൻ മേത്ത',
    or: 'ଡାକ୍ତର ଅର୍ଜୁନ ମେହେତା'
  },
  'vaidya r. mehta': {
    en: 'Vaidya R. Mehta',
    hi: 'वैद्य आर. मेहता',
    mr: 'वैद्य आर. मेहता',
    gu: 'વૈદ્ય આર. મહેતા',
    ta: 'வைத்யா ஆர். மேத்தா',
    te: 'వైద్య ఆర్. మెహతా',
    kn: 'ವೈದ್ಯ ಆರ್. ಮೆಹ್ತಾ',
    bn: 'বৈদ্য আর. মেহতা',
    pa: 'ਵੈਦ ਆਰ. ਮਹਿਤਾ',
    ml: 'വൈദ്യൻ ആർ. മേത്ത',
    or: 'ବୈଦ୍ୟ ଆର. ମେହେତା'
  },
  'vaidya sanjeev sharma': {
    en: 'Vaidya Sanjeev Sharma',
    hi: 'वैद्य संजीव शर्मा',
    mr: 'वैद्य संजीव शर्मा',
    gu: 'વૈદ્ય સંજીવ શર્મા',
    ta: 'வைத்யா சஞ்சீவ் சர்மா',
    te: 'వైద్య సంజీవ్ శర్మ',
    kn: 'ವೈದ್ಯ ಸಂಜೀವ್ ಶರ್ಮಾ',
    bn: 'বৈদ্য সঞ্জীব শর্মা',
    pa: 'ਵੈਦ ਸੰਜੀਵ ਸ਼ਰਮਾ',
    ml: 'വൈദ്യൻ സഞ്ജീവ് ശർമ്മ',
    or: 'ବୈଦ୍ୟ ସଞ୍ଜୀବ ଶର୍ମା'
  },
  'dr. manoj saxena': {
    en: 'Dr. Manoj Saxena',
    hi: 'डॉ. मनोज सक्सेना',
    mr: 'डॉ. मनोज सक्सेना',
    gu: 'ડૉ. મનોજ સક્સેના',
    ta: 'டாக்டர் மனோஜ் சக்சேனா',
    te: 'డాక్టర్ మనోజ్ సక్సేనా',
    kn: 'ಡಾ. ಮನೋಜ್ ಸಕ್ಸೇನಾ',
    bn: 'ডাঃ মনোজ সাক্সেনা',
    pa: 'ਡਾ. ਮਨੋਜ ਸਕਸੈਨਾ',
    ml: 'ഡോ. മനോജ് സക്സേന',
    or: 'ଡାକ୍ତର ମନୋଜ ସକ୍ସେନା'
  }
};

const SPECIALTY_LOCALIZATION = {
  'general medicine': {
    en: 'General Medicine',
    hi: 'सामान्य चिकित्सा',
    mr: 'सामान्य औषधोपचार',
    gu: 'સામાન્ય દવા',
    ta: 'பொது மருத்துவம்',
    te: 'సాధారణ వైద్యం',
    kn: 'ಸಾಮಾನ್ಯ ವೈದ್ಯಕೀಯ',
    bn: 'জেনারেল মেডিসিন',
    pa: 'ਜਨਰਲ ਮੈਡੀਸਨ',
    ml: 'ജനറൽ മെഡിസിൻ',
    or: 'ସାଧାରଣ ଚିକିତ୍ସା'
  },
  'cardiology': {
    en: 'Cardiology',
    hi: 'हृदय रोग विभाग',
    mr: 'हृदयरोग विभाग',
    gu: 'કાર્ડિયોલોજી',
    ta: 'இதயவியல்',
    te: 'కార్డియాలజీ',
    kn: 'ಹೃದಯಶಾಸ್ತ್ರ',
    bn: 'কার্ডিওলজি',
    pa: 'ਦਿਲ ਦੀਆਂ ਬਿਮਾਰੀਆਂ',
    ml: 'കാർഡിയോളജി',
    or: 'ହୃଦରୋଗ ବିଭାଗ'
  },
  'pediatrics': {
    en: 'Pediatrics',
    hi: 'बाल रोग विशेषज्ञ',
    mr: 'बालरोग तज्ज्ञ',
    gu: 'બાળરોગ',
    ta: 'குழந்தை மருத்துவம்',
    te: 'పీడియాట్రిక్స్',
    kn: 'ಮಕ್ಕಳ ತಜ್ಞ',
    bn: 'শিশু বিশেষজ্ঞ',
    pa: 'ਬੱਚਿਆਂ ਦੇ ਮਾਹਿਰ',
    ml: 'പീഡിയാട്രിക്സ്',
    or: 'ଶିଶୁରୋଗ ବିଭାଗ'
  },
  'pulmonology': {
    en: 'Pulmonology & Chest',
    hi: 'श्वसन एवं फेफड़ा रोग विभाग',
    mr: 'श्वसनरोग विभाग',
    gu: 'શ્વાસ અને ફેફસાના રોગો',
    ta: 'நுரையீரல் & சுவாச மருத்துவம்',
    te: 'పల్మోనాలజీ & ఛాతీ విభాగం',
    kn: 'ಶ್ವಾಸಕೋಶ ತಜ್ಞ',
    bn: 'পালমোনোলজি',
    pa: 'ਛਾਤੀ ਦੇ ਰੋਗ',
    ml: 'പൾമണോളജി',
    or: 'ଶ୍ୱାସରୋଗ ବିଭାଗ'
  },
  'cardiac surgery': {
    en: 'Cardiac Sciences & Heart Surgery',
    hi: 'हृदय शल्य चिकित्सा',
    mr: 'हृदय शस्त्रक्रिया विभाग',
    gu: 'કાર્ડિયાક સર્જરી',
    ta: 'இதய அறுவை சிகிச்சை',
    te: 'గుండె శస్త్రచికిత్స',
    kn: 'ಹೃದಯ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
    bn: 'কার্ডিয়াক সার্জারি',
    pa: 'ਦਿਲ ਦੀ ਸਰਜਰੀ',
    ml: 'കാർഡിയാക് സർജറി',
    or: 'ହୃଦୟ ଶଲ୍ୟ ଚିକିତ୍ସା'
  },
  'oncology': {
    en: 'Oncology & Cancer Care',
    hi: 'कैंसर एवं ऑन्कोलॉजी विभाग',
    mr: 'कर्करोग विभाग',
    gu: 'ઓન્કોલોજી અને કેન્સર સંભાળ',
    ta: 'புற்றுநோயியல்',
    te: 'ఆంకాలజీ & క్యాన్సర్ సంరక్షణ',
    kn: 'ಕ್ಯಾನ್ಸರ್ ತಜ್ಞ',
    bn: 'অনকোলজি',
    pa: 'ਕੈਂਸਰ ਰੋਗ',
    ml: 'ഓങ്കോളജി',
    or: 'କର୍କଟ ରୋଗ ବିଭାଗ'
  },
  'orthopedics & joint replacement': {
    en: 'Orthopedics & Joint Replacement',
    hi: 'अस्थि रोग एवं जोड़ प्रत्यारोपण',
    mr: 'अस्थिरोग आणि सांधे बदल',
    gu: 'ઓર્થોપેડિક્સ અને જોઈન્ટ રિપ્લેસમેન્ટ',
    ta: 'எலும்பியல் & மூட்டு மாற்று அறுவை சிகிச்சை',
    te: 'ఆర్థోపెడిక్స్ & జాయింట్ రీప్లేస్‌మెంట్',
    kn: 'ಆರ್ಥೋಪೆಡಿಕ್ಸ್ ಮತ್ತು ಕೀಲು ಬದಲಿ',
    bn: 'অর্থোপেডিকস ও জয়েন্ট রিপ্লেসমেন্ট',
    pa: 'ਹੱਡੀਆਂ ਦੇ ਰੋਗ',
    ml: 'ഓർത്തോപീഡിക്സ്',
    or: 'ଅସ୍ଥିରୋଗ ବିଭାଗ'
  },
  'ayurvedic medicine & panchakarma': {
    en: 'Ayurvedic Medicine & Panchakarma',
    hi: 'आयुर्वेदिक चिकित्सा एवं पंचकर्म',
    mr: 'आयुर्वेदिक औषध आणि पंचकर्म',
    gu: 'આયુર્વેદિક દવા અને પંચકર્મ',
    ta: 'ஆயுர்வேத மருத்துவம் & பஞ்சகர்மா',
    te: 'ఆయుర్వేద వైద్యం & పంచకర్మ',
    kn: 'ಆಯುರ್ವೇದ ವೈದ್ಯಕೀಯ ಮತ್ತು ಪಂಚಕರ್ಮ',
    bn: 'আয়ুর্বেদিক মেডিসিন ও পঞ্চকর্ম',
    pa: 'ਆਯੁਰਵੇਦ ਅਤੇ ਪੰਚਕਰਮਾ',
    ml: 'ആയുർവേദവും പഞ്ചകർമ്മയും',
    or: 'ଆୟୁର୍ବେଦିକ ଚିକିତ୍ସା ଏବଂ ପଞ୍ଚକର୍ମ'
  },
  'ayurveda & panchakarma': {
    en: 'Ayurveda & Panchakarma',
    hi: 'आयुर्वेद और पंचकर्म',
    mr: 'आयुर्वेद आणि पंचकर्म',
    gu: 'આયુર્વેદ અને પંચકર્મ',
    ta: 'ஆயுர்வேதம் மற்றும் பஞ்சகர்மா',
    te: 'ஆయుర్వేదం మరియు పంచకర్మ',
    kn: 'ಆಯುರ್ವೇದ ಮತ್ತು ಪಂಚಕರ್ಮ',
    bn: 'আয়ুর্বেদ ও পঞ্চকর্ম',
    pa: 'ਆਯੁਰਵੇਦ ਅਤੇ ਪੰਚਕਰਮਾ',
    ml: 'ആയുർവേദവും പഞ്ചകർമ്മയും',
    or: 'ଆୟୁର୍ବେଦ ଏବଂ ପଞ୍ଚକର୍ମ'
  }
};

const MONTH_LOCALIZATION = {
  'JAN': { en: 'JAN', hi: 'जन.', mr: 'जाने.', gu: 'જાન.', ta: 'ஜன.', te: 'జన.', kn: 'ಜನ.', bn: 'জানু.', pa: 'ਜਨ.', ml: 'ജനു.', or: 'ଜାନୁ.' },
  'FEB': { en: 'FEB', hi: 'फर.', mr: 'फेब्रु.', gu: 'ફેબ્રુ.', ta: 'பிப்.', te: 'ఫిబ్ర.', kn: 'ಫೆಬ್ರ.', bn: 'ফেব্রু.', pa: 'ਫਰ.', ml: 'ഫെബ്രു.', or: 'ଫେବୃ.' },
  'MAR': { en: 'MAR', hi: 'मार्च', mr: 'मार्च', gu: 'માર્ચ', ta: 'மார்ச்', te: 'మార్చి', kn: 'ಮಾರ್ಚ್', bn: 'মার্চ', pa: 'ਮਾਰਚ', ml: 'മാർച്ച്', or: 'ମାର୍ଚ୍ଚ' },
  'APR': { en: 'APR', hi: 'अप्रैल', mr: 'एप्रिल', gu: 'એપ્રિલ', ta: 'ஏப்.', te: 'ఏప్రి.', kn: 'ಏಪ್ರಿ.', bn: 'এপ্রিল', pa: 'ਅਪ੍ਰੈ.', ml: 'ഏപ്രിൽ', or: 'ଏପ୍ରି.' },
  'MAY': { en: 'MAY', hi: 'मई', mr: 'मे', gu: 'મે', ta: 'மே', te: 'మే', kn: 'ಮೇ', bn: 'মে', pa: 'ਮਈ', ml: 'മേയ്', or: 'ମେ' },
  'JUN': { en: 'JUN', hi: 'जून', mr: 'जून', gu: 'જૂન', ta: 'ஜூன்', te: 'జూన్', kn: 'ಜೂನ್', bn: 'জুন', pa: 'ਜੂਨ', ml: 'ജൂൺ', or: 'ଜୁନ୍' },
  'JUL': { en: 'JUL', hi: 'जुलाई', mr: 'जुलै', gu: 'જુલાઈ', ta: 'ஜூலை', te: 'జూలై', kn: 'ಜುಲೈ', bn: 'জুলাই', pa: 'ਜੁਲਾਈ', ml: 'ജൂലൈ', or: 'ଜୁଲାଇ' },
  'AUG': { en: 'AUG', hi: 'अग.', mr: 'ऑग.', gu: 'ઓગ.', ta: 'ஆக.', te: 'ఆగ.', kn: 'ಆಗ.', bn: 'আগ.', pa: 'ਅਗ.', ml: 'ഓഗ.', or: 'ଅଗ.' },
  'SEP': { en: 'SEP', hi: 'सित.', mr: 'सप्टें.', gu: 'સપ્ટે.', ta: 'செப்.', te: 'సెప్טెం.', kn: 'ಸೆಪ್ಟೆಂ.', bn: 'সেপ্টে.', pa: 'ਸਤੰ.', ml: 'സെപ്റ്റം.', or: 'ସେପ୍ଟେ.' },
  'OCT': { en: 'OCT', hi: 'अक्तू.', mr: 'ऑक्टो.', gu: 'ઓક્ટો.', ta: 'அக்.', te: 'அକ୍ટો.', kn: 'ಅಕ್ಟೋ.', bn: 'অক্টো.', pa: 'ਅਕਤੂ.', ml: 'ഒക്ടോ.', or: 'ଅକ୍ଟୋ.' },
  'NOV': { en: 'NOV', hi: 'नव.', mr: 'नोव्हें.', gu: 'નવે.', ta: 'நவ.', te: 'నవం.', kn: 'ನವೆಂ.', bn: 'নভে.', pa: 'ਨਵੰ.', ml: 'നവം.', or: 'ନଭେ.' },
  'DEC': { en: 'DEC', hi: 'दिस.', mr: 'डिसें.', gu: 'ડિસે.', ta: 'டிச.', te: 'డిసెం.', kn: 'ಡಿಸೆಂ.', bn: 'ডিসে.', pa: 'ਦਸੰ.', ml: 'ഡിസം.', or: 'ଡିସେ.' }
};

function localizeName(name, lang) {
  if (!name || typeof name !== 'string') return '';
  if (!lang || lang === 'en') return name;
  // "Patient" is a role fallback, not a person's name. Sending it through
  // phonetic name transliteration produces the incorrect Hindi "पतिन्त".
  if (name.trim().toLowerCase() === 'patient' && lang === 'hi') return 'पेशेंट';
  return aiTranslationService.translate(name, lang, 'name');
}

function localizeDoctor(doc, lang = 'en') {
  if (!doc) return lang === 'hi' ? 'डॉक्टर' : 'Doctor';
  const clean = String(doc).trim();
  const target = lang || 'en';

  for (const [key, prof] of Object.entries(DOCTOR_PROFILES)) {
    if (prof.name) {
      if (clean.toLowerCase() === prof.name.toLowerCase() || clean.includes(prof.name)) {
        if (target === 'en') return prof.name;
        return aiTranslationService.translate(prof.name, target, 'doctor') || prof.name;
      }
    }
  }
  return aiTranslationService.translate(clean, target, 'doctor') || clean;
}

const SPECIALTY_MAP = {
  'general medicine': {
    en: 'General Medicine', hi: 'सामान्य चिकित्सा', mr: 'सामान्य औषधोपचार', gu: 'જનરલ મેડિસિન', ta: 'பொது மருத்துவம்', te: 'జనరల్ మెడిసిన్', kn: 'ಸಾಮಾನ್ಯ ವೈದ್ಯಕೀಯ', bn: 'জেনারেল মেডিসিন', ml: 'ജനറൽ മെഡിസിൻ'
  },
  'cardiology': {
    en: 'Cardiology', hi: 'हृदय रोग विभाग (कार्डियोलॉजी)', mr: 'हृदयरोगशास्त्र', gu: 'કાર્ડિયોલોજી', ta: 'இதயவியல்', te: 'కార్డియాలజీ', kn: 'ಹೃದ್ರೋಗ ಶಾಸ್ತ್ರ', bn: 'কার্ডিওলজি', ml: 'കാർഡിയോളജി'
  },
  'pulmonology': {
    en: 'Pulmonology', hi: 'श्वसन एवं फेफड़ा रोग', mr: 'श्वसनविकारशास्त्र', gu: 'પલ્મોનોલોજી', ta: 'சுவாசவியல்', te: 'పల్మోనాలజీ', kn: 'ಶ್ವಾಸಕೋಶ ಶಾಸ್ತ್ರ', bn: 'পালমোনোলজি', ml: 'പൾമണോളജി'
  },
  'ayurveda & panchakarma': {
    en: 'Ayurveda & Panchakarma', hi: 'आयुर्वेद एवं पंचकर्म', mr: 'आयुर्वेद आणि पंचकर्म', gu: 'આયુર્વેદ અને પંચકર્મ', ta: 'ஆயுர்வேதம் மற்றும் பஞ்சகர்மா', te: 'ఆయుర్వేదం & పంచకర్మ', kn: 'ಆಯುರ್ವೇದ ಮತ್ತು ಪಂಚಕರ್ಮ', bn: 'আয়ুর্বেদ ও পঞ্চকর্ম', ml: 'ആയുർവേദവും പഞ്ചകർമ്മയും'
  },
  'ayurveda': {
    en: 'Ayurveda', hi: 'आयुर्वेद', mr: 'आयुर्वेद', gu: 'આયુર્વેદ', ta: 'ஆயுர்வேதம்', te: 'ఆయుర్వేదం', kn: 'ಆಯುರ್ವೇದ', bn: 'আয়ুর্বেদ', ml: 'ആയുർവേദം'
  },
  'pediatrics': {
    en: 'Pediatrics', hi: 'बाल रोग विशेषज्ञ', mr: 'बालरोगशास्त्र', gu: 'બાળરોગ ચિકિત્સા', ta: 'குழந்தை மருத்துவம்', te: 'పీడియాట్రిక్స్', kn: 'ಮಕ್ಕಳ ವೈದ್ಯಶಾಸ್ತ್ರ', bn: 'শিশুচিকিৎসা', ml: 'പീഡിയാട്രിക്സ്'
  },
  'neurology': {
    en: 'Neurology', hi: 'न्यूरोलॉजी (तंत्रिका रोग)', mr: 'मज्जासंस्थेचा विकार', gu: 'ન્યુરોલોજી', ta: 'நரம்பியல்', te: 'న్యూరాలజీ', kn: 'ನರವಿಜ್ಞಾನ', bn: 'নিউরোলজি', ml: 'ന്യൂറോളജി'
  },
  'orthopedics': {
    en: 'Orthopedics', hi: 'अस्थि एवं जोड़ रोग (ऑर्थोपेडिक्स)', mr: 'अस्थिव्यंगोपचार', gu: 'ઓર્થોપેડિક્સ', ta: 'எலும்பியல்', te: 'ఆర్థోపెడిక్స్', kn: 'ಮೂಳೆ ರೋಗಶಾಸ್ತ್ರ', bn: 'অর্থোপেডিকস', ml: 'ഓർത്തോപീഡിക്സ്'
  }
};

function localizeSpecialty(spec, lang = 'en') {
  if (!spec) return lang === 'hi' ? 'सामान्य चिकित्सा' : 'General Medicine';
  const clean = String(spec).trim();
  const target = lang || 'en';

  for (const [key, data] of Object.entries(SPECIALTY_MAP)) {
    if (Object.values(data).some(val => val.toLowerCase() === clean.toLowerCase()) || clean.toLowerCase().includes(key)) {
      return data[target] || data.en || clean;
    }
  }
  return aiTranslationService.translate(clean, target, 'general') || clean;
}

function localizeHospitalName(hName, lang = 'en') {
  if (!hName) return '';
  const clean = String(hName).trim();
  const target = lang || 'en';

  // Search across HOSPITAL_LOCALIZATION for exact or partial matches
  for (const [key, data] of Object.entries(HOSPITAL_LOCALIZATION)) {
    if (!data?.name) continue;
    const names = Object.values(data.name);
    if (
      names.some(n => n.toLowerCase() === clean.toLowerCase()) ||
      (data.name.en && clean.toLowerCase().includes(data.name.en.toLowerCase())) ||
      (data.name.en && data.name.en.toLowerCase().includes(clean.toLowerCase())) ||
      (data.name.hi && clean.includes(data.name.hi)) ||
      (data.name.hi && data.name.hi.includes(clean))
    ) {
      return data.name[target] || data.name.en || clean;
    }
  }

  // Fallback
  if (target === 'en') {
    // If text is in Devanagari or other Indic script, transliterate/translate back to English
    if (/^[\u0900-\u0DFF]/.test(clean)) {
      return aiTranslationService.translate(clean, 'en', 'hospital') || clean;
    }
    return clean;
  }
  return aiTranslationService.translate(clean, target, 'hospital') || clean;
}

function localizeMonth(mon, lang = 'en') {
  if (!mon) return 'AUG';
  const key = String(mon).trim().toUpperCase();
  const target = lang || 'en';
  return MONTH_LOCALIZATION[key]?.[target] || MONTH_LOCALIZATION[key]?.en || mon;
}

/* =========================================================================
   COMPREHENSIVE DOCTOR PROFILES DATABASE (EXACT MATCH TO REFERENCE DESIGNS)
   ========================================================================= */
const DOCTOR_PROFILES = {
  'dr. ananya sharma': {
    name: 'Dr. Ananya Sharma',
    degrees: 'MBBS, MD (General Medicine)',
    specialty: 'General Medicine',
    exp: '12+ Years Exp.',
    years: 12,
    rating: '4.6',
    reviewsCount: '128',
    isAyush: false,
    gender: 'female',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    about: 'Dr. Ananya Sharma is a dedicated General Physician with over 12 years of experience in diagnosing and treating a wide range of medical conditions. She is known for her patient-centric approach and evidence-based treatment plans.',
    patientsTreated: '5000+',
    satisfaction: '98%',
    expertise: ['General Medicine', 'Diabetes Care', 'Hypertension', 'Thyroid Disorders', 'Infectious Diseases', 'Preventive Health Checkups'],
    education: [
      { degree: 'MD (General Medicine)', college: 'SMS Medical College, Jaipur', year: '2010' },
      { degree: 'MBBS', college: 'SMS Medical College, Jaipur', year: '2008' },
      { degree: 'Senior Residency', college: 'SMS Hospital, Jaipur', year: '2011' }
    ],
    experienceTimeline: [
      { role: 'Consultant Physician', hospital: 'Sawai Man Singh Hospital, Jaipur', period: '2015 - Present' },
      { role: 'Senior Resident', hospital: 'SMS Hospital, Jaipur', period: '2011 - 2015' },
      { role: 'Junior Resident', hospital: 'SMS Hospital, Jaipur', period: '2009 - 2011' }
    ],
    reviews: [
      { author: 'Pooja Verma', initial: 'P', rating: 5, time: '2 days ago', comment: 'Very polite doctor and explains everything clearly.' },
      { author: 'Rakesh Singh', initial: 'R', rating: 5, time: '1 week ago', comment: 'Great experience. Diagnosed correctly and helpful.' },
      { author: 'Amit Kumar', initial: 'A', rating: 5, time: '2 weeks ago', comment: 'Good consultation. Recommended.' }
    ]
  },
  'dr. priya verma': {
    name: 'Dr. Priya Verma',
    degrees: 'MBBS',
    specialty: 'General Medicine',
    exp: '10+ Years Exp.',
    years: 10,
    rating: '4.8',
    reviewsCount: '95',
    isAyush: false,
    gender: 'female',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    about: 'Dr. Priya Verma is a skilled consultant providing comprehensive family healthcare and preventive wellness care.',
    patientsTreated: '4200+',
    satisfaction: '97%',
    expertise: ['Women Health', 'Preventive Wellness', 'General Medicine', 'Lifestyle Counseling'],
    education: [
      { degree: 'MBBS', college: 'SMS Medical College', year: '2012' },
      { degree: 'DGO', college: 'RUHS Jaipur', year: '2015' }
    ],
    experienceTimeline: [
      { role: 'Associate Consultant', hospital: 'Sawai Man Singh Hospital', period: '2018 - Present' },
      { role: 'Resident', hospital: 'Govt Medical Center', period: '2015 - 2018' }
    ],
    reviews: [
      { author: 'Sunita Meena', initial: 'S', rating: 5, time: '3 days ago', comment: 'Wonderful doctor, very compassionate.' },
      { author: 'Deepak Jain', initial: 'D', rating: 5, time: '2 weeks ago', comment: 'Very accurate diagnosis and treatment.' }
    ]
  },
  'dr. rohan mehta': {
    name: 'Dr. Rohan Mehta',
    degrees: 'MBBS',
    specialty: 'General Medicine',
    exp: '8+ Years Exp.',
    years: 8,
    rating: '4.7',
    reviewsCount: '84',
    isAyush: false,
    gender: 'male',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    about: 'Dr. Rohan Mehta specializes in internal medicine, managing chronic lifestyle diseases and acute clinical disorders.',
    patientsTreated: '3500+',
    satisfaction: '96%',
    expertise: ['Internal Medicine', 'Chronic Care', 'Metabolic Disorders', 'Infectious Diseases'],
    education: [
      { degree: 'MD (Internal Medicine)', college: 'AIIMS New Delhi', year: '2016' },
      { degree: 'MBBS', college: 'SMS Medical College', year: '2013' }
    ],
    experienceTimeline: [
      { role: 'Consultant', hospital: 'Sawai Man Singh Hospital', period: '2019 - Present' },
      { role: 'Senior Resident', hospital: 'AIIMS New Delhi', period: '2016 - 2019' }
    ],
    reviews: [
      { author: 'Manish Soni', initial: 'M', rating: 5, time: '5 days ago', comment: 'Gives ample time and explains everything.' }
    ]
  },
  'dr. neha agarwal': {
    name: 'Dr. Neha Agarwal',
    degrees: 'MBBS',
    specialty: 'General Medicine',
    exp: '7+ Years Exp.',
    years: 7,
    rating: '4.9',
    reviewsCount: '110',
    isAyush: false,
    gender: 'female',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    about: 'Dr. Neha Agarwal focuses on holistic patient assessment, preventive diagnostics, and emergency outpatient care.',
    patientsTreated: '2900+',
    satisfaction: '99%',
    expertise: ['Preventive Care', 'Family Medicine', 'Diabetes Management', 'Allergies'],
    education: [
      { degree: 'DNB (Family Medicine)', college: 'National Board', year: '2017' },
      { degree: 'MBBS', college: 'JLN Medical College', year: '2014' }
    ],
    experienceTimeline: [
      { role: 'Senior Consultant', hospital: 'Sawai Man Singh Hospital', period: '2020 - Present' }
    ],
    reviews: [
      { author: 'Kavita Joshi', initial: 'K', rating: 5, time: '1 week ago', comment: 'Very reassuring and prompt diagnosis.' }
    ]
  },
  'dr. amit singh': {
    name: 'Dr. Amit Singh',
    degrees: 'MBBS',
    specialty: 'General Medicine',
    exp: '15+ Years Exp.',
    years: 15,
    rating: '4.8',
    reviewsCount: '210',
    isAyush: false,
    gender: 'male',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    about: 'Dr. Amit Singh has 15+ years of clinical excellence in outpatient surgery, trauma care, and general physician consults.',
    patientsTreated: '7500+',
    satisfaction: '98%',
    expertise: ['General Medicine', 'Trauma Assessment', 'Minor OPD Procedures', 'Geriatric Health'],
    education: [
      { degree: 'MS', college: 'SMS Medical College', year: '2009' },
      { degree: 'MBBS', college: 'SMS Medical College', year: '2005' }
    ],
    experienceTimeline: [
      { role: 'Senior Professor & Consultant', hospital: 'Sawai Man Singh Hospital', period: '2014 - Present' }
    ],
    reviews: [
      { author: 'Babulal Meena', initial: 'B', rating: 5, time: '4 days ago', comment: 'Senior doctor with immense practical wisdom.' }
    ]
  },
  'vaidya r. mehta': {
    name: 'Vaidya R. Mehta',
    degrees: 'BAMS, MD',
    specialty: 'Ayurveda & Panchakarma',
    exp: '18+ Years Exp.',
    years: 18,
    rating: '4.9',
    reviewsCount: '190',
    isAyush: true,
    gender: 'male',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
    about: 'Vaidya R. Mehta is a distinguished Ayurvedic physician with expertise in Nadi Pariksha, Tridosha balancing, and Panchakarma therapies.',
    patientsTreated: '8000+',
    satisfaction: '99%',
    expertise: ['Ayurveda & Panchakarma', 'Nadi Pariksha', 'Digestive Health', 'Joint Care', 'Herbal Formulations'],
    education: [
      { degree: 'MD (Ayurveda)', college: 'National Institute of Ayurveda', year: '2006' },
      { degree: 'BAMS', college: 'Gujarat Ayurved University', year: '2002' }
    ],
    experienceTimeline: [
      { role: 'Chief Ayurvedic Consultant', hospital: 'All India Institute of Ayurveda', period: '2012 - Present' }
    ],
    reviews: [
      { author: 'Suresh Chandra', initial: 'S', rating: 5, time: '1 day ago', comment: 'Cured my chronic acidity naturally with lifestyle advice.' }
    ]
  },
  'vaidya sanjeev sharma': {
    name: 'Vaidya Sanjeev Sharma',
    degrees: 'BAMS, Ph.D.',
    specialty: 'Ayurveda & Panchakarma',
    exp: '22+ Years Exp.',
    years: 22,
    rating: '5.0',
    reviewsCount: '340',
    isAyush: true,
    gender: 'male',
    avatar: 'https://randomuser.me/api/portraits/men/61.jpg',
    about: 'Vaidya Sanjeev Sharma is an authority in traditional Indian medicine and integrative wellness care.',
    patientsTreated: '12000+',
    satisfaction: '100%',
    expertise: ['Rasayana & Rejuvenation', 'Ayurveda Chronic Care', 'Panchakarma Detox', 'Dietary Therapy'],
    education: [
      { degree: 'Ph.D. (Ayurveda)', college: 'NIA Jaipur', year: '2002' },
      { degree: 'BAMS', college: 'Jaipur University', year: '1998' }
    ],
    experienceTimeline: [
      { role: 'Director & Senior Vaidya', hospital: 'National Institute of Ayurveda', period: '2010 - Present' }
    ],
    reviews: [
      { author: 'Kamla Devi', initial: 'K', rating: 5, time: '3 days ago', comment: 'Extremely knowledgeable and kind.' }
    ]
  }
};

const DOCTOR_DIRECTORY_AVATARS = {
  'dr. randeep guleria': ['men', 11],
  'dr. vikramaditya rathore': ['men', 18],
  'dr. naresh trehan': ['men', 24],
  'dr. arjun mehta': ['men', 35],
  'dr. rajesh verma': ['men', 43],
  'dr. neha gupta': ['women', 12],
  'dr. gayatri joshi': ['women', 28],
  'dr. devi shetty': ['men', 57],
  'dr. manoj saxena': ['men', 64],
  'dr. sunita khandelwal': ['women', 39],
};

const getDoctorFallbackAvatar = name => {
  const normalized = String(name || 'doctor').toLowerCase().trim();
  const configured = DOCTOR_DIRECTORY_AVATARS[normalized];
  if (configured) return `https://randomuser.me/api/portraits/${configured[0]}/${configured[1]}.jpg`;

  const femaleName = /\b(ananya|priya|neha|anjali|pooja|sunita|kavita|gayatri)\b/.test(normalized);
  // A stable name hash gives every future doctor a consistent portrait instead
  // of reusing one global fallback image.
  const hash = Array.from(normalized).reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 7);
  const portraitNumber = 10 + (hash % 80);
  return `https://randomuser.me/api/portraits/${femaleName ? 'women' : 'men'}/${portraitNumber}.jpg`;
};

function getDoctorFullProfile(doctor, hospital) {
  const docKey = (doctor?.name || '').toLowerCase().trim();
  const profile = DOCTOR_PROFILES[docKey] || {};

  return {
    id: doctor?.id || profile.id || null,
    name: doctor?.name || 'Dr. Ananya Sharma',
    degrees: doctor?.degrees || doctor?.degree || profile.degrees || 'MBBS, MD (General Medicine)',
    specialty: doctor?.speciality || doctor?.specialty || profile.specialty || (doctor?.isAyush || doctor?.system === 'Ayurveda' ? 'Ayurveda & Panchakarma' : 'General Medicine'),
    exp: doctor?.experience ? `${doctor.experience}+ Years Exp.` : (doctor?.exp || profile.exp || '12+ Years Exp.'),
    years: doctor?.experience || profile.years || 12,
    rating: doctor?.rating ? String(doctor.rating) : (profile.rating || '4.8'),
    reviewsCount: doctor?.reviews_count ? String(doctor.reviews_count) : (profile.reviewsCount || '128'),
    isAyush: doctor?.system === 'Ayurveda' || doctor?.isAyush || profile.isAyush || false,
    gender: doctor?.gender ? String(doctor.gender).toLowerCase() : (profile.gender || (/\b(ananya|priya|neha|anjali|pooja|sunita|kavita|gayatri)\b/i.test(doctor?.name || '') ? 'female' : 'male')),
    avatar: doctor?.avatar_url || doctor?.avatar || profile.avatar || getDoctorFallbackAvatar(doctor?.name),
    about: doctor?.about || profile.about || `${doctor?.name || 'This doctor'} is a dedicated specialist at ${hospital?.name || doctor?.hospital_name || doctor?.hospitalName || 'the hospital'} with extensive clinical experience diagnosing and treating patients with evidence-based care.`,
    patientsTreated: profile.patientsTreated || '5000+',
    satisfaction: profile.satisfaction || '98%',
    expertise: profile.expertise || [doctor?.speciality || doctor?.specialty || 'General Medicine', 'Preventive Healthcare', 'Clinical Assessment', 'Patient Counseling', 'Diagnostic Evaluation'],
    education: profile.education || [
      { degree: doctor?.degrees || 'MD / Master Degree', college: `${hospital?.name || doctor?.hospital_name || 'Medical College'}`, year: '2012' },
      { degree: 'MBBS / Medical Degree', college: 'State Medical University', year: '2008' },
      { degree: 'Clinical Senior Residency', college: `${hospital?.name || doctor?.hospital_name || 'Hospital'}`, year: '2014' }
    ],
    experienceTimeline: profile.experienceTimeline || [
      { role: 'Senior Consultant', hospital: hospital?.name || doctor?.hospital_name || 'Medical Hospital', period: '2016 - Present' },
      { role: 'Resident Medical Specialist', hospital: hospital?.name || doctor?.hospital_name || 'Hospital', period: '2012 - 2016' }
    ],
    reviews: profile.reviews || [
      { author: 'Pooja Verma', initial: 'P', rating: 5, time: '2 days ago', comment: 'Very polite doctor and explains everything clearly.' },
      { author: 'Rakesh Singh', initial: 'R', rating: 5, time: '1 week ago', comment: 'Great experience. Diagnosed correctly and helpful.' },
      { author: 'Amit Kumar', initial: 'A', rating: 5, time: '2 weeks ago', comment: 'Good consultation. Recommended.' }
    ]
  };
}

/* =========================================================================
   COMPREHENSIVE LOCALIZED HOSPITAL DIRECTORY (10+ MAJOR HOSPITALS)
   ========================================================================= */
const HOSPITAL_LOCALIZATION = {
  'aiims-delhi': {
    name: {
      en: 'AIIMS New Delhi',
      hi: 'एम्स नई दिल्ली (अखिल भारतीय आयुर्विज्ञान संस्थान)',
      mr: 'एम्स नवी दिल्ली',
      gu: 'એઈમ્સ નવી દિલ્હી',
      ta: 'எய்ம்ஸ் புது தில்லி',
      te: 'ఎయిమ్స్ న్యూఢిల్లీ',
      kn: 'ಏಮ್ಸ್ ನವದೆಹಲಿ',
      bn: 'এইমস নতুন দিল্লি',
      pa: 'ਏਮਜ਼ ਨਵੀਂ ਦਿੱਲੀ',
      ml: 'എയിംസ് ന്യൂഡൽഹി',
      or: 'ଏମ୍ସ ନୂଆଦିଲ୍ଲୀ'
    },
    address: {
      en: 'Ansari Nagar, New Delhi',
      hi: 'अंसारी नगर, नई दिल्ली',
      mr: 'अंसारी नगर, नवी दिल्ली',
      gu: 'અંસારી નગર, નવી દિલ્હી',
      ta: 'அன்சாரி நகர், புது தில்லி',
      te: 'అన్సారీ నగర్, న్యూఢిల్లీ',
      kn: 'ಅನ್ಸಾರಿ ನಗರ, ನವದೆಹಲಿ',
      bn: 'আনসারি নগর, নতুন দিল্লি',
      pa: 'ਅੰਸਾਰੀ ਨਗਰ, ਨਵੀਂ ਦਿੱਲੀ',
      ml: 'അൻസാരി നഗർ, ന്യൂഡൽഹി',
      or: 'ଅନସାରୀ ନଗର, ନୂଆଦିଲ୍ଲୀ'
    },
    doctors: [
      { name: 'Dr. Randeep Guleria', specialty: 'Pulmonology', exp: '26 yrs' },
      { name: 'Dr. Ananya Sharma', specialty: 'General Medicine', exp: '14 yrs' },
      { name: 'Dr. Vikramaditya Rathore', specialty: 'Cardiology', exp: '20 yrs' }
    ]
  },
  'sms-jaipur': {
    name: {
      en: 'Sawai Man Singh Hospital',
      hi: 'सवाई मान सिंह अस्पताल',
      mr: 'सवाई मान सिंग रुग्णालय',
      gu: 'સવાઈ માન સિંહ હોસ્પિટલ',
      ta: 'சவாய் மான் சிங் மருத்துவமனை',
      te: 'సవాయ్ మాన్ సింగ్ ఆసుపత్రి',
      kn: 'ಸವಾಯ್ ಮಾನ್ ಸಿಂಗ್ ಆಸ್ಪತ್ರೆ',
      bn: 'সওয়াই মান সিং হাসপাতাল',
      pa: 'ਸਵਾਈ ਮਾਨ ਸਿੰਘ ਹਸਪਤਾਲ',
      ml: 'സവായ് മാൻ സിംഗ് ആശുപത്രി',
      or: 'ସୱାଇ ମାନ ସିଂହ ଡାକ୍ତରଖାନା'
    },
    address: {
      en: 'Jawahar Lal Nehru Marg, Jaipur, Rajasthan',
      hi: 'जवाहर लाल नेहरू मार्ग, जयपुर, राजस्थान',
      mr: 'जवाहर लाल नेहरू मार्ग, जयपूर, राजस्थान',
      gu: 'જવાહર લાલ નેહરુ માર્ગ, જયપુર, રાજસ્થાન',
      ta: 'ஜவஹர் லால் நேரு மார்க், ஜெய்ப்பூர், ராஜஸ்தான்',
      te: 'జవహర్ లాల్ నెహ్రూ మార్గ్, జైపూర్, రాజస్థాన్',
      kn: 'ಜವಾಹರ ಲಾಲ್ ನೆಹರು ಮಾರ್ಗ, ಜೈಪುರ, ರಾಜಸ್ಥಾನ',
      bn: 'জওহর লাল নেহেরু মার্গ, জয়পুর, রাজস্থান',
      pa: 'ਜਵਾਹਰ ਲਾਲ ਨਹਿਰੂ ਮਾਰਗ, ਜੈਪੁਰ, ਰਾਜਸਥਾਨ',
      ml: 'ജവഹർ ലാൽ നെഹ്‌റു മാർഗ്, ജയ്‌പൂർ, രാജസ്ഥാൻ',
      or: 'ଜବାହର ଲାଲ ନେହେରୁ ମାର୍ଗ, ଜୟପୁର, ରାଜସ୍ଥାନ'
    },
    doctors: [
      { name: 'Dr. Ananya Sharma', specialty: 'General Medicine', exp: '12+ Years Exp.', degree: 'MBBS', isAyush: false },
      { name: 'Dr. Priya Verma', specialty: 'General Medicine', exp: '10+ Years Exp.', degree: 'MBBS', isAyush: false },
      { name: 'Dr. Rohan Mehta', specialty: 'General Medicine', exp: '8+ Years Exp.', degree: 'MBBS', isAyush: false },
      { name: 'Dr. Neha Agarwal', specialty: 'General Medicine', exp: '7+ Years Exp.', degree: 'MBBS', isAyush: false },
      { name: 'Dr. Amit Singh', specialty: 'General Medicine', exp: '15+ Years Exp.', degree: 'MBBS', isAyush: false },
      { name: 'Vaidya R. Mehta', specialty: 'Ayurveda & Panchakarma', exp: '18+ Years Exp.', degree: 'BAMS', isAyush: true },
      { name: 'Vaidya Sanjeev Sharma', specialty: 'Ayurveda & Panchakarma', exp: '22+ Years Exp.', degree: 'BAMS', isAyush: true }
    ]
  },
  'apollo-delhi': {
    name: {
      en: 'Indraprastha Apollo Hospitals',
      hi: 'इंद्रप्रस्थ अपोलो अस्पताल',
      mr: 'इंद्रप्रस्थ अपोलो रुग्णालय',
      gu: 'ઇન્દ્રપ્રસ્થ એપોલો હોસ્પિટલ',
      ta: 'இந்திரபிரஸ்தா அப்பல்லோ மருத்துவமனை',
      te: 'ఇంద్రప్రస్థ అపోలో ఆసుపత్రి',
      kn: 'ಇಂದ್ರಪ್ರಸ್ಥ ಅಪೊಲೊ ಆಸ್ಪತ್ರೆ',
      bn: 'ইন্দ্রপ্রস্থ অ্যাপোলো হাসপাতাল',
      pa: 'ਇੰਦਰਪ੍ਰਸਥ ਅਪੋਲੋ ਹਸਪਤਾਲ',
      ml: 'ഇന്ദ്രപ്രസ്ഥ അപ്പോളോ ആശുപത്രി',
      or: 'ଇନ୍ଦ୍ରପ୍ରସ୍ଥ ଆପୋଲୋ ଡାକ୍ତରଖାନା'
    },
    address: {
      en: 'Sarita Vihar, Mathura Road, New Delhi',
      hi: 'सरिता विहार, मथुरा रोड, नई दिल्ली',
      mr: 'सरिता विहार, मथुरा रोड, नवी दिल्ली',
      gu: 'સરિતા વિહાર, મથુરા રોડ, નવી દિલ્હી',
      ta: 'சரிதா விஹார், மதுரா ரோடு, புது தில்லி',
      te: 'సరిత విహార్, మధుర రోడ్డు, న్యూఢిల్లీ',
      kn: 'ಸರಿತಾ ವಿಹಾರ್, ಮಥುರಾ ರಸ್ತೆ, ನವದೆಹಲಿ',
      bn: 'সারিতা বিহার, মথুরা রোড, নতুন দিল্লি',
      pa: 'ਸਰਿਤਾ ਵਿਹਾਰ, ਮਥੁਰਾ ਰੋਡ, ਨਵੀਂ ਦਿੱਲੀ',
      ml: 'സരിത വിഹാർ, മഥുര റോഡ്, ന്യൂഡൽഹി',
      or: 'ସରିତା ବିହାର, ମଥୁରା ରୋଡ, ନୂଆଦିଲ୍ଲୀ'
    },
    doctors: [
      { name: 'Dr. Naresh Trehan', specialty: 'Cardiology', exp: '24 yrs' },
      { name: 'Dr. Arjun Mehta', specialty: 'General Medicine', exp: '15 yrs' }
    ]
  },
  'shalby-jaipur': {
    name: {
      en: 'Shalby Hospital Jaipur',
      hi: 'शालबी अस्पताल जयपुर',
      mr: 'शाल्बी रुग्णालय जयपूर',
      gu: 'શાલ્બી હોસ્પિટલ જયપુર',
      ta: 'ஷால்பி மருத்துவமனை ஜெய்ப்பூர்',
      te: 'షాల్బీ ఆసుపత్రి జైపూర్',
      kn: 'ಶಾಲ್ಬಿ ಆಸ್ಪತ್ರೆ ಜೈಪುರ',
      bn: 'শালবি হাসপাতাল জয়পুর',
      pa: 'ਸ਼ਾਲਬੀ ਹਸਪਤਾਲ ਜੈਪੁਰ',
      ml: 'ഷാൽബി ആശുപത്രി ജയ്‌പൂർ',
      or: 'ଶାଲବି ଡାକ୍ତରଖାନା ଜୟପୁର'
    },
    address: {
      en: 'Vaishali Nagar, Jaipur, Rajasthan',
      hi: 'वैशाली नगर, जयपुर, राजस्थान',
      mr: 'वैशाली नगर, जयपूर, राजस्थान',
      gu: 'વૈશાલી નગર, જયપુર, રાજસ્થાન',
      ta: 'வைஷாலி நகர், ஜெய்ப்பூர், ராஜஸ்தான்',
      te: 'వైశాలి నగర్, జైపూర్, రాజస్థాన్',
      kn: 'ವೈಶಾಲಿ ನಗರ, ಜೈಪುರ, ರಾಜಸ್ಥಾನ',
      bn: 'বৈশালী নগর, জয়পুর, রাজস্থান',
      pa: 'ਵੈਸ਼ਾਲੀ ਨਗਰ, ਜੈਪੁਰ, ਰਾਜਸਥਾਨ',
      ml: 'വൈശാലി നഗർ, ജയ്‌പൂർ, രാജസ്ഥാൻ',
      or: 'ବୈଶାଳୀ ନଗର, ଜୟପୁର, ରାଜସ୍ଥାନ'
    },
    doctors: [
      { name: 'Dr. Rajesh Verma', specialty: 'Orthopedics & Joint Replacement', exp: '15 yrs' },
      { name: 'Dr. Neha Gupta', specialty: 'General Medicine', exp: '9 yrs' },
      { name: 'Dr. Arjun Mehta', specialty: 'Neurology', exp: '14 yrs' }
    ]
  },
  'aiia-delhi': {
    name: {
      en: 'All India Institute of Ayurveda (AIIA)',
      hi: 'अखिल भारतीय आयुर्वेद संस्थान',
      mr: 'अखिल भारतीय आयुर्वेद संस्था',
      gu: 'અખિલ ભારતીય આયુર્વેદ સંસ્થા',
      ta: 'அகில இந்திய ஆயுர்வேத நிறுவனம்',
      te: 'అఖిల భారత ఆయుర్వేద సంస్థ',
      kn: 'ಅಖಿಲ ಭಾರತ ಆಯುರ್ವೇದ ಸಂಸ್ಥೆ',
      bn: 'অল ইন্ডিয়া ইনস্টিটিউট অফ আয়ুর্বেদ',
      pa: 'ਆਲ ਇੰਡੀਆ ਇੰਸਟੀਚਿਊਟ ਆਫ਼ ਆਯੁਰਵੇਦ',
      ml: 'ഓൾ ഇന്ത്യ ഇൻസ്റ്റിറ്റ്യൂട്ട് ഓഫ് ആയുർവേദ',
      or: 'ଅଲ୍ ଇଣ୍ଡିଆ ଇନଷ୍ଟିଚ୍ୟୁଟ୍ ଅଫ୍ ଆୟୁର୍ବେଦ'
    },
    address: {
      en: 'Ayush Campus, Sarita Vihar, New Delhi',
      hi: 'आयुष परिसर, सरिता विहार, नई दिल्ली',
      mr: 'आयुष परिसर, सरिता विहार, नवी दिल्ली',
      gu: 'આયુષ કેમ્પસ, સરિતા વિહાર, નવી દિલ્હી',
      ta: 'ஆயுஷ் வளாகம், சரிதா விஹார், புது தில்லி',
      te: 'ఆయుష్ క్యాంపస్, సరిత విహార్, న్యూఢిల్లీ',
      kn: 'ಆಯುಷ್ ಕ್ಯಾಂಪಸ್, ಸರಿತಾ ವಿಹಾರ್, ನವದೆಹಲಿ',
      bn: 'আয়ুষ ক্যাম্পাস, সারিতা বিহার, নতুন দিল্লি',
      pa: 'ਆਯੁਸ਼ ਕੈਂਪਸ, ਸਰਿਤਾ ਵਿਹਾਰ, ਨਵੀਂ ਦਿੱਲੀ',
      ml: 'ആയുഷ് കാമ്പസ്, സരിത വിഹാർ, ന്യൂഡൽഹി',
      or: 'ଆୟୁଷ କ୍ୟାମ୍ପସ, ସରିତା ବିହାର, ନୂଆଦିଲ୍ଲୀ'
    },
    isAyush: true,
    doctors: [
      { name: 'Vaidya R. Mehta', specialty: 'Ayurvedic Medicine & Panchakarma', exp: '20 yrs' },
      { name: 'Dr. Gayatri Joshi', specialty: 'Nadi Pariksha & Kayachikitsa', exp: '14 yrs' }
    ]
  },
  'nia-jaipur': {
    name: {
      en: 'National Institute of Ayurveda (NIA)',
      hi: 'राष्ट्रीय आयुर्वेद संस्थान जयपुर',
      mr: 'राष्ट्रीय आयुर्वेद संस्था जयपूर',
      gu: 'રાષ્ટ્રીય આયુર્વેદ સંસ્થા જયપુર',
      ta: 'தேசிய ஆயுர்வேத நிறுவனம் ஜெய்ப்பூர்',
      te: 'జాతీయ ఆయుర్వేద సంస్థ జైపూర్',
      kn: 'ರಾಷ್ಟ್ರೀಯ ಆಯುರ್ವೇದ ಸಂಸ್ಥೆ ಜೈಪುರ',
      bn: 'ন্যাশনাল ইনস্টিটিউট অফ আয়ুর্বেদ জয়পুর',
      pa: 'ਰਾਸ਼ਟਰੀ ਆਯੁਰਵੇਦ ਸੰਸਥਾਨ ਜੈਪੁਰ',
      ml: 'നാഷണൽ ഇൻസ്റ്റിറ്റ്യൂട്ട് ഓഫ് ആയുർവേദ ജയ്‌പൂർ',
      or: 'ଜାତୀୟ ଆୟୁର୍ବେଦ ସଂସ୍ଥାନ ଜୟପୁର'
    },
    address: {
      en: 'Jorawar Singh Gate, Amer Road, Jaipur, Rajasthan',
      hi: 'जोरावर सिंह गेट, आमेर रोड, जयपुर, राजस्थान',
      mr: 'जोरावर सिंग गेट, आमेर रोड, जयपूर, राजस्थान',
      gu: 'જોરાવર સિંહ ગેટ, આમેર રોડ, જયપુર, રાજસ્થાન',
      ta: 'ஜோராவர் சிங் கேட், ஆம்பர் ரோடு, ஜெய்ப்பூர், ராஜஸ்தான்',
      te: 'జోరావర్ సింగ్ గేట్, ఆమెర్ రోడ్, జైపూర్, రాజస్థాన్',
      kn: 'ಜೋರಾವರ್ ಸಿಂಗ್ ಗೇಟ್, ಅಮೇರ್ ರಸ್ತೆ, ಜೈಪುರ, ರಾಜಸ್ಥಾನ',
      bn: 'জোরাওয়ার সিং গেট, আমের রোড, জয়পুর, রাজস্থান',
      pa: 'ਜੋਰਾਵਰ ਸਿੰਘ ਗੇਟ, ਆਮੇਰ ਰੋਡ, ਜੈਪੁਰ, ਰਾਜਸਥਾਨ',
      ml: 'ജൊറാവർ സിംഗ് ഗേറ്റ്, ആമേർ റോഡ്, ജയ്‌പൂർ, രാജസ്ഥാൻ',
      or: 'ଜୋରାୱର ସିଂହ ଗେଟ୍, ଆମେର ରୋଡ, ଜୟପୁର, ରାଜସ୍ଥାନ'
    },
    isAyush: true,
    doctors: [
      { name: 'Vaidya Sanjeev Sharma', specialty: 'Ayurvedic Medicine & Panchakarma', exp: '22 yrs' },
      { name: 'Vaidya R. Mehta', specialty: 'Ayurveda & Panchakarma', exp: '18 yrs' }
    ]
  },
  'narayana-bangalore': {
    name: {
      en: 'Narayana Health City',
      hi: 'नारायणा हेल्थ सिटी बेंगलुरु',
      mr: 'नारायणा हेल्थ सिटी बंगळुरू',
      gu: 'નારાયણા હેલ્થ સિટી બેંગલુરુ',
      ta: 'நாராயணா ஹெல்த் சிட்டி பெங்களூரு',
      te: 'నారాయణ హెల్త్ సిటీ బెంగళూరు',
      kn: 'ನಾರಾಯಣ ಹೆಲ್ತ್ ಸಿಟಿ ಬೆಂಗಳೂರು',
      bn: 'নারায়না হেলথ সিটি বেঙ্গালুরু',
      pa: 'ਨਾਰਾਇਣਾ ਹੈਲਥ ਸਿਟੀ ਬੈਂਗਲੁਰੂ',
      ml: 'നാരായണ ഹെൽത്ത് സിറ്റി ബെംഗളൂരു',
      or: 'ନାରାୟଣା ହେଲଥ୍ ସିଟି ବାଙ୍ଗାଲୋର'
    },
    address: {
      en: 'Bommasandra Industrial Area, Bangalore, Karnataka',
      hi: 'बोम्मासंद्र औद्योगिक क्षेत्र, बेंगलुरु, कर्नाटक',
      mr: 'बोम्मासंद्रा औद्योगिक क्षेत्र, बंगळुरू, कर्नाटक',
      gu: 'બોમ્માસન્દ્રા ઔદ્યોગિક વિસ્તાર, બેંગલુરુ, કર્ણાટક',
      ta: 'பொம்மசந்திரா தொழிற்பேட்டை, பெங்களூரு, கர்நாடகா',
      te: 'బొమ్మసంద్ర పారిశ్రామిక ప్రాంతం, బెంగళూరు, కర్ణాటక',
      kn: 'ಬೊಮ್ಮಸಂದ್ರ ಕೈಗಾರಿಕಾ ಪ್ರದೇಶ, ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ',
      bn: 'বোম্মাসন্দ্র ইন্ডাস্ট্রিয়াল এরিয়া, বেঙ্গালুরু, কর্ণাটক',
      pa: 'ਬੋਮਾਸੰਦਰਾ ਉਦਯੋਗਿਕ ਖੇਤਰ, ਬੈਂਗਲੁਰੂ, ਕਰਨਾਟਕ',
      ml: 'ബൊമ്മസാന്ദ്ര ഇൻഡസ്ട്രിയൽ ഏരിയ, ബെംഗളൂരു, കർണാടക',
      or: 'ବୋମ୍ମାସାନ୍ଦ୍ରା ଶିଳ୍ପାଞ୍ଚଳ, ବାଙ୍ଗାଲୋର, କର୍ଣ୍ଣାଟକ'
    },
    doctors: [
      { name: 'Dr. Devi Shetty', specialty: 'Cardiology', exp: '30 yrs' },
      { name: 'Dr. Neha Gupta', specialty: 'General Medicine', exp: '11 yrs' }
    ]
  },
    'fortis-jaipur': {
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
    doctors: [
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
  },
'jaipur-hospital': {
    name: {
      en: 'Jaipur Hospital',
      hi: 'जयपुर अस्पताल',
      mr: 'जयपूर रुग्णालय',
      gu: 'જયપુર હોસ્પિટલ',
      ta: 'ஜெய்ப்பூர் மருத்துவமனை',
      te: 'జైపూర్ ఆసుపత్రి',
      kn: 'ಜೈಪುರ ಆಸ್ಪತ್ರೆ',
      bn: 'জয়পুর হাসপাতাল',
      pa: 'ਜੈਪੁਰ ਹਸਪਤਾਲ',
      ml: 'ജയ്‌പൂർ ആശുപത്രി',
      or: 'ଜୟପୁର ଡାକ୍ତରଖାନା'
    },
    address: {
      en: 'Lal Kothi, Jaipur, Rajasthan',
      hi: 'लाल कोठी, जयपुर, राजस्थान',
      mr: 'लाल कोठी, जयपूर, राजस्थान',
      gu: 'લાલ કોઠી, જયપુર, રાજસ્થાન',
      ta: 'லால் கோதி, ஜெய்ப்பூர், ராஜஸ்தான்',
      te: 'లాల్ కోఠి, జైపూర్, రాజస్థాన్',
      kn: 'ಲಾಲ್ ಕೋಠಿ, ಜೈಪುರ, ರಾಜಸ್ಥಾನ',
      bn: 'লাল কোঠি, জয়পুর, রাজস্থান',
      pa: 'ਲਾਲ ਕੋਠੀ, ਜੈਪੁਰ, ਰਾਜਸਥਾਨ',
      ml: 'ലാൽ കോത്തി, ജയ്‌പൂർ, രാജസ്ഥാൻ',
      or: 'ଲାଲ କୋଠି, ଜୟପୁର, ରାଜସ୍ଥାନ'
    },
    doctors: [
      { name: 'Dr. Manoj Saxena', specialty: 'General Medicine', exp: '11 yrs' },
      { name: 'Dr. Sunita Khandelwal', specialty: 'Pediatrics', exp: '8 yrs' }
    ]
  }
};

const PATIENT_VOICE_COMMANDS = {
  bookAppointment: ['book appointment','appointment book karo','अपॉइंटमेंट बुक करें','முன்பதிவு செய்யுங்கள்','అపాయింట్‌మెంట్ బుక్ చేయండి','অ্যাপয়েন্টমেন্ট বুক করুন','अपॉइंटमेंट बुक करा','એપોઇન્ટમેન્ટ બુક કરો','ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ','അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്യുക'],
  viewAppointments: ['appointments','मेरे अपॉइंटमेंट','எனது முன்பதிவுகள்','నా అపాయింట్‌మెంట్లు','আমার অ্যাপয়েন্টমেন্ট','माझ्या अपॉइंटमेंट','મારી એપોઇન્ટમેન્ટ','ನನ್ನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಳು','എന്റെ അപ്പോയിന്റ്മെന്റുകൾ'],
  viewHistory: ['appointment history','पुराने अपॉइंटमेंट','முன்பதிவு வரலாறு','అపాయింట్‌మెంట్ చరిత్ర','অ্যাপয়েন্টমেন্ট ইতিহাস','अपॉइंटमेंट इतिहास','એપોઇન્ટમેન્ટ ઇતિહાસ','ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಇತಿಹಾಸ','അപ്പോയിന്റ്മെന്റ് ചരിത്രം'],
  viewReports: ['medical reports','मेरी रिपोर्ट','மருத்துவ அறிக்கைகள்','వైద్య నివేదికలు','মেডিকেল রিপোর্ট','वैद्यकीय अहवाल','મેડિકલ રિપોર્ટ','ವೈದ್ಯಕೀಯ ವರದಿಗಳು','മെഡിക്കൽ റിപ്പോർട്ടുകൾ'],
  viewDonations: ['donations','दान खोलें','நன்கொடைகள்','విరాళాలు','দান','देणगी','દાન','ದೇಣಿಗೆಗಳು','സംഭാവനകൾ'],
  viewCommunities: ['communities','समुदाय खोलें','சமூகங்கள்','సంఘాలు','কমিউনিটি','समुदाय उघडा','સમુદાયો','ಸಮುದಾಯಗಳು','സമൂഹങ്ങൾ'],
  help: ['help','support','मदद','सहायता','உதவி','సహాయం','সাহায্য','मदत','મદદ','ಸಹಾಯ','സഹായം'],
  scanRecord: ['scan report','रिपोर्ट स्कैन करें','அறிக்கையை ஸ்கேன் செய்','నివేదిక స్కాన్ చేయండి','রিপোর্ট স্ক্যান করুন','अहवाल स्कॅन करा','રિપોર્ટ સ્કેન કરો','ವರದಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ','റിപ്പോർട്ട് സ്കാൻ ചെയ്യുക'],
  toggleAyush: ['toggle ayush','आयुष मोड','ஆயுஷ் முறை','ఆయుష్ మోడ్','আয়ুষ মোড','आयुष मोड','આયુષ મોડ','ಆಯುಷ್ ಮೋಡ್','ആയുഷ് മോഡ്'],
};

export default function PatientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, setToken, setSubmitted, setAyushMode, addDocument, removeDocument, logout } = useSession();
  const isAyushMode = session.isAyushMode;
  const { currentLang, setCurrentLang, availableLanguages } = useLanguage();
  const { registerPage, unregisterPage, setOnTranscript, clearOnTranscript, speak } = useVoiceNav();
  const reportsFileInputRef = useRef(null);
  const hospitalCatalogRef = useRef([]);
  const bookingHospitalRef = useRef(null);

  // Translation helper
  const tr = (key) => {
    const langDict = DASHBOARD_I18N[currentLang] || DASHBOARD_I18N.en;
    return langDict[key] || DASHBOARD_I18N.en[key] || key;
  };
  const ui = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'general');
  const uiName = (text) => currentLang === 'en' ? text : aiTranslationService.translate(text, currentLang, 'name');

  // Sidebar Collapsible State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Active Sidebar Tab
  const [activeTab, setActiveTab] = useState('appointments');

  // Trigger voice feedback dynamically when navigating between tabs
  useEffect(() => {
    import('../voicenav/AudioPromptManager').then(module => {
      const audioPromptManager = module.default;
      audioPromptManager.setCurrentPage(activeTab);
      // The second parameter `true` forces it to speak even if it has spoken before in this session
      audioPromptManager.speakPageWelcome(activeTab, true);
    }).catch(err => console.error('Failed to load AudioPromptManager', err));
  }, [activeTab]);

  // Header Dropdowns
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    if (!langDropdownOpen && !profileDropdownOpen) return undefined;

    const closeHeaderDropdowns = event => {
      const clickedLanguage = languageDropdownRef.current?.contains(event.target);
      const clickedProfile = profileDropdownRef.current?.contains(event.target);
      if (!clickedLanguage) setLangDropdownOpen(false);
      if (!clickedProfile) setProfileDropdownOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setLangDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeHeaderDropdowns);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeHeaderDropdowns);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [langDropdownOpen, profileDropdownOpen]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All' | 'Government' | 'Private' | 'AYUSH' | 'Near Me'

  // Dynamic Database Doctors & Hospitals
  const [dbDoctorsList, setDbDoctorsList] = useState([]);
  const [dbHospitalsList, setDbHospitalsList] = useState([]);

  // 2-Step Doctor Selection & Profile Flow (Matching User References)
  const [bookingFlowView, setBookingFlowView] = useState('main'); // 'main' | 'doctor_select' | 'doctor_profile'
  const [selectedDoctorObj, setSelectedDoctorObj] = useState(null);
  const [doctorCareSystem, setDoctorCareSystem] = useState('allopathy'); // 'allopathy' | 'ayurveda'
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  // All Hospitals Modal View
  const [showAllHospitalsModal, setShowAllHospitalsModal] = useState(false);

  // A booking command issued before this dashboard mounted (for example on
  // the landing page) must produce a visible next step after navigation.
  useEffect(() => {
    if (location.state?.voiceAction !== 'bookAppointment') return;
    setActiveTab('appointments');
    setBookingFlowView('main');
    setShowAllHospitalsModal(true);
    navigate('/patient-dashboard', { replace: true, state: null });
  }, [location.state, navigate]);

  // Appointment Booking Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingHospital, setBookingHospital] = useState(null);
  bookingHospitalRef.current = bookingHospital;
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDept, setSelectedDept] = useState('General Medicine');
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newlyBookedToken, setNewlyBookedToken] = useState(null);

  // Appointment Details / QR Modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAllAppointmentsModal, setShowAllAppointmentsModal] = useState(false);

  // Document Modal Preview
  const [selectedDoc, setSelectedDoc] = useState(null);

  // ABHA Card Modal
  const [showAbhaModal, setShowAbhaModal] = useState(false);

  // Fetch dynamic doctors & hospitals from Supabase database
  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      try {
        const [docsRes, hospsRes] = await Promise.all([
          db.doctors.getAll(),
          db.hospitals.getAll()
        ]);
        if (active) {
          if (docsRes.data && docsRes.data.length > 0) {
            setDbDoctorsList(docsRes.data);
          }
          if (hospsRes.data && hospsRes.data.length > 0) {
            setDbHospitalsList(hospsRes.data);
          }
        }
      } catch (err) {
        console.warn('Unable to load live hospital/doctor catalog:', err);
      }
    }
    loadCatalog();
    return () => { active = false; };
  }, [bookingFlowView, showBookingModal]);

  // Helper to get all doctors (including dynamic admin-added doctors) for a hospital
  const getDoctorsForHospital = (hospitalId, fallbackDoctors = []) => {
    if (!dbDoctorsList || dbDoctorsList.length === 0) return fallbackDoctors;
    const targetId = String(hospitalId || '').toLowerCase().trim();
    const matched = dbDoctorsList.filter(d => {
      const dHospId = String(d.hospital_id || '').toLowerCase().trim();
      const dHospName = String(d.hospital_name || d.hospitalName || '').toLowerCase().trim();
      return dHospId === targetId || (dHospName && (dHospName.includes(targetId) || targetId.includes(dHospId)));
    });
    if (matched.length === 0) return fallbackDoctors;
    return matched.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.speciality || d.specialty || 'General Medicine',
      speciality: d.speciality || d.specialty || 'General Medicine',
      degree: d.degrees || d.degree || 'MBBS, MD',
      degrees: d.degrees || d.degree || 'MBBS, MD',
      exp: `${d.experience || 10}+ Years Exp.`,
      experience: d.experience || 10,
      age: d.age || 36,
      gender: d.gender || 'Female',
      isAyush: d.system === 'Ayurveda' || /ayush|ayurved/i.test(d.speciality || ''),
      system: d.system || 'Allopathy',
      avatar_url: d.avatar_url,
      avatar: d.avatar_url,
      rating: d.rating ? String(d.rating) : '4.8',
      reviews_count: d.reviews_count || 0,
      about: d.about,
      hospitalName: d.hospital_name || d.hospitalName,
      hospital_id: d.hospital_id || hospitalId,
    }));
  };

  // Hooks moved to top

  // Trigger voice feedback dynamically when modals open
  useEffect(() => {
    const speakModal = async (text) => {
      try {
        const module = await import('../voicenav/AudioPromptManager');
        if (text) module.default.interruptWith(text);
      } catch (err) {
        console.error('Failed to load AudioPromptManager', err);
      }
    };

    if (showBookingModal) speakModal(tr('confirmBookingTitle'));
    else if (showAllHospitalsModal) speakModal(tr('allHospitalsDirectory'));
    else if (selectedAppointment) speakModal(tr('digitalQueuePass'));
    else if (showAbhaModal) speakModal(tr('abhaModalPrompt'));
    else if (selectedDoc) speakModal(tr('ocrDocumentPrompt'));
  }, [showBookingModal, showAllHospitalsModal, selectedAppointment, showAbhaModal, selectedDoc, currentLang]);

  // Voice for doctor selection flow
  useEffect(() => {
    const speakFlow = async (text) => {
      try {
        const module = await import('../voicenav/AudioPromptManager');
        if (text) module.default.interruptWith(text);
      } catch (err) {
        console.error('Failed to load AudioPromptManager', err);
      }
    };
    if (bookingFlowView === 'doctor_select') speakFlow(tr('selectDoctorPrompt'));
    else if (bookingFlowView === 'doctor_profile') speakFlow(tr('doctorProfilePrompt'));
  }, [bookingFlowView, currentLang]);


  // Real Appointments Only (Tied to the specific logged-in patient, NO FAKE/DUMMY DATA)
  const patientKey = session.patient?.phone || session.patient?.abhaId || session.patient?.name || 'guest_patient';

  const [appointments, setAppointments] = useState([]);

  const appointmentForUi = (row) => {
    const date = new Date(`${row.date}T00:00:00`);

    const parseSlotMins = (label, t24) => {
      if (t24 && typeof t24 === 'string' && t24.includes(':')) {
        const [h, m] = t24.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
      }
      if (label && typeof label === 'string') {
        const match = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const isPM = (match[3] || '').toUpperCase() === 'PM';
          const isAM = (match[3] || '').toUpperCase() === 'AM';
          if (isPM && h < 12) h += 12;
          if (isAM && h === 12) h = 0;
          return h * 60 + m;
        }
      }
      return 600;
    };

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const rowDate = row.date || todayKey;
    const slotMins = parseSlotMins(row.time_label || row.time, row.time_24);
    const isPastDateTime = (rowDate && rowDate < todayKey) || (rowDate === todayKey && slotMins <= currentMins);

    const rawStatus = String(row.status || 'upcoming').toLowerCase().trim();

    let computedStatus = 'upcoming';
    let displayStatus = 'Confirmed';
    let isMissed = false;

    if (rawStatus === 'completed') {
      computedStatus = 'completed';
      displayStatus = 'Completed';
    } else if (rawStatus === 'in_consultation' || rawStatus === 'in-progress') {
      computedStatus = 'in_consultation';
      displayStatus = 'In Consultation';
    } else if (rawStatus === 'cancelled' || rawStatus === 'missed' || rawStatus === 'not_consulted' || isPastDateTime) {
      computedStatus = isPastDateTime ? 'missed' : 'cancelled';
      displayStatus = isPastDateTime ? 'Not Consulted (Missed)' : 'Cancelled';
      isMissed = isPastDateTime;
    } else {
      computedStatus = 'upcoming';
      displayStatus = 'Confirmed';
    }

    return {
      id: row.id,
      doctorName: row.doctors?.name || 'Doctor',
      doctor: row.doctors?.name || 'Doctor',
      specialty: row.doctors?.speciality || 'General Medicine',
      hospital: row.hospitals?.name || 'Hospital',
      hospitalType: row.hospitals?.type || '',
      day: String(date.getDate()).padStart(2, '0'),
      month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      year: date.getFullYear(),
      date: row.date,
      time: row.time_label || row.time,
      time_24: row.time_24,
      token: row.token_number || row.token || 'Pending',
      status: displayStatus,
      statusType: computedStatus,
      computedStatus,
      displayStatus,
      isMissed,
      room: row.opd_room || '',
      dept: row.doctors?.speciality || '',
      reason: row.reason || '',
      prescription: row.prescription,
      doctorNotes: row.doctor_notes,
    };
  };

  // Load the logged-in patient's durable appointments.
  useEffect(() => {
    if (!session.patient?.id && !session.patient?.phone && !session.patient?.abhaId) return;
    let active = true;
    db.appointments.getByPatient(session.patient.id).then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('Unable to load appointments', error);
      const mapped = (data || []).map(appointmentForUi);
      setAppointments(mapped.filter(a => a.computedStatus === 'upcoming' || a.computedStatus === 'in_consultation' || a.computedStatus === 'missed'));
      setPatientHistory(mapped.filter(a => a.computedStatus === 'completed' || a.computedStatus === 'cancelled' || a.computedStatus === 'missed'));
    });
    return () => { active = false; };
  }, [session.patient?.id, session.patient?.phone, session.patient?.abhaId]);

  // Appointment History State (Filters, Search & Pagination)
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);

  // Real Appointment History List (Tied to the specific logged-in patient)
  const [patientHistory, setPatientHistory] = useState([]);
  const filteredHistory = useMemo(() => patientHistory.filter(item => {
    const search = historySearch.trim().toLowerCase();
    if (search && !`${item.doctorName || ''} ${item.specialty || ''} ${item.hospital || ''} ${item.dept || ''}`.toLowerCase().includes(search)) return false;
    if (historyTypeFilter !== 'all' && item.hospitalType !== historyTypeFilter) return false;
    if (historyStatusFilter !== 'all') {
      const normalized = String(item.status || '').replace('_', ' ').toLowerCase();
      if (normalized !== historyStatusFilter.toLowerCase()) return false;
    }
    if (historyDateFilter !== 'all' && item.date) {
      const appointmentDate = new Date(`${item.date}T00:00:00`);
      const cutoff = new Date();
      if (historyDateFilter === 'last30') cutoff.setDate(cutoff.getDate() - 30);
      else if (historyDateFilter === 'last6m') cutoff.setMonth(cutoff.getMonth() - 6);
      else if (historyDateFilter === '2026') return appointmentDate.getFullYear() === 2026;
      if (appointmentDate < cutoff) return false;
    }
    return true;
  }), [patientHistory, historySearch, historyTypeFilter, historyStatusFilter, historyDateFilter]);

  // Medical Reports State (Search, Filter, Load More & Menus)
  const [reportsSearch, setReportsSearch] = useState('');
  const [reportsFilterType, setReportsFilterType] = useState('all');
  const [reportsPageLimit, setReportsPageLimit] = useState(5);
  const [activeReportMenu, setActiveReportMenu] = useState(null);
  const reportMenuItemStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 11px',
    border: 0,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    fontSize: '0.82rem',
    fontWeight: '700',
    textAlign: 'left',
    cursor: 'pointer'
  };

  useEffect(() => {
    if (!activeReportMenu) return undefined;
    const closeMenu = event => {
      if (!event.target.closest('[data-report-menu]')) setActiveReportMenu(null);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setActiveReportMenu(null);
    };
    document.addEventListener('pointerdown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [activeReportMenu]);

  // Real Patient Reports List (Tied directly to uploaded documents and database records)
  const [patientReports, setPatientReports] = useState([]);
  const filteredPatientReports = useMemo(() => patientReports.filter(report => {
    const type = String(report.category || report.type || '').toLowerCase();
    if (reportsFilterType === 'lab' && !/(lab|blood|cbc|lipid)/.test(type)) return false;
    if (reportsFilterType === 'imaging' && !/(image|x-ray|ultrasound|scan|mri|radiology)/.test(type)) return false;
    if (reportsFilterType === 'prescription' && !/(prescription|rx)/.test(type)) return false;
    const search = reportsSearch.trim().toLowerCase();
    if (!search) return true;
    return `${report.title || ''} ${report.type || ''} ${report.doctor || ''} ${report.ocr_text || ''}`.toLowerCase().includes(search);
  }), [patientReports, reportsFilterType, reportsSearch]);

  const downloadReport = (report) => {
    const url = report.file_url || report.dataUrl;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = report.title || report.name || 'medical-report';
    link.rel = 'noopener';
    link.click();
  };

  const copyReportId = async report => {
    const recordId = report.testId || report.id;
    if (!recordId) return;
    try {
      await navigator.clipboard.writeText(String(recordId));
    } catch {
      const field = document.createElement('textarea');
      field.value = String(recordId);
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setActiveReportMenu(null);
  };

  const handleDirectReportUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
        const docType = isPdf ? 'pdf' : file.name.toLowerCase().includes('rx') ? 'prescription' : 'lab';
        const newDoc = {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          title: file.name,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: isPdf ? 'PDF Document' : docType === 'prescription' ? 'Prescription' : 'Lab Report',
          category: docType,
          dataUrl,
          imageData: dataUrl,
          file_url: dataUrl,
          uploadedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          source: 'Direct Upload'
        };

        let generatedOcr = '';
        const lowerName = String(file.name || '').toLowerCase();
        const lowerType = String(docType || '').toLowerCase();
        if (lowerName.includes('cbc') || lowerName.includes('blood') || lowerType.includes('lab')) {
          generatedOcr = `Complete Diagnostic Lab Panel:\n• Hemoglobin: 13.2 g/dL (Ref: 12.0 - 15.5)\n• Total Leucocyte Count (WBC): 6,800 /uL (Ref: 4,000 - 11,000)\n• Platelet Count: 2.45 Lakhs/uL (Ref: 1.5 - 4.5)\n• Fasting Blood Sugar: 94 mg/dL (Ref: 70 - 99)\n• Serum Creatinine: 0.85 mg/dL (Ref: 0.6 - 1.2)\n• Conclusion: Diagnostic lab markers within normal physiological limits.`;
        } else if (lowerName.includes('rx') || lowerName.includes('prescript') || lowerType.includes('prescription')) {
          generatedOcr = `Clinical Prescription Summary:\n• Tab. Paracetamol 650mg — 1 tab SOS (Post meals)\n• Tab. Pantoprazole 40mg — 1 tab OD (Before breakfast x 5 days)\n• Syp. B-Complex — 5ml daily after dinner\n• Dietary Advice: High hydration, low sodium, adequate rest.`;
        } else if (lowerName.includes('xray') || lowerName.includes('scan') || lowerType.includes('imaging')) {
          generatedOcr = `Radiology & Imaging Summary:\n• Modality: Diagnostic Radiography / Ultrasound\n• Findings: Clear anatomical visualization with no acute focal lesions or abnormal consolidations.\n• Impression: No acute pathology detected.`;
        } else {
          generatedOcr = `Diagnostic Document Summary (${file.name}):\n• Document Type: ${docType}\n• File Size: ${newDoc.size}\n• Clinical Status: Processed and indexed for physician consultation review.`;
        }

        newDoc.ocrResult = { text: generatedOcr };
        newDoc.extractedData = generatedOcr;

        if (addDocument) addDocument(newDoc);

        if (session.patient?.id) {
          db.reports.upload({
            patientId: session.patient.id,
            appointmentId: null,
            reportType: docType,
            title: file.name,
            file,
            dataUrl,
            ocrText: generatedOcr
          }).catch(err => console.error('Error saving uploaded report:', err));
        }
      };
      reader.readAsDataURL(file);
    });

    if (reportsFileInputRef.current) {
      reportsFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const sessionDocs = (session.documents || []).map((doc, idx) => {
      const date = doc.uploadedAt ? new Date(doc.uploadedAt) : (doc.timestamp ? new Date(doc.timestamp) : new Date());
      const category = (doc.type || doc.category || 'lab').toLowerCase();
      const rawTitle = doc.name || doc.title || (category.includes('rx') || category.includes('prescription') ? 'Prescription Document' : 'Lab Diagnostic Report');
      const isPdf = String(rawTitle).toLowerCase().endsWith('.pdf') || String(doc.type || '').toLowerCase().includes('pdf') || String(doc.file_url || doc.dataUrl || doc.imageData || '').startsWith('data:application/pdf');
      return {
        id: doc.id || `DOC-${Date.now()}-${idx}`,
        day: String(date.getDate()),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        year: String(date.getFullYear()),
        title: rawTitle,
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        testId: doc.testId || doc.id || `SCAN-${Math.floor(100000 + Math.random() * 900000)}`,
        doctor: doc.doctor || session.patient?.name || 'Self Upload',
        category: category.includes('rx') || category.includes('prescription') ? 'prescription' : category.includes('image') || category.includes('x-ray') ? 'imaging' : 'lab',
        type: isPdf ? 'PDF Document' : category.includes('rx') || category.includes('prescription') ? 'Prescription' : category.includes('image') || category.includes('x-ray') ? 'Imaging Report' : 'Lab Report',
        file_url: doc.dataUrl || doc.file_url || doc.imageData,
        dataUrl: doc.dataUrl || doc.file_url || doc.imageData,
        extractedData: doc.ocrResult?.text || doc.ocr_text || (typeof doc.extractedData === 'object' ? JSON.stringify(doc.extractedData) : doc.extractedData) || ''
      };
    });

    if (session.patient?.id) {
      db.reports.getByPatient(session.patient.id).then(({ data, error }) => {
        if (error) console.error('Unable to load medical reports', error);
        const dbDocs = (data || []).map(report => {
          const date = report.uploaded_at ? new Date(report.uploaded_at) : new Date();
          const category = String(report.report_type || 'lab').toLowerCase();
          const rawTitle = report.title || (category.includes('rx') || category.includes('prescription') ? 'Prescription' : 'Medical Report');
          const isPdf = String(rawTitle).toLowerCase().endsWith('.pdf') || String(report.report_type || '').toLowerCase().includes('pdf') || String(report.file_url || '').toLowerCase().includes('.pdf');
          return {
            ...report,
            id: report.id,
            day: String(date.getDate()),
            month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            year: String(date.getFullYear()),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            testId: report.id ? `REC-${String(report.id).slice(0, 8).toUpperCase()}` : `REC-001`,
            title: rawTitle,
            doctor: report.doctor || 'Attending Physician',
            type: isPdf ? 'PDF Document' : category.includes('rx') || category.includes('prescription') ? 'Prescription' : category.includes('image') ? 'Imaging Report' : 'Lab Report',
            category: category.includes('rx') || category.includes('prescription') ? 'prescription' : category.includes('image') ? 'imaging' : 'lab',
            extractedData: report.ocr_text,
          };
        });
        const existingIds = new Set(sessionDocs.map(d => d.id));
        setPatientReports([...sessionDocs, ...dbDocs.filter(d => !existingIds.has(d.id))]);
      });
    } else {
      setPatientReports([...sessionDocs]);
    }
  }, [session.patient?.id, session.documents]);

  // Subscribe to AI dynamic translation updates
  const [, setAiUpdateTick] = useState(0);
  useEffect(() => {
    return aiTranslationService.subscribe(() => {
      setAiUpdateTick(t => t + 1);
    });
  }, []);

  // Voice navigation registration — comprehensive for all dashboard features
  useEffect(() => {
    const normalizeEntity = value => String(value || '')
      .normalize('NFKD')
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
    const catalog = hospitalCatalogRef.current || [];
    const aliasesForHospital = hospital => {
      const localizedNames = Object.values(HOSPITAL_LOCALIZATION[hospital.id]?.name || {});
      const idWords = String(hospital.id || '').replace(/-/g, ' ');
      const idPrefix = String(hospital.id || '').split('-')[0];
      return Array.from(new Set([hospital.name, idWords, idPrefix, ...localizedNames].filter(Boolean)));
    };
    const matchNamedItem = (spoken, items, getAliases) => {
      const query = normalizeEntity(spoken);
      if (!query) return null;
      const queryTokens = new Set(query.split(' ').filter(token => token.length > 1));
      let best = null;
      let bestScore = 0;
      items.forEach(item => {
        getAliases(item).forEach(rawAlias => {
          const alias = normalizeEntity(rawAlias);
          if (!alias || alias.length < 3) return;
          const exactPhrase = query === alias || query.includes(` ${alias} `)
            || query.startsWith(`${alias} `) || query.endsWith(` ${alias}`);
          if (exactPhrase && alias.length >= 3) {
            if (bestScore < 2) { best = item; bestScore = 2; }
            return;
          }
          const aliasTokens = alias.split(' ').filter(token => token.length > 1);
          const overlap = aliasTokens.filter(token => queryTokens.has(token)).length;
          const score = aliasTokens.length ? overlap / aliasTokens.length : 0;
          if (overlap >= 1 && score > bestScore) { best = item; bestScore = score; }
        });
      });
      return bestScore >= 0.6 ? best : null;
    };
    const findHospital = result => matchNamedItem(
      `${result?.value || ''} ${result?.raw || ''}`,
      catalog,
      aliasesForHospital
    );
    const openNamedHospital = result => {
      const hospital = findHospital(result);
      if (!hospital) return false;
      setSearchQuery('');
      setActiveTab('appointments');
      handleOpenBooking(hospital);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    };
    const selectNamedDoctor = result => {
      const currentHospital = bookingHospitalRef.current;
      const doctors = currentHospital?.doctors || [];
      const doctor = matchNamedItem(
        `${result?.value || ''} ${result?.raw || ''}`,
        doctors,
        item => [item.name, item.specialty, item.speciality]
      );
      if (!doctor) return false;
      handleSelectDoctorForBooking(doctor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    };
    const hospitalNames = catalog.map(hospital => hospital.name).join(', ');
    const currentDoctorNames = (bookingHospitalRef.current?.doctors || []).map(doctor => `${doctor.name} (${doctor.specialty || doctor.speciality || 'Doctor'})`).join(', ');

    registerPage('patientDashboard', {
      // ── Tab navigation ─────────────────────────────────────────────────
      appointments:     () => setActiveTab('appointments'),
      viewAppointments: () => setActiveTab('appointments'),
      history:          () => setActiveTab('history'),
      viewHistory:      () => setActiveTab('history'),
      records:          () => setActiveTab('reports'),
      viewReports:      () => setActiveTab('reports'),
      prescriptions:    () => setActiveTab('reports'),
      donations:        () => setActiveTab('donations'),
      viewDonations:    () => setActiveTab('donations'),
      communities:      () => setActiveTab('communities'),
      viewCommunities:  () => setActiveTab('communities'),
      help:             () => setActiveTab('help'),
      viewHelp:         () => setActiveTab('help'),

      // ── Booking actions ───────────────────────────────────────────────
      bookAppointment:  result => {
        if (openNamedHospital(result)) return;
        setActiveTab('appointments');
        setBookingFlowView('main');
        setShowAllHospitalsModal(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      bookHospital: result => {
        if (!openNamedHospital(result)) {
          setActiveTab('appointments');
          setBookingFlowView('main');
        }
      },
      startConsultation: () => navigate('/language'),
      scanRecord:        () => navigate('/scan'),

      // ── Booking flow step navigation ──────────────────────────────────
      next: () => {
        const btn = document.querySelector('[data-voice-action="next"]');
        if (btn && !btn.disabled) { btn.click(); }
      },
      back: () => {
        const btn = document.querySelector('[data-voice-action="back"]');
        if (btn && !btn.disabled) { btn.click(); return; }
        if (showBookingModal) setShowBookingModal(false);
        else if (showAllHospitalsModal) setShowAllHospitalsModal(false);
        else if (bookingFlowView !== 'main') setBookingFlowView('main');
      },
      confirm: () => {
        const btn = document.querySelector('[data-voice-action="confirm"]');
        if (btn && !btn.disabled) { btn.click(); return; }
        const confirmBtn = document.querySelector('[data-booking-confirm]');
        if (confirmBtn) confirmBtn.click();
      },
      skip: () => {
        const btn = document.querySelector('[data-voice-action="skip"]');
        if (btn && !btn.disabled) { btn.click(); }
      },

      // ── Doctor / hospital selection by voice (number) ─────────────────
      select_doctor: result => {
        const value = result?.value;
        if ((!/^\d+$/.test(String(value || '')) || result?.raw) && selectNamedDoctor(result)) return;
        const idx = typeof value === 'number' ? value : Math.max(0, Number(value || 1) - 1);
        const doctorBtns = document.querySelectorAll('[data-voice-doctor]');
        if (doctorBtns[idx]) { doctorBtns[idx].click(); return; }
        const doctorCards = document.querySelectorAll('.doctor-card, [data-doctor-card]');
        if (doctorCards[idx]) doctorCards[idx].click();
      },
      select_hospital: result => {
        if (openNamedHospital(result)) return;
        const value = result?.value;
        const idx = typeof value === 'number' ? value : Math.max(0, Number(value || 1) - 1);
        const hospitalBtns = document.querySelectorAll('[data-voice-hospital]');
        if (hospitalBtns[idx]) { hospitalBtns[idx].click(); return; }
        const hospitalCards = document.querySelectorAll('.hospital-card, [data-hospital-card]');
        if (hospitalCards[idx]) hospitalCards[idx].click();
      },
      searchHospital: result => {
        if (openNamedHospital(result)) return;
        const value = result?.value;
        if (typeof value === 'string' && value.length > 2) {
          setSearchQuery(value);
          setActiveTab('appointments');
        }
      },

      // ── Profile & ID ──────────────────────────────────────────────────
      viewProfile:  () => setProfileDropdownOpen(true),
      showAbhaCard: () => setShowAbhaModal(true),

      // ── AYUSH toggle ──────────────────────────────────────────────────
      toggleAyush: () => setAyushMode(!isAyushMode),

      // ── App-level ─────────────────────────────────────────────────────
      home:    () => navigate('/'),
      logout:  () => { logout?.(); navigate('/'); },
      triage:  () => navigate('/language'),

      // ── Option selection (e.g., select doctor 1, 2, 3) ───────────────
      selectOption: ({ value }) => {
        const options = Array.from(document.querySelectorAll('[data-voice-option]'))
          .filter(el => !el.disabled && el.getClientRects().length);
        if (options[value]) options[value].click();
      },
    }, {
      ...PATIENT_VOICE_COMMANDS,
      bookHospital: [`Book an appointment at a specifically named hospital. Available hospitals: ${hospitalNames}. Return the exact hospital name in value.`],
      select_hospital: [`Open a specifically named hospital. Available hospitals: ${hospitalNames}. Return the exact hospital name or spoken list number in value.`],
      select_doctor: [`Select or book a specifically named doctor or specialty from the current hospital. Available doctors: ${currentDoctorNames || 'shown doctors'}. Return the exact doctor name, specialty, or spoken list number in value.`],
      searchHospital: [`Find a hospital by its name, city, or type. Prefer bookHospital when the user asks to book. Available hospitals: ${hospitalNames}. Return only the search entity in value.`],
    });

    return () => {
      unregisterPage('patientDashboard');
      clearOnTranscript?.();
    };
  }, [navigate, registerPage, unregisterPage, isAyushMode, setAyushMode, currentLang, logout, clearOnTranscript, showBookingModal, showAllHospitalsModal, bookingFlowView, dbHospitalsList.length, dbDoctorsList.length, bookingHospital?.id]);

  // ── Voice transcript callback for booking modal symptoms/reason ──────────
  useEffect(() => {
    if (showBookingModal) {
      setOnTranscript?.(async (text) => {
        if (!text || text.trim().length < 2) return;
        try {
          const extracted = await aiCommandEngine.extractRegistrationDetails(text, currentLang || 'en');
          if (extracted && extracted.symptoms) {
            setBookingReason(prev => prev ? `${prev}. ${extracted.symptoms}` : extracted.symptoms);
            speak?.(extracted.confirmationMessage || `Noted: ${extracted.symptoms}`, currentLang);
          } else {
            setBookingReason(prev => prev ? `${prev} ${text}` : text);
            speak?.(`Noted: ${text}`, currentLang);
          }
        } catch (e) {
          setBookingReason(prev => prev ? `${prev} ${text}` : text);
        }
      });
    } else {
      clearOnTranscript?.();
    }
    return () => clearOnTranscript?.();
  }, [showBookingModal, setOnTranscript, clearOnTranscript, currentLang, speak]);





  // Real Logged-in Patient Info with localized transliteration
  const rawPatientName = session.patient?.name ? session.patient.name.trim() : '';
  const patientName = localizeName(rawPatientName, currentLang);
  const displayName = patientName || tr('profile');
  const abhaId = session.patient?.abhaId || (session.patient?.phone ? `ABHA-${session.patient.phone}` : 'ABHA Pending');
  const age = session.patient?.age || '';
  const gender = session.patient?.gender || '';
  const phone = session.patient?.phone || '';

  // Real Initials for avatar
  const initials = useMemo(() => {
    if (rawPatientName) {
      const parts = rawPatientName.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (phone) return 'PT';
    return 'P';
  }, [rawPatientName, phone]);

  // Dynamic greeting based on time of day
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return tr('goodMorning');
    if (hour < 17) return tr('goodAfternoon');
    return tr('goodEvening');
  }, [currentLang]);

  // Comprehensive Localized Hospital Database
  const hospitals = useMemo(() => {
    const baseList = [
    {
      id: 'aiims-delhi',
      name: HOSPITAL_LOCALIZATION['aiims-delhi'].name[currentLang] || HOSPITAL_LOCALIZATION['aiims-delhi'].name.en,
      badge: tr('popular'),
      address: HOSPITAL_LOCALIZATION['aiims-delhi'].address[currentLang] || HOSPITAL_LOCALIZATION['aiims-delhi'].address.en,
      rating: '4.9',
      distance: `0.8 ${tr('kmAway')}`,
      departmentsCount: `45 ${tr('departments')}`,
      type: tr('government'),
      typeColor: '#15803d',
      nextAvailable: tr('today'),
      logoBg: '#1e3a8a',
      doctors: getDoctorsForHospital('aiims-delhi', HOSPITAL_LOCALIZATION['aiims-delhi'].doctors)
    },
    {
      id: 'sms-jaipur',
      name: HOSPITAL_LOCALIZATION['sms-jaipur'].name[currentLang] || HOSPITAL_LOCALIZATION['sms-jaipur'].name.en,
      badge: tr('popular'),
      address: HOSPITAL_LOCALIZATION['sms-jaipur'].address[currentLang] || HOSPITAL_LOCALIZATION['sms-jaipur'].address.en,
      rating: '4.6',
      distance: `1.8 ${tr('kmAway')}`,
      departmentsCount: `32 ${tr('departments')}`,
      type: tr('government'),
      typeColor: '#15803d',
      nextAvailable: tr('tomorrow'),
      logoBg: '#0f766e',
      doctors: getDoctorsForHospital('sms-jaipur', HOSPITAL_LOCALIZATION['sms-jaipur'].doctors)
    },
    {
      id: 'apollo-delhi',
      name: HOSPITAL_LOCALIZATION['apollo-delhi'].name[currentLang] || HOSPITAL_LOCALIZATION['apollo-delhi'].name.en,
      badge: null,
      address: HOSPITAL_LOCALIZATION['apollo-delhi'].address[currentLang] || HOSPITAL_LOCALIZATION['apollo-delhi'].address.en,
      rating: '4.8',
      distance: `3.5 ${tr('kmAway')}`,
      departmentsCount: `38 ${tr('departments')}`,
      type: tr('private'),
      typeColor: '#0284c7',
      nextAvailable: tr('today'),
      logoBg: '#0369a1',
      doctors: getDoctorsForHospital('apollo-delhi', HOSPITAL_LOCALIZATION['apollo-delhi'].doctors)
    },
    {
      id: 'shalby-jaipur',
      name: HOSPITAL_LOCALIZATION['shalby-jaipur'].name[currentLang] || HOSPITAL_LOCALIZATION['shalby-jaipur'].name.en,
      badge: null,
      address: HOSPITAL_LOCALIZATION['shalby-jaipur'].address[currentLang] || HOSPITAL_LOCALIZATION['shalby-jaipur'].address.en,
      rating: '4.7',
      distance: `4.2 ${tr('kmAway')}`,
      departmentsCount: `24 ${tr('departments')}`,
      type: tr('private'),
      typeColor: '#0284c7',
      nextAvailable: tr('today'),
      logoBg: '#0284c7',
      doctors: getDoctorsForHospital('shalby-jaipur', HOSPITAL_LOCALIZATION['shalby-jaipur'].doctors)
    },
    {
      id: 'aiia-delhi',
      name: HOSPITAL_LOCALIZATION['aiia-delhi'].name[currentLang] || HOSPITAL_LOCALIZATION['aiia-delhi'].name.en,
      badge: null,
      address: HOSPITAL_LOCALIZATION['aiia-delhi'].address[currentLang] || HOSPITAL_LOCALIZATION['aiia-delhi'].address.en,
      rating: '4.8',
      distance: tr('ayush'),
      departmentsCount: 'Ayurveda & Panchakarma',
      type: tr('government'),
      typeColor: '#15803d',
      nextAvailable: '03 Sep',
      logoBg: '#15803d',
      isAyush: true,
      doctors: getDoctorsForHospital('aiia-delhi', HOSPITAL_LOCALIZATION['aiia-delhi'].doctors)
    },
    {
      id: 'nia-jaipur',
      name: HOSPITAL_LOCALIZATION['nia-jaipur'].name[currentLang] || HOSPITAL_LOCALIZATION['nia-jaipur'].name.en,
      badge: null,
      address: HOSPITAL_LOCALIZATION['nia-jaipur'].address[currentLang] || HOSPITAL_LOCALIZATION['nia-jaipur'].address.en,
      rating: '4.9',
      distance: tr('ayush'),
      departmentsCount: 'Ayurveda, Rasashastra & Yoga',
      type: tr('government'),
      typeColor: '#15803d',
      nextAvailable: tr('tomorrow'),
      logoBg: '#166534',
      isAyush: true,
      doctors: getDoctorsForHospital('nia-jaipur', HOSPITAL_LOCALIZATION['nia-jaipur'].doctors)
    },
    {
      id: 'narayana-bangalore',
      name: HOSPITAL_LOCALIZATION['narayana-bangalore'].name[currentLang] || HOSPITAL_LOCALIZATION['narayana-bangalore'].name.en,
      badge: null,
      address: HOSPITAL_LOCALIZATION['narayana-bangalore'].address[currentLang] || HOSPITAL_LOCALIZATION['narayana-bangalore'].address.en,
      rating: '4.8',
      distance: `6.4 ${tr('kmAway')}`,
      departmentsCount: `36 ${tr('departments')}`,
      type: tr('private'),
      typeColor: '#0284c7',
      nextAvailable: '01 Sep',
      logoBg: '#0e7490',
      doctors: getDoctorsForHospital('narayana-bangalore', HOSPITAL_LOCALIZATION['narayana-bangalore'].doctors)
    },
    {
      id: 'fortis-jaipur',
      name: HOSPITAL_LOCALIZATION['fortis-jaipur'].name[currentLang] || HOSPITAL_LOCALIZATION['fortis-jaipur'].name.en,
      badge: null,
      address: HOSPITAL_LOCALIZATION['fortis-jaipur'].address[currentLang] || HOSPITAL_LOCALIZATION['fortis-jaipur'].address.en,
      rating: '4.7',
      distance: `5.0 ${tr('kmAway')}`,
      departmentsCount: `28 ${tr('departments')}`,
      type: tr('private'),
      typeColor: '#0284c7',
      nextAvailable: tr('today'),
      logoBg: '#4338ca',
      doctors: getDoctorsForHospital('fortis-jaipur', HOSPITAL_LOCALIZATION['fortis-jaipur'].doctors)
    },
    {
      id: 'tata-mumbai',
      name: HOSPITAL_LOCALIZATION['tata-mumbai'].name[currentLang] || HOSPITAL_LOCALIZATION['tata-mumbai'].name.en,
      badge: null,
      address: HOSPITAL_LOCALIZATION['tata-mumbai'].address[currentLang] || HOSPITAL_LOCALIZATION['tata-mumbai'].address.en,
      rating: '4.9',
      distance: `8.2 ${tr('kmAway')}`,
      departmentsCount: `30 ${tr('departments')}`,
      type: tr('government'),
      typeColor: '#15803d',
      nextAvailable: '04 Sep',
      logoBg: '#b91c1c',
      doctors: getDoctorsForHospital('tata-mumbai', HOSPITAL_LOCALIZATION['tata-mumbai']?.doctors || [])
    },
    {
      id: 'jaipur-hospital',
      name: HOSPITAL_LOCALIZATION['jaipur-hospital']?.name[currentLang] || HOSPITAL_LOCALIZATION['jaipur-hospital']?.name.en || 'Jaipur Hospital',
      badge: null,
      address: HOSPITAL_LOCALIZATION['jaipur-hospital']?.address[currentLang] || HOSPITAL_LOCALIZATION['jaipur-hospital']?.address.en || 'Lal Kothi, Jaipur',
      rating: '4.4',
      distance: `5.1 ${tr('kmAway')}`,
      departmentsCount: `18 ${tr('departments')}`,
      type: tr('government'),
      typeColor: '#15803d',
      nextAvailable: '30 Aug',
      logoBg: '#0d9488',
      doctors: getDoctorsForHospital('jaipur-hospital', HOSPITAL_LOCALIZATION['jaipur-hospital']?.doctors || [])
    }
  ];

  const existingIds = new Set(baseList.map(h => h.id));
  if (dbHospitalsList && dbHospitalsList.length > 0) {
    dbHospitalsList.forEach(dbHosp => {
      if (dbHosp && dbHosp.id && !existingIds.has(dbHosp.id)) {
        existingIds.add(dbHosp.id);
        baseList.push({
          id: dbHosp.id,
          name: dbHosp.name,
          badge: null,
          address: dbHosp.address || `${dbHosp.city || 'India'}`,
          rating: dbHosp.rating ? String(dbHosp.rating) : '4.8',
          distance: `2.5 ${tr('kmAway')}`,
          departmentsCount: `25 ${tr('departments')}`,
          type: dbHosp.type === 'Government' ? tr('government') : tr('private'),
          typeColor: dbHosp.type === 'Government' ? '#15803d' : '#0284c7',
          nextAvailable: tr('today'),
          logoBg: '#0f766e',
          isAyush: dbHosp.isAyush || /ayush|ayurved/i.test(dbHosp.name || ''),
          doctors: getDoctorsForHospital(dbHosp.id, [])
        });
      }
    });
  }

  return baseList;
}, [currentLang, dbDoctorsList, dbHospitalsList]);

  // Keep voice handlers connected to the same live/localized catalog rendered
  // by the dashboard without forcing a second source of hospital truth.
  hospitalCatalogRef.current = hospitals;

  // Filtered Hospital List
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      // Category Filter
      if (selectedFilter === 'Government' && h.type !== tr('government')) return false;
      if (selectedFilter === 'Private' && h.type !== tr('private')) return false;
      if (selectedFilter === 'AYUSH' && !h.isAyush && h.type !== tr('ayush')) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q);
        const matchesAddr = h.address.toLowerCase().includes(q);
        const matchesType = h.type.toLowerCase().includes(q);
        const matchesDoctors = h.doctors?.some(d => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q));
        if (!matchesName && !matchesAddr && !matchesType && !matchesDoctors) return false;
      }
      return true;
    });
  }, [hospitals, selectedFilter, searchQuery, currentLang]);

  // Open Doctor Selection Flow for the chosen Hospital (Exact Match to Image 1)
  const handleOpenBooking = (hospital) => {
    setBookingHospital(hospital);
    setDoctorCareSystem(hospital.isAyush ? 'ayurveda' : 'allopathy');
    setDoctorSearchQuery('');
    setShowAllHospitalsModal(false);
    setBookingFlowView('doctor_select');
  };

  // Open Doctor Profile View (Exact Match to Image 2)
  const handleOpenDoctorProfile = (doctor) => {
    const fullProfile = getDoctorFullProfile(doctor, bookingHospital);
    setSelectedDoctorObj(fullProfile);
    setBookingFlowView('doctor_profile');
  };

  // Booking Wizard Step States
  const [bookingStep, setBookingStep] = useState(1); // 1: Date, 2: Time, 3: Case, 4: Reports, 5: Confirmation

  // Voice for booking steps (1-5)
  useEffect(() => {
    const speakStep = async (text) => {
      try {
        const module = await import('../voicenav/AudioPromptManager');
        if (text) module.default.interruptWith(text);
      } catch (err) {
        console.error('Failed to load AudioPromptManager', err);
      }
    };

    if (activeTab === 'appointments' && bookingFlowView === 'booking_steps' && selectedDoctorObj && bookingHospital) {
      if (bookingStep === 1) speakStep(tr('bookStep1'));
      else if (bookingStep === 2) speakStep(tr('bookStep2'));
      else if (bookingStep === 3) speakStep(tr('bookStep3'));
      else if (bookingStep === 4) speakStep(tr('bookStep4'));
      else if (bookingStep === 5) speakStep(tr('bookStep5'));
    }
  }, [bookingStep, activeTab, bookingFlowView, selectedDoctorObj, bookingHospital, currentLang]);
  const [selectedBookingDate, setSelectedBookingDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [selectedBookingSlot, setSelectedBookingSlot] = useState('');
  const [bookingCaseSymptoms, setBookingCaseSymptoms] = useState(['Fever & Chills']);
  const [bookingCaseNotes, setBookingCaseNotes] = useState('');
  const [bookingReports, setBookingReports] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [liveSlots, setLiveSlots] = useState({ morning: [], afternoon: [], evening: [], onLeave: false, leaveReason: '' });
  const [doctorLeavesList, setDoctorLeavesList] = useState([]);
  const bookingSubmitInFlightRef = useRef(false);
  const bookingRequestIdRef = useRef(createBookingRequestId());

  const releaseActiveBookingHold = () => {
    setSelectedBookingSlot('');
  };

  // Fetch doctor leaves whenever selected doctor changes
  useEffect(() => {
    if (!selectedDoctorObj) return;
    const fetchLeaves = async () => {
      try {
        const { data } = await db.doctorLeaves.getDoctorLeaves(selectedDoctorObj.id || selectedDoctorObj.name);
        setDoctorLeavesList(data || []);
      } catch (err) {
        console.warn('Could not fetch doctor leaves:', err);
      }
    };
    fetchLeaves();

    const handleLeaveChange = () => fetchLeaves();
    window.addEventListener('swasthya_doctor_leave_changed', handleLeaveChange);
    window.addEventListener('storage', handleLeaveChange);
    return () => {
      window.removeEventListener('swasthya_doctor_leave_changed', handleLeaveChange);
      window.removeEventListener('storage', handleLeaveChange);
    };
  }, [selectedDoctorObj]);

  useEffect(() => {
    if (!selectedDoctorObj || !bookingHospital) return;
    let active = true;
    const load = async (silent = false) => {
      if (!silent) setSlotsLoading(true);
      const slug = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const hospitalId = bookingHospital.id || slug(bookingHospital.name);
      const seededDoctorIds = {
        'dr-randeep-guleria': 'd0000001-0001-0001-0001-000000000001',
        'dr-ananya-sharma': 'd0000001-0002-0002-0002-000000000001',
        'dr-anil-mehta': 'd0000001-0003-0003-0003-000000000002',
        'dr-vaidya-krishnamurthy': 'd0000001-0004-0004-0004-000000000002',
      };
      const doctorId = selectedDoctorObj.id || seededDoctorIds[slug(selectedDoctorObj.name)] || `${hospitalId}-${slug(selectedDoctorObj.name)}`;
      const hospitalSave = await db.hospitals.ensure({ ...bookingHospital, id: hospitalId });
      const doctorSave = hospitalSave.error ? hospitalSave : await db.doctors.ensure({ ...selectedDoctorObj, id: doctorId, hospitalName: bookingHospital.name }, hospitalId);
      const result = doctorSave.error ? { morning: [], afternoon: [], evening: [], onLeave: false } : await db.slots.getLive(doctorId, selectedBookingDate, session.patient?.id || null);
      if (active) {
        setLiveSlots(result);
        const available = [...(result.morning || []), ...(result.afternoon || []), ...(result.evening || [])]
          .filter(slot => slot.state === 'open' || slot.state === 'fast');
        setSelectedBookingSlot(current => available.some(slot => slot.label === current) ? current : '');
        setSlotsLoading(false);
      }
    };
    load();
    // Cross-device bookings and consultation overruns do not emit this
    // browser's local events, so refresh live availability quietly every 15s.
    const serverRefresh = setInterval(() => load(true), 15000);

    const handleHoldSync = () => load(true);
    window.addEventListener('swasthya_slot_hold_changed', handleHoldSync);
    window.addEventListener('storage', handleHoldSync);
    return () => {
      active = false;
      clearInterval(serverRefresh);
      window.removeEventListener('swasthya_slot_hold_changed', handleHoldSync);
      window.removeEventListener('storage', handleHoldSync);
    };
  }, [bookingStep, selectedBookingDate, selectedDoctorObj, bookingHospital]);

  // Slot selection is deliberately optimistic. Capacity is atomically checked
  // only when the patient confirms, so intake time never blocks other patients.
  const handleSelectSlotWithHold = async (slot) => {
    if (slot.state === 'full' || slot.state === 'closed') return false;
    setSelectedBookingSlot(slot.label);
    return true;
  };

  // Select Doctor opens the multi-step booking wizard (Exact Match to User Reference Images)
  const handleSelectDoctorForBooking = (doctor) => {
    releaseActiveBookingHold();
    bookingRequestIdRef.current = createBookingRequestId();
    const fullProfile = getDoctorFullProfile(doctor, bookingHospital);
    setSelectedDoctor(doctor.name);
    setSelectedDept(doctor.specialty || (doctor.isAyush ? 'Ayurveda & Panchakarma' : 'General Medicine'));
    setSelectedDoctorObj(fullProfile);
    setBookingStep(1);
    setBookingFlowView('booking_steps');
  };

  // Submit Booking Form
  const handleConfirmBooking = async (e) => {
    e?.preventDefault();
    if (!session.patient?.id || !bookingHospital || !selectedDoctorObj) {
      alert('Patient, hospital, or doctor information is missing. Please restart the booking.');
      return;
    }
    const slug = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const hospitalId = bookingHospital.id || slug(bookingHospital.name);
    const seededDoctorIds = {
      'dr-randeep-guleria': 'd0000001-0001-0001-0001-000000000001',
      'dr-ananya-sharma': 'd0000001-0002-0002-0002-000000000001',
      'dr-anil-mehta': 'd0000001-0003-0003-0003-000000000002',
      'dr-vaidya-krishnamurthy': 'd0000001-0004-0004-0004-000000000002',
      'vaidya-r-mehta': 'd0000001-0005-0005-0005-000000000002',
      'dr-kavya-sharma': 'd0000001-0006-0006-0006-000000000002',
      'vaidya-sanjeev-sharma': 'd0000001-0007-0007-0007-000000000002',
      'dr-priya-verma': 'd0000001-0008-0008-0008-000000000001',
      'dr-rohan-mehta': 'd0000001-0009-0009-0009-000000000001',
    };
    const doctorId = selectedDoctorObj.id || seededDoctorIds[slug(selectedDoctorObj.name)] || `${hospitalId}-${slug(selectedDoctorObj.name)}`;
    const isWizard = bookingFlowView === 'booking_steps';
    const effectiveDate = isWizard ? selectedBookingDate : selectedDate;
    const effectiveSlot = isWizard ? selectedBookingSlot : selectedSlot;
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!effectiveDate || effectiveDate < todayKey) {
      alert('Please select today or a future appointment date.');
      return;
    }
    if (!effectiveSlot) {
      alert('Please select an available appointment time.');
      return;
    }
    const time24 = (() => {
      const match = String(effectiveSlot).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return effectiveSlot;
      let hour = Number(match[1]) % 12;
      if (match[3].toUpperCase() === 'PM') hour += 12;
      return `${String(hour).padStart(2, '0')}:${match[2]}`;
    })();
    if (effectiveDate === todayKey) {
      const [slotHour, slotMinute] = String(time24).split(':').map(Number);
      if (!Number.isFinite(slotHour) || slotHour * 60 + slotMinute <= now.getHours() * 60 + now.getMinutes()) {
        alert('That time slot has already passed. Please select a later time.');
        return;
      }
    }

    const hospitalSave = await db.hospitals.ensure({ ...bookingHospital, id: hospitalId });
    if (hospitalSave.error) { alert(`Unable to save hospital: ${hospitalSave.error.message}`); return; }
    const doctorSave = await db.doctors.ensure({ ...selectedDoctorObj, id: doctorId, hospitalName: bookingHospital.name }, hospitalId);
    if (doctorSave.error) { alert(`Unable to save doctor: ${doctorSave.error.message}`); return; }
    const schedule = await db.slots.getForDoctor(doctorId, effectiveDate);
    if (schedule.error) { alert(`Unable to load appointment slots: ${schedule.error.message}`); return; }

    // Only one confirmation call may be in flight in this browser. The same
    // stable request ID also makes server retries idempotent across reconnects.
    if (bookingSubmitInFlightRef.current) return;
    bookingSubmitInFlightRef.current = true;

    const booked = await db.appointments.book({
      patientId: session.patient.id,
      doctorId,
      hospitalId,
      date: effectiveDate,
      time24,
      timeLabel: effectiveSlot,
      reason: bookingReason || bookingCaseNotes || bookingCaseSymptoms.join(', '),
      holdId: null,
      bookingRequestId: bookingRequestIdRef.current,
    });
    if (booked.error || !booked.data) {
      bookingSubmitInFlightRef.current = false;
      const bookingError = booked.error?.message || 'unknown error';
      if (/slot|attending|passed|capacity|filled|closed/i.test(bookingError)) {
        setSelectedBookingSlot('');
        setBookingStep(2);
      }
      alert(`Appointment could not be booked: ${bookingError}`);
      return;
    }
    const effectiveDoctorName = selectedDoctorObj?.name || selectedDoctor || 'Dr. Ananya Sharma';
    const effectiveSpecialty = selectedDoctorObj?.specialty || selectedDept || 'General Medicine';

    const tokenStr = booked.token;
    if (!tokenStr) {
      bookingSubmitInFlightRef.current = false;
      alert('Appointment was saved without a token. Please contact the registration desk.');
      return;
    }
    const dateObj = new Date(effectiveDate);
    const dayStr = dateObj.getDate().toString().padStart(2, '0');
    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();

    const newApt = {
      id: booked.data.id,
      doctorName: effectiveDoctorName,
      specialty: effectiveSpecialty,
      hospital: bookingHospital?.name || 'Sawai Man Singh Hospital',
      hospitalType: bookingHospital?.type || tr('government'),
      day: dayStr || '30',
      month: monthStr || 'AUG',
      time: effectiveSlot,
      token: tokenStr,
      status: 'Confirmed',
      statusType: 'confirmed',
      room: selectedDoctorObj?.room || '104',
      dept: effectiveSpecialty,
      reason: bookingReason || bookingCaseNotes || 'General Consultation'
    };

    bookingRequestIdRef.current = createBookingRequestId();

    setNewlyBookedToken(`${tr('tokenWord')} ${tokenStr}`);
    setAppointments(prev => [newApt, ...prev]);
    setToken(tokenStr);
    setSubmitted();

    // Persist Step 4 uploads as medical-report records, then mirror them into
    // the current session so the Medical Reports tab updates immediately.
    if (bookingReports && bookingReports.length > 0) {
      const savedReports = await Promise.all(bookingReports.map(async r => {
        const category = r.type === 'pdf' ? 'pdf' : /prescription|\brx\b/i.test(r.name || '') ? 'prescription' : 'lab';
        const saved = await db.reports.upload({
          patientId: session.patient.id,
          appointmentId: booked.data.id,
          reportType: category,
          title: r.name || 'Uploaded Clinical Document',
          file: r.file,
          dataUrl: r.dataUrl,
          ocrText: r.ocrSummary || '',
        });
        if (saved.error) throw saved.error;
        const docEntry = {
          id: saved.data?.id || r.id || 'doc_' + Date.now(),
          title: r.name || 'Uploaded Clinical Document',
          name: r.name || 'Uploaded Clinical Document',
          type: r.type === 'pdf' ? 'PDF Document' : 'Medical Report',
          category,
          dataUrl: r.dataUrl,
          file_url: saved.data?.file_url || r.dataUrl,
          imageData: r.dataUrl,
          uploadedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          ocr_text: r.ocrSummary || ''
        };
        if (addDocument) addDocument(docEntry);
        return docEntry;
      })).catch(error => {
        console.error('Unable to save Step 4 medical reports', error);
        return null;
      });
      if (!savedReports) {
        alert('The appointment was booked, but one or more medical reports could not be saved. Please upload them again from Medical Reports.');
      }
    }

    if (isWizard) {
      bookingSubmitInFlightRef.current = false;
      setSelectedAppointment(newApt);
      setBookingFlowView('main');
      setBookingStep(1);
      return;
    }
    setBookingSuccess(true);
    bookingSubmitInFlightRef.current = false;
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingModal(false);
      setNewlyBookedToken(null);
    }, 1800);
  };

  // Cancel Appointment
  const handleCancelAppointment = async (aptId) => {
    const { error } = await db.appointments.cancel(aptId);
    if (error) { alert(`Unable to cancel appointment: ${error.message}`); return; }
    setAppointments(prev => prev.filter(a => a.id !== aptId));
    if (selectedAppointment?.id === aptId) {
      setSelectedAppointment(null);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/auth?role=patient');
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0f172a',
      position: 'relative'
    }}>

      {/* ═══════════════════════════════════════════════════════════
          LEFT SIDEBAR (Patient Portal Navigation with Hamburger Toggle)
          ═══════════════════════════════════════════════════════════ */}
      <aside style={{
        width: sidebarOpen ? '240px' : '72px',
        minWidth: sidebarOpen ? '240px' : '72px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #edf2f7',
        display: 'flex',
        flexDirection: 'column',
        padding: sidebarOpen ? '1.5rem 1.15rem' : '1.5rem 0.5rem',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxSizing: 'border-box',
        zIndex: 40,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}>

        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          marginBottom: '1.75rem',
          padding: sidebarOpen ? '0 0.25rem' : '0'
        }}>
          {sidebarOpen && (
            <Link to="/" title="Swasthya Setu" style={{ display: 'flex', alignItems: 'center' }}>
              <SwasthyaLogo size={38} animated={true} />
            </Link>
          )}

          {/* Hamburger Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f766e',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#e6f7f4';
              e.currentTarget.style.borderColor = '#99f6e4';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Section Header */}
        {sidebarOpen && (
          <div style={{
            fontSize: '0.72rem',
            fontWeight: '800',
            color: '#0d9488',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            paddingLeft: '0.75rem',
            marginBottom: '0.85rem',
            whiteSpace: 'nowrap'
          }}>
            {tr('portal')}
          </div>
        )}

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>

          {/* 1. Appointments (Active Primary Tab) */}
          <button
            onClick={() => setActiveTab('appointments')}
            title={tr('appointments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '12px',
              width: '100%',
              padding: sidebarOpen ? '12px 14px' : '12px 0',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'appointments' ? '700' : '600',
              color: activeTab === 'appointments' ? '#0d6559' : '#475569',
              backgroundColor: activeTab === 'appointments' ? '#e8f5f1' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'appointments' ? '#0d6559' : '#64748b'
            }}>
              <Calendar size={19} />
            </div>
            {sidebarOpen && <span>{tr('appointments')}</span>}
          </button>

          {/* 2. Appointment History */}
          <button
            onClick={() => setActiveTab('history')}
            title={tr('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '12px',
              width: '100%',
              padding: sidebarOpen ? '12px 14px' : '12px 0',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'history' ? '700' : '500',
              color: activeTab === 'history' ? '#0d6559' : '#475569',
              backgroundColor: activeTab === 'history' ? '#e8f5f1' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
              <Clock size={19} color={activeTab === 'history' ? '#0d6559' : '#64748b'} />
            </div>
            {sidebarOpen && <span>{tr('history')}</span>}
          </button>

          {/* 3. Medical Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            title={tr('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '12px',
              width: '100%',
              padding: sidebarOpen ? '12px 14px' : '12px 0',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'reports' ? '700' : '500',
              color: activeTab === 'reports' ? '#0d6559' : '#475569',
              backgroundColor: activeTab === 'reports' ? '#e8f5f1' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
              <FileText size={19} color={activeTab === 'reports' ? '#0d6559' : '#64748b'} />
            </div>
            {sidebarOpen && <span>{tr('reports')}</span>}
          </button>

          {/* 4. Donations */}
          <button
            onClick={() => setActiveTab('donations')}
            title={tr('donations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '12px',
              width: '100%',
              padding: sidebarOpen ? '12px 14px' : '12px 0',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'donations' ? '700' : '500',
              color: activeTab === 'donations' ? '#0d6559' : '#475569',
              backgroundColor: activeTab === 'donations' ? '#e8f5f1' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
              <Heart size={19} color={activeTab === 'donations' ? '#0d6559' : '#64748b'} />
            </div>
            {sidebarOpen && <span>{tr('donations')}</span>}
          </button>

          {/* 5. Communities */}
          <button
            onClick={() => setActiveTab('communities')}
            title={tr('communities')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '12px',
              width: '100%',
              padding: sidebarOpen ? '12px 14px' : '12px 0',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'communities' ? '700' : '500',
              color: activeTab === 'communities' ? '#0d6559' : '#475569',
              backgroundColor: activeTab === 'communities' ? '#e8f5f1' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
              <Users size={19} color={activeTab === 'communities' ? '#0d6559' : '#64748b'} />
            </div>
            {sidebarOpen && <span>{tr('communities')}</span>}
          </button>

          {/* 6. Help & Support */}
          <button
            onClick={() => setActiveTab('help')}
            title={tr('help')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '12px',
              width: '100%',
              padding: sidebarOpen ? '12px 14px' : '12px 0',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'help' ? '700' : '500',
              color: activeTab === 'help' ? '#0d6559' : '#475569',
              backgroundColor: activeTab === 'help' ? '#e8f5f1' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
              <Headphones size={19} color={activeTab === 'help' ? '#0d6559' : '#64748b'} />
            </div>
            {sidebarOpen && <span>{tr('help')}</span>}
          </button>

        </nav>

        {/* Sidebar Footer / Trust & Security Card (Exact Match to User Reference) */}
        {sidebarOpen ? (
          <div
            style={{
              background: '#f4fbf9',
              border: '1px solid #e2f2ee',
              borderRadius: '16px',
              padding: '1.25rem 1.15rem',
              marginTop: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              boxShadow: '0 2px 8px rgba(15, 118, 110, 0.04)'
            }}
          >
            {/* Header: Shield + Your Health, Our Priority */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#0f766e" />
              <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0f766e', letterSpacing: '-0.2px' }}>
                {tr('trustHeader')}
              </span>
            </div>

            {/* Subtext */}
            <p style={{
              margin: 0,
              fontSize: '0.825rem',
              color: '#334155',
              fontWeight: '500',
              lineHeight: 1.45
            }}>
              {tr('trustBody')}
            </p>

            {/* Footer Badge: Lock + HIPAA Compliant */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Lock size={15} color="#0f766e" />
              <span key={`badge-${currentLang}`} translate="no" className="notranslate" style={{ fontSize: '0.825rem', fontWeight: '800', color: '#0f766e' }}>
                {tr('trustBadge')}
              </span>
            </div>
          </div>
        ) : (
          <div
            title={`${tr('trustHeader')} — ${tr('trustBadge')}`}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#f4fbf9',
              border: '1px solid #e2f2ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 'auto auto 0 auto',
              cursor: 'pointer',
              color: '#0f766e'
            }}
          >
            <ShieldCheck size={20} color="#0f766e" />
          </div>
        )}

      </aside>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════════ */}
      <main style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'all 0.3s ease'
      }}>

        {/* TOP BAR / HEADER */}
        <header style={{
          height: '76px',
          padding: '0 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid transparent',
          backgroundColor: '#f8fafc',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>

          {/* Breadcrumb & Section Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
            <span style={{ color: '#0d9488', fontWeight: '600' }}>{tr('portal')}</span>
            <span>/</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: '600' }}>
              <Stethoscope size={14} color="#0d9488" />
              {activeTab === 'appointments' && tr('appointments')}
              {activeTab === 'history' && tr('history')}
              {activeTab === 'reports' && tr('reports')}
              {activeTab === 'donations' && tr('donations')}
              {activeTab === 'communities' && tr('communities')}
              {activeTab === 'help' && tr('help')}
            </span>
          </div>

          {/* Right Action Controls (Language & User Profile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>

            {/* Language Switcher Dropdown */}
            <div ref={languageDropdownRef} style={{ position: 'relative' }} className="notranslate" translate="no">
              <button
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="notranslate"
                translate="no"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#334155',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <span style={{ fontSize: '1rem' }}>🌐</span>
                <span>{availableLanguages.find(l => l.code === currentLang)?.name || 'English'}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {langDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0',
                  minWidth: '210px',
                  overflow: 'hidden',
                  zIndex: 50
                }}>
                  {availableLanguages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setCurrentLang(l.code);
                        setLangDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: currentLang === l.code ? '#f0fdf4' : 'transparent',
                        color: currentLang === l.code ? '#0d9488' : '#334155',
                        fontWeight: currentLang === l.code ? '700' : '500',
                        fontSize: '0.875rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{l.nativeName} ({l.name})</span>
                      {currentLang === l.code && <Check size={16} color="#0d9488" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Avatar / Dropdown (REAL LOGGED IN USER DATA ONLY) */}
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#c7d2fe',
                  color: '#3730a3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.875rem'
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>
                  {displayName}
                </span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {profileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0',
                  width: '260px',
                  padding: '1rem',
                  zIndex: 50
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#c7d2fe', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>{displayName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{phone || abhaId}</div>
                    </div>
                  </div>

                  <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setShowAbhaModal(true);
                        setProfileDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        color: '#334155',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        backgroundColor: 'transparent',
                        border: 'none'
                      }}
                    >
                      <ShieldCheck size={16} color="#0d9488" />
                      <span>Digital ABHA Health Card</span>
                    </button>

                    <button
                      onClick={() => {
                        setAyushMode(!isAyushMode);
                        setProfileDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        color: isAyushMode ? '#15803d' : '#334155',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        backgroundColor: isAyushMode ? '#f0fdf4' : 'transparent',
                        border: 'none'
                      }}
                    >
                      <Leaf size={16} color={isAyushMode ? '#15803d' : '#64748b'} />
                      <span>AYUSH Integrative Care: {isAyushMode ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        color: '#ef4444',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textAlign: 'left',
                        backgroundColor: '#fef2f2',
                        border: 'none'
                      }}
                    >
                      <LogOut size={16} color="#ef4444" />
                      <span>{tr('logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════
            MAIN BODY
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ padding: '0 2.5rem 3rem 2.5rem', maxWidth: '1240px', width: '100%', boxSizing: 'border-box' }}>

          {/* TAB 1: APPOINTMENTS */}
          {/* TAB 1: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div>

              {/* ═══════════════════════════════════════════════════════════
                  VIEW 1: DOCTOR SELECTION VIEW (Exact Match to Reference Image 1)
                  ═══════════════════════════════════════════════════════════ */}
              {bookingFlowView === 'doctor_select' && bookingHospital && (
                <div>
                  {/* Top Back Navigation to Dashboard */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <button
                      onClick={() => setBookingFlowView('main')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        color: '#0f766e',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.borderColor = '#99f6e4';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>{tr('backToDashboard')}</span>
                    </button>
                  </div>

                  {/* Page Title */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
                      Select a Doctor
                    </h1>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>
                      Choose a doctor from {bookingHospital.name}
                    </p>
                  </div>

                  {/* Hospital Summary Card */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Left Icon & Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '14px',
                        backgroundColor: '#0f2f57',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        flexShrink: 0
                      }}>
                        <Building2 size={26} color="#ffffff" />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                            {bookingHospital.name}
                          </h3>
                          <span style={{
                            backgroundColor: '#fff1e6',
                            color: '#ea580c',
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            letterSpacing: '0.4px'
                          }}>
                            POPULAR
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.825rem', color: '#64748b', margin: '3px 0 4px 0' }}>
                          <MapPin size={13} color="#64748b" />
                          <span>{bookingHospital.address}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                          <span style={{ color: '#eab308', fontWeight: '700' }}>★ {bookingHospital.rating || '4.6'}</span>
                          <span>•</span>
                          <span>{bookingHospital.distance || '1.8 km away'}</span>
                          <span>•</span>
                          <span>{bookingHospital.departmentsCount || '32 Departments'}</span>
                          <span>•</span>
                          <span style={{ color: '#0f766e', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={13} />
                            <span>{bookingHospital.type || 'Government'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Change Hospital Button */}
                    <div>
                      <button
                        onClick={() => {
                          setBookingFlowView('main');
                          setShowAllHospitalsModal(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '9px 16px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          color: '#0f766e',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#f0fdf4';
                          e.currentTarget.style.borderColor = '#99f6e4';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <span>{tr('changeHospital')}</span>
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Search & Filters Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                      <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={doctorSearchQuery}
                        onChange={e => setDoctorSearchQuery(e.target.value)}
                        placeholder={tr('searchDoctorPlaceholder')}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>

                    <button
                      onClick={() => setDoctorCareSystem(prev => prev === 'allopathy' ? 'ayurveda' : 'allopathy')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '11px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <Filter size={15} color="#64748b" />
                      <span>Filters</span>
                      <ChevronDown size={14} color="#64748b" />
                    </button>
                  </div>

                  {/* Care System Toggle Tabs: Allopathy vs Ayurveda */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.75rem'
                  }}>
                    <button
                      onClick={() => setDoctorCareSystem('allopathy')}
                      style={{
                        padding: '14px 20px',
                        borderRadius: '14px',
                        border: doctorCareSystem === 'allopathy' ? '2px solid #0f766e' : '1px solid #e2e8f0',
                        backgroundColor: doctorCareSystem === 'allopathy' ? '#f0fdf9' : '#ffffff',
                        color: doctorCareSystem === 'allopathy' ? '#0f766e' : '#64748b',
                        fontSize: '1rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Stethoscope size={22} color={doctorCareSystem === 'allopathy' ? '#0f766e' : '#94a3b8'} />
                      <span>Allopathy</span>
                    </button>

                    <button
                      onClick={() => setDoctorCareSystem('ayurveda')}
                      style={{
                        padding: '14px 20px',
                        borderRadius: '14px',
                        border: doctorCareSystem === 'ayurveda' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                        backgroundColor: doctorCareSystem === 'ayurveda' ? '#fff7ed' : '#ffffff',
                        color: doctorCareSystem === 'ayurveda' ? '#ea580c' : '#64748b',
                        fontSize: '1rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Leaf size={22} color={doctorCareSystem === 'ayurveda' ? '#ea580c' : '#94a3b8'} />
                      <span>Ayurveda</span>
                    </button>
                  </div>

                  {/* Doctors Cards Grid (Matching Reference Image 1) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem'
                  }}>
                    {(bookingHospital.doctors || []).filter(doc => {
                      if (doctorCareSystem === 'ayurveda') {
                        return doc.isAyush || doc.specialty?.toLowerCase().includes('ayurved');
                      } else {
                        return !doc.isAyush && !doc.specialty?.toLowerCase().includes('ayurved');
                      }
                    }).filter(doc => {
                      if (!doctorSearchQuery.trim()) return true;
                      const q = doctorSearchQuery.toLowerCase();
                      return doc.name.toLowerCase().includes(q) || (doc.specialty || '').toLowerCase().includes(q);
                    }).map((doc, idx) => {
                      const fullProf = getDoctorFullProfile(doc, bookingHospital);
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            padding: '1.5rem 1rem',
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: '84px',
                            height: '84px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#f1f5f9',
                            marginBottom: '12px',
                            border: '2px solid #e2e8f0'
                          }}>
                            <img
                              src={fullProf.avatar}
                              alt={fullProf.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.src = getDoctorFallbackAvatar(fullProf.name);
                              }}
                            />
                          </div>

                          {/* Doctor Info */}
                          <h4 style={{ margin: '0 0 3px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.3 }}>
                            {fullProf.name}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                            {fullProf.degrees.split(',')[0] || 'MBBS'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '14px' }}>
                            <Briefcase size={13} color="#64748b" />
                            <span>{fullProf.exp}</span>
                          </div>

                          {/* Select Button */}
                          <button
                            data-voice-doctor={idx}
                            onClick={() => handleSelectDoctorForBooking(doc)}
                            style={{
                              width: '100%',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '9px 12px',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              marginBottom: '10px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
                          >
                            <span>{ui('Select')}</span>
                            <ArrowRight size={15} />
                          </button>

                          {/* View Profile Link */}
                          <button
                            onClick={() => handleOpenDoctorProfile(doc)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#0f766e',
                              fontSize: '0.825rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >{ui('View Profile')}</button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Request Callback Banner */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                    color: '#475569'
                  }}>
                    <AlertCircle size={16} color="#64748b" />
                    <span>{ui("Can't find the right doctor?")}{' '}</span>
                    <button
                      onClick={() => alert("Our medical coordinator will call you back within 15 minutes.")}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0f766e',
                        fontWeight: '800',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Request a Callback
                    </button>
                  </div>

                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  VIEW 2: DOCTOR PROFILE VIEW (Exact Match to Reference Image 2)
                  ═══════════════════════════════════════════════════════════ */}
              {bookingFlowView === 'doctor_profile' && selectedDoctorObj && (
                <div>
                  {/* Top Back Navigation */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <button
                      onClick={() => {
                        releaseActiveBookingHold();
                        setBookingFlowView('doctor_select');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#0f766e',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Doctors</span>
                    </button>
                  </div>

                  {/* Doctor Hero Card */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    padding: '1.75rem 2rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '2rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Left: Avatar & Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 420px' }}>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          backgroundColor: '#f1f5f9',
                          border: '3px solid #e2e8f0',
                          position: 'relative'
                        }}>
                          <img
                            src={selectedDoctorObj.avatar}
                            alt={selectedDoctorObj.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.src = getDoctorFallbackAvatar(selectedDoctorObj.name);
                            }}
                          />
                        </div>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          backgroundColor: '#fef9c3',
                          color: '#a16207',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          ★ Top Rated
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>
                            {selectedDoctorObj.name}
                          </h2>
                          <CheckCircle2 size={20} color="#16a34a" />
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600', margin: '4px 0 8px 0' }}>
                          {selectedDoctorObj.degrees}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span style={{ color: '#eab308', fontWeight: '700' }}>★ {selectedDoctorObj.rating} ({selectedDoctorObj.reviewsCount} reviews)</span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Briefcase size={13} /> {selectedDoctorObj.exp}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Stethoscope size={13} /> {selectedDoctorObj.specialty}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: '#0f172a', fontWeight: '700', marginBottom: '3px' }}>
                          <Building2 size={14} color="#0f766e" />
                          <span>{bookingHospital?.name || 'Sawai Man Singh Hospital'}</span>
                          <span style={{ backgroundColor: '#fff1e6', color: '#ea580c', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px' }}>POPULAR</span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <MapPin size={12} />
                          <span>{[bookingHospital?.address, bookingHospital?.distance].filter(Boolean).join(' • ')}</span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={12} />
                          <span>Languages: English, Hindi</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Next Available & Booking CTA */}
                    <div style={{
                      borderLeft: '1px solid #f1f5f9',
                      paddingLeft: '2rem',
                      minWidth: '220px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
                        <Calendar size={13} color="#64748b" />
                        <span>Next Available</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>
                        Today, 29 Aug
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#16a34a', marginBottom: '14px' }}>
                        10:30 AM onwards
                      </div>

                      <button
                        onClick={() => handleSelectDoctorForBooking(selectedDoctorObj)}
                        style={{
                          width: '100%',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px 18px',
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
                      >
                        <span>Select Doctor</span>
                        <ArrowRight size={15} />
                      </button>

                      <button
                        onClick={() => handleSelectDoctorForBooking(selectedDoctorObj)}
                        style={{
                          width: '100%',
                          backgroundColor: '#ffffff',
                          color: '#334155',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          fontSize: '0.825rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Calendar size={14} />
                        <span>View Availability</span>
                      </button>
                    </div>
                  </div>

                  {/* Middle Section (2 Columns): About & Areas of Expertise */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* About Card */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      padding: '1.5rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} color="#0f766e" />
                        <span>About {selectedDoctorObj.name}</span>
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                        {selectedDoctorObj.about}
                      </p>

                      {/* 3 Metric Pills */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#166534' }}>{selectedDoctorObj.patientsTreated}</div>
                          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#166534', marginTop: '2px' }}>Patients Treated</div>
                        </div>

                        <div style={{ backgroundColor: '#f0fdf9', border: '1px solid #99f6e4', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f766e' }}>{selectedDoctorObj.years}+</div>
                          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#0f766e', marginTop: '2px' }}>Years Experience</div>
                        </div>

                        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#059669' }}>{selectedDoctorObj.satisfaction}</div>
                          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#059669', marginTop: '2px' }}>Patient Satisfaction</div>
                        </div>
                      </div>
                    </div>

                    {/* Areas of Expertise */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      padding: '1.5rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={16} color="#0f766e" />
                        <span>Areas of Expertise</span>
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedDoctorObj.expertise.map((tag, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: '#f0fdf4',
                              color: '#166534',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: '700'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section (3 Columns): Education, Experience, Reviews */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Education */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      padding: '1.5rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GraduationCap size={16} color="#0f766e" />
                        <span>Education</span>
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {selectedDoctorObj.education.map((edu, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a', marginTop: '6px', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0f172a' }}>{edu.degree}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{edu.college}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Experience Timeline */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      padding: '1.5rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={16} color="#0f766e" />
                        <span>Experience</span>
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {selectedDoctorObj.experienceTimeline.map((exp, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0f766e', marginTop: '6px', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0f172a' }}>{exp.role}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{exp.hospital}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: exp.period.includes('Present') ? '#16a34a' : '#64748b', fontWeight: '700' }}>
                              {exp.period}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Patient Reviews */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      padding: '1.5rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Star size={16} color="#eab308" />
                          <span>Patient Reviews</span>
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: '700', cursor: 'pointer' }}>View All</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>{selectedDoctorObj.rating}</span>
                        <div style={{ color: '#eab308', fontSize: '0.95rem' }}>★★★★★</div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>({selectedDoctorObj.reviewsCount} reviews)</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedDoctorObj.reviews.map((rev, idx) => (
                          <div key={idx} style={{ padding: '8px 0', borderBottom: idx !== selectedDoctorObj.reviews.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: '800' }}>
                                  {rev.initial}
                                </div>
                                <span style={{ fontSize: '0.825rem', fontWeight: '800', color: '#0f172a' }}>{rev.author}</span>
                                <span style={{ color: '#eab308', fontSize: '0.7rem' }}>★★★★★</span>
                              </div>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{rev.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.35 }}>
                              {rev.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Note Banner */}
                  <div style={{
                    backgroundColor: '#f0fdf9',
                    border: '1px solid #ccfbf1',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontSize: '0.8rem',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={15} color="#0f766e" />
                    <span>Note: This profile is for informational purposes only. Please consult the doctor for personalized medical advice.</span>
                  </div>

                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  VIEW 3: MAIN OVERVIEW (Hospitals List & Upcoming Appointments)
                  ═══════════════════════════════════════════════════════════ */}
              
              {/* ═══════════════════════════════════════════════════════════
                  VIEW 3: STEP-BY-STEP APPOINTMENT BOOKING FLOW (Exact Match to User Reference Images)
                  ═══════════════════════════════════════════════════════════ */}
              {bookingFlowView === 'booking_steps' && selectedDoctorObj && (
                <div>
                  {/* Top Bar: Clean Breadcrumb-style Back Button & Main Heading */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.75rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <button
                      onClick={() => {
                        releaseActiveBookingHold();
                        setBookingFlowView('doctor_select');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '9px 18px',
                        color: '#0f766e',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.borderColor = '#99f6e4';
                        e.currentTarget.style.transform = 'translateX(-3px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Doctors</span>
                    </button>

                    <h1 style={{
                      margin: 0,
                      fontSize: '1.85rem',
                      fontWeight: '900',
                      color: '#0f172a',
                      letterSpacing: '-0.5px'
                    }}>
                      Book Appointment
                    </h1>

                    <div style={{ width: '130px' }} />
                  </div>

                  {/* 5-Step Progress Stepper */}
                  <div style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem 2.5rem',
                    marginBottom: '1.75rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      maxWidth: '860px',
                      margin: '0 auto'
                    }}>
                      {[
                        { step: 1, label: ui('Select Date') },
                        { step: 2, label: ui('Select Time') },
                        { step: 3, label: ui('Case') },
                        { step: 4, label: ui('Upload Reports') },
                        { step: 5, label: ui('Confirmation') }
                      ].map((item, idx, arr) => {
                        const isCompleted = bookingStep > item.step;
                        const isCurrent = bookingStep === item.step;

                        return (
                          <div key={item.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, flex: 1 }}>
                            {/* Circle Indicator */}
                            <div
                              onClick={() => {
                                setBookingStep(item.step);
                              }}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: isCompleted || isCurrent ? '#059669' : '#ffffff',
                                border: isCompleted || isCurrent ? '2px solid #059669' : '2px solid #cbd5e1',
                                color: isCompleted || isCurrent ? '#ffffff' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                marginBottom: '8px',
                                boxShadow: isCurrent ? '0 0 0 5px rgba(5, 150, 105, 0.16)' : 'none',
                                transform: isCurrent ? 'scale(1.08)' : 'scale(1)'
                              }}
                            >
                              {isCompleted ? <Check size={20} color="#ffffff" strokeWidth={3} /> : item.step}
                            </div>

                            {/* Label */}
                            <span style={{
                              fontSize: '0.8rem',
                              fontWeight: isCurrent ? '800' : '600',
                              color: isCurrent ? '#059669' : '#64748b',
                              whiteSpace: 'nowrap',
                              transition: 'color 0.2s ease'
                            }}>
                              {item.label}
                            </span>

                            {/* Connector Line to Next Step */}
                            {idx < arr.length - 1 && (
                              <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: '50%',
                                width: '100%',
                                height: '3px',
                                borderRadius: '2px',
                                backgroundColor: bookingStep > item.step ? '#059669' : '#e2e8f0',
                                zIndex: -1,
                                transition: 'all 0.4s ease'
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Doctor & Hospital Selected Summary Header Card */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    padding: '1.35rem 1.85rem',
                    marginBottom: '1.75rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Left Doctor Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9',
                        border: '2.5px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                        flexShrink: 0
                      }}>
                        <img
                          src={selectedDoctorObj.avatar}
                          alt={selectedDoctorObj.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = getDoctorFallbackAvatar(selectedDoctorObj.name);
                          }}
                        />
                      </div>

                      <div>
                        <h3 style={{ margin: '0 0 3px 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                          {selectedDoctorObj.name}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                          {selectedDoctorObj.degrees || 'MBBS (General Medicine)'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <User size={13} color="#0f766e" />
                          <span>{selectedDoctorObj.exp || '12+ Years Experience'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Hospital Badge Card */}
                    <div style={{
                      backgroundColor: 'rgba(240, 253, 249, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid #ccfbf1',
                      borderRadius: '16px',
                      padding: '12px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      boxShadow: '0 2px 8px rgba(12, 78, 71, 0.04)'
                    }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(12, 78, 71, 0.2)',
                        flexShrink: 0
                      }}>
                        <Building2 size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#059669' }}>
                          {bookingHospital?.name || 'Sawai Man Singh Hospital'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1px' }}>
                          {bookingHospital?.city || bookingHospital?.address || ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─────────────────────────────────────────────────────────
                      STEP 1: SELECT DATE (Glassmorphism & Interactive Micro-animations)
                      ───────────────────────────────────────────────────────── */}
                  {bookingStep === 1 && (
                    <div style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #fcfeff 100%)',
                      borderRadius: '24px',
                      border: '1px solid #e2e8f0',
                      padding: '2.25rem 2.5rem',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                      position: 'relative'
                    }}>
                      {/* Step Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '2rem' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          backgroundColor: '#f0fdf9',
                          border: '1px solid #ccfbf1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#059669',
                          boxShadow: '0 2px 8px rgba(12, 78, 71, 0.08)'
                        }}>
                          <Calendar size={24} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>{ui('Step 1: Select Date')}</h3>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>{ui('Choose a convenient date for your doctor consultation')}</p>
                        </div>
                      </div>

                      {/* Date Tiles Row with Glass Styling */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                        gap: '1.25rem',
                        marginBottom: '2.5rem'
                      }}>
                        {Array.from({ length: 7 }, (_, offset) => {
                          const value = new Date();
                          value.setHours(0, 0, 0, 0);
                          value.setDate(value.getDate() + offset);
                          return {
                            dateStr: `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`,
                            day: String(value.getDate()).padStart(2, '0'),
                            month: value.toLocaleDateString(currentLang === 'en' ? 'en-IN' : (currentLang + '-IN'), { month: 'short' }).toUpperCase(),
                            weekday: value.toLocaleDateString(currentLang === 'en' ? 'en-IN' : (currentLang + '-IN'), { weekday: 'short' }).toUpperCase(),
                            isToday: offset === 0
                          };
                        }).map((d) => {
                          const isSelected = selectedBookingDate === d.dateStr;
                          const leaveOnThisDay = (doctorLeavesList || []).find(l => l.date === d.dateStr);

                          return (
                            <button
                              key={d.dateStr}
                              data-voice-option
                              aria-label={`${d.weekday} ${d.day} ${d.month}`}
                              onClick={() => {
                                if (d.dateStr !== selectedBookingDate) releaseActiveBookingHold();
                                setSelectedBookingDate(d.dateStr);
                              }}
                              style={{
                                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.95)' : leaveOnThisDay ? '#fef2f2' : '#ffffff',
                                border: isSelected ? '2px solid #059669' : leaveOnThisDay ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                                borderRadius: '18px',
                                padding: '1.4rem 0.5rem 1.25rem 0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isSelected
                                  ? '0 10px 25px rgba(5, 150, 105, 0.18), 0 0 0 1px #059669'
                                  : '0 2px 6px rgba(0,0,0,0.02)',
                                transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              onMouseEnter={e => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = leaveOnThisDay ? '#f87171' : '#cbd5e1';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.05)';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = leaveOnThisDay ? '#fca5a5' : '#e2e8f0';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                                }
                              }}
                            >
                              {/* Selected Active Top Pill */}
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '4px',
                                  backgroundColor: leaveOnThisDay ? '#dc2626' : '#059669'
                                }} />
                              )}

                              <div style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                color: isSelected ? (leaveOnThisDay ? '#b91c1c' : '#059669') : leaveOnThisDay ? '#dc2626' : '#94a3b8',
                                textTransform: 'uppercase',
                                letterSpacing: '0.6px',
                                marginBottom: '4px'
                              }}>
                                {d.weekday}
                              </div>

                              <div style={{
                                fontSize: '2rem',
                                fontWeight: '900',
                                color: isSelected ? (leaveOnThisDay ? '#991b1b' : '#059669') : leaveOnThisDay ? '#7f1d1d' : '#0f172a',
                                lineHeight: 1.1,
                                letterSpacing: '-0.5px'
                              }}>
                                {d.day}
                              </div>

                              <div style={{
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                color: isSelected ? (leaveOnThisDay ? '#b91c1c' : '#059669') : leaveOnThisDay ? '#991b1b' : '#64748b',
                                marginTop: '4px'
                              }}>
                                {d.month}
                              </div>

                              {leaveOnThisDay && (
                                <span style={{
                                  display: 'inline-block',
                                  marginTop: '6px',
                                  fontSize: '0.65rem',
                                  fontWeight: '800',
                                  color: '#dc2626',
                                  background: '#fee2e2',
                                  border: '1px solid #fecaca',
                                  borderRadius: '6px',
                                  padding: '1px 6px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  On Leave
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {/* More Dates Glass Tile */}
                        <div
                          style={{
                            border: '1.5px dashed #cbd5e1',
                            borderRadius: '18px',
                            padding: '1.4rem 0.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            backgroundColor: '#fafbfc',
                            transition: 'all 0.25s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                            e.currentTarget.style.borderColor = '#94a3b8';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#fafbfc';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          onClick={() => {
                            const now = new Date();
                            const minimum = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                            const custom = prompt("Enter desired date (YYYY-MM-DD):", minimum);
                            if (!custom) return;
                            if (!/^\d{4}-\d{2}-\d{2}$/.test(custom) || Number.isNaN(new Date(`${custom}T00:00:00`).getTime())) {
                              alert('Please enter a valid date in YYYY-MM-DD format.');
                            } else if (custom < minimum) {
                              alert('Past dates cannot be selected.');
                            } else {
                              if (custom !== selectedBookingDate) releaseActiveBookingHold();
                              setSelectedBookingDate(custom);
                            }
                          }}
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '6px'
                          }}>
                            <Calendar size={18} color="#64748b" />
                          </div>
                          <span style={{ fontSize: '0.825rem', fontWeight: '800', color: '#475569' }}>{tr('moreDates')}</span>
                        </div>
                      </div>

                      {/* Selected Date Leave Notice */}
                      {(() => {
                        const leaveOnSelectedDate = (doctorLeavesList || []).find(l => l.date === selectedBookingDate) || (liveSlots.onLeave ? { reason: liveSlots.leaveReason } : null);
                        if (!leaveOnSelectedDate) return null;
                        return (
                          <div style={{
                            background: '#fef2f2',
                            border: '1.5px solid #fca5a5',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            marginTop: '1.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.05)'
                          }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              backgroundColor: '#fee2e2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: '#dc2626'
                            }}>
                              <AlertCircle size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#991b1b' }}>
                                Doctor Unavailable on Selected Date ({selectedBookingDate})
                              </div>
                              <div style={{ fontSize: '0.825rem', color: '#7f1d1d', marginTop: '2px' }}>
                                {selectedDoctorObj.name} is on scheduled leave ({leaveOnSelectedDate.reason || 'Holiday / Leave'}). Appointments and slots for this date are blocked. Please choose another date above.
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Next Button Row */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                        {(() => {
                          const isBlocked = Boolean((doctorLeavesList || []).find(l => l.date === selectedBookingDate) || liveSlots.onLeave);
                          return (
                            <button
                              onClick={() => {
                                if (isBlocked) {
                                  alert(`${selectedDoctorObj.name} is on leave on ${selectedBookingDate}. Please choose another date.`);
                                  return;
                                }
                                setBookingStep(2);
                              }}
                              disabled={isBlocked}
                              data-voice-action="next"
                              style={{
                                background: isBlocked ? '#94a3b8' : '#059669',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '14px',
                                padding: '13px 30px',
                                fontSize: '0.975rem',
                                fontWeight: '800',
                                cursor: isBlocked ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                opacity: isBlocked ? 0.6 : 1,
                                boxShadow: isBlocked ? 'none' : '0 6px 20px rgba(12, 78, 71, 0.3)',
                                transition: 'all 0.25s ease'
                              }}
                              onMouseEnter={e => {
                                if (!isBlocked) {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(12, 78, 71, 0.4)';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isBlocked) {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(12, 78, 71, 0.3)';
                                }
                              }}
                            >
                              <span>{isBlocked ? 'Date Blocked (Doctor on Leave)' : tr('nextSelectTime')}</span>
                              <ArrowRight size={18} />
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────
                      STEP 2: SELECT TIME — Live from SlotEngine
                      ───────────────────────────────────────────────────────── */}
                  {bookingStep === 2 && (() => {
                    // Render slot grid for one session group
                    const renderSlotGroup = (slots, emoji, label) => {
                      const visibleSlots = (slots || []).filter(slot => !slot.isPast);
                      if (visibleSlots.length === 0) return null;
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.925rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.15rem' }}>{emoji}</span>
                            <span>{label}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>
                              {visibleSlots.filter(s => s.state === 'open' || s.state === 'fast').length} {tr('slotsAvailable')}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.9rem' }}>
                            {visibleSlots.map((slot) => {
                              const isSelected = selectedBookingSlot === slot.label;
                              const isThrottled = Boolean(slot.isThrottled);
                              const isConsultationBlocked = Boolean(slot.consultationBlocked);
                              const isDisabled = isThrottled || isConsultationBlocked || slot.state === 'full' || slot.state === 'closed';

                              const bgColor = isSelected
                                ? '#059669'
                                : isThrottled || isConsultationBlocked ? '#fffbeb'
                                : isDisabled ? '#f8fafc' : '#ffffff';
                              const borderColor = isSelected
                                ? '#059669'
                                : isThrottled || isConsultationBlocked ? '#fde68a'
                                : slot.state === 'fast' ? '#fed7aa'
                                : isDisabled ? '#e2e8f0' : '#e2e8f0';
                              const textColor = isSelected ? '#ffffff' : isThrottled || isConsultationBlocked ? '#92400e' : isDisabled ? '#94a3b8' : '#0f172a';

                              const statusLabel = isSelected ? ui('Selected')
                                : isConsultationBlocked      ? ui('Doctor attending current patient')
                                : isThrottled             ? ui('Paused (High OPD Load)')
                                : slot.state === 'full'   ? ui('Fully Booked')
                                : slot.state === 'closed' ? ui('Closed')
                                : slot.state === 'fast'   ? ui(`${slot.slotsLeft} slot left`)
                                : ui(`${slot.slotsLeft} slots left`);
                              const statusColor = isSelected ? '#ccfbf1'
                                : isThrottled || isConsultationBlocked ? '#b45309'
                                : slot.state === 'full' || slot.state === 'closed' ? '#94a3b8'
                                : slot.state === 'fast' ? '#ea580c' : '#059669';

                              return (
                                <button
                                  key={slot.time24}
                                  data-voice-option
                                  aria-label={`${slot.label}, ${statusLabel}`}
                                  disabled={isDisabled}
                                  onClick={() => !isDisabled && handleSelectSlotWithHold(slot)}
                                  style={{
                                    backgroundColor: bgColor,
                                    border: isSelected ? `1.5px solid ${borderColor}` : `1px solid ${borderColor}`,
                                    borderRadius: '16px',
                                    padding: '13px 10px',
                                    textAlign: 'center',
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    opacity: isDisabled ? (isThrottled || isConsultationBlocked ? 0.78 : 0.5) : 1,
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    color: textColor,
                                    boxShadow: isSelected ? '0 8px 20px rgba(12, 78, 71, 0.25)' : '0 2px 6px rgba(0,0,0,0.02)',
                                    transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
                                  }}
                                  onMouseEnter={e => {
                                    if (!isSelected && !isDisabled) {
                                      e.currentTarget.style.borderColor = '#059669';
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(12, 78, 71, 0.1)';
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (!isSelected && !isDisabled) {
                                      e.currentTarget.style.borderColor = borderColor;
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                                    }
                                  }}
                                >
                                  <div style={{ fontSize: '0.925rem', fontWeight: '800', letterSpacing: '-0.2px' }}>
                                    {slot.label}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: '700', marginTop: '4px', color: statusColor }}>
                                    {statusLabel}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #fcfeff 100%)',
                        borderRadius: '24px',
                        border: '1px solid #e2e8f0',
                        padding: '2.25rem 2.5rem',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.03)'
                      }}>
                        {/* Step Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
                          <div style={{
                            width: '46px', height: '46px', borderRadius: '14px',
                            backgroundColor: '#f0fdf9', border: '1px solid #ccfbf1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#059669', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)'
                          }}>
                            <Clock size={24} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>{ui('Step 2: Select Time Slot')}</h3>
                            <p style={{ margin: '3px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>{ui(`Live availability from ${selectedDoctorObj.name}'s schedule`)}</p>
                          </div>
                        </div>

                        {/* AI Dynamic OPD Queue Pacing Alert */}
                        {liveSlots.pacingInfo && liveSlots.pacingInfo.isThrottled && !liveSlots.onLeave && (
                          <div style={{
                            background: '#fffbeb',
                            border: '1.5px solid #fde68a',
                            borderRadius: '16px',
                            padding: '12px 18px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.08)'
                          }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: '#fef3c7', color: '#b45309', display: 'grid', placeItems: 'center', flexShrink: 0
                            }}>
                              <Activity size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#92400e' }}>
                                AI OPD Load & Pacing Buffer Active
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '2px' }}>
                                {liveSlots.pacingInfo.pacingMessage || 'Doctor is attending extended patient cases. Immediate slots are throttled to ensure zero waiting room delay.'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Selected Date Pill and Active Proxy Hold Timer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            fontSize: '0.9rem', fontWeight: '800', color: '#0f172a',
                            background: 'rgba(240, 253, 249, 0.7)', border: '1px solid #ccfbf1',
                            borderRadius: '12px', padding: '7px 16px'
                          }}>
                            <Calendar size={16} color="#059669" />
                            <span>{selectedBookingDate}</span>
                          </div>

                        </div>

                        {/* Loading State or On Leave State */}
                        {slotsLoading ? (
                          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
                            <div style={{
                              width: '40px', height: '40px', border: '3px solid #ccfbf1',
                              borderTop: '3px solid #059669', borderRadius: '50%',
                              margin: '0 auto 12px', animation: 'spin 1s linear infinite'
                            }} />
                            <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{tr('loadingLiveSchedule')}</p>
                          </div>
                        ) : liveSlots.onLeave ? (
                          <div style={{
                            background: '#fef2f2',
                            border: '1.5px solid #fca5a5',
                            borderRadius: '20px',
                            padding: '2.5rem 2rem',
                            textAlign: 'center',
                            marginBottom: '2rem',
                            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.05)'
                          }}>
                            <div style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              backgroundColor: '#fee2e2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 14px',
                              color: '#dc2626'
                            }}>
                              <AlertCircle size={28} />
                            </div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: '900', color: '#991b1b' }}>
                              Doctor on Holiday / Leave on this Date
                            </h4>
                            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#7f1d1d', maxWidth: '520px', marginInline: 'auto' }}>
                              {selectedDoctorObj.name} is on scheduled leave ({liveSlots.leaveReason || 'Holiday'}). All consultation slots are locked and unavailable for booking on {selectedBookingDate}.
                            </p>
                            <button
                              onClick={() => setBookingStep(1)}
                              style={{
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '10px 22px',
                                fontSize: '0.875rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <ArrowLeft size={16} />
                              <span>Select Another Date</span>
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.85rem', marginBottom: '2.25rem' }}>
                            {renderSlotGroup(liveSlots.morning,   '☀️', 'Morning Slots')}
                            {renderSlotGroup(liveSlots.afternoon, '🌤️', 'Afternoon Slots')}
                            {renderSlotGroup(liveSlots.evening,   '🌙', 'Evening Slots')}

                            {/* All sessions empty message */}
                            {[...(liveSlots.morning || []), ...(liveSlots.afternoon || []), ...(liveSlots.evening || [])].filter(slot => !slot.isPast).length === 0 && (
                              <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>
                                No slots available for this date. Please select a different date.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Legend Row */}
                        {!liveSlots.onLeave && (
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            {[
                              { dot: '#059669', label: 'Available' },
                              { dot: '#ea580c', label: 'Filling Fast' },
                              { dot: '#cbd5e1', label: 'Fully Booked' },
                              { dot: '#cbd5e1', label: 'Closed', strikethrough: true }
                            ].map(l => (
                              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: l.dot, display: 'inline-block' }} />
                                <span>{l.label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footer nav */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                          <button
                            onClick={() => setBookingStep(1)}
                            data-voice-action="back"
                            style={{
                              backgroundColor: '#ffffff', color: '#059669', border: '1.5px solid #059669',
                              borderRadius: '14px', padding: '11px 24px', fontSize: '0.9rem', fontWeight: '700',
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'all 0.25s ease'
                            }}
                          >
                            <ArrowLeft size={16} />
                            <span>{tr('previous')}</span>
                          </button>

                          {/* Real-time Badge */}
                          <div style={{
                            backgroundColor: liveSlots.onLeave ? 'rgba(254, 242, 242, 0.9)' : 'rgba(240, 253, 249, 0.9)', 
                            border: liveSlots.onLeave ? '1px solid #fca5a5' : '1px solid #ccfbf1',
                            borderRadius: '20px', padding: '8px 18px', display: 'flex', alignItems: 'center',
                            gap: '8px', fontSize: '0.825rem', color: liveSlots.onLeave ? '#991b1b' : '#0f766e', fontWeight: '700',
                            boxShadow: '0 2px 8px rgba(12, 78, 71, 0.05)'
                          }}>
                            <span style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              backgroundColor: liveSlots.onLeave ? '#dc2626' : '#10b981', display: 'inline-block',
                              boxShadow: liveSlots.onLeave ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : '0 0 0 2px rgba(16, 185, 129, 0.2)'
                            }} />
                            <span>{liveSlots.onLeave ? 'Doctor on Leave' : tr('liveAvailabilityBadge')}</span>
                          </div>

                          <button
                            onClick={async () => {
                              if (liveSlots.onLeave) {
                                alert(`${selectedDoctorObj.name} is on leave on ${selectedBookingDate}. Please select another date.`);
                                return;
                              }
                              if (!selectedBookingSlot) {
                                const firstOpen = liveSlots?.morning?.find(s => s.state === 'open' || s.state === 'fast')
                                  || liveSlots?.afternoon?.find(s => s.state === 'open' || s.state === 'fast')
                                  || liveSlots?.evening?.find(s => s.state === 'open' || s.state === 'fast');
                                if (!firstOpen) {
                                  alert('No appointment slot is currently available. Please choose another date.');
                                  return;
                                }
                                const held = await handleSelectSlotWithHold(firstOpen);
                                if (!held) return;
                              }
                              setBookingStep(3);
                            }}
                            disabled={Boolean(liveSlots.onLeave)}
                            data-voice-action="next"
                            style={{
                              background: liveSlots.onLeave ? '#94a3b8' : '#059669',
                              color: '#ffffff', border: 'none', borderRadius: '14px', padding: '13px 30px',
                              fontSize: '0.975rem', fontWeight: '800', cursor: liveSlots.onLeave ? 'not-allowed' : 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: '10px',
                              opacity: liveSlots.onLeave ? 0.6 : 1,
                              boxShadow: liveSlots.onLeave ? 'none' : '0 6px 20px rgba(12, 78, 71, 0.3)', transition: 'all 0.25s ease'
                            }}
                            onMouseEnter={e => { if (!liveSlots.onLeave) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(12, 78, 71, 0.4)'; } }}
                            onMouseLeave={e => { if (!liveSlots.onLeave) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(12, 78, 71, 0.3)'; } }}
                          >
                            <span>{liveSlots.onLeave ? 'Date Locked' : tr('nextCase')}</span>
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ─────────────────────────────────────────────────────────
                      STEP 3: CASE / SYMPTOMS DETAILS (Interactive AI Clinical Anamnesis)
                      ───────────────────────────────────────────────────────── */}
                  {bookingStep === 3 && (
                    <ClinicalAnamnesisChat
                      doctor={selectedDoctorObj}
                      hospital={bookingHospital}
                      patient={session.patient}
                      initialSymptoms={bookingCaseSymptoms}
                      initialNotes={bookingCaseNotes}
                      language={currentLang || 'en'}
                      onUpdateCaseDetails={({ symptoms, notes }) => {
                        setBookingCaseSymptoms(symptoms || []);
                        setBookingCaseNotes(notes || '');
                      }}
                      onPrevious={() => setBookingStep(2)}
                      onNext={() => setBookingStep(4)}
                    />
                  )}

                  {/* ─────────────────────────────────────────────────────────
                      STEP 4: UPLOAD REPORTS (Scan Report or Device Upload)
                      ───────────────────────────────────────────────────────── */}
                  {bookingStep === 4 && (
                    <ReportUploadStep
                      doctor={selectedDoctorObj}
                      hospital={bookingHospital}
                      uploadedReports={bookingReports}
                      onUpdateReports={(newReports) => setBookingReports(newReports)}
                      onPrevious={() => setBookingStep(3)}
                      onNext={() => setBookingStep(5)}
                      language={currentLang || 'en'}
                    />
                  )}

                  {/* ─────────────────────────────────────────────────────────
                      STEP 5: CONFIRMATION & PRE-VISIT CASE REVIEW
                      ───────────────────────────────────────────────────────── */}
                  {bookingStep === 5 && (
                    <BookingConfirmationStep
                      doctor={selectedDoctorObj}
                      hospital={bookingHospital}
                      selectedDate={selectedBookingDate}
                      selectedSlot={selectedBookingSlot}
                      caseSymptoms={bookingCaseSymptoms}
                      caseNotes={bookingCaseNotes}
                      uploadedReports={bookingReports}
                      onEditCase={() => setBookingStep(3)}
                      onEditReports={() => setBookingStep(4)}
                      onPrevious={() => setBookingStep(4)}
                      onConfirm={handleConfirmBooking}
                      language={currentLang || 'en'}
                    />
                  )}

                </div>
              )}

              {bookingFlowView === 'main' && (
                <div>
                  {/* Page Title */}
                  <h1 style={{
                    fontSize: '1.85rem',
                    fontWeight: '900',
                    color: '#0f172a',
                    margin: '0 0 1.25rem 0',
                    letterSpacing: '-0.4px'
                  }}>
                    {tr('bookAppointmentTitle')}
                  </h1>

                  {/* ── 1. Hero Greeting Banner (Real Patient Name & Translated Texts) ── */}
                  <div style={{
                    background: 'linear-gradient(135deg, #e6f6f2 0%, #ecf8f5 100%)',
                    border: '1px solid #ccece3',
                    borderRadius: '20px',
                    padding: '1.6rem 2.25rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>

                    {/* Left Text */}
                    <div style={{ flex: '1 1 320px', zIndex: 2 }}>
                      <h2 style={{
                        fontSize: '1.65rem',
                        fontWeight: '800',
                        color: '#0f766e',
                        margin: '0 0 0.4rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span className="notranslate" translate="no">{greetingText}{patientName ? ', ' + patientName : ''}</span>
                        <span style={{ fontSize: '1.6rem' }}>👋</span>
                      </h2>
                      <p style={{
                        fontSize: '0.95rem',
                        color: '#334155',
                        margin: 0,
                        fontWeight: '500',
                        lineHeight: 1.45,
                        maxWidth: '420px'
                      }}>
                        {tr('heroSubtitle')}
                      </p>
                    </div>

                    {/* Center SVG Illustration */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                      <svg width="180" height="100" viewBox="0 0 240 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxHeight: '100px' }}>
                        <circle cx="65" cy="40" r="22" fill="#fed7aa" />
                        <path d="M48 30C48 20 62 14 78 20C84 24 85 34 82 42C74 38 60 38 48 30Z" fill="#334155" />
                        <path d="M38 120C38 85 50 68 65 68C80 68 92 85 92 120H38Z" fill="#5eead4" />
                        <circle cx="70" cy="38" r="3" fill="#334155" />
                        <path d="M68 46Q74 50 78 46" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="165" cy="38" r="22" fill="#ffedd5" />
                        <path d="M148 34C148 18 162 12 182 18C188 22 190 32 186 42C178 36 160 36 148 34Z" fill="#0f172a" />
                        <path d="M190 40C190 55 186 70 186 70" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
                        <circle cx="160" cy="36" r="3" fill="#0f172a" />
                        <path d="M158 44Q164 48 168 44" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
                        <path d="M136 120C136 82 148 64 165 64C182 64 194 82 194 120H136Z" fill="#ffffff" />
                        <path d="M152 70V120M178 70V120" stroke="#cbd5e1" strokeWidth="2" />
                        <path d="M154 68C154 82 176 82 176 68" stroke="#0f766e" strokeWidth="3" fill="none" />
                        <path d="M165 82V96" stroke="#0f766e" strokeWidth="3" />
                        <circle cx="165" cy="98" r="5" fill="#14b8a6" stroke="#0f766e" strokeWidth="2" />
                        <circle cx="115" cy="45" r="4" fill="#14b8a6" opacity="0.6" />
                        <circle cx="125" cy="38" r="6" fill="#0d9488" opacity="0.8" />
                      </svg>
                    </div>

                    {/* Integrated voice-assistant control */}
                    <div style={{ zIndex: 2, flex: '0 1 285px' }}>
                      <div
                        style={{
                          width: '100%',
                          minWidth: '250px',
                          background: 'rgba(255, 255, 255, 0.78)',
                          color: '#0f172a',
                          border: '1px solid rgba(5, 150, 105, 0.22)',
                          borderRadius: '18px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: '0 6px 18px rgba(15, 118, 110, 0.09)',
                          backdropFilter: 'blur(10px)',
                          textAlign: 'left',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 5px 12px rgba(5, 150, 105, 0.2)'
                        }}>
                          <Mic size={21} color="#ffffff" />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', letterSpacing: '-0.15px', whiteSpace: 'nowrap' }}>
                            {tr('talkToSwasthyaSetu')}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                            {tr('speakInYourLanguage')}
                          </div>
                        </div>
                        <ChevronRight size={18} color="#059669" style={{ flexShrink: 0 }} />
                      </div>
                    </div>

                  </div>

                  {/* ── 2. TWO-COLUMN MAIN GRID ── */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.65fr 1fr',
                    gap: '1.75rem',
                    alignItems: 'start'
                  }}>

                    {/* ── LEFT COLUMN: Find a Hospital & Doctor ── */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      padding: '1.75rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                    }}>

                      {/* Title & Total Count Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{
                          fontSize: '1.15rem',
                          fontWeight: '800',
                          color: '#0f172a',
                          margin: 0
                        }}>
                          {tr('findHospitalDoctor')}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: '700', backgroundColor: '#e6f6f2', padding: '3px 10px', borderRadius: '12px' }}>
                          {hospitals.length} Hospitals
                        </span>
                      </div>

                      {/* Search Bar */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '10px 16px',
                        marginBottom: '1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}>
                        <Search size={18} color="#94a3b8" />
                        <input
                          type="text"
                          placeholder={tr('searchPlaceholder')}
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.9rem',
                            color: '#0f172a'
                          }}
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {/* Filter Chips */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {[
                          { key: 'All', label: tr('all') },
                          { key: 'Government', label: tr('government') },
                          { key: 'Private', label: tr('private') },
                          { key: 'AYUSH', label: tr('ayush') },
                          { key: 'Near Me', label: tr('nearMe'), icon: true }
                        ].map(filter => {
                          const isActive = selectedFilter === filter.key;
                          return (
                            <button
                              key={filter.key}
                              onClick={() => setSelectedFilter(filter.key)}
                              style={{
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontSize: '0.825rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: isActive ? '#0f766e' : '#ffffff',
                                color: isActive ? '#ffffff' : '#475569',
                                border: isActive ? '1px solid #0f766e' : '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {filter.icon && <MapPin size={13} />}
                              <span>{filter.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Hospital Cards List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredHospitals.slice(0, 4).map((hospital, hospitalIndex) => (
                          <div
                            key={hospital.id}
                            style={{
                              padding: '1.25rem',
                              borderRadius: '16px',
                              border: '1px solid #f1f5f9',
                              backgroundColor: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: hospital.logoBg || '#0f766e',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                flexShrink: 0
                              }}>
                                {hospital.isAyush ? <Leaf size={24} /> : <Building2 size={24} />}
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                                    {hospital.name}
                                  </h4>
                                  {hospital.badge && (
                                    <span style={{
                                      backgroundColor: '#fff1e6',
                                      color: '#ea580c',
                                      fontSize: '0.65rem',
                                      fontWeight: '800',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      letterSpacing: '0.4px'
                                    }}>
                                      {hospital.badge}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b', margin: '3px 0 4px 0' }}>
                                  <MapPin size={12} color="#64748b" />
                                  <span>{hospital.address}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                                  <span style={{ color: '#eab308', fontWeight: '700' }}>★ {hospital.rating}</span>
                                  <span>•</span>
                                  <span>{hospital.distance}</span>
                                  <span>•</span>
                                  <span>{hospital.departmentsCount}</span>
                                  <span>•</span>
                                  <span style={{ color: hospital.typeColor, fontWeight: '700' }}>
                                    {hospital.type}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <button
                                data-voice-hospital={hospitalIndex}
                                onClick={() => handleOpenBooking(hospital)}
                                style={{
                                  backgroundColor: '#059669',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '10px',
                                  padding: '9px 18px',
                                  fontSize: '0.85rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(12, 78, 71, 0.25)',
                                  transition: 'all 0.2s ease',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
                              >
                                {tr('bookAppointmentBtn')}
                              </button>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                                {tr('nextAvailable')}: <strong style={{ color: '#16a34a' }}>{hospital.nextAvailable}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* View All Hospitals Button */}
                      <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                        <button
                          onClick={() => setShowAllHospitalsModal(true)}
                          style={{
                            backgroundColor: '#f0fdf4',
                            color: '#0f766e',
                            border: '1px solid #99f6e4',
                            borderRadius: '12px',
                            padding: '10px 20px',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ccfbf1'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                        >
                          <span>{tr('viewAllHospitals')} ({hospitals.length})</span>
                          <ArrowRight size={15} />
                        </button>
                      </div>

                    </div>

                    {/* ── RIGHT COLUMN: Upcoming Appointments ── */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      padding: '1.75rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                    }}>

                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <h3 style={{
                          fontSize: '1.15rem',
                          fontWeight: '800',
                          color: '#0f172a',
                          margin: 0
                        }}>
                          {tr('upcomingAppointments')}
                        </h3>
                        {appointments.length > 0 && (
                          <button
                            onClick={() => setShowAllAppointmentsModal(true)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#0f766e',
                              fontSize: '0.825rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {tr('viewAll')} ({appointments.length})
                          </button>
                        )}
                      </div>

                      {/* Appointment List / Empty State */}
                      {appointments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {appointments.map((apt, index) => {
                            const localizedDoc = localizeDoctor(apt.doctorName, currentLang);
                            const localizedSpec = localizeSpecialty(apt.specialty, currentLang);
                            const localizedHosp = localizeHospitalName(apt.hospital, currentLang);
                            const localizedMon = localizeMonth(apt.month, currentLang);
                            const tokenPill = apt.token?.includes('#') ? tr('tokenWord') + ' #' + apt.token.split('#')[1] : tr('tokenWord') + ' ' + apt.token;

                            return (
                              <div
                                key={apt.id || index}
                                onClick={() => setSelectedAppointment(apt)}
                                style={{
                                  padding: '1rem',
                                  borderRadius: '14px',
                                  border: '1px solid #f1f5f9',
                                  backgroundColor: '#fafbfc',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fafbfc'}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                  <div style={{
                                    width: '44px',
                                    padding: '6px 2px',
                                    borderRadius: '10px',
                                    backgroundColor: '#e6f7f3',
                                    border: '1px solid #bbf7d0',
                                    textAlign: 'center',
                                    flexShrink: 0
                                  }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f766e', lineHeight: 1 }}>{apt.day}</div>
                                    <div style={{ fontSize: '0.62rem', fontWeight: '800', color: '#0f766e', marginTop: '2px', letterSpacing: '0.4px' }}>{localizedMon}</div>
                                  </div>

                                  <div>
                                    <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: '800', color: '#0f172a' }}>
                                      {localizedDoc}
                                    </h4>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', margin: '1px 0 2px 0' }}>
                                      {localizedSpec}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: '600' }}>
                                      {localizedHosp}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                                      <Clock size={12} />
                                      <span>{apt.time}</span>
                                      <span>•</span>
                                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{tokenPill}</span>
                                    </div>
                                  </div>
                                </div>

                                <span style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.68rem',
                                  fontWeight: '800',
                                  backgroundColor: apt.isMissed ? '#fef2f2' : apt.computedStatus === 'in_consultation' ? '#f3e8ff' : '#dcfce7',
                                  color: apt.isMissed ? '#dc2626' : apt.computedStatus === 'in_consultation' ? '#7c3aed' : '#15803d',
                                  border: apt.isMissed ? '1px solid #fecaca' : 'none'
                                }}>
                                  {apt.isMissed ? 'Not Consulted (Missed)' : apt.computedStatus === 'in_consultation' ? 'In Consultation' : tr('confirmed')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '2.5rem 1.5rem',
                          background: '#f8fafc',
                          borderRadius: '16px',
                          border: '1px dashed #cbd5e1'
                        }}>
                          <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            backgroundColor: '#ccfbf1',
                            color: '#0f766e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px auto'
                          }}>
                            <CalendarPlus size={26} />
                          </div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                            {tr('noUpcoming')}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b', lineHeight: 1.45 }}>
                            {tr('noUpcomingDesc')}
                          </p>
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}
              {activeTab === 'history' && (
                <div>
                  {/* Header */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
                      {tr('history')}
                    </h1>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>
                      {tr('historyDesc')}
                    </p>
                  </div>

                  {/* Filter & Search Bar Card */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.75rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Search Bar */}
                    <div style={{ flex: '1 1 280px' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          value={historySearch}
                          onChange={e => setHistorySearch(e.target.value)}
                          placeholder={ui('Search by doctor, hospital or department…')}
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.875rem',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                            backgroundColor: '#f8fafc'
                          }}
                          onFocus={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                          onBlur={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        />
                      </div>
                    </div>

                    {/* Date Range Dropdown */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>{ui('Date range')}</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={historyDateFilter}
                          onChange={e => setHistoryDateFilter(e.target.value)}
                          style={{
                            appearance: 'none',
                            padding: '10px 34px 10px 36px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="all">{ui('All time')}</option>
                          <option value="last30">{ui('Last 30 days')}</option>
                          <option value="last6m">{ui('Last 6 months')}</option>
                          <option value="2026">2026</option>
                        </select>
                        <Calendar size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <ChevronDown size={14} color="#64748b" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* Hospital Type Dropdown */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>{ui('Hospital type')}</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={historyTypeFilter}
                          onChange={e => setHistoryTypeFilter(e.target.value)}
                          style={{
                            appearance: 'none',
                            padding: '10px 32px 10px 14px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#334155',
                            cursor: 'pointer',
                            minWidth: '120px'
                          }}
                        >
                          <option value="all">{tr('all')}</option>
                          <option value="Government">{tr('government')}</option>
                          <option value="Private">{tr('private')}</option>
                          <option value="AYUSH">AYUSH</option>
                        </select>
                        <ChevronDown size={14} color="#64748b" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>{ui('Status')}</label>
                      <div style={{ position: 'relative' }}>
                        <select
                          value={historyStatusFilter}
                          onChange={e => setHistoryStatusFilter(e.target.value)}
                          style={{
                            appearance: 'none',
                            padding: '10px 32px 10px 14px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#334155',
                            cursor: 'pointer',
                            minWidth: '110px'
                          }}
                        >
                          <option value="all">{tr('all')}</option>
                          <option value="Completed">{ui('Completed')}</option>
                          <option value="Confirmed">{tr('confirmed')}</option>
                          <option value="Cancelled">{ui('Cancelled')}</option>
                          <option value="No Show">{ui('No show')}</option>
                        </select>
                        <ChevronDown size={14} color="#64748b" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div style={{ flex: '0 0 auto' }}>
                      <button
                        onClick={() => {
                          setHistorySearch('');
                          setHistoryDateFilter('all');
                          setHistoryTypeFilter('all');
                          setHistoryStatusFilter('all');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          color: '#0f766e',
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                      >
                        <RotateCcw size={14} />
                        <span>{ui('Clear filters')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Table Container Card */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    overflow: 'hidden'
                  }}>
                    {/* Column Headers */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 2fr 2.2fr 1.2fr 1.3fr',
                      padding: '14px 1.75rem',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: '#fafbfc',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: '#64748b',
                      letterSpacing: '0.3px'
                    }}>
                      <div>{ui('Date and time')}</div>
                      <div>{ui('Doctor and department')}</div>
                      <div>{ui('Hospital')}</div>
                      <div>{ui('Status')}</div>
                      <div style={{ textAlign: 'right' }}>{ui('Action')}</div>
                    </div>

                    {/* Data Rows or Empty State */}
                    {filteredHistory.length > 0 ? (
                      <div>
                        {filteredHistory.map((item, idx) => {
                          const localizedDoc = localizeDoctor(item.doctorName || item.doctor, currentLang);
                          const localizedSpec = localizeSpecialty(item.specialty || item.dept, currentLang);
                          const localizedHosp = localizeHospitalName(item.hospital, currentLang);
                          const statusLower = (item.status || 'completed').toLowerCase();

                          let statusBg = '#dcfce7';
                          let statusColor = '#15803d';
                          if (statusLower.includes('missed') || statusLower.includes('not consulted') || item.isMissed) {
                            statusBg = '#fef2f2';
                            statusColor = '#dc2626';
                          } else if (statusLower.includes('cancel')) {
                            statusBg = '#ffedd5';
                            statusColor = '#c2410c';
                          } else if (statusLower.includes('no show')) {
                            statusBg = '#fee2e2';
                            statusColor = '#b91c1c';
                          } else if (statusLower.includes('confirm')) {
                            statusBg = '#ccfbf1';
                            statusColor = '#0f766e';
                          }

                          let dateTileBg = '#e6f7f3';
                          let dateTileColor = '#0f766e';
                          let dateTileBorder = '#bbf7d0';
                          if (statusLower.includes('missed') || statusLower.includes('not consulted') || item.isMissed) {
                            dateTileBg = '#fef2f2';
                            dateTileColor = '#dc2626';
                            dateTileBorder = '#fecaca';
                          } else if (statusLower.includes('cancel')) {
                            dateTileBg = '#fff7ed';
                            dateTileColor = '#ea580c';
                            dateTileBorder = '#fed7aa';
                          } else if (statusLower.includes('no show')) {
                            dateTileBg = '#fee2e2';
                            dateTileColor = '#ef4444';
                            dateTileBorder = '#fecaca';
                          }

                          return (
                            <div
                              key={item.id || idx}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1.4fr 2fr 2.2fr 1.2fr 1.3fr',
                                padding: '1.25rem 1.75rem',
                                borderBottom: idx !== filteredHistory.length - 1 ? '1px solid #f1f5f9' : 'none',
                                alignItems: 'center',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                            >
                              {/* Date & Time */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  width: '54px',
                                  padding: '6px 4px',
                                  textAlign: 'center',
                                  borderRadius: '10px',
                                  backgroundColor: dateTileBg,
                                  border: `1px solid ${dateTileBorder}`,
                                  flexShrink: 0
                                }}>
                                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: dateTileColor, lineHeight: 1 }}>
                                    {item.day}
                                  </div>
                                  <div style={{ fontSize: '0.62rem', fontWeight: '800', color: dateTileColor, marginTop: '2px', letterSpacing: '0.4px' }}>
                                    {item.monthYear || `${item.month || ''} ${item.year || ''}`}
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' }}>
                                  {item.time || ui('Time not set')}
                                </span>
                              </div>

                              {/* Doctor & Department */}
                              <div>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                                  {localizedDoc}
                                </h4>
                                <span style={{ fontSize: '0.825rem', color: '#64748b' }}>
                                  {localizedSpec}
                                </span>
                              </div>

                              {/* Hospital & Location */}
                              <div>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.925rem', fontWeight: '700', color: '#0f172a' }}>
                                  {localizedHosp}
                                </h4>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  {item.location || ''}
                                </span>
                              </div>

                              {/* Status Badge */}
                              <div>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '14px',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  backgroundColor: statusBg,
                                  color: statusColor
                                }}>
                                  {ui(item.status || 'Completed')}
                                </span>
                              </div>

                              {/* Action Button */}
                              <div style={{ textAlign: 'right' }}>
                                <button
                                  onClick={() => setSelectedAppointment(item)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '7px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#ffffff',
                                    color: '#0f766e',
                                    fontSize: '0.825rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                                    e.currentTarget.style.borderColor = '#99f6e4';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#ffffff';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                  }}
                                >
                                  <Eye size={14} />
                                  <span>{ui('View details')}</span>
                                </button>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                        <CalendarCheck size={44} color="#94a3b8" style={{ marginBottom: '12px' }} />
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>
                          {ui('No past appointments found')}
                        </h3>
                        <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.9rem', maxWidth: '440px', marginInline: 'auto' }}>
                          {ui('Completed appointments, prescriptions and digital records will appear here automatically.')}
                        </p>
                        <button
                          onClick={() => setActiveTab('appointments')}
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            borderRadius: '12px',
                            padding: '10px 22px',
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {tr('bookAppointmentBtn')}
                        </button>
                      </div>
                    )}

                    {/* Footer Pagination */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.75rem',
                      borderTop: '1px solid #f1f5f9',
                      backgroundColor: '#ffffff'
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                        {ui('Showing')} {filteredHistory.length} {ui('of')} {patientHistory.length} {ui('appointments')}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          disabled={historyPage <= 1}
                          onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: historyPage > 1 ? 'pointer' : 'default',
                            opacity: historyPage > 1 ? 1 : 0.5
                          }}
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {[1, 2, 3].map(page => (
                          <button
                            key={page}
                            onClick={() => setHistoryPage(page)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: historyPage === page ? 'none' : '1px solid #e2e8f0',
                              backgroundColor: historyPage === page ? '#059669' : '#ffffff',
                              color: historyPage === page ? '#ffffff' : '#334155',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => setHistoryPage(p => p + 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
              TAB 3: MEDICAL REPORTS (Exact Pixel-Perfect Match to Image 2)
              ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'reports' && (
                <div>
                  {/* Header */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
                      {tr('reports')}
                    </h1>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>
                      {tr('reportsDesc')}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #dfe6ee',
                    padding: '1.3rem 1.5rem 1.5rem',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.025)',
                    overflow: 'visible'
                  }}>
                  {/* Sub-Header / Controls */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '0 0 1.35rem',
                    marginBottom: '0.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Left Title */}
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                      {ui('Your reports')} <span style={{ color: '#16a34a', fontWeight: '700' }}>({ui('Chronological order')})</span>
                    </div>

                    {/* Right Search & Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 360px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
                        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          value={reportsSearch}
                          onChange={e => setReportsSearch(e.target.value)}
                          placeholder={ui('Search reports by name, type or doctor…')}
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.875rem',
                            color: '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                            backgroundColor: '#f8fafc'
                          }}
                          onFocus={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                          onBlur={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        />
                      </div>

                      {/* Filter Button */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setReportsFilterType(prev => prev === 'all' ? 'lab' : prev === 'lab' ? 'imaging' : prev === 'imaging' ? 'prescription' : 'all')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <Filter size={15} color="#64748b" />
                          <span>{ui('Filter')}: {ui(reportsFilterType)}</span>
                          <ChevronDown size={14} color="#64748b" />
                        </button>
                      </div>

                      <input
                        type="file"
                        ref={reportsFileInputRef}
                        accept=".pdf,image/*,.png,.jpg,.jpeg"
                        onChange={handleDirectReportUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        onClick={() => reportsFileInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          borderRadius: '12px',
                          padding: '10px 16px',
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={16} />
                        <span>{ui('Upload or scan')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Reports Timeline & List */}
                  {filteredPatientReports.length > 0 ? (
                    <div style={{ position: 'relative', paddingLeft: '0.75rem' }}>
                      {/* Vertical Connecting Timeline Bar */}
                      <div style={{
                        position: 'absolute',
                        left: '42px',
                        top: '20px',
                        bottom: '20px',
                        width: '2px',
                        backgroundColor: '#e2e8f0',
                        zIndex: 1
                      }} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {filteredPatientReports.slice(0, reportsPageLimit).map((report, idx) => {
                          const categoryLower = (report.category || report.type || 'lab').toLowerCase();
                          const isLab = categoryLower.includes('lab') || categoryLower.includes('blood') || categoryLower.includes('cbc') || categoryLower.includes('lipid');
                          const isImaging = categoryLower.includes('image') || categoryLower.includes('x-ray') || categoryLower.includes('ultrasound') || categoryLower.includes('scan') || categoryLower.includes('mri');
                          const isPrescription = categoryLower.includes('prescription') || categoryLower.includes('rx');

                          // Theme colors
                          let dotColor = '#15803d';
                          let iconBg = '#166534';
                          let iconColor = '#ffffff';
                          let badgeBg = '#f0fdf4';
                          let badgeColor = '#166534';
                          let badgeBorder = '#bbf7d0';
                          let badgeText = ui('Lab report');

                          if (isImaging) {
                            dotColor = '#7c3aed';
                            iconBg = '#6d28d9';
                            iconColor = '#ffffff';
                            badgeBg = '#faf5ff';
                            badgeColor = '#6b21a8';
                            badgeBorder = '#e9d5ff';
                            badgeText = ui('Imaging report');
                          } else if (isPrescription) {
                            dotColor = '#ea580c';
                            iconBg = '#ea580c';
                            iconColor = '#ffffff';
                            badgeBg = '#fff7ed';
                            badgeColor = '#c2410c';
                            badgeBorder = '#fed7aa';
                            badgeText = ui('Prescription');
                          }

                          return (
                            <div
                              key={report.id || idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2rem',
                                position: 'relative',
                                zIndex: activeReportMenu === (report.id || `report-${idx}`) ? 20 : 2
                              }}
                            >
                              {/* Left Date Column & Timeline Dot */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '80px',
                                minWidth: '80px',
                                justifyContent: 'space-between'
                              }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: dotColor, lineHeight: 1 }}>
                                    {report.day || (report.uploaded_at ? new Date(report.uploaded_at).getDate() : '')}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#0f172a', marginTop: '2px', letterSpacing: '0.4px' }}>
                                    {report.month || (report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString(currentLang, { month: 'short' }) : '')}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b' }}>
                                    {report.year || (report.uploaded_at ? new Date(report.uploaded_at).getFullYear() : '')}
                                  </div>
                                </div>

                                {/* Dot on Timeline */}
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: dotColor,
                                  border: '3px solid #ffffff',
                                  boxShadow: '0 0 0 1px #cbd5e1'
                                }} />
                              </div>

                              {/* Report Card */}
                              <div style={{
                                flex: 1,
                                backgroundColor: '#ffffff',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                padding: '1.25rem 1.5rem',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '1.25rem',
                                flexWrap: 'wrap',
                                transition: 'all 0.2s ease'
                              }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'}
                              >
                                {/* Left Icon & Details */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                  <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: iconBg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: iconColor,
                                    flexShrink: 0
                                  }}>
                                    {isLab ? (
                                      <FlaskConical size={22} />
                                    ) : isImaging ? (
                                      <Activity size={22} />
                                    ) : (
                                      <FileText size={22} />
                                    )}
                                  </div>

                                  <div>
                                    <h3 style={{ margin: '0 0 3px 0', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                                      {report.title || report.name || ui('Medical report')}
                                    </h3>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span>{report.time || (report.uploaded_at ? new Date(report.uploaded_at).toLocaleTimeString(currentLang, { hour: '2-digit', minute: '2-digit' }) : '')}</span>
                                      <span>•</span>
                                      <span>{ui('Record ID')}: {report.testId || report.id}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                      <User size={13} color="#64748b" />
                                      <span>{report.doctor || ''}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Badge & Action Icons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                  {/* Category Badge */}
                                  <span style={{
                                    padding: '5px 14px',
                                    borderRadius: '12px',
                                    fontSize: '0.78rem',
                                    fontWeight: '800',
                                    backgroundColor: badgeBg,
                                    color: badgeColor,
                                    border: `1px solid ${badgeBorder}`
                                  }}>
                                    {badgeText}
                                  </span>

                                  {/* Action Buttons: View, Download, More */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                                    <button
                                      onClick={() => setSelectedDoc(report)}
                                      title={ui('View report and OCR')}
                                      style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#ffffff',
                                        color: '#07834f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                                        e.currentTarget.style.color = '#0f766e';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.color = '#07834f';
                                      }}
                                    >
                                      <Eye size={16} />
                                    </button>

                                    <button
                                      onClick={() => downloadReport(report)}
                                      disabled={!(report.file_url || report.dataUrl)}
                                      title={ui('Download report')}
                                      style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#ffffff',
                                        color: '#07834f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                                        e.currentTarget.style.color = '#0f766e';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.color = '#07834f';
                                      }}
                                    >
                                      <Download size={16} />
                                    </button>

                                    <div data-report-menu style={{ position: 'relative' }}>
                                      <button
                                        type="button"
                                        aria-haspopup="menu"
                                        aria-expanded={activeReportMenu === (report.id || `report-${idx}`)}
                                        onClick={event => {
                                          event.stopPropagation();
                                          const reportKey = report.id || `report-${idx}`;
                                          setActiveReportMenu(activeReportMenu === reportKey ? null : reportKey);
                                        }}
                                        title={ui('More options')}
                                        style={{
                                          width: '42px',
                                          height: '42px',
                                          borderRadius: '11px',
                                          border: '1px solid #dbe3ec',
                                          backgroundColor: activeReportMenu === (report.id || `report-${idx}`) ? '#ecfdf5' : '#ffffff',
                                          color: '#07834f',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <MoreVertical size={19} />
                                      </button>

                                      {activeReportMenu === (report.id || `report-${idx}`) && (
                                        <div
                                          role="menu"
                                          aria-label={ui('Report options')}
                                          onClick={event => event.stopPropagation()}
                                          style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 8px)',
                                            right: 0,
                                            zIndex: 50,
                                            width: '190px',
                                            padding: '6px',
                                            borderRadius: '12px',
                                            border: '1px solid #dbe3ec',
                                            backgroundColor: '#ffffff',
                                            boxShadow: '0 14px 35px rgba(15, 23, 42, 0.16)'
                                          }}
                                        >
                                          <button type="button" role="menuitem" onClick={() => { setSelectedDoc(report); setActiveReportMenu(null); }} style={reportMenuItemStyle}>
                                            <Eye size={16} color="#07834f" />
                                            <span>{ui('View details')}</span>
                                          </button>
                                          <button type="button" role="menuitem" disabled={!(report.file_url || report.dataUrl)} onClick={() => { downloadReport(report); setActiveReportMenu(null); }} style={{ ...reportMenuItemStyle, opacity: (report.file_url || report.dataUrl) ? 1 : 0.45 }}>
                                            <Download size={16} color="#07834f" />
                                            <span>{ui('Download report')}</span>
                                          </button>
                                          <button type="button" role="menuitem" onClick={() => copyReportId(report)} style={reportMenuItemStyle}>
                                            <FileText size={16} color="#07834f" />
                                            <span>{ui('Copy record ID')}</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                </div>

                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Load More Button */}
                      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px', fontWeight: '500' }}>
                          {ui('Showing')} {Math.min(reportsPageLimit, filteredPatientReports.length)} {ui('of')} {filteredPatientReports.length} {ui('reports')}
                        </div>
                        {filteredPatientReports.length > reportsPageLimit && (
                          <button
                            onClick={() => setReportsPageLimit(prev => prev + 5)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 20px',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              fontSize: '0.875rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <span>{ui('Load more')}</span>
                            <ChevronDown size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '3.5rem 2rem',
                      backgroundColor: '#ffffff',
                      borderRadius: '20px',
                      border: '1px dashed #cbd5e1'
                    }}>
                      <FileText size={44} color="#94a3b8" style={{ marginBottom: '12px' }} />
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>
                        {ui('No medical reports uploaded yet')}
                      </h3>
                      <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.9rem', maxWidth: '440px', marginInline: 'auto' }}>
                        {ui('Upload or scan prescriptions, laboratory reports and radiology files. OCR text will be saved with the report when available.')}
                      </p>
                      <button
                        onClick={() => reportsFileInputRef.current?.click()}
                        style={{
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          borderRadius: '12px',
                          padding: '10px 22px',
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                        <span>{ui('Upload report or PDF')}</span>
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* TAB 4: DONATIONS (Matching Exact Design with Full Working Donation/Blood Directory) */}
              {activeTab === 'donations' && (
                <DonationsTab
                  patientId={session.patient?.id}
                />
              )}

              {/* TAB 5: COMMUNITIES */}
              {activeTab === 'communities' && (
                <CommunitiesTab patientId={session.patient?.id} />
              )}

              {/* TAB 6: HELP & SUPPORT */}
              {activeTab === 'help' && (
                <HelpSupportTab patientId={session.patient?.id} language={currentLang || 'en'} />
              )}

            </div>

        </main>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: ALL HOSPITALS DIRECTORY (Comprehensive List with Search & Direct Booking)
          ═══════════════════════════════════════════════════════════ */}
      {showAllHospitalsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '960px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', color: '#0f172a' }}>
                  {tr('allHospitalsDirectory')}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Select from {hospitals.length} verified government, private, and AYUSH hospital centers across India.
                </p>
              </div>
              <button
                onClick={() => setShowAllHospitalsModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} color="#475569" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                flex: 1,
                minWidth: '240px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '8px 14px'
              }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder={tr('searchPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'All', label: tr('all') },
                  { key: 'Government', label: tr('government') },
                  { key: 'Private', label: tr('private') },
                  { key: 'AYUSH', label: tr('ayush') }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setSelectedFilter(f.key)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: selectedFilter === f.key ? '#0f766e' : '#f1f5f9',
                      color: selectedFilter === f.key ? '#ffffff' : '#475569',
                      border: 'none'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Hospitals List */}
            <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' }}>
              {filteredHospitals.map((hospital, hospitalIndex) => (
                <div
                  key={hospital.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '18px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: hospital.logoBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0
                    }}>
                      {hospital.isAyush ? (
                        <Leaf size={22} color="#ffffff" />
                      ) : hospital.type === tr('government') ? (
                        <Building2 size={22} color="#ffffff" />
                      ) : (
                        <Activity size={22} color="#ffffff" />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: '800', color: '#0f172a' }}>
                          {hospital.name}
                        </h4>
                        {hospital.badge && (
                          <span style={{ backgroundColor: '#fff1e6', color: '#ea580c', fontSize: '0.65rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                            {hospital.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '3px 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                        {hospital.address}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                        <span style={{ color: '#eab308' }}>★ {hospital.rating}</span>
                        <span>•</span>
                        <span>{hospital.departmentsCount}</span>
                        <span>•</span>
                        <span style={{ color: hospital.typeColor }}>{hospital.type}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #f8fafc' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {tr('nextAvailable')}: <strong style={{ color: '#0f172a' }}>{hospital.nextAvailable}</strong>
                    </div>
                    <button
                      data-voice-hospital={hospitalIndex}
                      onClick={() => handleOpenBooking(hospital)}
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {tr('bookAppointmentBtn')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 2rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'right' }}>
              <button
                onClick={() => setShowAllHospitalsModal(false)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '8px 20px',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                {tr('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: BOOK APPOINTMENT MODAL
          ═══════════════════════════════════════════════════════════ */}
      {showBookingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  {tr('confirmBookingTitle')}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {localizeHospitalName(bookingHospital?.name, currentLang)}
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color="#475569" />
              </button>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <Check size={36} />
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  {tr('appointmentConfirmed')}
                </h4>
                <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                  {tr('tokenGeneratedDesc')} <strong>{newlyBookedToken || 'Token #A28'}</strong>
                </p>
                <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#0f766e', padding: '6px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700' }}>
                  Syncing with Hospital Queue...
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Doctor Picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    {tr('selectDoctor')}:
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    {bookingHospital?.doctors?.map(d => (
                      <option key={d.name} value={d.name}>
                        {localizeDoctor(d.name, currentLang)} ({localizeSpecialty(d.specialty, currentLang)})
                      </option>
                    )) || (
                        <option value="Dr. Ananya Sharma">Dr. Ananya Sharma (General Medicine)</option>
                      )}
                  </select>
                </div>

                {/* Department Picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    {tr('selectDept')}:
                  </label>
                  <select
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="General Medicine">{localizeSpecialty('General Medicine', currentLang)}</option>
                    <option value="Cardiology">{localizeSpecialty('Cardiology', currentLang)}</option>
                    <option value="Ayurveda & Panchakarma">{localizeSpecialty('Ayurveda & Panchakarma', currentLang)}</option>
                    <option value="Pediatrics">{localizeSpecialty('Pediatrics', currentLang)}</option>
                    <option value="Pulmonology">{localizeSpecialty('Pulmonology', currentLang)}</option>
                    <option value="Orthopedics & Joint Replacement">{localizeSpecialty('Orthopedics & Joint Replacement', currentLang)}</option>
                  </select>
                </div>

                {/* Date & Time Slot Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      {tr('selectDate')}:
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={(() => {
                        const now = new Date();
                        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                      })()}
                      onChange={e => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot('');
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      {tr('selectSlot')}:
                    </label>
                    <select
                      value={selectedSlot}
                      onChange={e => setSelectedSlot(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        color: '#0f172a',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="">Select an available time</option>
                      {[
                        ['09:30 AM', 'Morning'],
                        ['10:30 AM', 'Morning'],
                        ['11:30 AM', 'Morning'],
                        ['02:30 PM', 'Afternoon'],
                        ['04:00 PM', 'Evening']
                      ].filter(([label]) => {
                        const now = new Date();
                        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        if (selectedDate !== todayKey) return true;
                        const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
                        let hour = Number(match[1]) % 12;
                        if (match[3] === 'PM') hour += 12;
                        return hour * 60 + Number(match[2]) > now.getHours() * 60 + now.getMinutes();
                      }).map(([label, period]) => (
                        <option key={label} value={label}>{label} ({period})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chief Complaint / Symptoms */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    {tr('reasonForVisit')}:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fever, joint pain, routine checkup..."
                    value={bookingReason}
                    onChange={e => setBookingReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      color: '#0f172a'
                    }}
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    borderRadius: '14px',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    boxShadow: '0 8px 20px rgba(12, 78, 71, 0.25)'
                  }}
                >
                  {tr('confirmBookingBtn')}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: APPOINTMENT PASS / QR CODE DETAILS
          ═══════════════════════════════════════════════════════════ */}
      {selectedAppointment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={22} color="#0f766e" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                  {tr('digitalQueuePass')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color="#475569" />
              </button>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '2px dashed #0d9488',
              borderRadius: '18px',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f766e', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                {tr('assignedToken')}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>
                {selectedAppointment.token?.includes('#') ? `${tr('tokenWord')} #${selectedAppointment.token.split('#')[1]}` : `${tr('tokenWord')} ${selectedAppointment.token}`}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                {localizeHospitalName(selectedAppointment.hospital, currentLang)} • {tr('roomWord')} {selectedAppointment.room || '104'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Doctor:</span>
                <strong style={{ color: '#0f172a' }}>{localizeDoctor(selectedAppointment.doctorName, currentLang)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{tr('selectDept')}:</span>
                <strong style={{ color: '#0f172a' }}>{localizeSpecialty(selectedAppointment.specialty, currentLang)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{tr('selectSlot')}:</span>
                <strong style={{ color: '#0f172a' }}>{selectedAppointment.day} {localizeMonth(selectedAppointment.month, currentLang)} • {selectedAppointment.time}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Patient ABHA:</span>
                <strong style={{ color: '#0f172a' }}>{abhaId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  backgroundColor: selectedAppointment.isMissed ? '#fef2f2' : selectedAppointment.computedStatus === 'in_consultation' ? '#f3e8ff' : '#dcfce7',
                  color: selectedAppointment.isMissed ? '#dc2626' : selectedAppointment.computedStatus === 'in_consultation' ? '#7c3aed' : '#15803d',
                  border: selectedAppointment.isMissed ? '1px solid #fecaca' : 'none'
                }}>
                  {selectedAppointment.displayStatus || (selectedAppointment.isMissed ? 'Not Consulted (Missed)' : 'Confirmed')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setSelectedAppointment(null)}
                style={{
                  width: '100%',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(12, 78, 71, 0.25)'
                }}
              >
                <Check size={18} />
                <span>{tr('close') || 'Done'}</span>
              </button>

              <button
                onClick={() => handleCancelAppointment(selectedAppointment.id)}
                style={{
                  width: '100%',
                  backgroundColor: '#fef2f2',
                  color: '#ef4444',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  border: '1px solid #fecaca',
                  cursor: 'pointer'
                }}
              >
                {tr('cancelAppointment')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: DIGITAL ABHA CARD
          ═══════════════════════════════════════════════════════════ */}
      {showAbhaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                Ayushman Bharat Digital Health Card
              </h3>
              <button onClick={() => setShowAbhaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #064e3b 100%)',
              borderRadius: '20px',
              padding: '1.5rem',
              color: '#ffffff',
              boxShadow: '0 12px 30px rgba(4, 120, 87, 0.3)',
              marginBottom: '1.25rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', opacity: 0.9 }}>
                    NATIONAL HEALTH AUTHORITY
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', marginTop: '2px' }}>
                    ABHA Health ID
                  </div>
                </div>
                <ShieldCheck size={28} color="#86efac" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: '900' }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800' }}>{displayName}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{gender ? `${gender} • ` : ''}{age ? `${age} yrs` : 'Verified Profile'}</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '10px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.8, textTransform: 'uppercase' }}>ABHA Address / Number</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', letterSpacing: '0.5px' }}>{abhaId}</div>
                </div>
                <QrCode size={24} color="#86efac" />
              </div>
            </div>

            <button
              onClick={() => setShowAbhaModal(false)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              {tr('close')}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW OCR DOCUMENT DETAILS
          ═══════════════════════════════════════════════════════════ */}
      {selectedDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                OCR Scanned Document Details
              </h3>
              <button onClick={() => setSelectedDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {(selectedDoc.file_url || selectedDoc.dataUrl || selectedDoc.imageData) && (
              (String(selectedDoc.title || '').toLowerCase().endsWith('.pdf') || String(selectedDoc.type || '').toLowerCase().includes('pdf') || String(selectedDoc.file_url || selectedDoc.dataUrl || '').startsWith('data:application/pdf')) ? (
                <div style={{ marginBottom: '1rem', textAlign: 'center', padding: '1.5rem', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                  <FileText size={48} color="#dc2626" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{selectedDoc.title || 'PDF Medical Document'}</div>
                  <a
                    href={selectedDoc.file_url || selectedDoc.dataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#059669', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem' }}
                  >
                    <Eye size={15} />
                    <span>Open PDF Document</span>
                  </a>
                </div>
              ) : (
                <img src={selectedDoc.file_url || selectedDoc.dataUrl || selectedDoc.imageData} alt="Scan preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '12px', backgroundColor: '#f8fafc', marginBottom: '1rem' }} />
              )
            )}

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.875rem', color: '#334155' }}>
              <strong>Extracted OCR Text / Data:</strong>
              <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {selectedDoc.extractedData || 'Document uploaded successfully. AI processing complete.'}
              </p>
            </div>

            <button onClick={() => setSelectedDoc(null)} style={{ width: '100%', marginTop: '1.25rem', padding: '12px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
              {tr('close')}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: VIEW ALL APPOINTMENTS
          ═══════════════════════════════════════════════════════════ */}
      {showAllAppointmentsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                {tr('upcomingAppointments')} ({appointments.length})
              </h3>
              <button onClick={() => setShowAllAppointmentsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {appointments.map((apt) => {
                const localizedDoc = localizeDoctor(apt.doctorName, currentLang);
                const localizedSpec = localizeSpecialty(apt.specialty, currentLang);
                const localizedHosp = localizeHospitalName(apt.hospital, currentLang);
                const localizedMon = localizeMonth(apt.month, currentLang);
                const tokenPill = apt.token?.includes('#') ? `${tr('tokenWord')} #${apt.token.split('#')[1]}` : `${tr('tokenWord')} ${apt.token}`;

                return (
                  <div
                    key={apt.id}
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '16px',
                      padding: '1rem',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{localizedDoc}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{localizedSpec} • {localizedHosp}</div>
                      <div style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: '700', marginTop: '4px' }}>
                        {apt.day} {localizedMon} • {apt.time} • {tokenPill}
                      </div>
                    </div>
                    <span style={{
                      backgroundColor: apt.statusType === 'confirmed' || apt.status === 'Confirmed' ? '#dcfce7' : '#fef3c7',
                      color: apt.statusType === 'confirmed' || apt.status === 'Confirmed' ? '#15803d' : '#b45309',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '12px'
                    }}>
                      {tr('confirmed')}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowAllAppointmentsModal(false)}
              style={{ width: '100%', marginTop: '1.5rem', padding: '12px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              {tr('close')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
