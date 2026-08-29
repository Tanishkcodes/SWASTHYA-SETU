import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import aiCommandEngine from '../engine/AICommandEngine';

export default function VoiceInput({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  className,
  style,
  type = 'text',
  name,
  maxLength
}) {
  const { 
    startListening, 
    stopListening, 
    isListening, 
    setOnTranscript, 
    clearOnTranscript, 
    setDictationMode,
    language
  } = useVoiceNav();
  const [isDictating, setIsDictating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isListening && isDictating) {
      setIsDictating(false);
      setDictationMode(false);
      clearOnTranscript();
    }
  }, [isListening, isDictating, clearOnTranscript, setDictationMode]);

  useEffect(() => {
    return () => {
      if (isDictating) {
        setDictationMode(false);
        clearOnTranscript();
      }
    };
  }, [isDictating, setDictationMode, clearOnTranscript]);

  const startDictation = () => {
    if (inputRef.current) inputRef.current.focus();
    setIsDictating(true);
    setDictationMode(true);
    
    setOnTranscript(async (rawText) => {
      if (!rawText || !rawText.trim()) return;
      
      const extracted = await aiCommandEngine.extractRegistrationDetails(rawText, language);
      
      let usefulValue = null;
      const isNumeric = type === 'number' || type === 'tel' || name === 'age' || name === 'phone' || name === 'aadhaar' || name === 'abhaId';
      
      if (name === 'name' || name === 'fullName') {
        if (extracted?.name && extracted.name.trim().length > 0) {
          usefulValue = extracted.name.trim();
        } else {
          // If raw input is a clean 1-3 word name without sentence fluff
          const words = rawText.trim().split(/\s+/);
          if (words.length <= 3 && !rawText.match(/\b(?:doctor|hospital|pain|dard|fever|tablet|help|kya|kyun|kahan|where|when|what|how)\b/i)) {
            usefulValue = rawText.trim();
          }
        }
      } else if (name === 'age') {
        if (extracted?.age && /^\d{1,3}$/.test(extracted.age.trim())) {
          const ageNum = parseInt(extracted.age.trim(), 10);
          if (ageNum >= 1 && ageNum <= 120) usefulValue = String(ageNum);
        }
      } else if (name === 'phone') {
        if (extracted?.phone && /^\d{10}$/.test(extracted.phone.trim())) {
          usefulValue = extracted.phone.trim();
        }
      } else if (isNumeric) {
        const digits = aiCommandEngine._convertSpokenNumberWords(rawText).replace(/[^0-9]/g, '');
        if (name === 'aadhaar' && digits.length >= 4) usefulValue = digits.slice(0, 12);
        else if (name === 'abhaId') {
          if (digits.length >= 14) {
            usefulValue = `${digits.slice(0,2)}-${digits.slice(2,6)}-${digits.slice(6,10)}-${digits.slice(10,14)}`;
          } else if (digits.length >= 4) {
            usefulValue = digits;
          }
        }
      }
      
      // ONLY update the input field if a genuinely useful value was understood and extracted
      if (usefulValue) {
        onChange({
          target: { name: name, value: usefulValue }
        });
      }
    });

    startListening(true);
  };

  const stopDictation = () => {
    if (isDictating) {
      stopListening();
      setIsDictating(false);
      setDictationMode(false);
      clearOnTranscript();
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (!isDictating) startDictation();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDictation();
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (isDictating) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        ref={inputRef}
        type={type}
        name={name}
        className={className}
        style={{ ...style, paddingRight: '44px' }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={maxLength}
      />
      <button
        type="button"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          position: 'absolute',
          right: '8px',
          background: isDictating ? 'var(--red-100, #fee2e2)' : 'transparent',
          border: 'none',
          padding: '6px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isDictating ? 'var(--red-600, #dc2626)' : 'var(--teal-600, #0d9488)',
          transition: 'all 0.2s',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
        title={isDictating ? "Stop dictating" : "Speak to fill this field"}
      >
        {isDictating ? (
          <MicOff size={18} className="animate-pulse" />
        ) : (
          <Mic size={18} />
        )}
      </button>
    </div>
  );
}
