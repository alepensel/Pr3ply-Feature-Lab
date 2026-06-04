import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-3-flash-preview";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
    const regenerate = !!body?.regenerate;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Only tutor of this session can trigger generation
    const { data: sessionRow } = await admin
      .from("sessions")
      .select("id, tutor_id, theme, scenario, description, level, language, max_spots")
      .eq("id", sessionId)
      .maybeSingle();
    if (!sessionRow) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (sessionRow.tutor_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the tutor can generate prompts" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!regenerate) {
      const { data: existing } = await admin
        .from("session_roleplay_prompts")
        .select("prompts")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (existing?.prompts) {
        return new Response(JSON.stringify({ prompts: existing.prompts, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert ${sessionRow.language || "English"} conversation coach.
You design short, engaging role-play prompts for small group speaking practice sessions.
Each prompt must be appropriate for CEFR level ${sessionRow.level || "B1"} learners and tightly tied to the session's theme and scenario.
Output 5 prompt cards, each takes about 2-4 minutes of speaking practice for a group of ${sessionRow.max_spots || 3} people.`;

    const userPrompt = `Session theme: ${sessionRow.theme}
Scenario: ${sessionRow.scenario}
Description: ${sessionRow.description || "(none provided)"}

Generate 5 role-play prompt cards. Each card should describe a mini-scenario where one student speaks at a time (the tutor will pick who speaks). Make them concrete, fun, and progressively a bit more challenging.`;

    const tools = [{
      type: "function",
      function: {
        name: "emit_prompts",
        description: "Return the role-play prompt cards.",
        parameters: {
          type: "object",
          properties: {
            prompts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short catchy title, 3-6 words" },
                  setup: { type: "string", description: "1-2 sentence context setting the scene" },
                  your_turn: { type: "string", description: "What the current speaker should say or do" },
                  vocabulary: { type: "array", items: { type: "string" }, description: "3-5 useful words or phrases" },
                  follow_up: { type: "string", description: "A deeper follow-up question the tutor can ask" },
                },
                required: ["title", "setup", "your_turn", "vocabulary", "follow_up"],
                additionalProperties: false,
              },
            },
          },
          required: ["prompts"],
          additionalProperties: false,
        },
      },
    }];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "emit_prompts" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Lovable Cloud settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) throw new Error("No tool call in AI response");
    const parsed = JSON.parse(args);
    const prompts = parsed.prompts;
    if (!Array.isArray(prompts) || prompts.length === 0) throw new Error("AI returned no prompts");

    const { error: upErr } = await admin
      .from("session_roleplay_prompts")
      .upsert({ session_id: sessionId, prompts, model: MODEL, updated_at: new Date().toISOString() }, { onConflict: "session_id" });
    if (upErr) throw new Error(upErr.message);

    return new Response(JSON.stringify({ prompts, cached: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-roleplay-prompts error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});