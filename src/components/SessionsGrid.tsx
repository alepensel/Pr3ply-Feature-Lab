import SessionCard from "./SessionCard";
import { useSessions } from "@/hooks/useSessions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const SessionsGrid = () => {
  const { sessions, loading } = useSessions();
  const { user } = useAuth();
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchBooked = async () => {
      if (!user) { setBookedIds(new Set()); return; }
      const { data } = await supabase
        .from("bookings")
        .select("session_id")
        .eq("user_id", user.id)
        .eq("status", "confirmed");
      setBookedIds(new Set((data || []).map((b) => b.session_id)));
    };
    fetchBooked();
  }, [user, sessions]);

  return (
    <section id="sessions" className="bg-secondary/50 py-20 md:py-28 flex-1">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Upcoming Shared Sessions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join other students for immersive conversation practice with Maya
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} {...session} isBooked={bookedIds.has(session.id)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SessionsGrid;
