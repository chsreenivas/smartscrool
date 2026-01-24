import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Transcribe request from user: ${userId}`);

    const { shortId, title, description } = await req.json();

    if (!shortId || !title) {
      throw new Error("shortId and title are required");
    }

    // Generate transcript, summary, difficulty, and topics using AI
    console.log(`Generating content analysis for short ${shortId}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an educational content analyzer. Generate a realistic transcript, summary, difficulty rating, and topic tags for educational videos.`
          },
          {
            role: "user",
            content: `Analyze this educational video and generate:
1. A realistic transcript (under 200 words) as if narrating the video
2. A 1-2 sentence summary highlighting the key learning point
3. Difficulty level: easy, medium, or hard (based on complexity)
4. 3-5 topic tags

Title: ${title}
Description: ${description || 'N/A'}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_video",
              description: "Analyze educational video content",
              parameters: {
                type: "object",
                properties: {
                  transcript: { type: "string", description: "Educational video transcript, under 200 words" },
                  summary: { type: "string", description: "1-2 sentence summary of key learning point" },
                  difficulty_level: { type: "string", enum: ["easy", "medium", "hard"], description: "Content difficulty" },
                  topics: { type: "array", items: { type: "string" }, description: "3-5 relevant topic tags" }
                },
                required: ["transcript", "summary", "difficulty_level", "topics"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_video" } },
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    let analysis = {
      transcript: "",
      summary: "",
      difficulty_level: "medium",
      topics: [] as string[]
    };

    if (toolCall?.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        // Fallback to text response
        analysis.transcript = aiResponse.choices?.[0]?.message?.content?.trim() || "";
      }
    }

    console.log(`Generated analysis for ${shortId}: difficulty=${analysis.difficulty_level}, topics=${analysis.topics.join(', ')}`);

    // Update the short with all generated content
    const supabaseService = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error: updateError } = await supabaseService
      .from("shorts")
      .update({ 
        transcript: analysis.transcript,
        ai_summary: analysis.summary,
        difficulty_level: analysis.difficulty_level,
        topics: analysis.topics
      })
      .eq("id", shortId);

    if (updateError) {
      console.error("Failed to update short with analysis:", updateError);
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    console.log(`Analysis saved for ${shortId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcript: analysis.transcript,
        summary: analysis.summary,
        difficulty_level: analysis.difficulty_level,
        topics: analysis.topics
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in transcribe-video:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
