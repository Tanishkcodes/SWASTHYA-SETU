import voiceAIService from '../voicenav/VoiceAIService';

/* Clinical document analysis. This module never invents OCR data: when the
   vision service cannot verify the image, it returns an explicit failure. */
export class OCRProcessor {
  static emptyStructuredData() {
    return { date: '', labName: '', tests: [], medications: [], findings: '', impression: '', notes: '' };
  }

  static async processImage(imageDataUrl, type = 'general', fileName = '') {
    if (typeof imageDataUrl !== 'string' || !/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(imageDataUrl)) {
      return {
        success: false,
        isMedicalDocument: null,
        type: 'Unsupported file',
        category: 'unverified',
        extractedText: '',
        summary: 'This file could not be visually analyzed. Upload a clear JPG, PNG, or WebP image.',
        error: 'A supported image is required for vision OCR.',
        structuredData: this.emptyStructuredData(),
      };
    }

    try {
      const result = await voiceAIService.analyzeReport(imageDataUrl, fileName);
      if (!result || typeof result.isMedicalDocument !== 'boolean') {
        throw new Error('The vision service returned no verifiable classification.');
      }

      const parameters = Array.isArray(result.detectedParameters)
        ? result.detectedParameters.filter(item => item && String(item.name || '').trim() && String(item.result || '').trim())
        : [];
      const evidence = Array.isArray(result.evidenceText)
        ? result.evidenceText.map(line => String(line || '').trim()).filter(Boolean)
        : [];
      const summary = String(result.summary || '').trim();
      const documentType = String(result.documentType || (result.isMedicalDocument ? 'Medical document' : 'Non-medical image')).trim();

      if (!result.isMedicalDocument) {
        return {
          success: true,
          isMedicalDocument: false,
          type: documentType,
          category: 'non-medical',
          text: summary,
          extractedText: '',
          summary: summary || 'No medical document or clinical data was detected in this image.',
          ocr_text: '',
          ocrSummary: '',
          confidence: Number(result.confidence || 0),
          structuredData: this.emptyStructuredData(),
        };
      }

      // A medical classification alone is insufficient. Require readable
      // evidence and reasonable confidence; do not interpret bare scans.
      if (!evidence.length || Number(result.confidence || 0) < 0.65) {
        throw new Error('The image was classified as medical, but no readable evidence could be verified.');
      }

      const textLines = [
        `${documentType}${result.labOrHospitalName ? ` — ${result.labOrHospitalName}` : ''}`,
        ...parameters.map(item => `• ${item.name}: ${item.result}${item.unit ? ` ${item.unit}` : ''}${item.ref ? ` [Ref: ${item.ref}]` : ''}${item.flag ? ` — ${item.flag}` : ''}`),
        evidence.length ? `Visible text:\n${evidence.map(line => `• ${line}`).join('\n')}` : '',
        summary ? `Summary: ${summary}` : '',
      ].filter(Boolean);
      const extractedText = textLines.join('\n');

      return {
        success: true,
        isMedicalDocument: true,
        type: documentType,
        category: String(result.category || type || 'medical').toLowerCase(),
        text: extractedText,
        extractedText,
        summary,
        ocr_text: extractedText,
        ocrSummary: summary || extractedText,
        confidence: Number(result.confidence || 0),
        warnings: Array.isArray(result.warnings) ? result.warnings : [],
        structuredData: {
          date: result.date || '',
          labName: result.labOrHospitalName || '',
          tests: parameters,
          medications: Array.isArray(result.medications) ? result.medications : [],
          findings: result.findings || '',
          impression: result.impression || '',
          notes: summary,
          evidenceText: evidence,
        },
      };
    } catch (error) {
      console.warn('Vision OCR could not verify this upload:', error);
      return {
        success: false,
        isMedicalDocument: null,
        type: 'Analysis unavailable',
        category: 'unverified',
        extractedText: '',
        summary: 'The image could not be analyzed reliably. Please upload a clearer, well-lit image with the complete document visible.',
        error: error?.message || 'Vision OCR failed.',
        structuredData: this.emptyStructuredData(),
      };
    }
  }

  // Kept for old stored reports. It deliberately returns no guessed values.
  static getExtractionForFile() {
    return {
      success: false,
      isMedicalDocument: null,
      type: 'OCR not available',
      category: 'unverified',
      extractedText: '',
      summary: 'No verified OCR data is available for this report.',
      error: 'The original image must be analyzed by the vision service.',
      structuredData: this.emptyStructuredData(),
    };
  }
}

export default OCRProcessor;
