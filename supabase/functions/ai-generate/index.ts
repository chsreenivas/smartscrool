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
    console.log(`AI Generate request from user: ${userId}`);

    const { type, shortId, transcript, title, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (type === "quiz") {
      systemPrompt = `You are an educational quiz generator. Create engaging, thought-provoking multiple choice questions based on the video content. Questions should test comprehension and critical thinking, not just recall.`;
      userPrompt = `Generate a quiz question for this educational video:
Title: ${title}
Description: ${description || 'N/A'}
Transcript: ${transcript || 'N/A'}

Create one question with 4 options. Make sure the question is educational and the wrong answers are plausible but clearly incorrect.`;

      tools = [
        {
          type: "function",
          function: {
            name: "create_quiz",
            description: "Create a quiz question with multiple choice answers",
            parameters: {
              type: "object",
              properties: {
                question: { type: "string", description: "The quiz question" },
                options: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Array of 4 answer options"
                },
                correct_answer: { 
                  type: "number", 
                  description: "Index of correct answer (0-3)" 
                },
                explanation: { 
                  type: "string", 
                  description: "Brief explanation of why the answer is correct" 
                }
              },
              required: ["question", "options", "correct_answer", "explanation"],
              additionalProperties: false
            }
          }
        }
      ];
      toolChoice = { type: "function", function: { name: "create_quiz" } };

    } else if (type === "summary") {
      systemPrompt = `You are an educational content summarizer. Create concise, engaging summaries that capture the key learning points.`;
      userPrompt = `Summarize this educational video for a student:
Title: ${title}
Description: ${description || 'N/A'}
Transcript: ${transcript || 'N/A'}

Provide a summary, 3-5 key points, and 2-3 related topics to explore.`;

      tools = [
        {
          type: "function",
          function: {
            name: "create_summary",
            description: "Create a summary of the educational content",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "2-3 sentence summary" },
                key_points: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "3-5 key learning points"
                },
                related_topics: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "2-3 related topics to explore" 
                }
              },
              required: ["summary", "key_points", "related_topics"],
              additionalProperties: false
            }
          }
        }
      ];
      toolChoice = { type: "function", function: { name: "create_summary" } };

    } else {
      throw new Error(`Unknown generation type: ${type}`);
    }

    console.log(`Generating ${type} for short ${shortId}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools,
        tool_choice: toolChoice
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

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log(`Generated ${type}:`, result);

    // Save to database using service role
    const supabaseService = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);

    if (type === "quiz") {
      const { error: quizError } = await supabaseService
        .from('quizzes')
        .upsert({
          short_id: shortId,
          question: result.question,
          options: result.options,
          correct_answer: result.correct_answer,
          explanation: result.explanation,
          xp_reward: 10
        }, { onConflict: 'short_id' });

      if (quizError) {
        console.error("Error saving quiz:", quizError);
      }
    } else if (type === "summary") {
      const { error: summaryError } = await supabaseService
        .from('ai_summaries')
        .upsert({
          short_id: shortId,
          summary: result.summary,
          key_points: result.key_points,
          related_topics: result.related_topics
        }, { onConflict: 'short_id' });

      if (summaryError) {
        console.error("Error saving summary:", summaryError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-generate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
