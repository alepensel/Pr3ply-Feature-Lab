import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-2.5-flash";

async function transcribeUser(admin: any, sessionId: string, userId: string): Promise<string> {
  // List the chunks for this user, ordered by chunk_index
  const { data: chunks } = await admin
    .from("session_audio_chunks")
    .select("path, chunk_index")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("chunk_index", { ascending: true });

  if (!chunks || chunks.length === 0) return "";

  // Download chunks and base64-encode the merged audio (treat each chunk independently to limit memory)
  const transcripts: string[] = [];
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

  for (const c of chunks) {
    const { data: blob } = await admin.storage.from("session-recordings").download(c.path);
    if (!blob) continue;
    const buf = new Uint8Array(await blob.arrayBuffer());
    // base64 encode
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You transcribe spoken audio verbatim. Output only the transcript text with no commentary. If the audio is silent or unintelligible, output an empty string." },
          { role: "user", content: [
            { type: "text", text: "Transcribe this audio:" },
            { type: "input_audio", input_audio: { data: b64, format: "webm" } },
          ] },
        ],
      }),
    });
    if (!res.ok) {
      console.error("transcribe chunk failed", res.status, await res.text().catch(() => ""));
      continue;
    }
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content || "";
    if (text) transcripts.push(typeof text === "string" ? text : JSON.stringify(text));
  }

  return transcripts.join(" ").trim();
}

async function generateFeedback(admin: any, sessionId: string, userId: string, transcript: string, sessionRow: any, prompts: any) {
  if (!transcript) {
    const empty = {
      strengths: [],
      mistakes: [],
      vocabulary_to_remember: [],
      next_steps: "We couldn't capture enough audio from you in this session. Try unmuting yourself and speaking up next time!",
      overall_score: 0,
      headline: "Not enough audio captured",
    };
    await admin.from("session_feedback").upsert({
      session_id: sessionId,
      user_id: userId,
      report: empty,
      score: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "session_id,user_id" });
    return;
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const systemPrompt = `You are an encouraging but honest ${sessionRow.language || "English"} speaking coach. You evaluate a student's spoken contribution to a small-group practice session at CEFR level ${sessionRow.level || "B1"}.`;
  const userPrompt = `Session theme: ${sessionRow.theme}
Scenario: ${sessionRow.scenario}
Role-play prompts used: ${JSON.stringify((prompts || []).map((p: any) => p.title))}

Student transcript:
"""
${transcript}
"""

Give specific, kind feedback focused on the student's actual words.`;

  const tools = [{
    type: "function",
    function: {
      name: "emit_feedback",
      description: "Return a structured feedback report.",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string", description: "One short upbeat sentence summarizing performance" },
          strengths: { type: "array", items: { type: "string" }, description: "2-3 specific strengths" },
          mistakes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phrase_said: { type: "string" },
                suggested_phrase: { type: "string" },
                why: { type: "string" },
              },
              required: ["phrase_said", "suggested_phrase", "why"],
              additionalProperties: false,
            },
          },
          vocabulary_to_remember: { type: "array", items: { type: "string" }, description: "3-5 useful phrases" },
          next_steps: { type: "string", description: "1-2 sentences on what to practice next" },
          overall_score: { type: "integer", minimum: 1, maximum: 10 },
        },
        required: ["headline", "strengths", "mistakes", "vocabulary_to_remember", "next_steps", "overall_score"],
        additionalProperties: false,
      },
    },
  }];

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "emit_feedback" } },
    }),
  });
  if (!res.ok) {
    console.error("feedback gen failed", res.status, await res.text().catch(() => ""));
    return;
  }
  const j = await res.json();
  const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return;
  const report = JSON.parse(args);

  await admin.from("session_feedback").upsert({
    session_id: sessionId,
    user_id: userId,
    report,
    score: report.overall_score ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "session_id,user_id" });
}

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
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
    if (!sessionId) return new Response(JSON.stringify({ error: "sessionId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: sessionRow } = await admin
      .from("sessions")
      .select("id, tutor_id, theme, scenario, description, level, language")
      .eq("id", sessionId)
      .maybeSingle();
    if (!sessionRow) return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (sessionRow.tutor_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the tutor can finalize this session" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark room state as ended
    await admin.from("session_room_state").upsert({
      session_id: sessionId,
      session_ended: true,
      is_paused: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "session_id" });

    // Collect distinct users with audio chunks
    const { data: users } = await admin
      .from("session_audio_chunks")
      .select("user_id")
      .eq("session_id", sessionId);
    const userIds = Array.from(new Set((users || []).map((r: any) => r.user_id)));

    const { data: promptsRow } = await admin
      .from("session_roleplay_prompts")
      .select("prompts")
      .eq("session_id", sessionId)
      .maybeSingle();
    const prompts = promptsRow?.prompts || [];

    // Process serially to avoid concurrent AI quota spikes
    for (const uid of userIds) {
      try {
        const transcript = await transcribeUser(admin, sessionId, uid);
        await admin.from("session_transcripts").upsert({
          session_id: sessionId,
          user_id: uid,
          text: transcript,
          updated_at: new Date().toISOString(),
        }, { onConflict: "session_id,user_id" });
        await generateFeedback(admin, sessionId, uid, transcript, sessionRow, prompts);
      } catch (e) {
        console.error("finalize user failed", uid, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: userIds.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("finalize-session error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});