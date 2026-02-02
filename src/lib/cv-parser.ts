import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedCV, EMPTY_PARSED_CV } from '@/types/cv';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Extract text content from a PDF or DOCX file buffer
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileType: 'pdf' | 'docx'
): Promise<string> {
  try {
    if (fileType === 'pdf') {
      console.log('[PDF Extract] Buffer size:', buffer.length);
      const pdfParser = new PDFParse(buffer);
      const data = await pdfParser.getText();
      console.log('[PDF Extract] Got text, length:', data.text?.length);
      return data.text;
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error) {
    console.error('[Extract] Error extracting text:', error);
    throw error;
  }
}

/**
 * Parse raw CV text using Gemini AI to extract structured data
 */
export async function parseWithGemini(rawText: string): Promise<ParsedCV> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `You are a CV/Resume parser. Extract structured information from the following CV text and return it as JSON.

Return ONLY valid JSON (no markdown code blocks, no explanations) with this exact structure:
{
  "contact": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedIn": "string (URL or empty)",
    "website": "string (URL or empty)"
  },
  "summary": "string (professional summary or objective)",
  "experience": [
    {
      "id": "string (unique identifier)",
      "company": "string",
      "title": "string",
      "location": "string",
      "startDate": "string (e.g., 'Jan 2020')",
      "endDate": "string (e.g., 'Present' or 'Dec 2023')",
      "current": boolean,
      "description": "string",
      "highlights": ["string array of achievements or responsibilities"]
    }
  ],
  "education": [
    {
      "id": "string (unique identifier)",
      "institution": "string",
      "degree": "string",
      "field": "string (field of study)",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string (if mentioned)",
      "highlights": ["string array of honors, activities, etc."]
    }
  ],
  "skills": ["string array of technical and soft skills"],
  "certifications": [
    {
      "id": "string (unique identifier)",
      "name": "string",
      "issuer": "string",
      "date": "string",
      "expiryDate": "string (if applicable)",
      "credentialId": "string (if mentioned)",
      "url": "string (verification URL if mentioned)"
    }
  ],
  "projects": [
    {
      "id": "string (unique identifier)",
      "name": "string",
      "description": "string",
      "technologies": ["string array"],
      "url": "string (if mentioned)",
      "startDate": "string",
      "endDate": "string"
    }
  ],
  "languages": ["string array of languages spoken"],
  "parsing_success": true
}

Important rules:
1. Generate unique IDs (use format like "exp-1", "edu-1", "cert-1", "proj-1")
2. If a field is not found in the CV, use an empty string "" or empty array []
3. Set "current" to true if the experience is ongoing (endDate contains "Present" or similar)
4. Extract ALL experience entries, education entries, and skills mentioned
5. Return ONLY the JSON object, no other text

CV Text:
${rawText}`;

  try {
    console.log('[Gemini] API Key present:', !!process.env.GEMINI_API_KEY);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    console.log('[Gemini] Raw response length:', text?.length);

    // Strip markdown code blocks if present
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    text = text.trim();

    const parsed = JSON.parse(text) as ParsedCV;
    parsed.parsing_success = true;
    return parsed;
  } catch (error) {
    console.error('[Gemini] Parsing error:', error);
    return { ...EMPTY_PARSED_CV, parsing_success: false };
  }
}

/**
 * Main function to parse a CV file
 */
export async function parseCV(
  buffer: Buffer,
  fileType: 'pdf' | 'docx'
): Promise<{ parsed: ParsedCV; success: boolean }> {
  try {
    console.log('[CV Parser] Starting extraction for:', fileType);
    const rawText = await extractTextFromFile(buffer, fileType);
    console.log('[CV Parser] Extracted text length:', rawText?.length || 0);
    console.log('[CV Parser] First 500 chars:', rawText?.slice(0, 500));

    if (!rawText || rawText.trim().length === 0) {
      console.error('[CV Parser] No text extracted from file');
      return { parsed: EMPTY_PARSED_CV, success: false };
    }

    console.log('[CV Parser] Calling Gemini...');
    const parsed = await parseWithGemini(rawText);
    console.log('[CV Parser] Gemini result success:', parsed.parsing_success);
    return { parsed, success: parsed.parsing_success };
  } catch (error) {
    console.error('[CV Parser] Error:', error);
    return { parsed: EMPTY_PARSED_CV, success: false };
  }
}
