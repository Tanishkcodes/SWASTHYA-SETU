import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import { Check, ArrowRight } from 'lucide-react';
import { db } from '../lib/db';
import '../styles/summary.css';

export default function CompletionPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, setToken, setSubmitted, resetSession } = useSession();
  const { audioPromptManager, registerPage, unregisterPage } = useVoiceNav();

  useEffect(() => {
    const submit = async () => {
      if (!session.intakeId) return;
      const { data, error } = await db.intakes.submit(session.intakeId);
      if (error) { console.error('Unable to submit clinical intake', error); return; }
      setToken(data?.token_number || null);
      setSubmitted(true);
    };
    submit();

    audioPromptManager.speakPageWelcome('completion');

    registerPage('completion', {
      home: () => {
        // Just navigate to dashboard, don't reset session entirely so they can see their token!
        navigate('/patient-dashboard', { replace: true });
      }
    });

    return () => unregisterPage('completion');
  }, []);

  const handleFinish = () => {
    // Navigate to dashboard
    navigate('/patient-dashboard', { replace: true });
  };

  return (
    <div className="completion-page animate-fade-in">
      <div className="completion-container">
        
        <div className="success-icon-wrapper">
          <Check size={64} strokeWidth={3} />
        </div>

        <h1 className="text-4xl font-extrabold text-navy-800" style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--weight-extrabold)', color: 'var(--navy-800)' }}>
          {t('thankYou')}
        </h1>
        
        <p className="completion-message">
          Your information has been securely submitted to the doctor.
        </p>

        <div className="token-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <span className="token-label">Your Token Number</span>
          <span className="token-number">{session.tokenNumber || '---'}</span>
          <p className="text-sm text-gray-500 mt-2">Please wait in the OPD area for your turn.</p>
        </div>

        <button 
          className="btn btn-outline btn-lg mt-8" 
          onClick={handleFinish}
          style={{ marginTop: 'var(--space-8)' }}
        >
          {t('home')} <ArrowRight size={20} />
        </button>

      </div>
    </div>
  );
}
