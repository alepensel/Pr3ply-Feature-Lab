import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Options {
  sessionId: string | undefined;
  userId: string | undefined;
  enabled: boolean;
  language?: string; // BCP-47 e.g. "en-US"
}

/**
 * Live-transcribes the local user's speech using the browser Web Speech API
 * and periodically upserts the accumulated transcript into session_transcripts.
 * The application stores only recognized text. Audio handling is controlled by
 * the browser's speech-recognition implementation and may involve a platform
 * recognition service.
 */
export const useSessionRecording = ({ sessionId, userId, enabled, language = "en-US" }: Options) => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const dirtyRef = useRef(false);
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !sessionId || !userId) return;
    const SR: any =
      (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      setError("Live transcription isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    let stopped = false;

    const flush = async () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      const text = transcriptRef.current.trim();
      try {
        await supabase
          .from("session_transcripts")
          .upsert(
            { session_id: sessionId, user_id: userId, text, updated_at: new Date().toISOString() },
            { onConflict: "session_id,user_id" }
          );
      } catch (err) {
        console.error("transcript upsert failed", err);
      }
    };

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let appended = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) appended += (r[0]?.transcript || "") + " ";
      }
      if (appended) {
        transcriptRef.current = (transcriptRef.current + " " + appended).replace(/\s+/g, " ").trim();
        dirtyRef.current = true;
      }
    };
    recognition.onerror = (e: any) => {
      if (e?.error && e.error !== "no-speech" && e.error !== "aborted") {
        console.warn("speech recognition error", e.error);
      }
    };
    recognition.onend = () => {
      // Auto-restart while still enabled (Chrome stops after pauses)
      if (!stopped) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    try {
      recognition.start();
      setRecording(true);
    } catch (err) {
      console.error("recognition.start failed", err);
      setError("Could not start live transcription");
    }

    flushTimerRef.current = window.setInterval(flush, 8000);

    return () => {
      stopped = true;
      if (flushTimerRef.current) window.clearInterval(flushTimerRef.current);
      try { recognition.onend = null; recognition.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
      setRecording(false);
      // Final flush
      flush();
    };
  }, [enabled, sessionId, userId, language]);

  return { recording, error };
};
