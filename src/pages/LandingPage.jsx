import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import StatCounter from '../components/StatCounter';
import { HeartPulse, Stethoscope, Users, Settings, ArrowRight, ShieldCheck, Activity, CheckCircle2, Clock, Globe2, Ear, Quote, ChevronDown, ChevronUp, Mail, Twitter, Linkedin, Facebook, Mic, ClipboardList } from 'lucide-react';
import SwasthyaLogo from '../components/SwasthyaLogo';
import BrandTitle from '../components/BrandTitle';
import '../styles/landing.css';
import { db } from '../lib/db';

export default function LandingPage() {
  const navigate = useNavigate();
  const { session, setAuth, setPatient } = useSession();
  const { t, currentLang } = useLanguage();
  const { audioPromptManager, registerPage, unregisterPage } = useVoiceNav();
  const [openFaq, setOpenFaq] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    const { error } = await db.feedback.submit({
      patientId: session.patient?.id || null, pageId: 'landing', language: currentLang, message: feedbackText.trim(),
    });
    if (error) { alert(`Unable to submit feedback: ${error.message}`); return; }
    setFeedbackSubmitted(true);
  };

  const handleStartSession = () => {
    if (session.isAuthenticated) {
      if (session.userRole === 'patient') navigate('/patient-dashboard');
      else if (session.userRole === 'doctor') navigate('/physician');
      else if (session.userRole === 'admin') navigate('/admin-dashboard');
    } else {
      navigate('/auth?role=patient');
    }
  };

  const handleBookAppointment = () => {
    if (session.isAuthenticated && session.userRole === 'patient') {
      navigate('/patient-dashboard', { state: { voiceAction: 'bookAppointment' } });
    } else {
      navigate('/auth?role=patient');
    }
  };

  useEffect(() => {
    // Register comprehensive voice commands for landing page
    registerPage('landing', {
      next: handleStartSession,
      start_session: handleStartSession,
      bookAppointment: handleBookAppointment,
      book_appointment: handleBookAppointment,
      register_new: () => navigate('/auth?role=patient'),
      login_patient: () => navigate('/auth?role=patient'),
      login_doctor: () => navigate('/auth?role=doctor'),
      login_admin: () => navigate('/auth?role=admin'),
      login_abha: () => navigate('/auth?role=patient'),
      login_aadhaar: () => navigate('/auth?role=patient'),
      select_language: () => navigate('/language'),
      change_language: () => navigate('/language'),
      scan_document: () => navigate('/scan'),
      document_scan: () => navigate('/scan'),
      home: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      scrollUp: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      scrollDown: () => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }),
      help: () => {
        const faqSec = document.querySelector('.faq-section');
        if (faqSec) faqSec.scrollIntoView({ behavior: 'smooth' });
      },
      faq: () => {
        const faqSec = document.querySelector('.faq-section');
        if (faqSec) faqSec.scrollIntoView({ behavior: 'smooth' });
      }
    }, {
      next: ['Begin using Swasthya Setu or continue to the correct signed-in portal'],
      start_session: ['Start, begin, continue, or get healthcare assistance'],
      book_appointment: ['Book, arrange, schedule, or get a doctor appointment as a patient'],
      bookAppointment: ['Book, arrange, schedule, or get a doctor appointment as a patient'],
      register_new: ['Register a new patient who has no existing login'],
      login_patient: ['Open patient login, patient registration, or patient portal'],
      login_doctor: ['Open doctor or physician login portal'],
      login_admin: ['Open hospital administrator login portal'],
      login_abha: ['Use an ABHA health ID for patient login'],
      login_aadhaar: ['Use Aadhaar for patient login'],
      select_language: ['Choose or change the website language'],
      change_language: ['Choose or change the website language'],
      scan_document: ['Scan or upload a prescription, report, or medical document'],
      document_scan: ['Scan or upload a prescription, report, or medical document'],
      help: ['Show help, frequently asked questions, or explain how the website works'],
      faq: ['Show frequently asked questions'],
    });

    return () => unregisterPage('landing');
  }, [audioPromptManager, navigate, registerPage, unregisterPage, session]);

  return (
    <div className="landing-page" style={{ background: 'transparent' }}>

      {/* 
          =============================================
          HERO SECTION (Realistic Hospital Background)
          =============================================
      */}
      <section className="hero-section relative" style={{
        minHeight: '95vh',
        padding: 'var(--space-16) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to right, rgba(250,248,243,0.95) 0%, rgba(250,248,243,0.85) 50%, rgba(250,248,243,0.4) 100%), url("/hero-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        borderBottom: '1px solid var(--gray-200)',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '1000px', zIndex: 1, marginTop: '2rem' }}>

          <div className="badge animate-fade-in-down mb-6" style={{ background: 'white', color: 'var(--teal-700)', padding: '10px 28px', borderRadius: '32px', fontWeight: '700', fontSize: '0.9rem', marginBottom: '32px', boxShadow: '0 10px 30px rgba(13,148,136,0.15)', border: '1px solid var(--teal-200)', letterSpacing: '0.5px' }}>
            <span className="mr-2">✨</span> {t('tagline')}
          </div>

          <h1 className="hero-title animate-fade-in-up" style={{ fontSize: '5rem', marginBottom: '1.5rem', fontWeight: '900', color: 'var(--navy-900)', lineHeight: '1.05', letterSpacing: '-2px' }}>
            <span style={{ color: 'var(--teal-600)', background: 'linear-gradient(135deg, var(--teal-500), var(--teal-700))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'textShine 3s infinite linear' }}>AI</span>{t('heroTitle').replace('AI', '')}
          </h1>

          <p className="hero-subtitle animate-fade-in-up" style={{ fontSize: '1.4rem', maxWidth: '780px', margin: '0 auto 3.5rem auto', lineHeight: '1.6', color: 'var(--gray-700)', fontWeight: '500', animationDelay: '0.1s' }}>
            {t('heroSubtitle')}
          </p>

          <div className="animate-fade-in-up" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.2s' }}>
            <button
              className="btn btn-primary btn-xl"
              onClick={handleStartSession}
              style={{ fontSize: '1.2rem', padding: '20px 48px', borderRadius: '14px', boxShadow: '0 20px 40px rgba(13,148,136,0.3)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: 'linear-gradient(135deg, var(--teal-500) 0%, var(--teal-700) 100%)' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 25px 50px rgba(13,148,136,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(13,148,136,0.3)'; }}
            >
              {t('startSession')} <ArrowRight size={24} className="ml-2" />
            </button>
          </div>

          <div className="stats-container stagger-children animate-fade-in-up" style={{ marginTop: '5.5rem', width: '100%', animationDelay: '0.3s', padding: '2.5rem', borderRadius: '24px', background: 'rgba(250, 248, 243, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(20, 71, 75, 0.1)', boxShadow: '0 30px 60px rgba(20, 71, 75, 0.08)' }}>
            <StatCounter end={15} suffix=" min" label="Avg Time Saved per patient" duration={2500} />
            <StatCounter end={9} label="Regional Languages Supported" duration={2000} />
            <StatCounter end={100} suffix="K+" label="Patients Triaged Successfully" duration={3000} />
          </div>
        </div>
      </section>

      {/* 
          =============================================
          TRUST & TESTIMONIAL QUOTES SECTION
          =============================================
      */}
      <section style={{ padding: '6rem 2rem', background: 'var(--teal-50)', borderBottom: '1px solid var(--teal-100)' }}>
        <div className="container" style={{ maxWidth: '1250px' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--navy-900)', letterSpacing: '-1px' }}>{t('trustedBy')}</h2>
            <p style={{ color: 'var(--teal-700)', fontWeight: '600', marginTop: '0.5rem' }}>{t('trustedByDesc')}</p>
          </div>

          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
            <div style={{ background: 'var(--gray-50)', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(20,71,75,0.1)', position: 'relative' }}>
              <Quote size={40} color="var(--teal-200)" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--gray-700)', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                {t('quote1')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--navy-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy-700)', fontWeight: 'bold' }}>Dr. S</div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: 'var(--navy-900)' }}>{t('quote1Author')}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{t('quote1Role')}</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--gray-50)', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(20,71,75,0.1)', position: 'relative' }}>
              <Quote size={40} color="var(--teal-200)" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--gray-700)', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                {t('quote2')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--orange-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-700)', fontWeight: 'bold' }}>Dr. K</div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: 'var(--navy-900)' }}>{t('quote2Author')}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{t('quote2Role')}</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--gray-50)', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 30px rgba(20,71,75,0.1)', position: 'relative' }}>
              <Quote size={40} color="var(--teal-200)" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }} />
              <p style={{ fontSize: '1.1rem', color: 'var(--gray-700)', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                {t('quote3')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-700)', fontWeight: 'bold' }}>Dr. A</div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: 'var(--navy-900)' }}>{t('quote3Author')}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{t('quote3Role')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
          =============================================
          HOW IT WORKS SECTION (Beige Split Layout)
          =============================================
      */}
      <section style={{ padding: '8rem 2rem', background: 'var(--gray-50)', position: 'relative', overflow: 'hidden' }}>
        {/* Soft background glow */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--teal-50) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>

        <div className="container" style={{ maxWidth: '1250px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6rem', alignItems: 'center' }}>

            <div className="feature-text">
              <div style={{ color: 'var(--teal-600)', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Ear size={20} /> Intelligent Triage</div>
              <h2 style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--navy-900)', marginBottom: '1.5rem', lineHeight: '1.1', letterSpacing: '-1px' }}>
                {t('featureConverse')}
              </h2>
              <p style={{ fontSize: '1.2rem', color: 'var(--gray-600)', marginBottom: '3rem', lineHeight: '1.7' }}>
                {t('featureConverseDesc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '2rem', borderRadius: '24px', background: 'var(--teal-50)', border: '1px solid var(--teal-100)', transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(20,71,75,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ background: 'white', color: 'var(--teal-600)', padding: '14px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(20,71,75,0.1)', flexShrink: 0 }}><ShieldCheck size={26} /></div>
                  <div>
                    <h4 style={{ fontWeight: '800', color: 'var(--navy-900)', fontSize: '1.2rem', marginBottom: '0.4rem' }}>{t('featureConnect')}</h4>
                    <p style={{ color: 'var(--gray-600)', fontSize: '1rem', lineHeight: '1.6' }}>{t('featureConnectDesc')}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', padding: '2rem', borderRadius: '24px', background: 'var(--orange-50)', border: '1px solid var(--orange-100)', transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(232,93,38,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ background: 'white', color: 'var(--orange-500)', padding: '14px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(232,93,38,0.1)', flexShrink: 0 }}><Activity size={26} /></div>
                  <div>
                    <h4 style={{ fontWeight: '800', color: 'var(--navy-900)', fontSize: '1.2rem', marginBottom: '0.4rem' }}>{t('featureSummarize')}</h4>
                    <p style={{ color: 'var(--gray-600)', fontSize: '1rem', lineHeight: '1.6' }}>{t('featureSummarizeDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="feature-image" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(circle, var(--teal-100) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
              <img src="/kiosk.jpg" alt="AI Kiosk Illustration" style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '32px', position: 'relative', zIndex: 1, boxShadow: '0 30px 60px -15px rgba(20,71,75,0.15)', border: '10px solid var(--teal-50)' }} />
            </div>

          </div>
        </div>
      </section>

      {/* 
          =============================================
          WHY CHOOSE SWASTHYA SETU (Beige Bento Box)
          =============================================
      */}
      <section style={{ padding: '8rem 2rem', background: 'var(--teal-50)', borderTop: '1px solid var(--teal-100)' }}>
        <div className="container" style={{ maxWidth: '1250px' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--navy-900)', marginBottom: '1.25rem', letterSpacing: '-0.5px' }}>{t('whyChoose')}</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>{t('whyChooseDesc')}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.75rem', gridAutoRows: 'minmax(240px, auto)' }}>

            {/* Bento Card 1 — wide, airy beige */}
            <div style={{ gridColumn: 'span 8', background: 'var(--gray-50)', padding: '4rem', borderRadius: '32px', boxShadow: '0 6px 24px rgba(20,71,75,0.06)', border: '1px solid var(--teal-100)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <div style={{ position: 'absolute', right: '-8%', bottom: '-15%', width: '280px', height: '280px', background: 'radial-gradient(circle, var(--teal-100) 0%, transparent 70%)', borderRadius: '50%' }}></div>
              <div style={{ background: 'var(--teal-100)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                <Clock size={32} color="var(--teal-700)" />
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>{t('saveTime')}</h3>
              <p style={{ color: 'var(--gray-600)', lineHeight: '1.7', fontSize: '1.1rem', maxWidth: '80%', position: 'relative', zIndex: 1 }}>{t('saveTimeDesc')}</p>
            </div>

            {/* Bento Card 2 — accent teal */}
            <div style={{ gridColumn: 'span 4', background: 'var(--teal-600)', color: 'white', padding: '4rem 3rem', borderRadius: '32px', boxShadow: '0 20px 40px rgba(20,71,75,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <div style={{ background: 'rgba(255,255,255,0.15)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                <Globe2 size={32} color="white" />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>{t('zeroLiteracy')}</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: '1.7', fontSize: '1.05rem' }}>{t('zeroLiteracyDesc')}</p>
            </div>

            {/* Bento Card 3 — full-width, warm beige with orange accent */}
            <div style={{ gridColumn: 'span 12', background: 'var(--gray-50)', padding: '4rem', borderRadius: '32px', boxShadow: '0 6px 24px rgba(20,71,75,0.06)', border: '1px solid var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4rem', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <div style={{ flex: '1' }}>
                <div style={{ background: 'var(--orange-50)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                  <CheckCircle2 size={32} color="var(--orange-500)" />
                </div>
                <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1rem' }}>{t('clinicalAccuracy')}</h3>
                <p style={{ color: 'var(--gray-600)', lineHeight: '1.7', fontSize: '1.2rem', maxWidth: '70%' }}>{t('clinicalAccuracyDesc')}</p>
              </div>
              <div style={{ flexShrink: 0, width: '260px', height: '180px', background: 'var(--teal-50)', borderRadius: '24px', border: '2px solid var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stethoscope size={64} color="var(--teal-300)" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
          =============================================
          PORTAL SELECTION SECTION (Elevated Beige Cards)
          =============================================
      */}
      <section style={{ padding: '9rem 2rem', background: 'var(--gray-50)' }}>
        <div className="container" style={{ maxWidth: '1250px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '3.5rem', color: 'var(--navy-900)', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-1.5px' }}>
            {t('selectPortal')}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--gray-500)', marginBottom: '5rem', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 5rem auto' }}>{t('selectPortalDesc')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>

            {/* Patient Portal */}
            <div onClick={() => {
              if (session.isAuthenticated && session.userRole === 'patient') {
                navigate('/patient-dashboard');
              } else {
                navigate('/auth?role=patient');
              }
            }} style={{ cursor: 'pointer', background: 'var(--gray-100)', padding: '4rem 3rem', borderRadius: '32px', border: '1px solid var(--teal-100)', transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-12px) scale(1.01)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(20,71,75,0.12)'; e.currentTarget.style.borderColor = 'var(--teal-200)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--teal-100)'; }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '180px', background: 'radial-gradient(circle at top right, var(--teal-50) 0%, transparent 70%)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
                <div style={{ color: 'var(--teal-600)', background: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(20,71,75,0.1)' }}>
                  <Users size={44} strokeWidth={1.5} />
                </div>
                <div style={{ background: 'var(--teal-100)', color: 'var(--teal-700)', padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '700' }}>{t('patientBadge') || 'Patient'}</div>
              </div>
              <h3 style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>{t('patientPortal') || 'Patient Portal'}</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '1.05rem', lineHeight: '1.7', position: 'relative', zIndex: 1, marginBottom: '2.5rem' }}>{t('patientPortalDesc') || 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal-600)', fontWeight: '700', fontSize: '1rem', position: 'relative', zIndex: 1 }}>{t('enterPortal') || 'Enter Portal'} <ArrowRight size={18} /></div>
            </div>

            {/* Doctor Portal */}
            <div onClick={() => {
              if (session.isAuthenticated && session.userRole === 'doctor') {
                navigate('/physician');
              } else {
                navigate('/auth?role=doctor');
              }
            }} style={{ cursor: 'pointer', background: 'var(--gray-100)', padding: '4rem 3rem', borderRadius: '32px', border: '1px solid var(--teal-100)', transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-12px) scale(1.01)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(20,71,75,0.12)'; e.currentTarget.style.borderColor = 'var(--teal-200)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--teal-100)'; }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '180px', background: 'radial-gradient(circle at top right, var(--teal-50) 0%, transparent 70%)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
                <div style={{ color: 'var(--teal-600)', background: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(20,71,75,0.1)' }}>
                  <Stethoscope size={44} strokeWidth={1.5} />
                </div>
                <div style={{ background: 'var(--teal-100)', color: 'var(--teal-700)', padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '700' }}>{t('doctorBadge') || 'Doctor'}</div>
              </div>
              <h3 style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>{t('doctorPortal') || 'Doctor Portal'}</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '1.05rem', lineHeight: '1.7', position: 'relative', zIndex: 1, marginBottom: '2.5rem' }}>{t('doctorPortalDesc') || 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal-600)', fontWeight: '700', fontSize: '1rem', position: 'relative', zIndex: 1 }}>{t('enterPortal') || 'Enter Portal'} <ArrowRight size={18} /></div>
            </div>

            {/* Admin Portal */}
            <div onClick={() => {
              if (session.isAuthenticated && session.userRole === 'admin') {
                navigate('/admin-dashboard');
              } else {
                navigate('/auth?role=admin');
              }
            }} style={{ cursor: 'pointer', background: 'var(--gray-100)', padding: '4rem 3rem', borderRadius: '32px', border: '1px solid var(--teal-100)', transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-12px) scale(1.01)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(20,71,75,0.12)'; e.currentTarget.style.borderColor = 'var(--teal-200)'; }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--teal-100)'; }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '180px', background: 'radial-gradient(circle at top right, var(--teal-50) 0%, transparent 70%)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
                <div style={{ color: 'var(--teal-600)', background: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(20,71,75,0.1)' }}>
                  <Settings size={44} strokeWidth={1.5} />
                </div>
                <div style={{ background: 'var(--teal-100)', color: 'var(--teal-700)', padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '700' }}>{t('adminBadge') || 'Admin'}</div>
              </div>
              <h3 style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>{t('adminPortal') || 'Admin Portal'}</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '1.05rem', lineHeight: '1.7', position: 'relative', zIndex: 1, marginBottom: '2.5rem' }}>{t('adminPortalDesc') || 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal-600)', fontWeight: '700', fontSize: '1rem', position: 'relative', zIndex: 1 }}>{t('enterPortal') || 'Enter Portal'} <ArrowRight size={18} /></div>
            </div>

          </div>
        </div>
      </section>

      {/* 
          =============================================
          PATIENT JOURNEY TIMELINE
          =============================================
      */}
      <section style={{ padding: '8rem 2rem', background: 'white' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '3rem', color: 'var(--navy-900)', marginBottom: '5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
            {t('journeyTitle') || 'The Patient Journey'}
          </h2>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', left: '32px', top: '24px', bottom: '24px', width: '2px', background: 'var(--teal-100)', zIndex: 0 }}></div>

            {[
              { icon: <Mic size={24} />, title: t('journeyStep1Title') || 'Patient Speaks', desc: t('journeyStep1Desc') || 'Patient voices their medical history in their native language at the self-service kiosk.' },
              { icon: <Activity size={24} />, title: t('journeyStep2Title') || 'AI Processing', desc: t('journeyStep2Desc') || 'Our advanced NLP engine translates and structures the audio into clinical terminology.' },
              { icon: <ClipboardList size={24} />, title: t('journeyStep3Title') || 'Structured Report', desc: t('journeyStep3Desc') || 'A standardized, comprehensive clinical note is generated instantly.' },
              { icon: <Stethoscope size={24} />, title: t('journeyStep4Title') || 'Doctor Reviews', desc: t('journeyStep4Desc') || 'Doctor reviews the note on their dashboard before the patient even enters the room.' }
            ].map((step, idx) => (
              <div key={idx} className="timeline-step hover:-translate-y-1 transition-all" style={{ display: 'flex', gap: '2rem', position: 'relative', zIndex: 1, padding: '1.5rem', borderRadius: '24px', cursor: 'default' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-50)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(20,71,75,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--teal-50)', border: '2px solid var(--teal-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-600)', flexShrink: 0, boxShadow: '0 0 0 8px white' }}>
                  {step.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>{step.title}</h3>
                  <p style={{ color: 'var(--gray-600)', fontSize: '1.1rem', lineHeight: '1.6' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
          =============================================
          INTERACTIVE FAQ
          =============================================
      */}
      <section style={{ padding: '8rem 2rem', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '3rem', color: 'var(--navy-900)', marginBottom: '4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
            {t('faqTitle') || 'Frequently Asked Questions'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { q: t('faq1Q') || 'Is my medical data secure?', a: t('faq1A') || 'Yes, Swasthya Setu is fully compliant with ABDM guidelines. Patient data is encrypted and completely secure.' },
              { q: t('faq2Q') || 'Which languages are supported?', a: t('faq2A') || 'We currently support over 9 regional Indian languages including Hindi, Tamil, Telugu, Kannada, Bengali, and Marathi.' },
              { q: t('faq3Q') || 'Do patients need to be tech-savvy?', a: t('faq3A') || 'Not at all. The interface is primarily voice-driven, ensuring a zero-literacy barrier for rural and elderly patients.' }
            ].map((faq, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--teal-100)', transition: 'all 0.3s' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{ width: '100%', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--navy-900)' }}>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp color="var(--teal-500)" /> : <ChevronDown color="var(--gray-400)" />}
                </button>
                <div style={{ maxHeight: openFaq === idx ? '200px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out' }}>
                  <p style={{ padding: '0 2rem 1.5rem 2rem', color: 'var(--gray-600)', lineHeight: '1.6' }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
          =============================================
          CLEAN PROFESSIONAL FOOTER
          =============================================
      */}
      <footer style={{ background: '#1C1917', color: 'var(--gray-300)', padding: '6rem 2rem 3rem 2rem', borderTop: 'none' }}>
        <div className="container" style={{ maxWidth: '1250px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '5rem', marginBottom: '5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--gray-50)', padding: '6px', borderRadius: '12px', display: 'inline-flex' }}>
                  <SwasthyaLogo size={42} animated={false} />
                </div>
                <BrandTitle size="md" light={true} showTagline={true} taglineSize="sm" animated={true} />
              </div>
              <p style={{ color: '#D6D3D1', lineHeight: '1.6', fontSize: '1rem', marginBottom: '1.5rem' }}>
                {t('footerTagline') || 'Transforming healthcare accessibility through AI-driven clinical history taking. Zero literacy required.'}
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href="#" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'all 0.3s' }} className="hover:bg-teal-500 hover:-translate-y-1"><Twitter size={20} /></a>
                <a href="#" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'all 0.3s' }} className="hover:bg-teal-500 hover:-translate-y-1"><Linkedin size={20} /></a>
                <a href="#" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'all 0.3s' }} className="hover:bg-teal-500 hover:-translate-y-1"><Facebook size={20} /></a>
              </div>
            </div>

            <div>
              <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '2rem', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('footerPlatform') || 'Platform'}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.05rem' }}>
                <li>
                  <button 
                    onClick={() => {
                      if (session.isAuthenticated && session.userRole === 'patient') navigate('/patient-dashboard');
                      else navigate('/auth?role=patient');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#D6D3D1', cursor: 'pointer', fontSize: '1.05rem', textAlign: 'left' }}
                    className="hover:text-teal-400 transition-colors"
                  >
                    {t('patientPortal') || 'Patient Portal'}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (session.isAuthenticated && session.userRole === 'doctor') navigate('/physician');
                      else navigate('/auth?role=doctor');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#D6D3D1', cursor: 'pointer', fontSize: '1.05rem', textAlign: 'left' }}
                    className="hover:text-teal-400 transition-colors"
                  >
                    {t('doctorPortal')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (session.isAuthenticated && session.userRole === 'admin') navigate('/admin-dashboard');
                      else navigate('/auth?role=admin');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#D6D3D1', cursor: 'pointer', fontSize: '1.05rem', textAlign: 'left' }}
                    className="hover:text-teal-400 transition-colors"
                  >
                    {t('adminPortal') || 'Admin Dashboard'}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '2rem', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('footerFeedback') || 'Share Feedback'}</h4>
              <p style={{ color: '#D6D3D1', marginBottom: '1.5rem', lineHeight: '1.6' }}>{t('footerFeedbackDesc') || 'We value your input. Let us know how we can improve.'}</p>

              {feedbackSubmitted ? (
                <div style={{ background: 'rgba(20, 184, 166, 0.1)', color: 'var(--teal-400)', padding: '16px', borderRadius: '12px', border: '1px solid var(--teal-500)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={24} color="var(--teal-400)" />
                  <span style={{ fontWeight: 'bold' }}>{t('footerFeedbackSuccess') || 'Thank you for your feedback!'}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea value={feedbackText} onChange={event => setFeedbackText(event.target.value)} placeholder={t('footerFeedbackPlaceholder') || 'Your feedback...'} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', outline: 'none', resize: 'vertical', minHeight: '80px' }}></textarea>
                  <button onClick={submitFeedback} style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: 'var(--teal-500)', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', width: '100%' }} className="hover:bg-teal-400">{t('footerFeedbackSubmit') || 'Submit Feedback'}</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', color: '#A8A29E' }}>
            <p>&copy; {new Date().getFullYear()} {t('appName')}</p>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <a href="#" className="hover:text-teal-400" style={{ transition: 'color 0.2s', color: '#A8A29E' }}>{t('termsOfService') || 'Terms of Service'}</a>
              <a href="#" className="hover:text-teal-400" style={{ transition: 'color 0.2s', color: '#A8A29E' }}>{t('privacyPolicy') || 'Privacy Policy'}</a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
