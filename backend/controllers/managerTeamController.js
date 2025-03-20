const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

//check if team exists for a particular idea or not...
const checkTeam = async (req , res) => {
    const idea_id = req.params.id;
    try{
        const {data , error} = await supabase
        .from('manage_team')
        .select('*')
        .eq('idea_id', idea_id);

        if (error) throw error;

        if(data.length > 0){
            res.status(200).json({success : true});
        }else{
            res.status(200).json({success : false});
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//create-team record when view team is pressed..
const createTeam = async (req, res) => {

    const idea_id = req.params.id;

    try{
        const {data , error} = await supabase
        .from('manage_team')
        .insert({
            idea_id: idea_id,
            created_at: new Date(),
        })  

        if (error) throw error;

        res.status(200).json(
        {
            success : true,
            data : data
        });
    }catch(error){
        res.status(500).json({ error: error.message });
    }   
    
}       

//update team record when view team is pressed..
const updateTeam = async (req, res) => {
    const idea_id = req.params.id;

    const repo_name = req.body.repo_name;
    const repo_url = req.body.repo_url;

    try{
        const { data , error } = await supabase
        .from('manage_team')
        .update({
            repo_name: repo_name,
            repo_url: repo_url,
            updated_at: new Date(),
        })
        .eq('idea_id', idea_id);

        if (error) throw error;

        res.status(200).json({success : true , data : data});
    }catch(error){
        res.status(500).json({ error: error.message });
    }

}

const getTeam = async (req, res) => {   
    const idea_id = req.params.id;      
    try {
        // First get the team data with basic info
        const { data: teamData, error: teamError } = await supabase
            .from('manage_team')
            .select('*')
            .eq('idea_id', idea_id)
            .single();
            

        if (teamError) throw teamError;

        // If there are members, fetch their profile information
        if (teamData.members && teamData.members.length > 0) {
            // Extract member IDs from the members array
            const memberIds = teamData.members.map(member => 
                typeof member === 'object' ? member.id : member
            );

            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    email,
                    avatar_url,
                    github_url,
                    portfolio_url,
                    resume_url,
                    description,
                    skills,
                    github_username
                `)
                .in('id', memberIds);

            if (profilesError) throw profilesError;

            // Combine profile data with joined_at timestamps and sort by join date
            teamData.member_profiles = profilesData.map(profile => {
                const memberInfo = teamData.members.find(member => 
                    (typeof member === 'object' && member.id === profile.id) || 
                    member === profile.id
                );
                return {
                    ...profile,
                    joined_at: typeof memberInfo === 'object' ? memberInfo.joined_at : new Date().toISOString()
                };
            })
            .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at)); // Sort in descending order
        } else {
            teamData.member_profiles = [];
        }

        res.status(200).json({
            success: true,
            data: teamData
        });

    } catch (error) {
        console.error('Error fetching team data:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    createTeam,
    checkTeam,
    updateTeam,
    getTeam
};
