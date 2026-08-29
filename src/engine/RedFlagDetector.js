/* ============================================
   SWASTHYA SETU — Red Flag Detector
   Rule-based logic to detect emergency situations
   ============================================ */

export class RedFlagDetector {
  static check(symptoms, severity, age) {
    const flags = [];

    // Red flag rules
    if (symptoms.includes('chest_pain')) {
      flags.push({ type: 'critical', message: 'Potential cardiac event. Fast track to ECG.' });
    }
    
    if (symptoms.includes('breathlessness') && severity === 'high') {
      flags.push({ type: 'critical', message: 'Severe breathlessness. Check O2 sat immediately.' });
    }
    
    if (symptoms.includes('headache') && symptoms.includes('vomiting') && severity === 'high') {
      flags.push({ type: 'warning', message: 'Severe headache with vomiting. Rule out raised ICP/Stroke.' });
    }

    if (age && parseInt(age) > 65) {
      if (symptoms.includes('fever') && symptoms.includes('dizziness')) {
        flags.push({ type: 'warning', message: 'Geriatric patient with fever/dizziness. High risk of falls/sepsis.' });
      }
    }

    return flags;
  }
}

export default RedFlagDetector;
