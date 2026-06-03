import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RoleplayPrompt {
  title: string;
  setup: string;
  your_turn: string;
  vocabulary: string[];
  follow_up: string;
}

export const useSessionPrompts = (sessionId: string | undefined, isTutor: boolean) => {
  const [prompts, setPrompts] = useState<RoleplayPrompt[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    if (!sessionId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("session_roleplay_prompts" as any)
      .select("prompts")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (data) setPrompts((data as any).prompts as RoleplayPrompt[]);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  const generate = useCallback(async (regenerate = false) => {
    if (!sessionId || !isTutor) return;
    setGenerating(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("generate-roleplay-prompts", {
      body: { sessionId, regenerate },
    });
    setGenerating(false);
    if (fnError) { setError(fnError.message); return; }
    if ((data as any)?.prompts) setPrompts((data as any).prompts);
  }, [sessionId, isTutor]);

  return { prompts, loading, generating, error, generate, refetch: fetchPrompts };
};