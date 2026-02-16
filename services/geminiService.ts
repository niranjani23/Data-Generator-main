import { GoogleGenAI } from "@google/genai";
import { DataFormat, GenerationOptions } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDummyData = async (
  userPrompt: string,
  format: DataFormat,
  options: GenerationOptions,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const model = 'gemini-3-flash-preview';

  let specificInstructions = '';
  switch (format) {
    case DataFormat.JSON:
      specificInstructions = `
      - Generate valid JSON syntax.
      - Support nested objects and arrays deeply if requested.
      - Use specific data types (boolean, numbers, null) correctly, do not wrap everything in strings unless necessary.
      `;
      break;
    case DataFormat.CSV:
      specificInstructions = `
      - Generate valid CSV with a header row.
      - If nested data is requested, flatten it using dot notation for headers (e.g., 'address.city') or understandable conventions.
      - Enclose strings containing commas in quotes.
      `;
      break;
    case DataFormat.XML:
      specificInstructions = `
      - Generate valid XML with a single root element (e.g., <root> or <data> if not specified).
      - Use semantic tags based on property names.
      - Handle nested structures as nested elements.
      `;
      break;
    case DataFormat.TXT:
      specificInstructions = `
      - Format as plain text or structured text as requested (e.g., lists, paragraphs).
      `;
      break;
  }

  // Construct formatting rules based on options
  const formattingRules = `
  STRICT FORMATTING RULES:
  1. **Date Format**: All date fields must strictly follow this format: "${options.dateFormat}". 
     - If "Unix Timestamp" is requested, return an integer (milliseconds since epoch).
     - If "ISO 8601" is requested, use YYYY-MM-DDTHH:mm:ss.sssZ.
  2. **Number Precision**: ${options.decimalPlaces !== 'default' ? `Round all floating-point numbers to exactly ${options.decimalPlaces} decimal places.` : 'Use standard precision for numbers.'}
  `;

  const systemInstruction = `You are a sophisticated dummy data generator engine.
  Your task is to generate realistic, diverse, and structurally correct data based on the user's description.
  
  CORE RULES:
  1. Output ONLY the raw data. Do NOT include markdown code blocks (like \`\`\`json), explanatory text, or conversational filler.
  2. **Complex Structures**: You are capable of generating deeply nested JSON, relational data, and complex object schemas.
  3. **Data Types**: Respect requested types (Enums, Booleans, Floats, Dates). 
     - If a user asks for "status (Active, Inactive)", randomly assign these values.
     - If a user asks for "boolean", output raw true/false.
  4. **Quantity**: Adhere strictly to the requested number of items.
  
  ${formattingRules}

  FORMAT SPECIFIC INSTRUCTIONS:
  ${specificInstructions}
  `;

  const fullPrompt = `Generate data in ${format} format based on this request: "${userPrompt}"`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
  }
};