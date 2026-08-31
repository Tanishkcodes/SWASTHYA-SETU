const fs = require('fs');

const file = 'd:/swasthya setu/src/engine/AiTranslationService.js';
let content = fs.readFileSync(file, 'utf8');

const target = `  'tomorrow': { en: 'Tomorrow', hi: 'कल', mr: 'उद्या', gu: 'આવતીકાલે', ta: 'நாளை', te: 'రేపు', kn: 'ನಾಳೆ', bn: 'আগামীকাল', ml: 'നാളെ' },
};`;

const replacement = `  'tomorrow': { en: 'Tomorrow', hi: 'कल', mr: 'उद्या', gu: 'આવતીકાલે', ta: 'நாளை', te: 'రేపు', kn: 'ನಾಳೆ', bn: 'আগামীকাল', ml: 'നാളെ' },
  'sidhant': { en: 'Sidhant', hi: 'सिद्धांत', mr: 'सिद्धांत', gu: 'સિદ્ધાંત', ta: 'சித்தாந்த்', te: 'సిద్ధాంత్', kn: 'ಸಿದ್ಧಾಂತ್', bn: 'সিদ্ধান্ত', ml: 'സിദ്ധാന്ത്' },
  'ananya sharma': { en: 'Ananya Sharma', hi: 'अनन्या शर्मा', mr: 'अनन्या शर्मा', gu: 'અનન્યા શર્મા', ta: 'அனன்யா சர்மா', te: 'అనన్య శర్మ', kn: 'ಅನನ್ಯಾ ಶರ್ಮಾ', bn: 'অনন্যা শর্মা', ml: 'അനന്യ ശർമ്മ' },
};`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log("AiTranslationService MULTI_DICT updated");
