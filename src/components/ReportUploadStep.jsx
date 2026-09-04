import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  FileText,
  CheckCircle,
  Trash2,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  X,
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';
import OCRProcessor from '../engine/OCRProcessor';

const REPORT_COPY = {
  en:{title:'Upload previous medical reports',subtitle:'This helps the doctor understand your health history.',scan:'Scan report',scanDesc:'Use the camera to scan reports and documents.',start:'Start scanning',or:'or',upload:'Upload from device',uploadDesc:'Choose reports from your phone or computer.',choose:'Choose files',attached:'Attached medical documents',doctorFile:'Will be attached to the doctor’s appointment file.',safe:'Your files are stored for this appointment and available through the clinical workflow.',formats:'Supported: PDF, JPG, PNG · Maximum 5 MB per file',cameraError:'Camera permission was not granted or the camera is unavailable. You can choose a photo instead.',initializing:'Initializing camera…',capture:'Capture document',view:'View document',remove:'Remove',previous:'Previous',next:'Next'},
  hi:{title:'पिछली मेडिकल रिपोर्ट अपलोड करें',subtitle:'इससे डॉक्टर आपकी स्वास्थ्य जानकारी बेहतर समझ सकेंगे।',scan:'रिपोर्ट स्कैन करें',scanDesc:'रिपोर्ट और दस्तावेज़ स्कैन करने के लिए कैमरा उपयोग करें।',start:'स्कैन शुरू करें',or:'या',upload:'डिवाइस से अपलोड करें',uploadDesc:'फोन या कंप्यूटर से रिपोर्ट चुनें।',choose:'फाइल चुनें',attached:'संलग्न मेडिकल दस्तावेज़',doctorFile:'डॉक्टर की अपॉइंटमेंट फाइल से जोड़ा जाएगा।',safe:'आपकी फाइलें इस अपॉइंटमेंट के लिए संग्रहित होकर क्लिनिकल कार्यप्रवाह में उपलब्ध रहेंगी।',formats:'समर्थित: PDF, JPG, PNG · प्रति फाइल अधिकतम 5 MB',cameraError:'कैमरा अनुमति नहीं मिली या कैमरा उपलब्ध नहीं है। आप फोटो चुन सकते हैं।',initializing:'कैमरा शुरू हो रहा है…',capture:'दस्तावेज़ कैप्चर करें',view:'दस्तावेज़ देखें',remove:'हटाएँ',previous:'पिछला',next:'अगला'},
  ta:{title:'முந்தைய மருத்துவ அறிக்கைகளை பதிவேற்றவும்',subtitle:'உங்கள் உடல்நல வரலாற்றை மருத்துவர் புரிந்துகொள்ள இது உதவும்.',scan:'அறிக்கையை ஸ்கேன் செய்',scanDesc:'அறிக்கைகள் மற்றும் ஆவணங்களை கேமராவில் ஸ்கேன் செய்யவும்.',start:'ஸ்கேன் தொடங்கு',or:'அல்லது',upload:'சாதனத்திலிருந்து பதிவேற்று',uploadDesc:'தொலைபேசி அல்லது கணினியிலிருந்து அறிக்கைகளைத் தேர்ந்தெடுக்கவும்.',choose:'கோப்புகளைத் தேர்ந்தெடு',attached:'இணைக்கப்பட்ட மருத்துவ ஆவணங்கள்',doctorFile:'மருத்துவரின் முன்பதிவு கோப்பில் இணைக்கப்படும்.',safe:'இந்த முன்பதிவிற்காக கோப்புகள் சேமிக்கப்பட்டு மருத்துவ செயல்முறையில் கிடைக்கும்.',formats:'ஆதரவு: PDF, JPG, PNG · ஒரு கோப்பிற்கு அதிகபட்சம் 5 MB',cameraError:'கேமரா அனுமதி இல்லை அல்லது கேமரா கிடைக்கவில்லை. பதிலாக படம் தேர்ந்தெடுக்கலாம்.',initializing:'கேமரா தொடங்குகிறது…',capture:'ஆவணத்தைப் படம் பிடி',view:'ஆவணத்தைப் பார்',remove:'நீக்கு',previous:'முந்தையது',next:'அடுத்து'},
  te:{title:'మునుపటి వైద్య నివేదికలను అప్‌లోడ్ చేయండి',subtitle:'మీ ఆరోగ్య చరిత్రను డాక్టర్ అర్థం చేసుకోవడానికి ఇది సహాయపడుతుంది.',scan:'నివేదిక స్కాన్ చేయండి',scanDesc:'నివేదికలు, పత్రాలను కెమెరాతో స్కాన్ చేయండి.',start:'స్కానింగ్ ప్రారంభించండి',or:'లేదా',upload:'పరికరం నుండి అప్‌లోడ్',uploadDesc:'ఫోన్ లేదా కంప్యూటర్ నుండి నివేదికలను ఎంచుకోండి.',choose:'ఫైళ్లు ఎంచుకోండి',attached:'జోడించిన వైద్య పత్రాలు',doctorFile:'డాక్టర్ అపాయింట్‌మెంట్ ఫైల్‌కు జోడించబడుతుంది.',safe:'మీ ఫైళ్లు ఈ అపాయింట్‌మెంట్ కోసం నిల్వై క్లినికల్ ప్రక్రియలో అందుబాటులో ఉంటాయి.',formats:'మద్దతు: PDF, JPG, PNG · ఒక్క ఫైల్ గరిష్ఠం 5 MB',cameraError:'కెమెరా అనుమతి లేదు లేదా అందుబాటులో లేదు. బదులుగా ఫోటో ఎంచుకోండి.',initializing:'కెమెరా ప్రారంభమవుతోంది…',capture:'పత్రాన్ని క్యాప్చర్ చేయండి',view:'పత్రం చూడండి',remove:'తొలగించండి',previous:'మునుపటి',next:'తర్వాత'},
  bn:{title:'আগের মেডিকেল রিপোর্ট আপলোড করুন',subtitle:'এটি ডাক্তারকে আপনার স্বাস্থ্য ইতিহাস বুঝতে সাহায্য করে।',scan:'রিপোর্ট স্ক্যান করুন',scanDesc:'ক্যামেরা দিয়ে রিপোর্ট ও নথি স্ক্যান করুন।',start:'স্ক্যান শুরু করুন',or:'অথবা',upload:'ডিভাইস থেকে আপলোড',uploadDesc:'ফোন বা কম্পিউটার থেকে রিপোর্ট বেছে নিন।',choose:'ফাইল বেছে নিন',attached:'সংযুক্ত মেডিকেল নথি',doctorFile:'ডাক্তারের অ্যাপয়েন্টমেন্ট ফাইলে যুক্ত হবে।',safe:'ফাইলগুলো এই অ্যাপয়েন্টমেন্টের জন্য সংরক্ষিত হয়ে ক্লিনিক্যাল প্রক্রিয়ায় পাওয়া যাবে।',formats:'সমর্থিত: PDF, JPG, PNG · প্রতি ফাইল সর্বোচ্চ 5 MB',cameraError:'ক্যামেরা অনুমতি নেই বা ক্যামেরা পাওয়া যাচ্ছে না। পরিবর্তে ছবি বেছে নিন।',initializing:'ক্যামেরা চালু হচ্ছে…',capture:'নথির ছবি তুলুন',view:'নথি দেখুন',remove:'মুছুন',previous:'আগের',next:'পরবর্তী'},
  mr:{title:'मागील वैद्यकीय अहवाल अपलोड करा',subtitle:'यामुळे डॉक्टरांना तुमचा आरोग्य इतिहास समजण्यास मदत होते.',scan:'अहवाल स्कॅन करा',scanDesc:'कॅमेराने अहवाल आणि कागदपत्रे स्कॅन करा.',start:'स्कॅन सुरू करा',or:'किंवा',upload:'डिव्हाइसवरून अपलोड',uploadDesc:'फोन किंवा संगणकातून अहवाल निवडा.',choose:'फाइल निवडा',attached:'जोडलेली वैद्यकीय कागदपत्रे',doctorFile:'डॉक्टरांच्या अपॉइंटमेंट फाइलला जोडले जाईल.',safe:'तुमच्या फाइल्स या अपॉइंटमेंटसाठी साठवल्या जातात आणि क्लिनिकल प्रक्रियेत उपलब्ध असतात.',formats:'समर्थित: PDF, JPG, PNG · प्रति फाइल कमाल 5 MB',cameraError:'कॅमेरा परवानगी मिळाली नाही किंवा उपलब्ध नाही. त्याऐवजी फोटो निवडा.',initializing:'कॅमेरा सुरू होत आहे…',capture:'कागदपत्र कॅप्चर करा',view:'कागदपत्र पहा',remove:'काढा',previous:'मागील',next:'पुढील'},
  gu:{title:'અગાઉના મેડિકલ રિપોર્ટ અપલોડ કરો',subtitle:'આ ડૉક્ટરને તમારો આરોગ્ય ઇતિહાસ સમજવામાં મદદ કરે છે.',scan:'રિપોર્ટ સ્કેન કરો',scanDesc:'કેમેરાથી રિપોર્ટ અને દસ્તાવેજ સ્કેન કરો.',start:'સ્કેન શરૂ કરો',or:'અથવા',upload:'ડિવાઇસથી અપલોડ',uploadDesc:'ફોન અથવા કમ્પ્યુટરથી રિપોર્ટ પસંદ કરો.',choose:'ફાઇલ પસંદ કરો',attached:'જોડેલા મેડિકલ દસ્તાવેજો',doctorFile:'ડૉક્ટરની એપોઇન્ટમેન્ટ ફાઇલમાં જોડાશે.',safe:'ફાઇલો આ એપોઇન્ટમેન્ટ માટે સંગ્રહિત થઈ ક્લિનિકલ પ્રક્રિયામાં ઉપલબ્ધ રહેશે.',formats:'સમર્થિત: PDF, JPG, PNG · દરેક ફાઇલ મહત્તમ 5 MB',cameraError:'કેમેરાની મંજૂરી મળી નથી અથવા ઉપલબ્ધ નથી. તેના બદલે ફોટો પસંદ કરો.',initializing:'કેમેરા શરૂ થાય છે…',capture:'દસ્તાવેજ કૅપ્ચર કરો',view:'દસ્તાવેજ જુઓ',remove:'દૂર કરો',previous:'પાછળ',next:'આગળ'},
  kn:{title:'ಹಿಂದಿನ ವೈದ್ಯಕೀಯ ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',subtitle:'ಇದು ನಿಮ್ಮ ಆರೋಗ್ಯ ಇತಿಹಾಸವನ್ನು ವೈದ್ಯರು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.',scan:'ವರದಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',scanDesc:'ಕ್ಯಾಮೆರಾದಿಂದ ವರದಿ ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',start:'ಸ್ಕ್ಯಾನಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ',or:'ಅಥವಾ',upload:'ಸಾಧನದಿಂದ ಅಪ್‌ಲೋಡ್',uploadDesc:'ಫೋನ್ ಅಥವಾ ಕಂಪ್ಯೂಟರ್‌ನಿಂದ ವರದಿ ಆಯ್ಕೆ ಮಾಡಿ.',choose:'ಫೈಲ್ ಆಯ್ಕೆ',attached:'ಲಗತ್ತಿಸಿದ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು',doctorFile:'ವೈದ್ಯರ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಫೈಲ್‌ಗೆ ಲಗತ್ತಿಸಲಾಗುತ್ತದೆ.',safe:'ನಿಮ್ಮ ಫೈಲ್‌ಗಳು ಈ ಅಪಾಯಿಂಟ್ಮೆಂಟ್‌ಗಾಗಿ ಸಂಗ್ರಹವಾಗಿ ಕ್ಲಿನಿಕಲ್ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿ ಲಭ್ಯವಿರುತ್ತವೆ.',formats:'ಬೆಂಬಲಿತ: PDF, JPG, PNG · ಪ್ರತಿ ಫೈಲ್ ಗರಿಷ್ಠ 5 MB',cameraError:'ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ಇಲ್ಲ ಅಥವಾ ಲಭ್ಯವಿಲ್ಲ. ಬದಲಿಗೆ ಚಿತ್ರ ಆಯ್ಕೆ ಮಾಡಿ.',initializing:'ಕ್ಯಾಮೆರಾ ಆರಂಭವಾಗುತ್ತಿದೆ…',capture:'ದಾಖಲೆ ಸೆರೆಹಿಡಿಯಿರಿ',view:'ದಾಖಲೆ ನೋಡಿ',remove:'ತೆಗೆದುಹಾಕಿ',previous:'ಹಿಂದೆ',next:'ಮುಂದೆ'},
  ml:{title:'മുൻ മെഡിക്കൽ റിപ്പോർട്ടുകൾ അപ്‌ലോഡ് ചെയ്യുക',subtitle:'നിങ്ങളുടെ ആരോഗ്യ ചരിത്രം മനസ്സിലാക്കാൻ ഇത് ഡോക്ടറെ സഹായിക്കുന്നു.',scan:'റിപ്പോർട്ട് സ്കാൻ ചെയ്യുക',scanDesc:'ക്യാമറ ഉപയോഗിച്ച് റിപ്പോർട്ടുകളും രേഖകളും സ്കാൻ ചെയ്യുക.',start:'സ്കാൻ ആരംഭിക്കുക',or:'അല്ലെങ്കിൽ',upload:'ഉപകരണത്തിൽ നിന്ന് അപ്‌ലോഡ്',uploadDesc:'ഫോണിൽ നിന്നോ കമ്പ്യൂട്ടറിൽ നിന്നോ റിപ്പോർട്ടുകൾ തിരഞ്ഞെടുക്കുക.',choose:'ഫയലുകൾ തിരഞ്ഞെടുക്കുക',attached:'ചേർത്ത മെഡിക്കൽ രേഖകൾ',doctorFile:'ഡോക്ടറുടെ അപ്പോയിന്റ്മെന്റ് ഫയലിൽ ചേർക്കും.',safe:'ഫയലുകൾ ഈ അപ്പോയിന്റ്മെന്റിനായി സൂക്ഷിച്ച് ക്ലിനിക്കൽ പ്രക്രിയയിൽ ലഭ്യമാക്കും.',formats:'പിന്തുണ: PDF, JPG, PNG · ഓരോ ഫയലിനും പരമാവധി 5 MB',cameraError:'ക്യാമറ അനുമതി ലഭിച്ചില്ല അല്ലെങ്കിൽ ക്യാമറ ലഭ്യമല്ല. പകരം ചിത്രം തിരഞ്ഞെടുക്കാം.',initializing:'ക്യാമറ ആരംഭിക്കുന്നു…',capture:'രേഖ പകർത്തുക',view:'രേഖ കാണുക',remove:'നീക്കുക',previous:'മുമ്പ്',next:'അടുത്തത്'}
};

export default function ReportUploadStep({
  doctor = {},
  hospital = {},
  uploadedReports = [],
  onUpdateReports = () => {},
  onPrevious = () => {},
  onNext = () => {},
  language = 'en'
}) {
  const c = REPORT_COPY[language] || REPORT_COPY.en;
  const [reports, setReports] = useState(Array.isArray(uploadedReports) ? uploadedReports : []);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Sync reports to parent
  useEffect(() => {
    onUpdateReports(reports.filter(report => report.ocrStatus !== 'rejected' && report.ocrStatus !== 'analyzing'));
  }, [reports]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsScanning(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Camera not available, fallback to file capture:", err);
      setCameraError(c.cameraError);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) {
      // Simulate capture if desktop camera unavailable
      simulateCapture();
      return;
    }

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    await processCapturedDocument(dataUrl, `Scanned_Report_${Date.now().toString().slice(-4)}.jpg`, 'Scan');
    setIsProcessing(false);
    stopCamera();
  };

  const simulateCapture = () => {
    // No camera means no captured image. Ask for a real file instead.
    fileInputRef.current?.click();
  };
  const handleDeviceUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const newDoc = {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type.includes('pdf') ? 'pdf' : 'image',
          file,
          dataUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'Upload',
          ocrStatus: 'analyzing'
        };

        // Extract and attach clinical OCR summary in background
        const ocrPromise = OCRProcessor.processImage(dataUrl, file.type.includes('pdf') ? 'pdf' : 'lab', file.name)
          .then(res => {
            if (!res?.success || !res.isMedicalDocument) {
              setReports(prev => prev.map(d => d.id === newDoc.id ? { ...d, ocrStatus: res?.isMedicalDocument === false ? 'rejected' : 'unverified', analysisNotice: res?.summary || res?.error || 'Unable to analyze this file.' } : d));
              return;
            }
            const extracted = res?.extractedText || res?.text || res?.summary || '';
            if (extracted) {
              setReports(prev => prev.map(d => d.id === newDoc.id ? {
                ...d,
                ocrStatus: 'success',
                ocrSummary: extracted,
                ocr_text: extracted,
                extracted_data: res.structuredData || extracted,
                reportType: res.category || 'lab'
              } : d));
            }
          })
          .catch(err => console.warn('OCR processing note:', err));

        setReports(prev => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processCapturedDocument = async (dataUrl, fileName, source) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const newDoc = {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: fileName,
      size: '340 KB',
      type: 'image',
      file: new File([blob], fileName, { type: blob.type || 'image/jpeg' }),
      dataUrl,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source
    };

    try {
      const res = await OCRProcessor.processImage(dataUrl, 'lab', fileName);
      if (!res?.success || !res.isMedicalDocument) {
        newDoc.ocrStatus = res?.isMedicalDocument === false ? 'rejected' : 'unverified';
        newDoc.analysisNotice = res?.summary || res?.error || 'Unable to analyze this image.';
        setReports(prev => [...prev, newDoc]);
        return;
      }
      const extracted = res?.extractedText || res?.text || res?.summary || '';
      if (extracted) {
        newDoc.ocrSummary = extracted;
        newDoc.ocrStatus = 'success';
        newDoc.ocr_text = extracted;
        newDoc.extracted_data = res.structuredData || extracted;
        newDoc.reportType = res.category || 'lab';
      }
    } catch (e) {
      console.warn("OCR skipped:", e);
    }

    setReports(prev => [...prev, newDoc]);
  };

  const removeReport = (id) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div style={{ width: '100%' }}>
      {/* ── HIDDEN CANVAS & FILE INPUT ── */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleDeviceUpload}
      />

      {/* ── STEP 4 MAIN CONTAINER ── */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        marginBottom: '1.5rem'
      }}>
        {/* Header Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em'
          }}>
            {c.title}
          </h2>
          <p style={{
            fontSize: '0.95rem',
            color: '#64748b',
            margin: 0,
            fontWeight: '500'
          }}>
            {c.subtitle}
          </p>
        </div>

        {/* ── TWO BIG UPLOAD CARDS SIDE-BY-SIDE ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1.25rem',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          {/* 1. Left Card: Scan Report */}
          <div style={{
            border: '1.5px dashed #059669',
            borderRadius: '20px',
            backgroundColor: '#fbfefc',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onClick={startCamera}
          >
            {/* 3D-Style Scanner Graphic */}
            <div style={{
              width: '90px',
              height: '70px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="84" height="64" viewBox="0 0 84 64" fill="none">
                {/* Scanner Lid / Cover */}
                <path d="M12 28L42 12L72 28L42 36L12 28Z" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
                <path d="M12 28V36L42 44V36L12 28Z" fill="#64748b" />
                <path d="M72 28V36L42 44V36L72 28Z" fill="#475569" />
                {/* Scanner Glass Bed */}
                <ellipse cx="42" cy="38" rx="26" ry="12" fill="#38bdf8" fillOpacity="0.4" />
                {/* Glowing Green Scan Line */}
                <line x1="22" y1="36" x2="62" y2="36" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
                {/* Document Inside */}
                <rect x="30" y="24" width="24" height="18" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" transform="rotate(-8 30 24)" />
                <line x1="33" y1="28" x2="47" y2="26" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="33" y1="32" x2="45" y2="30" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              color: '#059669',
              margin: '0 0 6px 0'
            }}>
              {c.scan}
            </h3>
            <p style={{
              fontSize: '0.85rem',
              color: '#64748b',
              margin: '0 0 1.5rem 0',
              fontWeight: '500',
              lineHeight: 1.4,
              maxWidth: '220px'
            }}>
              {c.scanDesc}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              style={{
                backgroundColor: '#e6f7ee',
                color: '#059669',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 22px',
                fontSize: '0.9rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Maximize2 size={16} />
              <span>{c.start}</span>
            </button>
          </div>

          {/* Middle "or" Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#0f172a'
            }}>
              {c.or}
            </div>
          </div>

          {/* 2. Right Card: Upload from Device */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            backgroundColor: '#f8fafc',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
          >
            {/* Blue Cloud Icon Illustration */}
            <div style={{
              width: '90px',
              height: '70px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="68" height="52" viewBox="0 0 68 52" fill="none">
                <path
                  d="M52 42H18C11.3726 42 6 36.6274 6 30C6 23.8244 10.6622 18.7398 16.6994 18.077C18.6656 10.5186 25.5684 5 33.7778 5C43.2057 5 50.9842 12.1158 51.9213 21.3282C57.6534 22.3855 62 27.3828 62 33.4C62 40.3588 56.3588 46 49.4 46"
                  stroke="#2563eb"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M34 25V43M34 25L26 33M34 25L42 33"
                  stroke="#2563eb"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              color: '#2563eb',
              margin: '0 0 6px 0'
            }}>
              {c.upload}
            </h3>
            <p style={{
              fontSize: '0.85rem',
              color: '#64748b',
              margin: '0 0 1.5rem 0',
              fontWeight: '500',
              lineHeight: 1.4,
              maxWidth: '220px'
            }}>
              {c.uploadDesc}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 22px',
                fontSize: '0.9rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Upload size={16} />
              <span>{c.choose}</span>
            </button>
          </div>
        </div>

        {/* ── ATTACHED REPORTS PREVIEW LIST ── */}
        {reports.length > 0 && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.75rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="#059669" />
                <span>{c.attached} ({reports.length})</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                {c.doctorFile}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {reports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: report.type === 'pdf' ? '#fef2f2' : '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: report.type === 'pdf' ? '#ef4444' : '#16a34a',
                      flexShrink: 0
                    }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {report.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {report.size} • {report.source}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: report.ocrStatus === 'rejected' ? '#b91c1c' : '#64748b', marginTop: '4px' }}>
                        {report.ocrStatus === 'analyzing' ? 'Analyzing image…' : report.ocrStatus === 'success' ? 'AI extraction complete — review against the original' : report.analysisNotice || 'No verified OCR data'}
                        {report.ocrStatus === 'rejected' && ' This file will not be attached to the consultation.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {report.dataUrl && (
                      <button
                        onClick={() => setSelectedPreviewDoc(report)}
                        title={c.view}
                        aria-label={c.view}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px'
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => removeReport(report.id)}
                      title={c.remove}
                      aria-label={c.remove}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECURITY & FORMAT FOOTER ── */}
        <div style={{
          textAlign: 'center',
          paddingTop: '0.5rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: '#334155',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            <ShieldCheck size={18} color="#059669" />
            <span>{c.safe}</span>
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#64748b',
            fontWeight: '500'
          }}>
            {c.formats}
          </div>
        </div>
      </div>

      {/* ── LIVE CAMERA VIEWPORT MODAL ── */}
      {isScanning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '640px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
                  Document Scanner
                </h3>
              </div>
              <button
                onClick={stopCamera}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Viewport Area */}
            <div style={{
              position: 'relative',
              backgroundColor: '#000000',
              width: '100%',
              height: '380px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#ffffff', padding: '2rem' }}>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    {cameraError || c.initializing}
                  </p>
                  <button
                    onClick={simulateCapture}
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {c.capture}
                  </button>
                </div>
              )}

              {/* Viewfinder Target Guidelines */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                bottom: '20px',
                border: '2px dashed rgba(255, 255, 255, 0.6)',
                borderRadius: '16px',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)'
              }} />
            </div>

            {/* Modal Controls */}
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={stopCamera}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={captureFrame}
                disabled={isProcessing}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px 28px',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                }}
              >
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Camera size={18} />}
                <span>{isProcessing ? 'Processing OCR...' : 'Capture Document'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENT PREVIEW MODAL ── */}
      {selectedPreviewDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>
                {selectedPreviewDoc.name}
              </div>
              <button
                onClick={() => setSelectedPreviewDoc(null)}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center', maxHeight: '450px', overflowY: 'auto' }}>
              <img
                src={selectedPreviewDoc.dataUrl}
                alt={selectedPreviewDoc.name}
                style={{ maxWidth: '100%', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
              />
            </div>
          </div>
        </div>
      )}

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
          <span>{c.previous}</span>
        </button>

        <button
          onClick={onNext}
          disabled={isProcessing || reports.some(report => report.ocrStatus === 'analyzing')}
          data-voice-action="next"
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
          <span>{c.next}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
