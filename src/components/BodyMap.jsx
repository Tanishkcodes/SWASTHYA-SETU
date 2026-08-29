import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';

export default function BodyMap({ onSelect }) {
  const { t } = useLanguage();
  const { speak, language } = useVoiceNav();

  const handleSelect = (part) => {
    // Speak confirmation
    speak(t(part), language);
    onSelect(part);
  };

  // Simplified SVG for demo purposes
  return (
    <div className="body-map-container animate-fade-in-up">
      <svg 
        viewBox="0 0 200 500" 
        className="body-map-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head */}
        <circle 
          cx="100" cy="50" r="30" 
          className="body-part"
          onClick={() => handleSelect('head')}
        />
        <text x="100" y="55" fontSize="12" textAnchor="middle" pointerEvents="none" fill="#0f766e">
          {t('head')}
        </text>

        {/* Neck */}
        <rect 
          x="85" y="80" width="30" height="20" 
          className="body-part"
          onClick={() => handleSelect('neck')}
        />

        {/* Chest */}
        <path 
          d="M60 100 L140 100 L130 180 L70 180 Z" 
          className="body-part"
          onClick={() => handleSelect('chest')}
        />
        <text x="100" y="145" fontSize="12" textAnchor="middle" pointerEvents="none" fill="#0f766e">
          {t('chest')}
        </text>

        {/* Abdomen */}
        <path 
          d="M70 180 L130 180 L125 260 L75 260 Z" 
          className="body-part"
          onClick={() => handleSelect('abdomen')}
        />
        <text x="100" y="225" fontSize="12" textAnchor="middle" pointerEvents="none" fill="#0f766e">
          {t('abdomen')}
        </text>

        {/* Arms */}
        <rect 
          x="30" y="100" width="25" height="120" rx="10"
          className="body-part"
          onClick={() => handleSelect('leftArm')}
        />
        <rect 
          x="145" y="100" width="25" height="120" rx="10"
          className="body-part"
          onClick={() => handleSelect('rightArm')}
        />

        {/* Legs */}
        <rect 
          x="75" y="260" width="22" height="180" rx="10"
          className="body-part"
          onClick={() => handleSelect('leftLeg')}
        />
        <rect 
          x="103" y="260" width="22" height="180" rx="10"
          className="body-part"
          onClick={() => handleSelect('rightLeg')}
        />
      </svg>
    </div>
  );
}
