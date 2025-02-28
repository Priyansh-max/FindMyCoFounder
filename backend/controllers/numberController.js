const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get applications sent by the user
    const { data: sentApplications, error: sentError } = await supabase
      .from('applications')
      .select('status')
      .eq('profile_id', userId);

    if (sentError) throw sentError;

    // Get ideas posted by the user
    const { data: postedIdeas, error: ideasError } = await supabase
      .from('ideas')
      .select('id')
      .eq('founder_id', userId);

    if (ideasError) throw ideasError;

    // Get all applications received on user's ideas
    const { data: receivedApplications, error: receivedError } = await supabase
      .from('applications')
      .select('status, idea_id')
      .in('idea_id', postedIdeas.map(idea => idea.id));

    if (receivedError) throw receivedError;

    // Calculate statistics for sent applications
    const sentStats = {
      total: sentApplications.length,
      accepted: sentApplications.filter(app => app.status === 'accepted').length,
      pending: sentApplications.filter(app => app.status === 'pending').length,
      rejected: sentApplications.filter(app => app.status === 'rejected').length
    };

    // Calculate statistics for received applications
    const receivedStats = {
      total: receivedApplications.length,
      accepted: receivedApplications.filter(app => app.status === 'accepted').length,
      pending: receivedApplications.filter(app => app.status === 'pending').length,
      rejected: receivedApplications.filter(app => app.status === 'rejected').length
    };

    // Calculate total ideas posted
    const ideasCount = postedIdeas.length;

    res.json({
      success: true,
      data: {
        applications_sent: sentStats,
        applications_received: receivedStats,
        ideas_posted: ideasCount
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = {
  getStats
};
