const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/profile", async (req, res) => {
  const { fullName, description } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze the given profile information and check if:
      1. The full name:
         - Is a proper person name
         - Doesn't contain numbers or special characters or any slang
         - Is not gibberish
      2. The description (if provided):
         - Doesn't contain inappropriate content like any slang
         - Is not gibberish or meaningless

      Respond in JSON format like this:
      {
        "fullName": { 
          "isValid": true/false, 
          "reason": "...",
          "suggestions": ["..."]
        },
        "description": { 
          "isValid": true/false, 
          "reason": "...",
          "suggestions": ["..."]
        }
      }

      Inputs:
      - Full Name: "${fullName}"
      - Description: "${description || ''}"
    `;

    const response = await model.generateContent(prompt);
    const result = await response.response.text();
    const cleanedResult = result.replace(/```json|```/g, "").trim();
    const parsedResult = JSON.parse(cleanedResult);

    // Check if all validated fields are valid
    const success = Object.values(parsedResult).every(field => field.isValid);

    res.json({ success, ...parsedResult });
  } catch (error) {
    console.error("Error validating profile:", error);
    res.status(500).json({ error: "Failed to validate profile information" });
  }
});

module.exports = router; 