/* ============================================
   SWASTHYA SETU — Mock OCR Processor
   Simulates extracting data from old prescriptions/labs
   ============================================ */

export class OCRProcessor {
  
  static async processImage(imageDataUrl, type = 'prescription') {
    // Simulate network delay for OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (type === 'prescription') {
      return {
        success: true,
        type: 'Old Prescription',
        extractedText: 'Rx Paracetamol 500mg SOS\nAmoxicillin 250mg TDS x 5 days',
        structuredData: {
          date: '10-Aug-2023',
          doctor: 'Dr. Sharma',
          medications: [
            { name: 'Paracetamol 500mg', dosage: 'SOS' },
            { name: 'Amoxicillin 250mg', dosage: 'TDS', duration: '5 days' }
          ]
        }
      };
    } else if (type === 'lab') {
      return {
        success: true,
        type: 'Lab Report (CBC)',
        extractedText: 'Hemoglobin: 11.2 g/dL\nWBC: 8500 cells/cumm',
        structuredData: {
          date: '12-Aug-2023',
          labName: 'City Path Labs',
          tests: [
            { name: 'Hemoglobin', result: '11.2', unit: 'g/dL', flag: 'Low' },
            { name: 'WBC', result: '8500', unit: 'cells/cumm', flag: 'Normal' }
          ]
        }
      };
    }

    return { success: false, error: 'Unknown document type' };
  }
}

export default OCRProcessor;
