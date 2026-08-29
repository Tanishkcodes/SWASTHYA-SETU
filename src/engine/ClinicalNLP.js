/* ============================================
   SWASTHYA SETU — Clinical NLP Engine
   Simulated NLP for extracting symptoms, severity, 
   duration, and negations from raw transcripts
   ============================================ */

export class ClinicalNLP {
  // Simplified lexicon for demo
  static symptomLexicon = {
    chest_pain: ['chest pain', 'seene mein dard', 'nenju vali', 'chaati mein dard'],
    headache: ['headache', 'sir dard', 'tala vali', 'sir dukh raha'],
    fever: ['fever', 'bukhar', 'kaychal', 'taap', 'jvaram'],
    cough: ['cough', 'khasi', 'irumal', 'dagg', 'khokla'],
    breathlessness: ['breathless', 'saans phoolna', 'moochu thinaral', 'saans lene mein dikkat'],
    abdominal_pain: ['stomach pain', 'pet dard', 'vayitru vali', 'kadoopu noppi'],
    vomiting: ['vomiting', 'ulti', 'vaanthi', 'vanti'],
    diarrhea: ['diarrhea', 'loose motion', 'dast', 'bhedi'],
    weakness: ['weakness', 'kamzori', 'saurv', 'balheenata'],
    dizziness: ['dizziness', 'chakkar', 'thala sutral', 'kallu thiruguthundi'],
  };

  static negationKeywords = ['no', 'not', 'nahi', 'illai', 'ledu', 'na', 'naahi', 'nathi', 'illa', 'venda'];
  static severityHighKeywords = ['very', 'severe', 'bahut', 'bhayanak', 'romba', 'chala', 'khub', 'khatarnak', 'bhayankar', 'sakht'];
  static severityLowKeywords = ['mild', 'little', 'thoda', 'halka', 'konjam', 'kodiga', 'samanya', 'alpa'];
  
  static timeKeywords = {
    days: ['day', 'days', 'din', 'naal', 'rojulu', 'divas'],
    weeks: ['week', 'weeks', 'hafta', 'hafte', 'vaaram', 'saptah'],
    months: ['month', 'months', 'mahina', 'maheena', 'masam', 'mahine'],
    years: ['year', 'years', 'saal', 'varusham', 'samvatsaram', 'varsh'],
    hours: ['hour', 'hours', 'ghanta', 'ghante', 'mani', 'gantalu', 'taas'],
  };

  // Extract entities from a raw transcript string
  static extractEntities(text) {
    if (!text) return { symptoms: [], negations: [], duration: null, severity: null };

    const lowerText = text.toLowerCase();
    const result = {
      symptoms: [],
      negations: [],
      duration: null,
      severity: null,
      raw: text
    };

    // 1. Check Negations
    let isNegated = false;
    for (const neg of this.negationKeywords) {
      // Simple check: if negation word is in the text, we might be negating a symptom
      // A real NLP would use dependency parsing.
      if (new RegExp(`\\b${neg}\\b`).test(lowerText)) {
        isNegated = true;
        break;
      }
    }

    // 2. Find Symptoms
    for (const [symptomKey, aliases] of Object.entries(this.symptomLexicon)) {
      for (const alias of aliases) {
        if (lowerText.includes(alias)) {
          if (isNegated) {
            result.negations.push(symptomKey);
          } else {
            result.symptoms.push(symptomKey);
          }
          break; // move to next symptom category
        }
      }
    }

    // 3. Estimate Severity
    for (const word of this.severityHighKeywords) {
      if (lowerText.includes(word)) {
        result.severity = 'high';
        break;
      }
    }
    if (!result.severity) {
      for (const word of this.severityLowKeywords) {
        if (lowerText.includes(word)) {
          result.severity = 'low';
          break;
        }
      }
    }

    // 4. Estimate Duration (e.g. "3 din se")
    // Very basic regex extraction for demo
    const timeRegex = /(\d+)\s+([a-z]+)/i;
    const match = lowerText.match(timeRegex);
    if (match) {
      const num = match[1];
      const unit = match[2];
      
      // Check if unit matches our known time words
      let standardUnit = null;
      for (const [key, aliases] of Object.entries(this.timeKeywords)) {
        if (aliases.includes(unit)) {
          standardUnit = key;
          break;
        }
      }
      
      if (standardUnit) {
        result.duration = `${num} ${standardUnit}`;
      }
    }

    return result;
  }
}

export default ClinicalNLP;
