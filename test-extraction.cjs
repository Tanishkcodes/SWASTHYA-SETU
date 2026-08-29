const { createServer } = require('vite');

(async () => {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  try {
    const module = await vite.ssrLoadModule('/src/engine/AICommandEngine.js');
    const engine = module.default;
    
    console.log('Testing extraction...');
    
    const text = 'Hi, I am Rajesh Kumar, a 45 year old male and my phone is 9988776655';
    console.log('Input:', text);
    
    const result = await engine.extractRegistrationDetails(text, 'en');
    
    console.log('Result extracted successfully:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (e) {
    console.error(e);
  } finally {
    vite.close();
  }
})();
