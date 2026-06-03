import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Options {
  sessionId: string | undefined;
  userId: string | undefined;
  enabled: boolean;
  chunkSeconds?: number;
}

/**
 * Records the user's mic in chunks while enabled, uploading each chunk to the
 * session-recordings bucket and registering it in session_audio_chunks.
 */
export const useSessionRecording = ({ sessionId, userId, enabled, chunkSeconds = 30 }: Options) => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIndexRef = useRef(0);

  useEffect(() => {
    if (!enabled || !sessionId || !userId) return;
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording not supported in this browser");
      return;
    }

    let stopped = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType: mime });
        recorderRef.current = recorder;

        recorder.ondataavailable = async (e) => {
          if (!e.data || e.data.size === 0) return;
          const idx = chunkIndexRef.current++;
          const path = `sessions/${sessionId}/${userId}/${String(idx).padStart(4, "0")}.webm`;
          const startedAt = new Date().toISOString();
          try {
            const { error: upErr } = await supabase.storage
              .from("session-recordings")
              .upload(path, e.data, { contentType: "audio/webm", upsert: true });
            if (upErr) { console.error("chunk upload failed", upErr); return; }
            await supabase.from("session_audio_chunks" as any).insert({
              session_id: sessionId,
              user_id: userId,
              path,
              chunk_index: idx,
              started_at: startedAt,
              duration_ms: chunkSeconds * 1000,
            });
          } catch (err) {
            console.error("chunk persist failed", err);
          }
        };

        recorder.start(chunkSeconds * 1000);
        if (!stopped) setRecording(true);
      } catch (err) {
        console.error("getUserMedia failed", err);
        setError(err instanceof Error ? err.message : "Mic access denied");
      }
    };

    start();

    return () => {
      stopped = true;
      try {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          recorderRef.current.stop();
        }
      } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      recorderRef.current = null;
      streamRef.current = null;
      setRecording(false);
    };
  }, [enabled, sessionId, userId, chunkSeconds]);

  return { recording, error };
};