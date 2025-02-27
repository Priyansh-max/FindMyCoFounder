const { createClient } = require('@supabase/supabase-js');
const { get } = require('../routes/profileRoutes');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const createIdea = async (req, res) => {
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

  const updateIdea = async (req, res) => {
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
  //get all ideas excluding the currentuser's posted ideas
  const getIdeas = async (req, res) => {
    try {
      const userId = req.user.id;
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          profiles:founder_id (
            id,
            full_name,
            email,
            avatar_url,
            github_url,
            portfolio_url,
            description
          )
        `)
        .eq('status', 'open')
        // .neq('founder_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to a cleaner format
      const formattedData = data.map(idea => ({
        ...idea,
        founder: idea.profiles,
        profiles: undefined // Remove the nested profiles object
      }));

      res.json({
        success: true,
        data: formattedData
      });
    } catch (error) {
      console.error('Idea fetch error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  };

  //get idea posted by the current user
  const getIdeabyUser = async (req, res) => {
    try {
      const userId = req.user.id; //make it by header
  
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .single();
  
      if (error) throw error;
  
      res.json(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: error.message });
    }
  };

  module.exports = {
    createIdea,
    updateIdea,
    getIdeas,
    getIdeabyUser
  }; 