const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const submitProject = async (req, res) => {
    return res.status(200).json({ message: 'Project submitted successfully' });
}

const uploadLogo = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No logo file uploaded' });
      }


      const logo = req.file;
      const allowedMimeTypes = ["image/jpeg", "image/png"];

      if (!allowedMimeTypes.includes(logo.mimetype)) {
        return res.status(400).json({ error: "Invalid file type. Only JPG and PNG are allowed." });
      }

      console.log(logo);
      const userId = req.user.id;
      const fileExt = logo.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // Create service client with more privileges
      const serviceClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Upload file to Supabase Storage
      const { error: uploadError } = await serviceClient.storage
        .from('logo')
        .upload(fileName, logo.buffer, {
          contentType: logo.mimetype,
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload logo');
      }
  
      // Get public URL
      const { data: { publicUrl } } = serviceClient.storage
        .from('logo')
        .getPublicUrl(fileName);
  
      res.json({ 
        success: true,
        logoUrl: publicUrl 
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to upload logo' 
      });
    }
};

module.exports = {
  submitProject,
  uploadLogo
}
