// Keep form values interoperable even when Scribe returns native numerals.
export function normalizeDigits(value) {
  return String(value ?? '').replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/gu, digit => {
    const code = digit.codePointAt(0);
    for (const zero of [0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66]) {
      if (code >= zero && code <= zero + 9) return String(code - zero);
    }
    return digit;
  });
}

const digitWords = {
  hi: 'शून्य एक दो तीन चार पाँच छह सात आठ नौ',
  mr: 'शून्य एक दोन तीन चार पाच सहा सात आठ नऊ',
  ta: 'பூஜ்ஜியம் ஒன்று இரண்டு மூன்று நான்கு ஐந்து ஆறு ஏழு எட்டு ஒன்பது',
  te: 'సున్నా ఒకటి రెండు మూడు నాలుగు ఐదు ఆరు ఏడు ఎనిమిది తొమ్మిది',
  bn: 'শূন্য এক দুই তিন চার পাঁচ ছয় সাত আট নয়',
  gu: 'શૂન્ય એક બે ત્રણ ચાર પાંચ છ સાત આઠ નવ',
  kn: 'ಸೊನ್ನೆ ಒಂದು ಎರಡು ಮೂರು ನಾಲ್ಕು ಐದು ಆರು ಏಳು ಎಂಟು ಒಂಬತ್ತು',
  ml: 'പൂജ്യം ഒന്ന് രണ്ട് മൂന്ന് നാല് അഞ്ച് ആറ് ഏഴ് എട്ട് ഒമ്പത്',
};

export function localizeSpokenIdentifiers(text, language) {
  const words = digitWords[language]?.split(' ');
  if (!words) return text;
  // Long identifiers are spoken digit by digit; ages, dates and quantities remain numbers.
  return normalizeDigits(text).replace(/\b\d{5,}\b/g, number => [...number].map(digit => words[Number(digit)]).join(' '));
}
