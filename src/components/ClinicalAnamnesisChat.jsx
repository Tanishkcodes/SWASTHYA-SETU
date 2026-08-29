/* =========================================================================
   SWASTHYA SETU — Clinical Anamnesis & Adaptive AI Consultation Scribe
   Adapts dynamically to:
   - Ayurvedic Doctors (Dashavidha & Ashtavidha Pariksha, Agni, Kostha, Tridosha)
   - Allopathic Doctors (Onset, Severity, HPI, Red Flags, Prior Meds)
   - Real-time Interactive Option Pills in Chat + Voice/Text Input
   ========================================================================= */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Mic, MicOff, Sparkles, Bot, User, CheckCircle2,
  AlertCircle, RotateCcw, ArrowRight, ArrowLeft, Activity,
  HeartPulse, FileText, ChevronRight, ShieldCheck, Stethoscope, Leaf
} from 'lucide-react';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';

// ── Custom SVG Icons for the Problem Grid matching the user's design ──
function ThermometerIcon({ size = 32, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      <path d="M11.5 6h2" />
      <path d="M11.5 9h2" />
      <path d="M11.5 12h2" />
    </svg>
  );
}

function HeadacheIcon({ size = 32, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2v1" />
      <path d="M4.93 4.93l.7.7" />
      <path d="M19.07 4.93l-.7.7" />
      <path d="M16 11a4 4 0 1 0-8 0c0 1.66.8 3.13 2 4.02V18h4v-2.98c1.2-.89 2-2.36 2-4.02z" />
      <path d="M10 11h.01" />
      <path d="M14 11h.01" />
    </svg>
  );
}

function StomachIcon({ size = 32, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4" />
      <path d="M12 7c-4 0-7 3-7 7a7 7 0 0 0 14 0c0-4-3-7-7-7z" />
      <path d="M8 14c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5" />
    </svg>
  );
}

function CoughIcon({ size = 32, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8c0-3.3-2.7-6-6-6S4 4.7 4 8c0 2.2 1.2 4.1 3 5.1V18h6v-4.9c1.8-1 3-2.9 3-5.1z" />
      <path d="M18 10h4" />
      <path d="M19 14h3" />
      <path d="M18 18h4" />
    </svg>
  );
}

function BodyPainIcon({ size = 32, color = '#059669' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      <path d="M12 8v8" />
      <path d="M8 10l4 2 4-2" />
      <path d="M9 22l3-6 3 6" />
      <path d="M16 11l2 2-2 2" />
      <path d="M8 11l-2 2 2 2" />
    </svg>
  );
}

// ── Initial Problem Cards list ──
const INITIAL_PROBLEMS = [
  { id: 'fever', label: 'Fever', sublabel: 'बुखार / காய்ச்சல்', icon: ThermometerIcon },
  { id: 'headache', label: 'Headache', sublabel: 'सिरदर्द / தலைவலி', icon: HeadacheIcon },
  { id: 'stomach', label: 'Stomach Pain', sublabel: 'पेट दर्द / வயிற்று வலி', icon: StomachIcon },
  { id: 'cough', label: 'Cough / Cold', sublabel: 'खांसी-जुकाम / இருமல்', icon: CoughIcon },
  { id: 'bodypain', label: 'Body Pain', sublabel: 'बदन दर्द / உடல் வலி', icon: BodyPainIcon },
];

export default function ClinicalAnamnesisChat({
  doctor,
  hospital,
  initialSymptoms = [],
  initialNotes = '',
  onUpdateCaseDetails,
  onPrevious,
  onNext,
  language = 'en'
}) {
  const { isListening, toggleListening, interimTranscript } = useVoiceNav();
  
  // Determine if Doctor is Ayurvedic / AYUSH vs Allopathic
  const isAyurvedic = Boolean(
    doctor?.specialty?.toLowerCase().includes('ayurved') ||
    doctor?.degrees?.toLowerCase().includes('bams') ||
    doctor?.degrees?.toLowerCase().includes('ayush') ||
    doctor?.degrees?.toLowerCase().includes('panchakarma') ||
    doctor?.degrees?.toLowerCase().includes('vaidya')
  );

  const safeSymptoms = Array.isArray(initialSymptoms) ? initialSymptoms : [];
  const safeNotes = typeof initialNotes === 'string' ? initialNotes : '';

  const [selectedCards, setSelectedCards] = useState(safeSymptoms);
  const [chatStarted, setChatStarted] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [caseSummary, setCaseSummary] = useState({
    chiefComplaints: safeSymptoms,
    duration: '',
    severity: '',
    nature: '',
    triggers: '',
    ayushPrakriti: '',
    ayushAgni: '',
    medications: '',
    notes: safeNotes
  });

  const chatBottomRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatStarted && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, chatStarted]);

  // Helper to sync case notes back to parent without render loops
  const syncToParent = (updatedSummary) => {
    const summary = updatedSummary || caseSummary;
    const complaints = Array.isArray(summary.chiefComplaints) ? summary.chiefComplaints : [];
    const formattedNotes = [
      complaints.length ? `• Chief Complaints: ${complaints.join(', ')}` : '',
      summary.duration ? `• Duration: ${summary.duration}` : '',
      summary.severity ? `• Severity: ${summary.severity}` : '',
      summary.nature ? `• Nature: ${summary.nature}` : '',
      isAyurvedic && summary.ayushAgni ? `• Ayurvedic Agni/Kostha: ${summary.ayushAgni}` : '',
      isAyurvedic && summary.ayushPrakriti ? `• Doshic Manifestation: ${summary.ayushPrakriti}` : '',
      summary.medications ? `• Prior Medication/History: ${summary.medications}` : '',
      summary.notes ? `• Patient Statement: ${summary.notes}` : ''
    ].filter(Boolean).join('\n');

    onUpdateCaseDetails?.({
      symptoms: complaints,
      notes: formattedNotes || summary.notes || ''
    });
  };

  // ── CLINICAL INTERVIEW FLOW DEFINITIONS ──
  // 1. Allopathic Flow
  const allopathicFlow = [
    {
      id: 'duration',
      question: (symptoms) => `Thank you for sharing. For how long have you been experiencing ${symptoms.join(' & ') || 'these symptoms'}?`,
      options: ['Less than 24 hours', '2 - 3 Days', '4 - 7 Days (1 Week)', 'More than 2 Weeks (Chronic)']
    },
    {
      id: 'severity',
      question: () => `How severe is the discomfort right now?`,
      options: ['Mild (Manageable)', 'Moderate (Affecting daily work)', 'Severe (Intense pain / high fever)', 'Intermittent / Comes and goes']
    },
    {
      id: 'nature',
      question: (symptoms) => `Are you experiencing any associated symptoms? (Select all that match or type below)`,
      options: ['Chills & Sweating', 'Nausea / Loss of Appetite', 'Throbbing / Heaviness', 'Burning Sensation', 'No other issues, just this']
    },
    {
      id: 'medications',
      question: () => `Have you taken any medication (like Paracetamol, antacids, painkillers) or have existing BP/Diabetes?`,
      options: ['Taken Paracetamol / OTC Tablet', 'Taking Regular BP/Sugar Medicine', 'No Medicines Taken', 'Allergic to specific drugs']
    }
  ];

  // 2. Ayurvedic Flow (Dashavidha & Ashtavidha Pariksha)
  const ayurvedicFlow = [
    {
      id: 'duration',
      question: (symptoms) => `नमस्ते. How long has this ${symptoms.join(' & ') || 'discomfort'} (Roga Lakshana) been present?`,
      options: ['1 - 2 Days (Navina / Acute)', '3 - 7 Days', 'More than 2 Weeks', 'Long-standing / Purana']
    },
    {
      id: 'ayushAgni',
      question: () => `[Ayurvedic Agni Pariksha] How is your appetite (Agni) and bowel movement (Kostha)?`,
      options: ['Manda Agni (Low appetite / Heavy stomach)', 'Tikshna Agni (Intense hunger / Acid burning)', 'Visham Agni (Irregular / Gas & Bloating)', 'Sama Agni (Normal & Regular digestion)']
    },
    {
      id: 'ayushPrakriti',
      question: () => `[Doshic Lakshana] What sensations are dominant in your body?`,
      options: ['Vata (Dryness, stiffness, pricking pain, restlessness)', 'Pitta (Burning sensation, excessive heat, red eyes/skin)', 'Kapha (Heavy head, congestion, sluggishness, phlegm)', 'Mixed (Vata-Pitta / Kapha)']
    },
    {
      id: 'medications',
      question: () => `[Ahara & Nidra] How is your sleep (Nidra) and stress level, and have you taken any home remedies or Kadha?`,
      options: ['Disturbed Sleep / Insomnia', 'Sound Sleep / Normal', 'Taken Ginger / Tulsi / Kadha', 'No remedies yet']
    }
  ];

  const activeFlow = isAyurvedic ? ayurvedicFlow : allopathicFlow;

  // Start the Chat flow
  const startConsultationChat = (initialSymptomsList, userCustomText = '') => {
    setChatStarted(true);
    const symptoms = initialSymptomsList.length ? initialSymptomsList : (userCustomText ? [userCustomText] : ['General Discomfort']);
    
    setCaseSummary(prev => ({
      ...prev,
      chiefComplaints: symptoms,
      notes: userCustomText || prev.notes
    }));

    const greeting = isAyurvedic
      ? `🙏 Pranam! I am your AI Ayurvedic Scribe for **${doctor?.name || 'Vaidya Ji'}**.`
      : `👋 Hello! I am your Clinical Pre-Consultation Assistant for **${doctor?.name || 'Dr. Specialist'}**.`;

    const firstStep = activeFlow[0];
    const initialAiMsg = {
      sender: 'ai',
      text: `${greeting}\n\n${firstStep.question(symptoms)}`,
      options: firstStep.options,
      stepId: firstStep.id
    };

    const initialUserMsg = userCustomText ? [{ sender: 'user', text: userCustomText }] : [];
    setMessages([...initialUserMsg, initialAiMsg]);
    setActiveStepIdx(0);
  };

  // Handle user response (from clicked pill OR typed text)
  const handleUserResponse = (text) => {
    if (!text.trim()) return;

    const currentStep = activeFlow[activeStepIdx];
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    // Update case summary field
    if (currentStep) {
      setCaseSummary(prev => {
        const next = { ...prev };
        if (currentStep.id === 'duration') next.duration = text;
        if (currentStep.id === 'severity') next.severity = text;
        if (currentStep.id === 'nature') next.nature = text;
        if (currentStep.id === 'ayushAgni') next.ayushAgni = text;
        if (currentStep.id === 'ayushPrakriti') next.ayushPrakriti = text;
        if (currentStep.id === 'medications') next.medications = text;
        syncToParent(next);
        return next;
      });
    }

    const nextIdx = activeStepIdx + 1;
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      if (nextIdx < activeFlow.length) {
        const nextStep = activeFlow[nextIdx];
        const aiReply = {
          sender: 'ai',
          text: nextStep.question(caseSummary.chiefComplaints),
          options: nextStep.options,
          stepId: nextStep.id
        };
        setMessages(prev => [...prev, aiReply]);
        setActiveStepIdx(nextIdx);
      } else {
        // Complete the clinical triage summary
        const finalAiReply = {
          sender: 'ai',
          text: `✅ **Clinical Case Brief Recorded!**\nI have summarized your symptoms and prep notes for **${doctor?.name}**. You can proceed to upload existing prescriptions/reports or confirm your consultation.`,
          options: ['Proceed to Next Step ➔', 'Add more symptoms / notes'],
          isFinal: true
        };
        setMessages(prev => [...prev, finalAiReply]);
      }
    }, 700);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      border: '1px solid #e2e8f0',
      padding: '2.25rem 2.5rem',
      boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
      position: 'relative'
    }}>
      {/* ── TOP HEADER WITH SPECIALTY BADGE ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            backgroundColor: isAyurvedic ? '#fef3c7' : '#f0fdf9',
            border: isAyurvedic ? '1px solid #fde68a' : '1px solid #ccfbf1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAyurvedic ? '#92400e' : '#0c4e47',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            {isAyurvedic ? <Leaf size={22} /> : <FileText size={22} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>
                Step 3: Reason for Visit & Case Details
              </h3>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: isAyurvedic ? '#fef3c7' : '#f0fdf9',
                color: isAyurvedic ? '#92400e' : '#0f766e',
                border: isAyurvedic ? '1px solid #fde68a' : '1px solid #ccfbf1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Sparkles size={11} />
                {isAyurvedic ? 'Ayurvedic Dashavidha AI' : 'Smart Clinical AI Anamnesis'}
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Preparing case file for {doctor?.name} ({doctor?.specialty || 'Physician'})
            </p>
          </div>
        </div>

        {chatStarted && (
          <button
            onClick={() => {
              setChatStarted(false);
              setMessages([]);
              setActiveStepIdx(0);
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
            <span>Reset Symptoms</span>
          </button>
        )}
      </div>

      {/* ── INITIAL SCREEN: MATCHING THE USER'S PROVIDED SCREENSHOT ── */}
      {!chatStarted ? (
        <div>
          {/* Main Card Container */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #eef2f6',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            marginBottom: '1.75rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <h2 style={{
              margin: '0 0 6px 0',
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#1e293b',
              letterSpacing: '-0.3px'
            }}>
              What Problem are you having?
            </h2>
            <p style={{ margin: '0 0 2rem 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
              Please select all that apply
            </p>

            {/* 5 Clean Problem Tiles Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              {INITIAL_PROBLEMS.map((prob) => {
                const IconComponent = prob.icon;
                const isSelected = selectedCards.includes(prob.label);

                return (
                  <button
                    key={prob.id}
                    type="button"
                    onClick={() => {
                      let updated;
                      if (isSelected) {
                        updated = selectedCards.filter(c => c !== prob.label);
                      } else {
                        updated = [...selectedCards, prob.label];
                      }
                      setSelectedCards(updated);
                      // Start chat right away when selected
                      if (updated.length > 0) {
                        startConsultationChat(updated);
                      }
                    }}
                    style={{
                      backgroundColor: isSelected ? '#f0fdf9' : '#ffffff',
                      border: isSelected ? '2px solid #059669' : '1.5px solid #e2e8f0',
                      borderRadius: '18px',
                      padding: '1.6rem 0.75rem 1.4rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected
                        ? '0 10px 25px rgba(5, 150, 105, 0.15), 0 0 0 1px #059669'
                        : '0 2px 8px rgba(0,0,0,0.02)',
                      transform: isSelected ? 'translateY(-3px)' : 'translateY(0)'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#059669';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.1)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                      }
                    }}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#ccfbf1' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      <IconComponent size={30} color="#059669" />
                    </div>

                    <div>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        color: isSelected ? '#065f46' : '#1e293b',
                        letterSpacing: '-0.2px'
                      }}>
                        {prob.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', fontWeight: '500' }}>
                        {prob.sublabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Input bar at bottom */}
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
                gap: '10px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '16px',
                padding: '8px 14px',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s ease'
              }}
            >
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Type your symptoms or details (optional)..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.925rem',
                  color: '#0f172a',
                  padding: '8px 4px'
                }}
              />

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={() => {
                  toggleListening();
                }}
                style={{
                  backgroundColor: isListening ? '#fee2e2' : '#f1f5f9',
                  border: 'none',
                  borderRadius: '12px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isListening ? '#ef4444' : '#64748b',
                  transition: 'all 0.2s ease'
                }}
                title="Speak your symptoms"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputVal.trim() && selectedCards.length === 0}
                style={{
                  backgroundColor: (inputVal.trim() || selectedCards.length > 0) ? '#0c4e47' : '#94a3b8',
                  border: 'none',
                  borderRadius: '12px',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (inputVal.trim() || selectedCards.length > 0) ? 'pointer' : 'not-allowed',
                  color: '#ffffff',
                  boxShadow: (inputVal.trim() || selectedCards.length > 0) ? '0 4px 12px rgba(12, 78, 71, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ── INTERACTIVE AI ANAMNESIS CHAT VIEW ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* Left Column: The Interactive Chat */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: '460px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.02)'
          }}>
            {/* Chat Top Banner */}
            <div style={{
              padding: '12px 18px',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isAyurvedic ? '#fef3c7' : '#f0fdf9',
                  color: isAyurvedic ? '#b45309' : '#0c4e47',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bot size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0f172a' }}>
                    Swasthya Setu Clinical Scribe
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>
                    ● Interactive AI Anamnesis Active
                  </div>
                </div>
              </div>

              {/* Progress pill */}
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '12px' }}>
                Question {Math.min(activeStepIdx + 1, activeFlow.length)} of {activeFlow.length}
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div style={{
              flex: 1,
              padding: '1.25rem 1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {messages.map((m, idx) => {
                const isAi = m.sender === 'ai';

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAi ? 'flex-start' : 'flex-end',
                      animation: 'fadeIn 0.25s ease'
                    }}
                  >
                    {/* Bubble */}
                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: isAi ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                      backgroundColor: isAi ? '#ffffff' : '#0c4e47',
                      color: isAi ? '#0f172a' : '#ffffff',
                      fontSize: '0.9rem',
                      lineHeight: '1.45',
                      boxShadow: isAi ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 12px rgba(12, 78, 71, 0.2)',
                      border: isAi ? '1px solid #e2e8f0' : 'none',
                      whiteSpace: 'pre-line'
                    }}>
                      {m.text}
                    </div>

                    {/* Option Pills attached to this message */}
                    {isAi && m.options && m.options.length > 0 && idx === messages.length - 1 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '10px',
                        maxWidth: '95%'
                      }}>
                        {m.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => {
                              if (m.isFinal && opt.includes('Proceed')) {
                                onNext?.();
                              } else {
                                handleUserResponse(opt);
                              }
                            }}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1.5px solid #0c4e47',
                              color: '#0c4e47',
                              borderRadius: '18px',
                              padding: '7px 14px',
                              fontSize: '0.825rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(12, 78, 71, 0.08)',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#0c4e47';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.color = '#0c4e47';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <span>{opt}</span>
                            <ChevronRight size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '14px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0c4e47', animation: 'pulse 1s infinite' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0c4e47', animation: 'pulse 1s infinite 0.2s' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0c4e47', animation: 'pulse 1s infinite 0.4s' }} />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px', fontWeight: '600' }}>AI is thinking…</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Chat Bottom Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputVal.trim()) {
                  handleUserResponse(inputVal.trim());
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0'
              }}
            >
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="Type or speak additional details..."
                style={{
                  flex: 1,
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  color: '#0f172a'
                }}
              />

              <button
                type="button"
                onClick={() => toggleListening()}
                style={{
                  backgroundColor: isListening ? '#fee2e2' : '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isListening ? '#ef4444' : '#64748b'
                }}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="submit"
                disabled={!inputVal.trim()}
                style={{
                  backgroundColor: inputVal.trim() ? '#0c4e47' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputVal.trim() ? 'pointer' : 'not-allowed',
                  color: '#ffffff'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Right Column: Live Clinical Case File Preview */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <Stethoscope size={18} color="#0c4e47" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                Live Doctor Case Brief
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.825rem' }}>
              <div>
                <span style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  Chief Complaints:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                  {caseSummary.chiefComplaints.map((c, i) => (
                    <span key={i} style={{ backgroundColor: '#f0fdf9', color: '#0c4e47', border: '1px solid #ccfbf1', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.75rem' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {caseSummary.duration && (
                <div>
                  <span style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Duration:
                  </span>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {caseSummary.duration}
                  </div>
                </div>
              )}

              {caseSummary.severity && (
                <div>
                  <span style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Severity:
                  </span>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {caseSummary.severity}
                  </div>
                </div>
              )}

              {isAyurvedic && caseSummary.ayushAgni && (
                <div>
                  <span style={{ fontWeight: '700', color: '#92400e', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Agni & Kostha Pariksha:
                  </span>
                  <div style={{ fontWeight: '700', color: '#78350f', marginTop: '2px' }}>
                    {caseSummary.ayushAgni}
                  </div>
                </div>
              )}

              {isAyurvedic && caseSummary.ayushPrakriti && (
                <div>
                  <span style={{ fontWeight: '700', color: '#92400e', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Doshic Manifestation:
                  </span>
                  <div style={{ fontWeight: '700', color: '#78350f', marginTop: '2px' }}>
                    {caseSummary.ayushPrakriti}
                  </div>
                </div>
              )}

              {caseSummary.medications && (
                <div>
                  <span style={{ fontWeight: '700', color: '#64748b', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Prior Meds / History:
                  </span>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {caseSummary.medications}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              marginTop: '1.25rem',
              padding: '10px 12px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: '#64748b'
            }}>
              <ShieldCheck size={16} color="#059669" />
              <span>Prepared for {doctor?.name} consultation</span>
            </div>
          </div>
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
          <span>Previous: Select Time</span>
        </button>

        <button
          type="button"
          onClick={() => onNext?.()}
          style={{
            background: 'linear-gradient(135deg, #0c4e47 0%, #083934 100%)',
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
          <span>Next: Upload Reports</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
