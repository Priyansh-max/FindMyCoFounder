const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Store validation codes temporarily (in production, use a database)
const validationCodes = new Map();

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Use App Password for Gmail
  }
});

// Generate a random 6-digit code
function generateValidationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route to send validation code
router.post('/send-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Generate a new validation code
    const validationCode = generateValidationCode();
    
    // Store the code with timestamp (expires in 10 minutes)
    validationCodes.set(email, {
      code: validationCode,
      timestamp: Date.now(),
      attempts: 0
    });

    // Email template
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p style="color: #666; font-size: 16px;">Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 5px; font-size: 32px;">${validationCode}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'Validation code sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Error sending validation code:', error);
    res.status(500).json({ error: 'Failed to send validation code' });
  }
});

// Route to verify the code
router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const validationData = validationCodes.get(email);

  if (!validationData) {
    return res.status(400).json({ error: 'No validation code found for this email' });
  }

  // Check if code has expired (10 minutes)
  if (Date.now() - validationData.timestamp > 10 * 60 * 1000) {
    validationCodes.delete(email);
    return res.status(400).json({ error: 'Validation code has expired' });
  }

  // Check attempts
  if (validationData.attempts >= 3) {
    validationCodes.delete(email);
    return res.status(400).json({ error: 'Too many attempts. Please request a new code' });
  }

  // Increment attempts
  validationData.attempts++;

  // Verify the code
  if (validationData.code === code) {
    validationCodes.delete(email); // Clean up after successful verification
    return res.json({ 
      message: 'Email verified successfully',
      verified: true 
    });
  }

  // If code doesn't match
  return res.status(400).json({ 
    error: 'Invalid code',
    attemptsLeft: 3 - validationData.attempts
  });
});

module.exports = router;
