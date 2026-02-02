import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedCV, EMPTY_PARSED_CV } from '@/types/cv';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const PARSE_PROMPT = `You are a CV/Resume parser. Analyze this document and extract structured information as JSON.

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
      "id": "string (unique identifier like exp-1)",
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
      "id": "string (unique identifier like edu-1)",
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
      "id": "string (unique identifier like cert-1)",
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
      "id": "string (unique identifier like proj-1)",
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
2. If a field is not found, use an empty string "" or empty array []
3. Set "current" to true if the experience is ongoing
4. Extract ALL experience entries, education entries, and skills mentioned
5. Return ONLY the JSON object, no other text`;

/**
 * Parse a CV file using Gemini's native document understanding
 */
export async function parseCV(
  buffer: Buffer,
  fileType: 'pdf' | 'docx'
): Promise<{ parsed: ParsedCV; success: boolean }> {
  try {
    console.log('[CV Parser] Starting Gemini parsing for:', fileType);
    console.log('[CV Parser] API Key present:', !!process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Convert buffer to base64
    const base64Data = buffer.toString('base64');

    // Determine MIME type
    const mimeType = fileType === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Send file directly to Gemini
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: PARSE_PROMPT },
    ]);

    const response = await result.response;
    let text = response.text();
    console.log('[CV Parser] Gemini response length:', text.length);

    // Strip markdown code blocks if present
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    text = text.trim();

    const parsed = JSON.parse(text) as ParsedCV;
    parsed.parsing_success = true;

    console.log('[CV Parser] Successfully parsed CV');
    return { parsed, success: true };
  } catch (error) {
    console.error('[CV Parser] Error:', error);
    return { parsed: EMPTY_PARSED_CV, success: false };
  }
}
