import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, PhoneCall, CalendarPlus, Menu, X, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import VoiceNavIndicator from '../voicenav/VoiceNavIndicator';
import SwasthyaLogo from './SwasthyaLogo';
import BrandTitle from './BrandTitle';

export default function Header() {
  const navigate = useNavigate();
  const { currentLang, setCurrentLang, availableLanguages, t } = useLanguage();
  const { session, logout } = useSession();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 'var(--header-height)',
      background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'white',
      backdropFilter: isScrolled ? 'blur(16px)' : 'none',
      borderBottom: isScrolled ? '1px solid var(--gray-200)' : '1px solid transparent',
      boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
      zIndex: 1000,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{ width: '100%', height: '100%', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand / Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }} className="hover-scale">
          <SwasthyaLogo size={46} animated={true} />
          <BrandTitle size="md" showTagline={true} taglineSize="sm" animated={true} />
        </Link>

        {/* Navigation & Actions (Always visible) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

          {/* Language Selector */}
          <div style={{ position: 'relative' }} className="notranslate" translate="no">
            <button 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--teal-50)', border: '1px solid var(--teal-200)', padding: '10px 20px', borderRadius: '24px', color: 'var(--teal-700)', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              className="hover:-translate-y-1 hover:shadow-lg notranslate"
              translate="no"
            >
              <Globe size={18} />
              {availableLanguages.find(l => l.code === currentLang)?.name || currentLang}
              <ChevronDown size={16} style={{ transition: 'transform 0.3s', transform: langDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>

            {langDropdownOpen && (
              <div className="animate-fade-in-down" style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 15px 50px rgba(0,0,0,0.15)', border: '1px solid var(--gray-200)', overflow: 'hidden', minWidth: '200px', zIndex: 100 }}>
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLang(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    style={{ width: '100%', textAlign: 'left', padding: '14px 20px', background: currentLang === lang.code ? 'var(--teal-600)' : 'white', color: currentLang === lang.code ? 'white' : 'var(--navy-700)', fontWeight: currentLang === lang.code ? '700' : '500', fontSize: '0.95rem', borderBottom: '1px solid var(--gray-100)', transition: 'all 0.2s' }}
                    className="hover:bg-teal-50 hover:text-teal-700"
                  >
                    {lang.nativeName} <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '4px' }}>({lang.name})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
