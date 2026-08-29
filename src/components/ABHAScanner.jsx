import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function ABHAScanner({ onScan, onClose, t }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "abha-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [0] }, // 0 = QR_CODE
      false
    );
    
    scanner.render((decodedText) => {
      // On success
      scanner.clear();
      onScan(decodedText);
    }, (error) => {
      // On error/scanning - ignore
    });
    
    return () => {
      try {
        scanner.clear();
      } catch (e) {
        console.error("Failed to clear scanner on unmount", e);
      }
    };
  }, [onScan]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'var(--gray-100)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={18} color="var(--gray-600)" />
        </button>
        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--teal-700)' }}>
          {t ? t('scanAbha') || 'Scan ABHA QR Code' : 'Scan ABHA QR Code'}
        </h3>
        <div id="abha-reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: 'var(--gray-500)' }}>
          Point your camera at an ABHA ID card
        </p>
      </div>
    </div>
  );
}
