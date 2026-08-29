import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import SummaryGenerator from '../engine/SummaryGenerator';
import AudioButton from '../components/AudioButton';
import { FileText, User, Activity, AlertCircle, Database } from 'lucide-react';
import '../styles/summary.css';

export default function SummaryPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, setSummary } = useSession();
  const { audioPromptManager, registerPage, unregisterPage } = useVoiceNav();
  
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    // Generate summary on mount
    const generated = SummaryGenerator.generate(session);
    setSummaryData(generated);
    setSummary(generated);

    audioPromptManager.speakPageWelcome('summary');

    registerPage('summary', {
      next: () => navigate('/completion'),
      back: () => navigate('/scan'),
    });

    return () => unregisterPage('summary');
  }, []);

  if (!summaryData) return null;

  return (
    <div className="summary-page animate-fade-in">
      <div className="summary-header">
        <h1 className="summary-title flex-center gap-3">
          {t('clinicalSummary')}
          <AudioButton textKey="welcomeSummary" />
        </h1>
        <p className="summary-subtitle">Review before final submission</p>
      </div>

      <div className="summary-content stagger-children">
        
        {/* Red Flags Alert */}
        {summaryData.redFlags && summaryData.redFlags.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-fade-in-up" style={{ background: 'var(--red-50)', borderLeft: '4px solid var(--red-500)', padding: 'var(--space-4)', borderRadius: '0 var(--radius-lg) var(--radius-lg) 0'}}>
            <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--red-800)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <AlertCircle size={20} /> Critical Alerts Detected
            </h3>
            <ul style={{ listStyle: 'disc', paddingLeft: '24px', color: 'var(--red-700)' }}>
              {summaryData.redFlags.map((flag, idx) => (
                <li key={idx} className="text-sm">{flag.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Patient Demographics */}
        <div className="summary-card animate-fade-in-up">
          <div className="summary-card-header">
            <User size={20} /> Patient Information
          </div>
          <div className="summary-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="summary-field">
              <span className="summary-label">Name</span>
              <span className="summary-value font-semibold">{summaryData.demographics.name}</span>
            </div>
            <div className="summary-field">
              <span className="summary-label">Age / Gender</span>
              <span className="summary-value">{summaryData.demographics.age} / {summaryData.demographics.gender}</span>
            </div>
            <div className="summary-field">
              <span className="summary-label">Contact</span>
              <span className="summary-value">{summaryData.demographics.phone}</span>
            </div>
            <div className="summary-field">
              <span className="summary-label">Auth Method</span>
              <span className="summary-value uppercase">{summaryData.demographics.authMethod}</span>
            </div>
          </div>
        </div>

        {/* Clinical History */}
        <div className="summary-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="summary-card-header">
            <Activity size={20} /> Clinical History
          </div>
          <div className="summary-card-body">
            <div className="summary-field">
              <span className="summary-label">History of Present Illness</span>
              <span className="summary-value">{summaryData.subjective.hpi}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--gray-200)' }} />
            <div className="summary-field">
              <span className="summary-label">Past Medical & Surgical</span>
              <span className="summary-value">{summaryData.subjective.pmh}</span>
            </div>
            
            {summaryData.ayush && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid var(--gray-200)' }} />
                <div className="summary-field">
                  <span className="summary-label">AYUSH Assessment</span>
                  <span className="summary-value font-semibold text-orange-600">{summaryData.ayush}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="summary-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="summary-card-header">
            <FileText size={20} /> Extracted Documents
          </div>
          <div className="summary-card-body">
            <div className="summary-field">
              <span className="summary-value">{summaryData.subjective.documents}</span>
            </div>
          </div>
        </div>

        {/* SNOMED Codes */}
        <div className="summary-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="summary-card-header">
            <Database size={20} /> Proposed SNOMED-CT Codes
          </div>
          <div className="summary-card-body">
            <div>
              {summaryData.snmmedCodes.map(code => (
                <span key={code.code} className="snomed-tag">
                  {code.term} ({code.code})
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">These codes will be attached to the FHIR bundle upon submission.</p>
          </div>
        </div>

      </div>

      <div style={{ marginTop: 'var(--space-10)', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/scan')}>
          {t('back')}
        </button>
        <button className="btn btn-primary btn-xl animate-pulse-glow" onClick={() => navigate('/completion')}>
          {t('submitToDoctor')}
        </button>
      </div>
    </div>
  );
}
