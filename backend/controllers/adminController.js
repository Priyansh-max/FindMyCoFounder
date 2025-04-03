const {createClient} = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const getSubmissions = async (req, res) => {
    try{
        const {data, error} = await supabase
        .from('projectSubmission')
        .select('*')
        .order('submitted_on', { ascending: false });

        if(error) throw error;

        // Process submissions and fetch profile data for team members
        //promise here means waiting for all the submissions to be processed    
        const submissions = await Promise.all(data.map(async (submission) => {
            // Make sure mem_stats exists and is an array
            if (!submission.mem_stats || !Array.isArray(submission.mem_stats)) {
                return submission;
            }

            // Get all profile IDs from mem_stats
            const profileIds = submission.mem_stats
                .filter(member => member && member.id)
                .map(member => member.id);

            if (profileIds.length === 0) {
                return submission;
            }

            // Fetch profiles data in a single query
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, github_username')
                .in('id', profileIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                return submission;
            }

            // Create a map for quick lookup
            const profilesMap = {};
            profilesData.forEach(profile => {
                profilesMap[profile.id] = profile;
            });

            // Enhance each member in mem_stats with profile data
            const enhancedMemStats = submission.mem_stats.map(member => {
                if (member && member.id && profilesMap[member.id]) {
                    return {
                        ...member,
                        full_name: profilesMap[member.id].full_name || 'Unknown',
                        avatar_url: profilesMap[member.id].avatar_url || null,
                        github_username: profilesMap[member.id].github_username || member.github_username || 'unknown'
                    };
                }
                return member;
            });

            // Return enhanced submission
            return {
                ...submission,
                mem_stats: enhancedMemStats
            };
        }));

        // Return the processed submissions
        res.status(200).json({
            success: true,
            data: submissions
        });
        
    } catch(error) {
        console.error('Error in getSubmissions:', error);
        res.status(500).json({error: error.message});
    }
};

module.exports = { getSubmissions };
