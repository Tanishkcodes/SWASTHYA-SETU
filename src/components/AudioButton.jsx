import React from 'react';
import { Volume2, Square } from 'lucide-react';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';

export default function AudioButton({ textKey, customText, lang, size = 20, className = 'audio-btn-inline' }) {
  const { speak, isSpeaking, audioPromptManager, language } = useVoiceNav();

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      audioPromptManager.stop();
    } else {
      if (customText) {
        speak(customText, lang || language);
      } else if (textKey) {
        audioPromptManager.forceSpeak(textKey);
      }
    }
  };

  return (
    <button 
      className={className} 
      onClick={handlePlay}
      title="Listen"
      aria-label="Listen to explanation"
      type="button"
    >
      {isSpeaking ? <Square size={size * 0.8} fill="currentColor" /> : <Volume2 size={size} />}
    </button>
  );
}
