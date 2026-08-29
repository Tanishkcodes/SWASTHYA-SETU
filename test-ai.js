import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const apiKey = envVars['VITE_GEMINI_API_KEY'];
const ai = new GoogleGenAI({ apiKey: apiKey });

async function extractRegistrationDetails(transcript, language) {
  const prompt = `
  You are an AI assistant helping to fill a patient registration form.
  The user spoke the following sentence in language '${language}':
  "${transcript}"
  
  Extract the following entities if present:
  - name (string)
  - age (number or string)
  - phone (string, keep only digits if possible, length 10)
  - gender (string: 'Male', 'Female', or 'Other')
  
  Return ONLY a raw JSON object. Do not include markdown formatting or backticks.
  If a field is not found, leave it empty string or null.
  
  Example output:
  {"name":"Rajesh","age":30,"phone":"9999999999","gender":"Male"}
  `;

  console.log("Sending prompt to Gemini...");
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.1
      }
    });

    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/```json\n?/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```\n?/, '').replace(/```$/, '').trim();
    }
    
    console.log("Raw Response:", result.text);
    const parsed = JSON.parse(cleanJson);
    console.log("Parsed JSON:", parsed);
  } catch(e) {
    console.error("Error:", e);
  }
}

extractRegistrationDetails('my name is Rajesh, age 32, phone 9876543210, male', 'en');
