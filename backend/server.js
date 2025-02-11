//this server is basically to validate the user inputs while posting the ideas 
//because a user can post a anything so to keep a proper validation is important the inputs must not be gibbrish or slang 

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/validate", async (req, res) => {
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


