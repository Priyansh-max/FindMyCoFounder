const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/submit-project", async (req, res) => {
  const { projectLink, videoLink, description } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Analyze the given project information and check if:
      1. The Project link:
         - Is a proper link/url
      2. The Video Demostration link (if provided):
         - Is a proper link/url
         - Consider empty video link as valid
      3. The description:
         - Is not gibberish or meaningless
         - Is not too vague or broad

      Respond in JSON format like this:
      {
        "projectLink": { 
          "isValid": true/false, 
          "reason": "...",
        },
        "videoLink": { 
          "isValid": true/false, 
          "reason": "...",
        },
        "description": { 
          "isValid": true/false, 
          "reason": "...",
        }
      }

      Inputs:
      - Project Link: "${projectLink}"
      - Video Link: "${videoLink || ''}"
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