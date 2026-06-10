import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSessions } from "@/hooks/useSessions";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, Loader2, Sparkles, Check, Star } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { tutor as defaultTutor } from "@/data/mockData";

interface Booking {
  id: string;
  session_id: string;
  status: string;
  created_at: string;
}

interface FeedbackEntry {
  session_id: string;
  score: number | null;
  report: { headline?: string } | null;
  session: {
    id: string;
    theme: string;
    scenario: string;
    scheduled_at: string;
  } | null;
}

const useNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};

const isSessionJoinable = (scheduledAt: string, now: Date) => {
  const start = new Date(scheduledAt);
  const diffMin = (start.getTime() - now.getTime()) / 60_000;
  return diffMin <= 10 && diffMin > -60;
};

const getTimeUntilLabel = (scheduledAt: string, now: Date) => {
  const start = new Date(scheduledAt);
  const diffMin = Math.round((start.getTime() - now.getTime()) / 60_000);
  if (diffMin <= 0) return "Happening now";
  if (diffMin < 60) return `Starts in ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `Starts in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Starts in ${days}d`;
};

const StudentDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { sessions } = useSessions();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [bookedSessions, setBookedSessions] = useState<Record<string, any>>({});
  const [attendedSessionIds, setAttendedSessionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const now = useNow();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setBookings(data);
      setLoading(false);
    };
    if (user) fetchBookings();
  }, [user]);

  useEffect(() => {
    const fetchBookedSessions = async () => {
      if (bookings.length === 0) { setBookedSessions({}); return; }
      const ids = Array.from(new Set(bookings.map((b) => b.session_id)));
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .in("id", ids);
      const map: Record<string, any> = {};
      (data || []).forEach((s: any) => {
        map[s.id] = {
          ...s,
          tutor: defaultTutor,
          maxSpots: s.max_spots,
          spotsLeft: Math.max(0, s.max_spots),
          nextSession: s.next_session,
        };
      });
      setBookedSessions(map);
    };
    fetchBookedSessions();
  }, [bookings]);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("session_feedback" as any)
        .select("session_id, score, report")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (!data) return;
      const rows = data as any[];
      // Pull session info for each feedback row
      const sessionIds = rows.map((r) => r.session_id);
      if (sessionIds.length === 0) { setFeedbackEntries([]); return; }
      const { data: sessionRows } = await supabase
        .from("sessions")
        .select("id, theme, scenario, scheduled_at")
        .in("id", sessionIds);
      const sessionsById: Record<string, any> = {};
      (sessionRows || []).forEach((s: any) => { sessionsById[s.id] = s; });
      setFeedbackEntries(rows.map((r) => ({
        session_id: r.session_id,
        score: r.score,
        report: r.report,
        session: sessionsById[r.session_id] || null,
      })));
    };
    if (user) fetchFeedback();
  }, [user]);

  useEffect(() => {
    const fetchAttended = async () => {
      if (!user) { setAttendedSessionIds(new Set()); return; }
      const ids = new Set<string>();
      const { data: fb } = await supabase
        .from("session_feedback" as any)
        .select("session_id")
        .eq("user_id", user.id);
      (fb as any[] | null)?.forEach((r) => ids.add(r.session_id));
      const { data: audio } = await supabase
        .from("session_audio_chunks" as any)
        .select("session_id")
        .eq("user_id", user.id);
      (audio as any[] | null)?.forEach((r) => ids.add(r.session_id));
      setAttendedSessionIds(ids);
    };
    fetchAttended();
  }, [user]);

  const getSessionDetails = (sessionId: string) =>
    sessions.find((s) => s.id === sessionId) || bookedSessions[sessionId];

  const feedbackBySession = feedbackEntries.reduce<Record<string, FeedbackEntry>>((acc, f) => {
    acc[f.session_id] = f;
    return acc;
  }, {});

  const upcomingBookings = bookings.filter((b) => {
    const s = getSessionDetails(b.session_id);
    if (!s) return false;
    return new Date(s.scheduled_at).getTime() > now.getTime() - 60 * 60_000;
  });

  const pastBookings = bookings
    .filter((b) => {
      const s = getSessionDetails(b.session_id);
      if (!s) return false;
      if (new Date(s.scheduled_at).getTime() > now.getTime() - 60 * 60_000) return false;
      return attendedSessionIds.has(b.session_id);
    })
    .sort((a, b) => {
      const sa = getSessionDetails(a.session_id);
      const sb = getSessionDetails(b.session_id);
      return new Date(sb?.scheduled_at || 0).getTime() - new Date(sa?.scheduled_at || 0).getTime();
    });

  const formatPastDate = (iso: string, durationMin = 50) => {
    const start = new Date(iso);
    const end = new Date(start.getTime() + durationMin * 60_000);
    const day = start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const t = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} · ${t(start)} – ${t(end)}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your booked conversation sessions
          </p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions booked yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse available sessions and book your first conversation practice!
              </p>
              <Button onClick={() => navigate("/#sessions")}>Browse Sessions</Button>
            </CardContent>
          </Card>
        ) : (
          <>
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">Upcoming lessons</h2>
            {upcomingBookings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming lessons booked.</p>
            ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingBookings.map((booking) => {
              const session = getSessionDetails(booking.session_id);
              if (!session) return null;

              const joinable = isSessionJoinable(session.scheduled_at, now);
              const timeLabel = getTimeUntilLabel(session.scheduled_at, now);

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium">
                        {session.theme}
                      </span>
                      <Badge
                        className={
                          joinable
                            ? "bg-primary text-primary-foreground"
                            : "bg-background/90 text-foreground"
                        }
                      >
                        {timeLabel}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{session.scenario}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <img
                        src={session.tutor.avatar}
                        alt={session.tutor.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="font-medium">
                        {session.tutor.name} {countryFlag(session.tutor.country) && <span>{countryFlag(session.tutor.country)}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{session.nextSession}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{session.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{session.maxSpots} spots total</span>
                    </div>
                    <div className="pt-3 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        className="flex-1 bg-preply-pink text-foreground hover:bg-preply-pink/90 gap-1.5"
                        onClick={() => navigate(`/session/${session.id}/room`)}
                      >
                        <Video className="h-4 w-4" />
                        Join
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">Past lessons</h2>
            {pastBookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <Check className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No past lessons yet. Once you complete a session, it will appear here with your feedback.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastBookings.map((booking) => {
                  const session = getSessionDetails(booking.session_id);
                  if (!session) return null;
                  const fb = feedbackBySession[booking.session_id];
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <img
                        src={session.tutor.avatar}
                        alt={session.tutor.name}
                        className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {formatPastDate(session.scheduled_at)}
                          </span>
                          {fb?.score != null && (
                            <span className="inline-flex items-center gap-1 bg-preply-pink/30 text-foreground px-2 py-0.5 rounded text-xs font-semibold">
                              <Star className="h-3 w-3 fill-current" />
                              {fb.score}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Check className="h-4 w-4" />
                          <span>Completed</span>
                          <span>·</span>
                          <span>{session.tutor.name}, {session.theme}</span>
                        </div>
                      </div>
                      {fb ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/session/${booking.session_id}/feedback`)}
                          className="gap-1.5 flex-shrink-0"
                        >
                          <Sparkles className="h-4 w-4" />
                          View feedback
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/session/${booking.session_id}`)}
                          className="flex-shrink-0"
                        >
                          View details
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
