const fs = require('fs');

const filePath = 'src/voicenav/LanguagePack.js';
let lines = fs.readFileSync(filePath, 'utf-8').split('\n');

console.log('Total lines:', lines.length);

// The English block last valid line is 731 (0-indexed: 730)
// The injected garbage runs from line 732 to 1096 (0-indexed: 731 to 1095)
// Line 1097 (0-indexed: 1096) closes with '  },'
// So we keep: 0..730, then 1096..end

const lastValidEnLine = 730;  // 0-indexed: "voiceConfirm: 'Did you say: ',"
const closingBrace = 1096;    // 0-indexed: '  },'
const firstNonEn = 731;       // 0-indexed: where injected garbage starts

// Verify
console.log('Last valid EN line (730):', JSON.stringify(lines[lastValidEnLine]));
console.log('First injected line (731):', JSON.stringify(lines[firstNonEn]));
console.log('Closing brace (1096):', JSON.stringify(lines[closingBrace]));

// Build new lines: keep 0..lastValidEnLine, then closingBrace..end
const newLines = [
  ...lines.slice(0, lastValidEnLine + 1),
  lines[closingBrace],   // '  },'
  ...lines.slice(closingBrace + 1)
];

console.log('New total lines:', newLines.length);
console.log('Lines removed:', lines.length - newLines.length);

fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
console.log('Done! File written successfully.');
