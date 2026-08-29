import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import { Mic, FileText, Link as LinkIcon, Share2, ShieldCheck, Check } from 'lucide-react';
import AudioButton from '../components/AudioButton';
import '../styles/consent.css';

export default function ConsentPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, setConsent, setAllConsents } = useSession();
  const { consents } = session;
  const { audioPromptManager, registerPage, unregisterPage } = useVoiceNav();

  const allAgreed = consents.voice && consents.document && consents.abha && consents.share;

  useEffect(() => {
    audioPromptManager.speakPageWelcome('consent');

    registerPage('consent', {
      next: handleProceed,
      back: () => navigate('/language'),
      yes: () => {
        setAllConsents(true);
        audioPromptManager.speakText("You have agreed to all items. Say next to proceed.");
      },
      no: () => {
        setAllConsents(false);
      }
    });

    return () => unregisterPage('consent');
  }, [audioPromptManager, navigate, registerPage, unregisterPage, allAgreed]);

  const toggleAll = () => {
    setAllConsents(!allAgreed);
  };

  const handleProceed = () => {
    if (consents.voice) {
      navigate('/interview');
    } else {
      // If voice not allowed, skip interview, go to scan (or alert user)
      // For this app, we require at least voice or document
      navigate('/interview');
    }
  };

  const consentItems = [
    {
      id: 'voice',
      icon: <Mic size={24} />,
      titleKey: 'consentVoice',
      descKey: 'consentVoiceDesc'
    },
    {
      id: 'document',
      icon: <FileText size={24} />,
      titleKey: 'consentDocument',
      descKey: 'consentDocumentDesc'
    },
    {
      id: 'abha',
      icon: <LinkIcon size={24} />,
      titleKey: 'consentAbha',
      descKey: 'consentAbhaDesc'
    },
    {
      id: 'share',
      icon: <Share2 size={24} />,
      titleKey: 'consentShare',
      descKey: 'consentShareDesc'
    }
  ];

  return (
    <div className="consent-page animate-fade-in">
      <div className="consent-header">
        <h1 className="consent-title flex-center gap-3">
          {t('consentTitle')}
          <AudioButton textKey="welcomeConsent" />
        </h1>
        <p className="consent-subtitle">{t('consentSubtitle')}</p>
      </div>

      <div className="consent-container stagger-children">
        
        {/* Master Toggle */}
        <div className="master-toggle animate-fade-in-up">
          <div className="flex items-center gap-3">
            <Check size={28} color={allAgreed ? "var(--teal-600)" : "var(--gray-400)"} />
            <span className="master-toggle-text">{t('agreeAll')}</span>
          </div>
          <div 
            className={`toggle-switch ${allAgreed ? 'active' : ''}`}
            onClick={toggleAll}
            style={{ transform: 'scale(1.2)', transformOrigin: 'right center' }}
          />
        </div>

        {/* Individual Items */}
        {consentItems.map((item, index) => (
          <div 
            key={item.id} 
            className={`consent-card animate-fade-in-up ${consents[item.id] ? 'active' : ''}`}
            style={{ animationDelay: `${(index + 1) * 0.1}s` }}
          >
            <div className="consent-icon">
              {item.icon}
            </div>
            
            <div className="consent-content">
              <div className="consent-item-header">
                <span className="consent-item-title">{t(item.titleKey)}</span>
                <AudioButton textKey={item.titleKey} customText={t(item.descKey)} size={16} />
              </div>
              <p className="consent-item-desc">{t(item.descKey)}</p>
            </div>
            
            <div className="consent-toggle-wrapper">
              <div 
                className={`toggle-switch ${consents[item.id] ? 'active' : ''}`}
                onClick={() => setConsent(item.id, !consents[item.id])}
              />
            </div>
          </div>
        ))}

        {/* Notice */}
        <div className="dpdp-notice animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <ShieldCheck size={20} className="flex-shrink-0 text-teal-600" />
          <p>{t('dpdpNotice')}</p>
        </div>

      </div>

      <div style={{ marginTop: 'var(--space-10)', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px' }}>
        <button className="btn btn-ghost btn-lg" onClick={() => navigate('/language')}>
          {t('back')}
        </button>
        <button 
          className="btn btn-primary btn-xl animate-pulse-glow" 
          onClick={handleProceed}
          disabled={!consents.voice && !consents.document}
        >
          {t('proceedWithConsent')}
        </button>
      </div>
    </div>
  );
}
