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

module.exports = {
    createTeam,
    checkTeam
};
