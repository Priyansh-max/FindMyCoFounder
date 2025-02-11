import supabase from "./supabase";
import { validateText } from "./validateContent";

export default async function moderateContent(req: Request) {
    try {
      const { title, ideaDescription, developmentRequirements, additionalInfo } = await req.json();
  
      // Validate each field
      const validationResults = {
        title: await validateText(title),
        ideaDescription: await validateText(ideaDescription),
        developmentRequirements: await validateText(developmentRequirements),
        additionalInfo: await validateText(additionalInfo),
      };
  
      // Check if any field contains slang or gibberish
      const isValid = Object.values(validationResults).every(
        (res) => !res.containsSlang && !res.isGibberish
      );
  
      if (!isValid) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Some fields contain slang or gibberish.",
            validationResults,
          }),
          { status: 400 }
        );
      }
  
      // Save to Supabase if valid
      const { data, error } = await supabase
        .from("submissions")
        .insert([{ title, ideaDescription, developmentRequirements, additionalInfo }]);
  
      if (error) throw error;
  
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        { status: 500 }
      );
    }
  }