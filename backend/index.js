//this server is basically to validate the user inputs while posting the ideas 
//because a user can post a anything so to keep a proper validation is important the inputs must not be gibbrish or slang 

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const profileValidation = require("./validate/profileValidation");
const ideaValidation = require("./validate/ideaValidation");
const emailValidation = require("./validate/emailValidation");
const phoneValidation = require("./validate/phoneValidate");
require("dotenv").config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

// Use profile validation routes
app.use("/api/validate", profileValidation);
app.use("/api/validate", ideaValidation);
app.use("/api/validate/email", emailValidation);
app.use("/api/validate/phone", phoneValidation);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


