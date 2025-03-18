const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

//NEED CHANGES
const createApplication = async (req, res) => {
    try {
      const { title, ideaDescription , developerNeeds, additionalDetails} = req.body;
      console.log(req.body);
      const userId = req.user.id;
  
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          founder_id: userId,
          title: title,
          idea_desc: ideaDescription,
          dev_req: developerNeeds,
          additional_details: additionalDetails,
          status: 'open',
          created_at: new Date(),
          updated_at: new Date(),
        });
  
      if (error) throw error;
  
      res.json({ message: 'Idea created successfully', data });
    } catch (error) {
      console.error('Idea creation error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  //NEED CHANGES
  const updateApplication = async (req, res) => {
    try {
      const { title, idea_desc, dev_req, additional_info} = req.body;
      const userId = req.user.id;
  
      const { data, error } = await supabase
        .from('ideas')
        .update({
          title: title,
          idea_desc: idea_desc,
          dev_req: dev_req,
          additional_info: additional_info,
          updated_at: new Date()
        })
        .eq('id', userId);
  
      if (error) throw error;
  
      res.json({ message: 'Idea updated successfully', data });
    } catch (error) {
      console.error('Idea update error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  //get application posted by the current user ... DONE
  const getApplicationbyUser = async (req, res) => {
    try {
      const userId = req.user.id;

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          ideas (
            id,
            title,
            idea_desc,
            dev_req,
            additional_details,
            status,
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include founder details directly in the idea object
      const formattedData = data.map(app => ({
        ...app,
        idea: {
          ...app.ideas,
          founder: app.ideas.profiles,
          profiles: undefined // Remove nested profiles object
        },
        ideas: undefined // Remove the original ideas object
      }));

      res.json({
        success: true,
        data: formattedData
      });
    } catch (error) {
      console.error('Application fetch error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  };

  //get the application in a particular idea....
  const getApplicationbyIdea = async (req, res) => {
    try {
      const ideaId = req.params.id;
      console.log(ideaId);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profile:profile_id (
            id,
            full_name,
            email,
            avatar_url,
            github_url,
            portfolio_url,
            resume_url,
            description,
            skills
          )
        `)
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include profile details directly
      const formattedData = data.map(app => ({
        ...app,
        profile: app.profile,
        profiles: undefined // Remove nested profiles object
      }));

      res.json({
        success: true,
        data: formattedData
      });
    } catch (error) {
      console.error('Application fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  const acceptApplication = async (req, res) => {
    const applicationId = req.params.id;

    try {
        // Step 1: Update the application status to 'accepted'
        const { error: updateError } = await supabase
            .from('applications')
            .update({ status: 'accepted' })
            .eq('id', applicationId);
        
        if (updateError) {
            throw new Error('Failed to update application status');
        }

        // Step 2: Fetch the profile_id and idea_id of the accepted user
        const { data: application, error: fetchError } = await supabase
            .from('applications')
            .select('profile_id, idea_id')
            .eq('id', applicationId)
            .single(); // Ensures we get only one record
        
        if (fetchError || !application) {
            throw new Error('Profile ID not found');
        }

        const profileId = application.profile_id;
        const ideaId = application.idea_id;

        // Step 3: First get the current team data
        const { data: teamData, error: teamFetchError } = await supabase
            .from('manage_team')
            .select('members')
            .eq('idea_id', ideaId)
            .single();
            
        if (teamFetchError) {
            throw new Error('Failed to fetch team data');
        }
        
        // Step 4: Append to the members array
        let updatedMembers = teamData.members || [];
        if (!updatedMembers.includes(profileId)) {
            updatedMembers.push(profileId);
        }
        
        // Step 5: Update the members array
        const { error: updateMembersError } = await supabase
            .from('manage_team')
            .update({ members: updatedMembers })
            .eq('idea_id', ideaId);
            
        if (updateMembersError) {
            throw new Error('Failed to add user to team');
        }

        return res.json({ 
          success: true, 
          message: 'Application accepted and user added to team', 
          profile_id: profileId 
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const rejectApplication = async (req, res) => {
  const applicationId = req.params.id;
  try { 
    const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

    if (updateError) {
        throw new Error('Failed to update application status');
    }
    
    return res.json({
        success: true,
        message: 'Application rejected successfully'
    });
    
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};




  module.exports = {
    createApplication,
    updateApplication,
    getApplicationbyUser,
    getApplicationbyIdea,
    acceptApplication,
    rejectApplication
  }; 