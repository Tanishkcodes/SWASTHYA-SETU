import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

async function main() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in VITE_GEMINI_API_KEY");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Read and parse English object
  const enObjStr = fs.readFileSync('C:/Users/Tanishk/.gemini/antigravity-ide/brain/603db53c-0137-417c-8325-5513bc22b4fb/scratch/enObj.json', 'utf8');
  let enObj;
  try {
    const cleaned = enObjStr.trim().replace(/,\s*$/, '');
    enObj = eval('(' + cleaned + ')');
  } catch(e) {
    console.error("Failed to eval enObj:", e);
    process.exit(1);
  }

  const entries = Object.entries(enObj);
  const BATCH_SIZE = 40; // Safely batch to prevent context/output limits
  const langs = ['ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml'];
  
  // Initialize result object
  const fullTranslations = {};
  for (const lang of langs) {
    fullTranslations[lang] = {};
  }

  console.log(`Starting translation of ${entries.length} strings across ${langs.length} languages...`);

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchObj = Object.fromEntries(batch);
    
    console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(entries.length / BATCH_SIZE)}...`);
    
    const prompt = `Translate the following English JSON object into the following 7 languages: Tamil ('ta'), Telugu ('te'), Bengali ('bn'), Marathi ('mr'), Gujarati ('gu'), Kannada ('kn'), and Malayalam ('ml').
    
Maintain exactly the same keys. Do not translate the keys. Only translate the values.
Return the output strictly as a JSON object matching this structure:
{
  "ta": { "key1": "translation", "key2": "translation" },
  "te": { "key1": "translation", "key2": "translation" },
  "bn": { "key1": "translation", "key2": "translation" },
  "mr": { "key1": "translation", "key2": "translation" },
  "gu": { "key1": "translation", "key2": "translation" },
  "kn": { "key1": "translation", "key2": "translation" },
  "ml": { "key1": "translation", "key2": "translation" }
}

English JSON to translate:
${JSON.stringify(batchObj, null, 2)}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const parsed = JSON.parse(response.text);
      
      // Merge batch into full translations
      for (const lang of langs) {
        if (parsed[lang]) {
          Object.assign(fullTranslations[lang], parsed[lang]);
        }
      }
      
      // Wait to avoid rate limits
      await new Promise(r => setTimeout(r, 4000));
    } catch(err) {
      console.error(`Failed on batch ${i / BATCH_SIZE + 1}:`, err);
      process.exit(1);
    }
  }

  console.log("All batches translated successfully!");
  
  // Write the translated object out to a JSON file so we can inject it
  fs.writeFileSync('C:/Users/Tanishk/.gemini/antigravity-ide/brain/603db53c-0137-417c-8325-5513bc22b4fb/scratch/translated.json', JSON.stringify(fullTranslations, null, 2));
  console.log("Saved to translated.json");
}

main();
