import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import { useVoiceNav } from '../voicenav/VoiceNavProvider';
import OCRProcessor from '../engine/OCRProcessor';
import { db } from '../lib/db';
import AudioButton from '../components/AudioButton';
import { Camera, FileText, CheckCircle, Loader, Trash2 } from 'lucide-react';
import '../styles/scan.css';

export default function DocumentScanPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { session, addDocument, updateDocument, removeDocument } = useSession();
  const { audioPromptManager, registerPage, unregisterPage } = useVoiceNav();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [docType, setDocType] = useState('prescription'); // prescription, lab

  useEffect(() => {
    audioPromptManager.speakPageWelcome('scan');

    registerPage('scan', {
      next: () => navigate('/patient-dashboard'),
      back: () => navigate('/patient-dashboard'),
      takePicture: handleCapture,
    });

    startCamera();

    return () => {
      unregisterPage('scan');
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Camera access denied or not available", err);
      // We'll show a fallback UI if camera fails
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = async () => {
    if (!cameraActive) {
      // Simulate capture if no camera (e.g. desktop dev)
      simulateCapture();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Draw current video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    processImage(imageDataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        processImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateCapture = () => {
    // No camera means no captured image. Ask for a real file instead.
    fileInputRef.current?.click();
  };
  const processImage = async (imageDataUrl) => {
    audioPromptManager.speakText("Analyzing document...");
    
    // 1. Create document entry
    const doc = {
      type: docType,
      imageData: imageDataUrl,
      status: 'analyzing',
    };
    
    // Need a temporary ID since context adds its own.
    // We'll just add it, then find the latest one (simplified for demo).
    const tempId = Date.now().toString();
    const docWithId = { ...doc, id: tempId, timestamp: new Date().toISOString() };
    
    // Direct state mutation workaround for demo simplicity since we don't have the exact ID back from reducer immediately
    // In real app, action would return ID or we pass ID in.
    addDocument(docWithId);

    // 2. Process with OCR Engine
    try {
      const result = await OCRProcessor.processImage(imageDataUrl, docType);
      
      if (!result.success || !result.isMedicalDocument) {
        updateDocument(tempId, { status: 'error', error: result.summary || result.error || 'No readable medical document was detected.' });
        return;
      }
      if (result.success && result.isMedicalDocument) {
        let persisted = null;
        if (session.patient?.id) {
          const blob = await (await fetch(imageDataUrl)).blob();
          const file = new File([blob], `${docType}-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
          const saved = await db.reports.upload({
            patientId: session.patient.id,
            appointmentId: null,
            reportType: docType,
            title: `${docType === 'lab' ? 'Lab report' : 'Prescription'} ${new Date().toLocaleDateString()}`,
            file,
            ocrText: result.extractedText || JSON.stringify(result),
          });
          if (saved.error) throw saved.error;
          persisted = saved.data;
        }
        audioPromptManager.speakText("Document scanned successfully.");
        updateDocument(tempId, {
          status: 'success',
          extractedData: result,
          databaseId: persisted?.id || null,
          filePath: persisted?.file_url || null,
        });
      }
    } catch (e) {
      updateDocument(tempId, { status: 'error', error: e?.message || 'Document analysis failed. Please try a clearer image.' });
      audioPromptManager.speakError();
    }
  };

  return (
    <div className="scan-page animate-fade-in">
      <div className="scan-header">
        <h1 className="scan-title flex-center gap-3">
          {t('scanDocuments')}
          <AudioButton textKey="welcomeScan" />
        </h1>
        <p className="scan-subtitle">{t('scanSubtitle')}</p>
      </div>

      <div className="scan-content">
        
        {/* Document Type Selector */}
        <div className="flex gap-4 mb-4 justify-center" style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
          <button 
            className={`btn ${docType === 'prescription' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDocType('prescription')}
          >
            Prescription
          </button>
          <button 
            className={`btn ${docType === 'lab' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setDocType('lab')}
          >
            Lab Report
          </button>
        </div>

        {/* Camera Container */}
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline className="camera-preview" style={{ display: cameraActive ? 'block' : 'none' }} />
          {!cameraActive && (
            <div className="text-gray-400 flex-col-center gap-2">
              <Camera size={48} />
              <span>Camera not available. Upload a clear image from your gallery.</span>
            </div>
          )}
          
          <div className="camera-overlay">
            <div className="scan-frame"></div>
          </div>

          <div className="camera-actions" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <button className="btn-capture" onClick={handleCapture} title="Take Picture" style={{ marginBottom: '12px' }}>
              <div className="btn-capture-inner"></div>
            </button>
            <button 
              className="btn btn-outline bg-white/20 backdrop-blur-md text-white border-white/40" 
              onClick={() => fileInputRef.current.click()}
            >
              Upload from Gallery instead
            </button>
          </div>

          {/* Hidden canvas for image extraction */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Hidden file input for fallback */}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
        </div>

        {/* Document List */}
        {session.documents.length > 0 && (
          <div className="doc-list animate-fade-in-up mt-6">
            <h3 className="font-bold text-navy-800 mb-2">Scanned Documents ({session.documents.length})</h3>
            
            {session.documents.map(doc => (
              <div key={doc.id} className="doc-card">
                <img src={doc.imageData} alt="Scan thumbnail" className="doc-thumb" />
                
                <div className="doc-info">
                  <div className="doc-title">{doc.type === 'prescription' ? 'Old Prescription' : 'Lab Report'}</div>
                  
                  {doc.status === 'analyzing' && (
                    <div className="doc-status status-analyzing">
                      <Loader size={14} className="animate-spin" /> Analyzing text...
                    </div>
                  )}
                  
                  {doc.status === 'success' && (
                    <div className="doc-status status-success">
                      <CheckCircle size={14} /> Extraction complete
                    </div>
                  )}
                  {doc.status === 'error' && <div role="alert" style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{doc.error || 'This document could not be analyzed.'}</div>}

                  {/* Show preview of extracted data if available */}
                  {doc.status === 'success' && doc.extractedData && (
                    <div className="analysis-panel">
                      {doc.type === 'prescription' && (doc.extractedData.structuredData?.medications || []).map((med, i) => (
                        <div key={i} className="analysis-item">
                          <span className="analysis-label">{med.name}:</span>
                          <span className="analysis-value">{med.dosage} ({med.duration || 'SOS'})</span>
                        </div>
                      ))}
                      {doc.type === 'lab' && (doc.extractedData.structuredData?.tests || []).map((test, i) => (
                        <div key={i} className="analysis-item">
                          <span className="analysis-label">{test.name}:</span>
                          <span className="analysis-value" style={{ color: test.flag === 'Normal' ? 'inherit' : 'var(--red-600)' }}>
                            {test.result} {test.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  className="btn-icon btn-ghost text-red-500" 
                  onClick={() => removeDocument(doc.id)}
                  title="Remove"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/patient-dashboard')}>
          {t('back')}
        </button>
        <button className="btn btn-primary btn-xl animate-pulse-glow" onClick={() => navigate('/patient-dashboard')}>
          View in Dashboard
        </button>
      </div>
    </div>
  );
}
