import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  short_id: string;
  title: string;
  description?: string;
  transcript?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { short_id, title, description, transcript } = await req.json() as ModerationRequest;

    if (!short_id || !title) {
      throw new Error("short_id and title are required");
    }

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build content for moderation - use transcript if available, otherwise use title/description
    const contentToModerate = transcript 
      ? `Title: ${title}\nDescription: ${description || 'N/A'}\nTranscript: ${transcript}`
      : `Title: ${title}\nDescription: ${description || 'N/A'}`;

    console.log(`Moderating video ${short_id}...`);
    console.log(`Content length: ${contentToModerate.length} characters`);

    // Call Lovable AI for classification - using flash-lite for speed and cost efficiency
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an AI content moderator for an educational video platform for teens and students.
Your job is to classify video content as either 'Educational' or 'Non-educational'.

Classification criteria:
- 'Educational': Content that teaches or explains subjects in science, math, history, language, coding, geography, psychology, economics, health, arts, or other academic/learning topics. The content must have clear educational value and learning outcomes.
- 'Non-educational': Entertainment-only content, memes, pranks, vlogs without educational value, gaming without learning context, drama, celebrity gossip, or anything unrelated to learning.

You must respond with ONLY one word: 'Educational' or 'Non-educational'.`
          },
          {
            role: "user",
            content: `Classify this video content:\n\n${contentToModerate}`
          }
        ],
        max_tokens: 20, // Very low to save credits
        temperature: 0, // Deterministic output
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limited by AI gateway");
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required for AI gateway");
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const classification = aiResponse.choices?.[0]?.message?.content?.trim() || "";
    
    console.log(`AI classification for ${short_id}: "${classification}"`);

    // Parse classification result
    const isEducational = classification.toLowerCase().includes("educational") && 
                          !classification.toLowerCase().includes("non-educational");
    
    const moderationStatus = isEducational ? "approved" : "flagged";
    const isApproved = isEducational; // Auto-approve educational content

    // Update the short with moderation result
    const { error: updateError } = await supabase
      .from("shorts")
      .update({
        is_educational: isEducational,
        moderation_status: moderationStatus,
        moderation_result: classification,
        moderated_at: new Date().toISOString(),
        is_approved: isApproved,
        transcript: transcript || null,
      })
      .eq("id", short_id);

    if (updateError) {
      console.error("Failed to update short:", updateError);
      throw new Error(`Failed to update short: ${updateError.message}`);
    }

    // Log moderation result (for audit trail)
    const { error: logError } = await supabase
      .from("moderation_logs")
      .insert({
        short_id,
        classification,
        raw_response: JSON.stringify(aiResponse),
      });

    if (logError) {
      console.error("Failed to log moderation:", logError);
      // Don't throw - logging failure shouldn't block the response
    }

    console.log(`Video ${short_id} moderated: ${moderationStatus}`);

    return new Response(JSON.stringify({
      success: true,
      short_id,
      is_educational: isEducational,
      moderation_status: moderationStatus,
      is_approved: isApproved,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
