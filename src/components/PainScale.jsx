import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';

export default function PainScale({ onSelect }) {
  const { t } = useLanguage();
  const { speak, language } = useVoiceNav();
  const [value, setValue] = useState(5);

  const faces = [
    { emoji: '😀', label: 'No Pain' },
    { emoji: '🙂', label: 'Mild' },
    { emoji: '😐', label: 'Moderate' },
    { emoji: '☹️', label: 'Severe' },
    { emoji: '😫', label: 'Very Severe' },
    { emoji: '😭', label: 'Worst Pain' },
  ];

  const getFaceIndex = (val) => Math.floor(val / 2);

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  const handleFaceClick = (index) => {
    const newVal = index * 2;
    setValue(newVal);
  };

  const handleConfirm = () => {
    speak(`${value} out of 10`, language);
    onSelect(value);
  };

  return (
    <div className="pain-scale-container animate-fade-in-up">
      <div className="pain-faces">
        {faces.map((face, index) => (
          <span 
            key={index} 
            className={`pain-face ${getFaceIndex(value) === index ? 'active' : ''}`}
            onClick={() => handleFaceClick(index)}
            title={face.label}
          >
            {face.emoji}
          </span>
        ))}
      </div>

      <input 
        type="range" 
        min="0" 
        max="10" 
        step="1"
        value={value} 
        onChange={handleChange}
        className="pain-slider"
      />

      <div className="pain-value-display">
        {value} / 10
      </div>

      <button className="btn btn-primary" onClick={handleConfirm}>
        {t('next')}
      </button>
    </div>
  );
}
