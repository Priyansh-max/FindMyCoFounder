const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const verifyOnboarding = async (req , res) => {
    try{
        const userId = req.user.id; 

        const {data , error} = await supabase
        .from('profiles')
        .select('onboarding')
        .eq('id' , userId)
        .single();

        if(error){
            throw error;
        }

        return res.status(200).json({
            success: true,
            onboarding: data.onboarding
        });
    } catch (error) {
        console.error('Error verifying onboarding:', error);
        return res.status(500).json({error: 'Internal server error'});
    }
}

const applyToIdea = async (req , res) => {
    try{    
        const userId = req.user.id;
        const ideaId = req.params.ideaId;
        const pitch = req.body.pitch;

        //first check if the user has already applied to this idea
        const {data: existingApplication , error: existingApplicationError} = await supabase
        .from('applications')
        .select('*')
        .eq('profile_id' , userId)
        .eq('idea_id' , ideaId)
        .maybeSingle();

        if(existingApplicationError){
            throw existingApplicationError;
        }

        if(existingApplication){
            return res.status(200).json({success: true , message: 'You have already applied to this idea'});
        }

        // Validate the pitch
        try {
            const pitchValidationResponse = await axios.post(`${process.env.BACKEND_URL}/api/validate/pitch`, {
                pitch: pitch
            });
            
            // If pitch validation fails, return error with reason
            if (!pitchValidationResponse.data.success) {
                return res.status(200).json({
                    success: false,
                    validationError: true,
                    message: pitchValidationResponse.data.pitch.reason || 'Your pitch needs improvement',
                    validation: pitchValidationResponse.data
                });
            }
        } catch (validationError) {
            console.error('Error validating pitch:', validationError);
            return res.status(200).json({
                success: false,
                validationError: true,
                message: validationError.response.data.message || 'Your pitch needs improvement',
                validation: validationError.response.data
            });
        }

        // Insert application
        const {data , error} = await supabase
        .from('applications')
        .insert({
            idea_id: ideaId, 
            profile_id: userId, 
            pitch: pitch, 
            status: 'pending'
        });

        if(error){
            // Check if this is a unique constraint violation
            if(error.code === '23505'){
                return res.status(200).json({
                    success: false, 
                    message: 'There was an issue with your application. Please try again later.'
                });
            }
            throw error;
        }

        return res.status(200).json({success: true , message: 'Application submitted successfully' , data: data});

    }catch(error){
        console.error('Error applying to idea:', error);
        return res.status(500).json({error: 'Internal server error'});
    }
}

module.exports = {
    verifyOnboarding,
    applyToIdea
}
