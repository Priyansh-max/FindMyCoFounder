const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/pitch", async (req, res) => {
  const { pitch } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze the given pitch and check if:
      1. The pitch:
         - Is not gibberish or meaningless
         - Is not too vague or broad
         - It should look like an application.


      Respond in JSON format like this:
      {
        "pitch": { 
          "isValid": true/false, 
          "reason": "...",
        },
      }

      Inputs:
      - Pitch: "${pitch}"
    `;

    const response = await model.generateContent(prompt);
    const result = await response.response.text();
    const cleanedResult = result.replace(/```json|```/g, "").trim();
    const parsedResult = JSON.parse(cleanedResult);

    // Check if all validated fields are valid
    const success = Object.values(parsedResult).every(field => field.isValid);

    res.json({ success, ...parsedResult });
  } catch (error) {
    console.error("Error validating pitch:", error);
    res.status(500).json({ error: "Failed to validate pitch" });
  }
});

module.exports = router; 