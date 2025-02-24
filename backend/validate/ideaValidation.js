const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/idea", async (req, res) => {
  const { title, description, devReq, additionalDetails } = req.body;

  if (!title || !description || !devReq || !additionalDetails) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze the given inputs and check if:
      1. They contain slang or offensive words.
      2. They are gibberish or meaningless.
      3. They are informative
      4. The title field should look like a name or heading of a project

      Respond in JSON format like this:
      {
        "title": { "isValid": true/false, "reason": "..." },
        "description": { "isValid": true/false, "reason": "..." },
        "devReq": { "isValid": true/false, "reason": "..." },
        "additionalDetails": { "isValid": true/false, "reason": "..." }
      }

      Inputs:
      - Title: "${title}"
      - Description: "${description}"
      - Development Requirements: "${devReq}"
      - Additional Details: "${additionalDetails}"
    `;

    const response = await model.generateContent(prompt);
    const result = await response.response.text();

    // 🔥 Remove unwanted markdown formatting
    const cleanedResult = result.replace(/```json|```/g, "").trim();
    const parsedResult = JSON.parse(cleanedResult);

    // ✅ Overall success check: If all fields are valid, success = true
    const success = Object.values(parsedResult).every(field => field.isValid);

    res.json({ success, ...parsedResult });
  } catch (error) {
    console.error("Error validating text:", error);
    res.status(500).json({ error: "Failed to validate text" });
  }
});

module.exports = router; 