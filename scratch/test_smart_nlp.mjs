// test_smart_nlp.mjs
const demographicFillers = /(?:\b(?:main|mai|hum|meri|mera|mere|apna|apni|apne|aap|aapka|aapki|aapke|tum|tumhara|tumhari|tu|tera|teri|tere|unka|unki|unke|iska|iski|iske|usko|isko|inhe|unhe|umar|saal|sal|varsh|vaya|vay|vayasu|yellu|boyosh|bosor|vayassu|years|year|old|age|phone|mobile|number|hai|hain|hu|hoon|hoga|tha|thi|the|to|toh|bhi|hi|na|ne|ko|se|me|mein|par|pe|aur|ya|and|with|for|of|in|at|the|a|an|is|am|are|was|were|chhe|aahe|undi|undhi|unnaru|irukku|aagide|aanu|aananu|aagiradhu|bol|bolo|bolna|bolchi|bolta|bolti|bolte|speaking|calling|here|ji|yaar|bhai|sir|madam|boss|please|arre|are|rey|sun|suno|dekh|dekho|likho|likh|likhna|likhiye|likhun|liha|lakho|bareyiri|ezhudhunga|ezhuthu|rayandi|dalo|daal|karo|kardo|kar|karna|kijiye|rakho|rakhna|batao|dena|type|enter|fill|put|save|set|write|just|patient|person|shri|shree|smt|mr|mrs|ms|dr|nenu|naaku|naadi|naan|enakku|en|enathu|ennoda|naa|aami|aamar|mee|aamhi|naanu|nanage|nanna|nimma|njaan|enikku|ente|ningal|ningalude|vendum|kavale|beku|aavashyam|naam|name|hesaru|peyar|per|peru|naav|maazhe|maaze|maarun|tamaru|oru|purusha|purushan|male|mail|female|femail|gender|ling|sex|dhan|thaan|nu|solunga|podunga|vaanga|cheppandi|veyyandi|bolun|korun|saanga|taka|heli|haki|maadi|parayu|idu|cheyyu|garu|andi)\b|(?:तू|तुम|तुम्ही|तुम्हाला|तुम्हार|आप|आपका|आपकी|आपके|तेरा|तेरी|तेरे|मेरा|मेरी|मेरे|अपना|अपनी|अपने|उसका|उसकी|इसका|इसकी|उम्र|साल|वर्ष|फोन|फ़ोन|मोबाइल|नंबर|है|हैं|हूँ|था|थी|थे|तो|भी|ही|ना|ने|को|से|में|पर|और|या|जी|भाई|यार|सर|मैडम|लिखिए|लिखो|लिख|डालो|डाल|करो|कर|बताओ|बोलो|बोल|रखो|दीजिए|বয়স|বছর|வயது|வயிசு|வயசு|వయస్సు|వయసు|ఏళ్ళు|ವಯಸ್ಸು|ವರ್ಷ|വയസ്സ്|വയ|ઉંમર|વય|વર્ષ|नाव|आहे|पुरुष|महिला|स्त्री|ஆண்|பெண்|மக|మహిళ|స్త్రీ|ছেলে|মেয়ে|પુરુષ|મહિલા|પુರುಷ|ಮಹಿಳೆ|പുരുഷൻ|ആൺ|സ്ത്രീ))/gi;

function extractName(text) {
  const explicitNameMatch = text.match(/(?:my name is|i am|mera naam hai|mera naam|naam hai|naam|name is|name|नाम है|नाम|en peyar|enadhu peyar|peyar|பேர்|என் பெயர்|பெயர்|naa peru|na peru|peru|నా పేరు|పేరు|aamar naam|aaponar naam|naam|আমার নাম|নাম|maazhe naav|maaze naav|naav aahe|naav|माझे नाव|नाव|maarun naam|tamaru naam|naam chhe|મારું નામ|નામ|nanna hesaru|nimma hesaru|hesaru|ನನ್ನ ಹೆಸರು|ಹೆಸರು|ente peru|ningalude peru|peru|എന്റെ പേര്|പേര്)\s+([^\d,.:;।|]+)/i);

  if (explicitNameMatch && explicitNameMatch[1]) {
    let nameSegment = explicitNameMatch[1];
    nameSegment = nameSegment.replace(demographicFillers, ' ').replace(/[:,;।|.-]/g, ' ').replace(/\s+/g, ' ').trim();
    const nameTokens = nameSegment.split(' ').filter(w => w.length >= 2 && !/\d/.test(w));
    if (nameTokens.length > 0 && nameTokens.length <= 4) {
      return nameTokens.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  return '';
}

const testCases = [
  "name tu rajesh",
  "naam tu rajesh",
  "naam to rajesh",
  "naam likho Rajesh Sharma",
  "mera naam tu rajesh",
  "mera naam aap Rajesh likhiye umar 30",
  "my name is Rajesh Kumar",
  "name is Ramesh",
  "en peyar Priya nu podunga",
  "naa peru Suresh garu",
  "aamar naam Amit bolchi",
  "nanna hesaru Ravi heli",
  "maarun naam Hitesh bhai lakho",
  "maazhe naav Amit aahe",
  "ente peru Rahul aanu",
  "continue",
  "login",
  "mujhe bukhar hai do din se"
];

for (const tc of testCases) {
  console.log(`Input: "${tc}" -> Extracted Name: "${extractName(tc)}"`);
}
