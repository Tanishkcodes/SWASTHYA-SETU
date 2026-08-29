/* ============================================
   SWASTHYA SETU — Clinical History Engine
   Adaptive interview logic, question banks, branching
   ============================================ */

export class ClinicalHistoryEngine {
  constructor(isAyushMode = false) {
    this.isAyushMode = isAyushMode;
    
    // Core sections in order
    this.sections = [
      'chiefComplaint',
      'hpi',
      'pastMedical',
      'pastSurgical',
      'medications',
      'allergies',
      'familyHistory',
      'personalHistory',
      'reviewOfSystems'
    ];
    
    if (this.isAyushMode) {
      this.sections.push('ayushAssessment');
    }
  }

  // Get the first question for a section
  getInitialQuestion(sectionId, context = {}) {
    switch (sectionId) {
      case 'chiefComplaint':
        return {
          id: 'cc_main',
          textKey: 'chiefComplaintQ',
          type: 'bodySystem', // UI will render the body map
          options: [],
        };
      
      case 'hpi':
        // HPI questions depend on the chief complaint.
        // We use SOCRATES for pain, or simplified for others.
        const cc = context.chiefComplaint || 'it';
        return {
          id: 'hpi_onset',
          textKey: 'whenDidItStart',
          customText: `When did the ${cc} start?`,
          type: 'choice_or_text',
          options: [
            { id: 'opt_1_day', label: 'Today / 1 Day', value: '1 day' },
            { id: 'opt_2_days', label: '2-3 Days', value: '2-3 days' },
            { id: 'opt_1_week', label: '1 Week', value: '1 week' },
            { id: 'opt_more', label: 'More than a week', value: '> 1 week' },
          ]
        };

      case 'pastMedical':
        return {
          id: 'pmh_diabetes',
          textKey: 'diabetes',
          customText: 'Do you have Diabetes or High Blood Sugar?',
          type: 'yes_no_dontknow',
          diseaseKey: 'diabetes',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
            { id: 'dontknow', labelKey: 'dontKnow', value: 'dontknow', icon: '❓' },
          ]
        };

      case 'pastSurgical':
        return {
          id: 'psh_any',
          textKey: 'pastSurgical',
          customText: 'Have you had any surgeries or operations in the past?',
          type: 'yes_no',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
          ]
        };
        
      case 'medications':
        return {
          id: 'meds_any',
          textKey: 'drugHistory',
          customText: 'Are you currently taking any daily medicines?',
          type: 'yes_no',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
          ]
        };

      case 'allergies':
        return {
          id: 'alg_any',
          textKey: 'allergyHistory',
          customText: 'Do you have allergies to any medicines or food?',
          type: 'yes_no',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
          ]
        };

      case 'familyHistory':
        return {
          id: 'fh_parents',
          textKey: 'familyHistory',
          customText: 'Do your parents or siblings have Diabetes, Heart Disease, or Cancer?',
          type: 'yes_no_dontknow',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
            { id: 'dontknow', labelKey: 'dontKnow', value: 'dontknow', icon: '❓' },
          ]
        };

      case 'personalHistory':
        return {
          id: 'ph_smoking',
          textKey: 'smoking',
          customText: 'Do you currently smoke or use tobacco?',
          type: 'yes_no',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '🚬' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
          ]
        };

      case 'reviewOfSystems':
        return {
          id: 'ros_fever',
          textKey: 'fever',
          customText: 'Have you had a fever recently?',
          type: 'yes_no',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
          ]
        };

      case 'ayushAssessment':
        return {
          id: 'ayush_prakriti_frame',
          textKey: 'prakriti_frame', // Need to add to language pack later if needed
          customText: 'How would you describe your body frame?',
          type: 'choice',
          options: [
            { id: 'thin', label: 'Thin & light', value: 'vata' },
            { id: 'medium', label: 'Medium & muscular', value: 'pitta' },
            { id: 'heavy', label: 'Heavy & solid', value: 'kapha' },
          ]
        };

      default:
        return null;
    }
  }

  // Get the next question based on the current question and answer
  getNextQuestion(sectionId, currentQuestionId, answer, context = {}) {
    // ── HPI Branching (SOCRATES) ──
    if (sectionId === 'hpi') {
      const isPain = (context.chiefComplaint || '').toLowerCase().includes('pain');
      
      if (currentQuestionId === 'hpi_onset') {
        if (isPain) {
          return {
            id: 'hpi_character',
            textKey: 'whatMakesItWorse', // Not exact match, using customText
            customText: 'What does the pain feel like?',
            type: 'choice',
            options: [
              { id: 'burning', labelKey: 'burning', value: 'burning', icon: '🔥' },
              { id: 'sharp', labelKey: 'sharp', value: 'sharp', icon: '⚡' },
              { id: 'dull', labelKey: 'dull', value: 'dull', icon: '🧱' },
              { id: 'pressing', labelKey: 'pressing', value: 'pressing', icon: '🗜️' },
            ]
          };
        } else {
          return {
            id: 'hpi_severity',
            textKey: 'howSevere',
            type: 'painScale', // Special UI component
            options: []
          };
        }
      }

      if (currentQuestionId === 'hpi_character') {
        return {
          id: 'hpi_radiation',
          textKey: 'whereIsTheProblem',
          customText: 'Does the pain spread anywhere else?',
          type: 'choice_or_text',
          options: [
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
          ]
        };
      }

      if (currentQuestionId === 'hpi_radiation') {
        return {
          id: 'hpi_severity',
          textKey: 'howSevere',
          type: 'painScale',
          options: []
        };
      }

      if (currentQuestionId === 'hpi_severity') {
        return {
          id: 'hpi_associated',
          textKey: 'anyOtherSymptoms',
          type: 'multi_choice',
          options: [
            { id: 'fever', labelKey: 'fever', value: 'fever' },
            { id: 'vomiting', labelKey: 'vomiting', value: 'vomiting' },
            { id: 'breathlessness', labelKey: 'breathlessness', value: 'breathlessness' },
            { id: 'none', labelKey: 'no', value: 'none' },
          ]
        };
      }

      if (currentQuestionId === 'hpi_associated') {
        return null; // End of HPI
      }
    }

    // ── Past Medical History Branching ──
    if (sectionId === 'pastMedical') {
      const pmhSequence = [
        { id: 'pmh_diabetes', key: 'diabetes' },
        { id: 'pmh_htn', key: 'hypertension', customText: 'Do you have High Blood Pressure?' },
        { id: 'pmh_heart', key: 'heartDisease', customText: 'Do you have any Heart Disease?' },
        { id: 'pmh_asthma', key: 'asthma', customText: 'Do you have Asthma or breathing issues?' },
        { id: 'pmh_thyroid', key: 'thyroid', customText: 'Do you have Thyroid problems?' },
      ];

      // Find current index
      const currentIndex = pmhSequence.findIndex(q => q.id === currentQuestionId);
      
      // If they answered 'yes' to a disease, we could ask "Since when?", but for demo we move to next disease
      if (currentIndex !== -1 && currentIndex < pmhSequence.length - 1) {
        const next = pmhSequence[currentIndex + 1];
        return {
          id: next.id,
          textKey: next.key,
          customText: next.customText,
          type: 'yes_no_dontknow',
          diseaseKey: next.key,
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
            { id: 'dontknow', labelKey: 'dontKnow', value: 'dontknow', icon: '❓' },
          ]
        };
      }
      return null; // End of PMH
    }

    // ── Personal History Branching ──
    if (sectionId === 'personalHistory') {
      if (currentQuestionId === 'ph_smoking') {
        return {
          id: 'ph_alcohol',
          textKey: 'alcohol',
          customText: 'Do you drink alcohol?',
          type: 'yes_no',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '🍺' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
          ]
        };
      }
      if (currentQuestionId === 'ph_alcohol') {
        return {
          id: 'ph_diet',
          textKey: 'vegetarian', // loosely mapping
          customText: 'What is your diet type?',
          type: 'choice',
          options: [
            { id: 'veg', labelKey: 'vegetarian', value: 'vegetarian', icon: '🥗' },
            { id: 'nonveg', labelKey: 'nonVegetarian', value: 'non-vegetarian', icon: '🍗' },
          ]
        };
      }
      if (currentQuestionId === 'ph_diet') {
        return null;
      }
    }

    // ── Review of Systems Branching ──
    if (sectionId === 'reviewOfSystems') {
      const rosSequence = [
        { id: 'ros_fever', textKey: 'fever' },
        { id: 'ros_cough', textKey: 'cough', customText: 'Do you have a cough?' },
        { id: 'ros_vomiting', textKey: 'vomiting', customText: 'Any vomiting or nausea?' },
        { id: 'ros_weight', textKey: 'weightLoss', customText: 'Have you lost weight recently without trying?' },
      ];
      
      const currentIndex = rosSequence.findIndex(q => q.id === currentQuestionId);
      if (currentIndex !== -1 && currentIndex < rosSequence.length - 1) {
        const next = rosSequence[currentIndex + 1];
        return {
          id: next.id,
          textKey: next.textKey,
          customText: next.customText,
          type: 'yes_no',
          options: [
            { id: 'yes', labelKey: 'yes', value: 'yes', icon: '✅' },
            { id: 'no', labelKey: 'no', value: 'no', icon: '❌' },
          ]
        };
      }
      return null; // End of ROS
    }

    // For sections we haven't fully expanded in the demo, just return null after first question
    return null;
  }
}

const engine = new ClinicalHistoryEngine();
export default engine;
