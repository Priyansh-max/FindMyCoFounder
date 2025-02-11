import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function validateText(inputText: string): Promise<{ containsSlang: boolean; isGibberish: boolean }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are a content moderation AI. Analyze the given text and determine if:
      1. It contains slang or offensive words.
      2. It is gibberish or nonsensical.

      Respond in strict JSON format:
      {
        "containsSlang": true/false,
        "isGibberish": true/false
      }

      Here is the user input:
      "${inputText}"
    `;

    const response = await model.generateContent(prompt);
    const result = await response.response.text();

    return JSON.parse(result);
  } catch (error) {
    console.error("Error validating text:", error);
    return { containsSlang: false, isGibberish: false }; // Default to safe response
  }
}
