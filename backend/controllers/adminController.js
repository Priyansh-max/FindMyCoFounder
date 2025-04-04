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
        .eq('status', 'pending')
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

const approveSubmission = async (req, res) => {
    try{
        //got the submissionid this is the id of the submission in the projectSubmission table
        const submissionId = req.params.id;

        console.log("Submission ID:", submissionId);

        //getting the project data
        const { projectDetails , mem_details , checklist} = req.body;


        const idea_id = projectDetails.idea_id;

        //using start_date and todays date to calculate duration in days
        const start_date = new Date(projectDetails.start_date);
        const today = new Date();
        const duration = Math.floor((today - start_date) / (1000 * 60 * 60 * 24));

        console.log("Duration:", duration);

        //get the author of the idea
        const {data, error} = await supabase
        .from('ideas')
        .select('founder_id')
        .eq('id', idea_id)
        .single();

        if(error) throw error;

        const author = data.founder_id;

        console.log("Author:", author);

        let projecttype = '';

        //find if the project is solo or individual.......
        if(mem_details.length === 1 && mem_details[0].id === author){
            projecttype = 'individual';
        }else{
            projecttype = 'team';
        }

        console.log("Project Type:", projecttype);
        // Calculate points for each member based on their role and contributions
        // First, identify the author, direct contributors, and open-source contributors
    
        let project_marked_spam = false;

        if(checklist["Mark SPAM"]){
            project_marked_spam = true;
        }

        console.log("Project Marked Spam:", project_marked_spam);

        let totalCommits = 0;
        let totalPullRequests = 0;
        let totalIssues = 0;
        let totalMergedPRs = 0;
        
        // Add stats from all team members except the author (to avoid double counting)
        mem_details.forEach(member => {
            // Skip if it's the author (already counted)
            if (member.id === author) return;
            
            totalCommits += member.commits || 0;
            totalPullRequests += (member.open_pull_requests || 0) + (member.closed_pull_requests || 0);
            totalIssues += (member.open_issues || 0) + (member.closed_issues || 0);
            totalMergedPRs += member.merged_pull_requests || 0;
        });

        console.log("Total Commits:", totalCommits);
        console.log("Total Pull Requests:", totalPullRequests);
        console.log("Total Issues:", totalIssues);
        console.log("Total Merged PRs:", totalMergedPRs);

        //author points sorted
        let author_points = 0;

        if(project_marked_spam){
            author_points += 70 +
                            (duration * 1) +
                            (mem_details.length * 2) +
                            (totalMergedPRs * 2) -
                            (20);
        }else{
            author_points += 70 + // Completion bonus
                            (duration * 1) + // Days since project started
                            (mem_details.length * 2) + // Team size bonus
                            (totalMergedPRs * 2); // Merged PRs bonus
        }

        console.log("Author Points:", author_points);
        // Initialize points object to store calculated points for each member
        const memberPoints = {};
        mem_details.forEach(member => {
            // Skip if it's the author (already calculated)
            if (member.id === author) return;
            
            // Calculate days since joined
            const joinDate = new Date(member.joined_at);
            const daysSinceJoined = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
            
            // Check if member is a direct contributor (has commits but no PRs or issues)
            const isDirectContributor = member.commits > 0 && 
                                      (member.open_pull_requests === 0 && 
                                       member.closed_pull_requests === 0 && 
                                       member.open_issues === 0 && 
                                       member.closed_issues === 0);
            
            // Calculate points based on contribution type
            let points = 0;
            
            if (isDirectContributor) {
                // Formula for direct contributors: (Days Since Joined × 0.5) + (Valid Commits × 1 for valid / 0 for spam) - (Inactive Days × 1)
                points = (daysSinceJoined * 0.5) + 
                         (member.is_spam ? 0 : member.commits * 3/4) - 
                         (member.inactive_days * 1);
            } else {
                // Formula for open-source contributors: (Days Since Joined × 0.5) + (Merged PRs × 2) - (Inactive Days × 1)
                points = (daysSinceJoined * 0.5) + 
                         (member.merged_pull_requests * 2) - 
                         (member.inactive_days * 1);
            }
            
            // Store calculated points
            memberPoints[member.id] = Math.max(0, Math.round(points)); // Ensure points are not negative and rounded
        });
        
        console.log("Calculated member points:", memberPoints);
        
        // Calculate additional points from checklist items
        let checklistPoints = 0;
        
        // Apply point adjustments based on checklist items
        if (checklist["Does github contains a README.md file"]) {
            checklistPoints += 5; // +5 if README is provided
        } else {
            checklistPoints -= 3; // -5 if README is not provided
        }
        
        if (checklist["Does it has an open issue or open pull request"]) {
            checklistPoints -= 3; // -5 if there are open issues/PRs
        }
        
        if (checklist["Does it provide a video demo"]) {
            checklistPoints += 5; // +10 if video demo provided
        } else {
            checklistPoints -= 3; // -10 if no video demo
        }
        
        if (checklist["Does it provide a relevant description"]) {
            checklistPoints += 5; // +5 if description matches
        } else {
            checklistPoints -= 2; // -5 if description doesn't match
        }

        if(checklist["Does it provide a relevant logo"]){
            checklistPoints += 2;
        }else{
            checklistPoints -= 2;
        }
        
        // Adjust author points based on checklist
        author_points += checklistPoints;
        
        console.log("Checklist added points:", checklistPoints);
        //give each member also checklist points
        Object.keys(memberPoints).forEach(id => {
            memberPoints[id] += checklistPoints/10;
        });
        
        // Make sure no points are negative
        Object.keys(memberPoints).forEach(id => {
            memberPoints[id] = Math.max(0, Math.round(memberPoints[id]));
        });
        
        console.log("Final member points after checklist adjustments:", memberPoints);
        
        //construct a team member array of json objects containing team_member_id , points , avatar_url
        const teamMemberArray = mem_details.map(member => {
            if(member.id === author) return;
            return {
                team_member_id: member.id,
                points: memberPoints[member.id],
                avatar_url: member.avatar_url
            }
        });

        console.log("Team Member Array:", teamMemberArray);

        // idea updated
        const {data: ideaData, error: ideaError} = await supabase
        .from('ideas')
        .update({
            idea_desc : projectDetails.description,
            project_type: projecttype,
            project_link: projectDetails.project_link,
            video_url: projectDetails.video_url,
            duration : duration,
            submission_id: submissionId,
            logo_url: projectDetails.logo_url,
            repo_url: projectDetails.repo_url,
            team : teamMemberArray,
            completion_status: 'approved'
        })
        .eq('id', idea_id);

        if(ideaError) throw ideaError;

        //update authors profile with project_completion
        //the project_completion should store [{project_id , project_title, previous_rating, current_rating, date , role}]

        //get the project completion column fromt the profile table first

        const {data: profileData, error: profileError} = await supabase
        .from('profiles')
        .select('project_completion')
        .eq('id', author)
        .single();

        if(profileError) throw profileError;

        //now use the previous project completion data use the last element of the array current 

        const previous_rating = profileData.project_completion && 
                               Array.isArray(profileData.project_completion) && 
                               profileData.project_completion.length > 0 ? 
                               profileData.project_completion[profileData.project_completion.length - 1].totalRating : 0;

        //use the last element of the array as 
        const project_completion = {
            project_id: idea_id,
            project_title: projectDetails.title,
            rating : author_points,
            totalRating: previous_rating + author_points,
            date: new Date().toISOString(),
            role: 'author'
        }

        // Update author's profile with project completion
        let updatedProjectCompletion = [];
        
        // If there's existing data, use it, otherwise start with empty array
        if (profileData.project_completion && Array.isArray(profileData.project_completion)) {
            updatedProjectCompletion = [...profileData.project_completion];
        }

        // Add new project completion record
        updatedProjectCompletion.push(project_completion);

        // Update author's profile
        const { error: authorUpdateError } = await supabase
            .from('profiles')
            .update({
                project_completion: updatedProjectCompletion,
                project_rating: previous_rating + author_points
            })
            .eq('id', author);

        if (authorUpdateError) throw authorUpdateError;

        // Now handle team members (excluding the author)
        const teamMemberUpdates = mem_details
            .filter(member => member.id !== author) // Exclude author
            .map(async (member) => {
                try {
                    // Get team member's profile data
                    const { data: memberProfileData, error: memberProfileError } = await supabase
                        .from('profiles')
                        .select('project_completion, project_rating, total_commits, total_pull_requests, total_issues, total_merged_pr')
                        .eq('id', member.id)
                        .single();

                    if (memberProfileError) throw memberProfileError;

                    // Initialize values if they don't exist
                    const previousRating = (memberProfileData.project_rating || 0);
                    const points = memberPoints[member.id] || 0;
                    let memberProjectCompletion = [];
                    
                    if (memberProfileData.project_completion && Array.isArray(memberProfileData.project_completion)) {
                        memberProjectCompletion = [...memberProfileData.project_completion];
                    }

                    // Create project completion record for team member
                    const memberCompletionRecord = {
                        project_id: idea_id,
                        project_title: projectDetails.title,
                        rating: points,
                        totalRating: previousRating + points,
                        date: new Date().toISOString(),
                        role: 'contributor'
                    };

                    memberProjectCompletion.push(memberCompletionRecord);

                    // Get current GitHub stats or initialize if not present
                    const currentTotalCommits = memberProfileData.total_commits || 0;
                    const currentTotalPullRequests = memberProfileData.total_pull_requests || 0;
                    const currentTotalIssues = memberProfileData.total_issues || 0;
                    const currentTotalMergedPR = memberProfileData.total_merged_pr || 0;
                    
                    // Get member's contributions from this project
                    const newCommits = member.commits || 0;
                    const newPullRequests = (member.open_pull_requests || 0) + (member.closed_pull_requests || 0);
                    const newIssues = (member.open_issues || 0) + (member.closed_issues || 0);
                    const newMergedPR = member.merged_pull_requests || 0;

                    // Update team member's profile
                    const { error: memberUpdateError } = await supabase
                        .from('profiles')
                        .update({
                            project_completion: memberProjectCompletion,
                            project_rating: previousRating + points,
                            total_commits: currentTotalCommits + newCommits,
                            total_pull_requests: currentTotalPullRequests + newPullRequests,
                            total_issues: currentTotalIssues + newIssues,
                            total_merged_pr: currentTotalMergedPR + newMergedPR
                        })
                        .eq('id', member.id);

                    if (memberUpdateError) throw memberUpdateError;

                    return {
                        userId: member.id,
                        success: true
                    };
                } catch (error) {
                    console.error(`Error updating profile for team member ${member.id}:`, error);
                    return {
                        userId: member.id,
                        success: false,
                        error: error.message
                    };
                }
            });
        
        // Wait for all team member updates to complete
        const teamMemberResults = await Promise.all(teamMemberUpdates);

        // Update submission status
        const { error: submissionError } = await supabase
            .from('projectSubmission')
            .update({
                status: 'approved',
            })
            .eq('id', submissionId);

        if (submissionError) throw submissionError;

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Project approved successfully',
        });
    } catch(error) {
        console.error('Error in approveSubmission:', error);    
        res.status(500).json({error: error.message});
    }
}


module.exports = { getSubmissions, approveSubmission };
