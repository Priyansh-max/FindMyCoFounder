const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Store verification codes temporarily (should use Redis in production)
const verificationCodes = new Map();

// Create or update profile
const createProfile = async (req, res) => {
  try {
    const { fullName, email, githubUrl, portfolioUrl, description, skills, resumeUrl } = req.body;
    
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        description,
        skills,
        resume_url: resumeUrl,
        updated_at: new Date()
      });

    if (error) throw error;

    res.json({ message: 'Profile created successfully', data });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone, githubUrl, portfolioUrl, description } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        email,
        phone,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        description,
        updated_at: new Date()
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({ message: 'Profile updated successfully', data });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update skills
const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('profiles')
      .update({ skills })
      .eq('id', userId);

    if (error) throw error;

    res.json({ message: 'Skills updated successfully', data });
  } catch (error) {
    console.error('Skills update error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Upload resume
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log("Uploading resume");
    const userId = req.user.id;
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    console.log(userId);

    const serviceClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key instead of anon key
    );

    const { error } = await serviceClient.storage
      .from('Resume')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = serviceClient.storage
      .from('Resume')
      .getPublicUrl(fileName);

    res.json({ publicUrl });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate verification code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send verification email
const verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const code = generateCode();
    
    // Store code with timestamp
    verificationCodes.set(email, {
      code,
      timestamp: Date.now(),
      attempts: 0
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify phone (implement SMS service integration here)
const verifyPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const code = generateCode();
    
    // Store code (in production, integrate with SMS service)
    verificationCodes.set(phone, {
      code,
      timestamp: Date.now(),
      attempts: 0
    });

    // In production, send SMS here
    // For now, just return the code
    res.json({ message: 'Verification code sent', code });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProfile,
  updateProfile,
  getProfile,
  uploadResume,
  verifyEmail,
  verifyPhone,
  updateSkills
}; 