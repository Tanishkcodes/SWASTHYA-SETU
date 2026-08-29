import React, { useRef, useState, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { useLanguage } from '../context/LanguageContext';
import { X } from 'lucide-react';

import hindiLayout from 'simple-keyboard-layouts/build/layouts/hindi';
import bengaliLayout from 'simple-keyboard-layouts/build/layouts/bengali';
import kannadaLayout from 'simple-keyboard-layouts/build/layouts/kannada';
import malayalamLayout from 'simple-keyboard-layouts/build/layouts/malayalam';
import teluguLayout from 'simple-keyboard-layouts/build/layouts/telugu';

// Custom / Fallback layouts for languages not in simple-keyboard-layouts
const marathiLayout = {
  layout: {
    default: [
      "औ ऐ आ ई ऊ ब भ ग ध ज ड ड़ ऍ",
      "ो ौ ॉ ा ी ू ब भ ग ध ज ड ड़",
      "े ୈ ॅ ि ु प फ क ख च छ ट ठ",
      "ॉ ं म न व ल स य ळ",
      "{shift} {space} {bksp}"
    ],
    shift: [
      "औ ऐ आ ई ऊ ब भ ग ध ज ड ड़ ऍ",
      "ो ौ ॉ ा ी ू ब भ ग ध ज ड ड़",
      "े ୈ ॅ ि ु प फ क ख च छ ट ठ",
      "ॉ ं म न व ल स य ळ",
      "{shift} {space} {bksp}"
    ]
  }
};

const tamilLayout = {
  layout: {
    default: [
      "ா ி ீ ு ூ ெ ே ை ொ ோ ௌ",
      "அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ",
      "க ங ச ஞ ட ண த ந ப ம",
      "ய ர ல வ ழ ள ற ன ஜ ஷ ஸ ஹ க்",
      "{shift} {space} {bksp}"
    ],
    shift: [
      "ா ி ீ ு ூ ெ ே ை ொ ோ ௌ",
      "அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ",
      "க ங ச ஞ ட ண த ந ப ம",
      "ய ர ல வ ழ ள ற ன ஜ ஷ ஸ ஹ க்",
      "{shift} {space} {bksp}"
    ]
  }
};

const gujaratiLayout = {
  layout: {
    default: [
      "ો ૌ ા ી ૂ બ ભ ગ ધ જ ડ",
      "ે ૈ િ ુ પ ફ ક ખ ચ છ ટ ઠ",
      "ં મ ન વ લ સ ય શ ષ ળ",
      "અ આ ઇ ઈ ઉ ઊ એ ઐ ઓ ઔ",
      "{shift} {space} {bksp}"
    ],
    shift: [
      "ો ૌ ા ી ૂ બ ભ ગ ધ જ ડ",
      "ે ૈ િ ુ પ ફ ક ખ ચ છ ટ ઠ",
      "ં મ ન વ લ સ ય શ ષ ળ",
      "અ આ ઇ ઈ ઉ ઊ એ ઐ ઓ ઔ",
      "{shift} {space} {bksp}"
    ]
  }
};

const layouts = {
  en: undefined, // Default english
  hi: hindiLayout.layout,
  ta: tamilLayout.layout,
  te: teluguLayout.layout,
  bn: bengaliLayout.layout,
  mr: marathiLayout.layout,
  gu: gujaratiLayout.layout,
  kn: kannadaLayout.layout,
  ml: malayalamLayout.layout,
};

export default function VirtualKeyboard({ inputName, inputValue, onChange, onClose }) {
  const { currentLang } = useLanguage();
  const keyboardRef = useRef();

  useEffect(() => {
    if (keyboardRef.current) {
      keyboardRef.current.setInput(inputValue);
    }
  }, [inputValue]);

  const onChangeKeyboard = (input) => {
    onChange({ target: { name: inputName, value: input } });
  };

  const getLayout = () => {
    return layouts[currentLang];
  };

  return (
    <div className="virtual-keyboard-container animate-fade-in-up" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--gray-100)',
      padding: '1rem',
      borderTop: '1px solid var(--gray-300)',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
      zIndex: 2000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', maxWidth: '800px', margin: '0 auto 0.5rem auto' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
          Virtual Keyboard ({currentLang.toUpperCase()})
        </span>
        <button onClick={onClose} style={{ background: 'var(--red-50)', color: 'var(--red-600)', padding: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Keyboard
          keyboardRef={r => (keyboardRef.current = r)}
          layout={getLayout()}
          onChange={onChangeKeyboard}
          theme="hg-theme-default hg-theme-ios"
          display={{
            '{bksp}': 'Backspace ⌫',
            '{enter}': 'Enter ↵',
            '{shift}': 'Shift ⇧',
            '{s}': 'shift',
            '{tab}': 'tab',
            '{lock}': 'caps',
            '{accept}': 'Submit',
            '{space}': 'Space'
          }}
        />
      </div>
    </div>
  );
}
