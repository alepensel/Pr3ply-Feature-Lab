import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tutor as defaultTutor } from "@/data/mockData";

export interface Session {
  id: string;
  tutor_id: string;
  theme: string;
  scenario: string;
  description: string;
  language: string;
  level: string;
  duration: string;
  price: number;
  max_spots: number;
  next_session: string;
  scheduled_at: string;
  meet_link: string;
  created_at: string;
  updated_at: string;
}

export interface SessionWithTutor extends Session {
  tutor: typeof defaultTutor;
  spotsLeft: number;
  maxSpots: number;
  nextSession: string;
}

export const useSessions = () => {
  const [sessions, setSessions] = useState<SessionWithTutor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    if (data) {
      const sessionIds = data.map((s: any) => s.id);

      // Use security definer function so ALL users see accurate counts
      const { data: counts } = await supabase.rpc("session_booking_counts", {
        _session_ids: sessionIds,
      });

      const bookingCounts: Record<string, number> = {};
      (counts || []).forEach((row: any) => {
        bookingCounts[row.session_id] = Number(row.count);
      });

      const mapped: SessionWithTutor[] = data.map((s: any) => {
        const booked = bookingCounts[s.id] || 0;
        return {
          ...s,
          tutor: defaultTutor,
          spotsLeft: Math.max(0, s.max_spots - booked),
          maxSpots: s.max_spots,
          nextSession: s.next_session,
        };
      });
      setSessions(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
};

export const useSession = (id: string | undefined) => {
  const [session, setSession] = useState<SessionWithTutor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!id) { setLoading(false); return; }
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        const { data: counts } = await supabase.rpc("session_booking_counts", {
          _session_ids: [data.id],
        });

        const booked = counts?.[0]?.count ? Number(counts[0].count) : 0;
        setSession({
          ...data,
          tutor: defaultTutor,
          spotsLeft: Math.max(0, data.max_spots - booked),
          maxSpots: data.max_spots,
          nextSession: data.next_session,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  return { session, loading };
};
