/* ============================================
   SWASTHYA SETU — Summary Generator
   Transforms session history into structured SOAP format
   ============================================ */

export class SummaryGenerator {
  
  static generate(session) {
    const { patient, history, documents, redFlags, isAyushMode } = session;
    
    // Build Subjective (History)
    let hpiText = `${patient.name} (${patient.age}/${patient.gender.charAt(0)}) presented with ${history.chiefComplaint || 'no specific complaint'} in the ${history.bodySystem || 'general'} region. `;
    
    history.hpiResponses.forEach(r => {
      hpiText += `Patient reported ${r.answer} for question ${r.question}. `;
    });

    let pastHistory = [];
    if (history.pastMedical.length > 0) pastHistory.push(`Medical: ${history.pastMedical.join(', ')}`);
    if (history.pastSurgical.length > 0) pastHistory.push(`Surgical: ${history.pastSurgical.join(', ')}`);
    if (history.allergies.length > 0) pastHistory.push(`Allergies: ${history.allergies.join(', ')}`);

    // Extract document data
    const docData = documents
      .filter(d => d.status === 'success' && d.extractedData)
      .map(d => {
        if (d.type === 'prescription') {
          return `Old Rx: ${d.extractedData.structuredData.medications.map(m => m.name).join(', ')}`;
        }
        if (d.type === 'lab') {
          const abn = d.extractedData.structuredData.tests.filter(t => t.flag !== 'Normal');
          return abn.length > 0 ? `Abnormal Labs: ${abn.map(a => `${a.name} (${a.result})`).join(', ')}` : 'Labs: WNL';
        }
        return null;
      })
      .filter(Boolean);

    // Build Ayush section if applicable
    let ayushText = null;
    if (isAyushMode && history.ayushAssessment) {
      ayushText = `Prakriti: ${history.ayushAssessment}`;
    }

    return {
      demographics: patient,
      subjective: {
        hpi: hpiText,
        pmh: pastHistory.length > 0 ? pastHistory.join(' | ') : 'No significant past history',
        documents: docData.length > 0 ? docData.join(' | ') : 'No documents scanned',
      },
      ayush: ayushText,
      redFlags: redFlags,
      generatedAt: new Date().toISOString(),
      snmmedCodes: this._mockSnomedMapping(history.chiefComplaint),
    };
  }

  static _mockSnomedMapping(cc) {
    const map = {
      'chest pain': { code: '29857009', term: 'Chest pain' },
      'fever': { code: '386661006', term: 'Fever' },
      'headache': { code: '25064002', term: 'Headache' },
    };
    
    for (const [key, val] of Object.entries(map)) {
      if (cc && cc.toLowerCase().includes(key)) {
        return [val];
      }
    }
    return [{ code: '26036001', term: 'Unknown complaint' }]; // default
  }
}

export default SummaryGenerator;
