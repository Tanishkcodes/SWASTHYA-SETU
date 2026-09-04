import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

let response;
let failure;
let calls = 0;
const service = { async analyzeReport() { calls++; if (failure) throw failure; return response; } };
const context = vm.createContext({ console: { warn() {} }, Number, String, Array });
const dependency = new vm.SyntheticModule(['default'], function () { this.setExport('default', service); }, { context });
const module = new vm.SourceTextModule(await readFile(new URL('../src/engine/OCRProcessor.js', import.meta.url), 'utf8'), { context });
await module.link(() => dependency);
await module.evaluate();
const OCR = module.namespace.OCRProcessor;
const image = 'data:image/png;base64,aW1hZ2U=';

let result = await OCR.processImage('data:application/pdf;base64,cGRm', 'lab', 'blood-cbc.pdf');
assert.equal(result.success, false);
assert.equal(result.extractedText, '');
assert.equal(calls, 0);

response = { isMedicalDocument: false, documentType: 'Landscape', summary: 'A photograph of trees.', detectedParameters: [{ name: 'Hemoglobin', result: '13' }] };
result = await OCR.processImage(image, 'lab', 'blood-cbc.jpg');
assert.equal(result.isMedicalDocument, false);
assert.equal(result.extractedText, '');
assert.equal(result.structuredData.tests.length, 0);

failure = new Error('Provider unavailable');
result = await OCR.processImage(image, 'lab', 'hba1c-lipid-xray.jpg');
assert.equal(result.success, false);
assert.equal(result.extractedText, '');
failure = null;

response = { isMedicalDocument: true, documentType: 'Lab report', summary: 'Normal results', detectedParameters: [{ name: 'Hb', result: '13' }] };
result = await OCR.processImage(image);
assert.equal(result.success, false, 'Unsubstantiated medical output must fail closed');

response = { isMedicalDocument: true, documentType: 'Lab report', confidence: 0.95, evidenceText: ['Glucose 87 mg/dL'], detectedParameters: [{ name: 'Glucose', result: '87', unit: 'mg/dL' }], summary: 'Glucose is printed as 87 mg/dL.' };
result = await OCR.processImage(image);
assert.equal(result.success, true);
assert.equal(result.structuredData.tests[0].result, '87');
assert.equal(result.structuredData.date, '', 'Missing dates must not become today');
assert.equal(result.structuredData.medications.length, 0);

result = OCR.getExtractionForFile('cbc.jpg', 'lab', 1);
assert.equal(result.success, false);
assert.equal(result.extractedText, '');
console.log('OCR safety checks passed (6 cases).');
