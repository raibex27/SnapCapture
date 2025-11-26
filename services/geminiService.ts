import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    };

    const textPart = {
      text: "Extract all visible text from this image. Be precise and preserve formatting like line breaks where possible. If there is no text, return an empty response."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error extracting text with Gemini API:", error);
    throw new Error("Gemini API request failed.");
  }
};
