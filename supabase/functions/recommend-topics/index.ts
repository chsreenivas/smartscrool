import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limit: 5 requests per hour for recommend-topics
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Authenticate the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    console.log(`Generating recommendations for user: ${userId}`);

    // Check rate limit using service role client
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: rateLimitAllowed, error: rateLimitError } = await supabaseService.rpc(
      'check_rate_limit',
      {
        p_user_id: userId,
        p_endpoint: 'recommend-topics',
        p_max_requests: RATE_LIMIT_MAX_REQUESTS,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS
      }
    );

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (!rateLimitAllowed) {
      console.log(`Rate limit exceeded for user: ${userId}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Recommendations refresh every hour. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's watch history (categories and topics)
    const { data: viewHistory, error: viewError } = await supabase
      .from('short_views')
      .select('short_id, shorts!inner(category, topics, subtopic)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (viewError) {
      console.error("Error fetching view history:", viewError);
    }

    // Get user's interests from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('interests')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    // Compile watch data
    const watchedCategories: Record<string, number> = {};
    const watchedTopics: string[] = [];

    if (viewHistory) {
      for (const view of viewHistory) {
        const short = view.shorts as any;
        if (short?.category) {
          watchedCategories[short.category] = (watchedCategories[short.category] || 0) + 1;
        }
        if (short?.topics) {
          watchedTopics.push(...short.topics);
        }
        if (short?.subtopic) {
          watchedTopics.push(short.subtopic);
        }
      }
    }

    const interests = profile?.interests || [];

    // Build context for AI
    const watchContext = Object.entries(watchedCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => `${cat} (${count} videos)`)
      .join(', ');

    const topTopics = [...new Set(watchedTopics)].slice(0, 10).join(', ');

    const availableTopics = [
      "Math", "Science", "Early American History", "Psychology", "ELA",
      "Money & Personal Finance", "Technology", "SAT Prep", "Music", "Philosophy"
    ];

    console.log(`Watch context: ${watchContext}`);
    console.log(`Top topics: ${topTopics}`);
    console.log(`User interests: ${interests.join(', ')}`);

    // Call AI for recommendations
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
            content: `You are a learning recommendation assistant for an educational video platform for students.
Based on the user's watch history and interests, suggest 3 topics they should explore next.

Available topics: ${availableTopics.join(', ')}

You MUST respond using the suggest_topics function.`
          },
          {
            role: "user",
            content: `User's watch history:
- Categories watched: ${watchContext || 'No history yet'}
- Topics explored: ${topTopics || 'None yet'}
- Stated interests: ${interests.length > 0 ? interests.join(', ') : 'None specified'}

Suggest 3 topics for them to explore next, with brief reasons why.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_topics",
              description: "Return topic recommendations for the user",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string", description: "The topic name from available topics" },
                        reason: { type: "string", description: "Brief reason why this topic fits the user (max 15 words)" },
                        priority: { type: "number", description: "Priority 1-3, 1 being highest" }
                      },
                      required: ["topic", "reason", "priority"]
                    }
                  }
                },
                required: ["recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_topics" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response:", JSON.stringify(aiResponse));

    // Parse tool call response
    let recommendations = [];
    try {
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        recommendations = parsed.recommendations || [];
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      // Fallback recommendations
      recommendations = [
        { topic: "Science", reason: "Great for curious minds", priority: 1 },
        { topic: "Math", reason: "Build foundational skills", priority: 2 },
        { topic: "Psychology", reason: "Understand how people think", priority: 3 }
      ];
    }

    // Map topic names to slugs
    const topicSlugMap: Record<string, string> = {
      "Math": "math",
      "Science": "science",
      "Early American History": "history",
      "Psychology": "psychology",
      "ELA": "ela",
      "Money & Personal Finance": "money",
      "Technology": "technology",
      "SAT Prep": "sat-prep",
      "Music": "music",
      "Philosophy": "philosophy"
    };

    const enrichedRecommendations = recommendations.map((rec: any) => ({
      ...rec,
      slug: topicSlugMap[rec.topic] || rec.topic.toLowerCase().replace(/\s+/g, '-')
    }));

    return new Response(JSON.stringify({
      success: true,
      recommendations: enrichedRecommendations
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Recommendation error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
