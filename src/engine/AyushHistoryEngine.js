/* ============================================
   SWASTHYA SETU — AYUSH History Engine
   Dashavidha Pariksha (10-fold examination) and Prakriti
   ============================================ */

export class AyushHistoryEngine {
  
  static getPrakritiAssessmentQuestions() {
    return [
      {
        id: 'prakriti_frame',
        text: 'How would you describe your body frame?',
        options: [
          { value: 'vata', label: 'Thin and light' },
          { value: 'pitta', label: 'Medium and muscular' },
          { value: 'kapha', label: 'Heavy and solid' },
        ]
      },
      {
        id: 'prakriti_skin',
        text: 'How is your skin usually?',
        options: [
          { value: 'vata', label: 'Dry and rough' },
          { value: 'pitta', label: 'Warm, oily, prone to acne' },
          { value: 'kapha', label: 'Thick, moist, smooth' },
        ]
      },
      {
        id: 'prakriti_digestion',
        text: 'How is your appetite and digestion?',
        options: [
          { value: 'vata', label: 'Irregular' },
          { value: 'pitta', label: 'Strong, intense' },
          { value: 'kapha', label: 'Slow, steady' },
        ]
      }
    ];
  }

  static calculatePrakriti(answers) {
    let scores = { vata: 0, pitta: 0, kapha: 0 };
    
    for (const val of answers) {
      if (scores[val] !== undefined) {
        scores[val]++;
      }
    }

    // Find highest score
    let dominant = 'vata';
    let max = scores.vata;
    
    if (scores.pitta > max) {
      dominant = 'pitta';
      max = scores.pitta;
    }
    if (scores.kapha > max) {
      dominant = 'kapha';
    }

    // Check for dual prakriti (simplified)
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] === sorted[1][1] && sorted[0][1] > 0) {
      return `${sorted[0][0]}-${sorted[1][0]}`;
    }

    return dominant;
  }
}

export default AyushHistoryEngine;
