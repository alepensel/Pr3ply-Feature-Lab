import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RoomState {
  session_id: string;
  current_prompt_index: number;
  current_speaker_id: string | null;
  turn_started_at: string | null;
  turn_duration_seconds: number;
  is_paused: boolean;
  session_ended: boolean;
}

const defaultState = (sessionId: string): RoomState => ({
  session_id: sessionId,
  current_prompt_index: 0,
  current_speaker_id: null,
  turn_started_at: null,
  turn_duration_seconds: 60,
  is_paused: true,
  session_ended: false,
});

export const useSessionRoomState = (sessionId: string | undefined, isTutor: boolean) => {
  const [state, setState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("session_room_state" as any)
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setState(data as unknown as RoomState);
      } else if (isTutor) {
        // Tutor creates the initial row
        const initial = defaultState(sessionId);
        await supabase.from("session_room_state" as any).insert(initial);
        setState(initial);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sessionId, isTutor]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`room-state-${sessionId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "session_room_state",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.new) setState(payload.new as unknown as RoomState);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const update = useCallback(async (patch: Partial<RoomState>) => {
    if (!sessionId || !isTutor) return;
    setState((prev) => prev ? { ...prev, ...patch } : prev);
    await supabase
      .from("session_room_state" as any)
      .update(patch)
      .eq("session_id", sessionId);
  }, [sessionId, isTutor]);

  return { state, loading, update };
};