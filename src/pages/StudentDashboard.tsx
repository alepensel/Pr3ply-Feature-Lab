import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { sharedSessions } from "@/data/mockData";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, Loader2 } from "lucide-react";

interface Booking {
  id: string;
  session_id: string;
  status: string;
  created_at: string;
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
  // Joinable 10 minutes before start and up to 60 minutes after
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
  const [bookings, setBookings] = useState<Booking[]>([]);
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

  const getSessionDetails = (sessionId: string) =>
    sharedSessions.find((s) => s.id === sessionId);

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              const session = getSessionDetails(booking.session_id);
              if (!session) return null;

              const joinable = isSessionJoinable(session.scheduledAt, now);
              const timeLabel = getTimeUntilLabel(session.scheduledAt, now);

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
                      <span className="font-medium">{session.tutor.name}</span>
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Video className="h-4 w-4" />
                      <span>Google Meet</span>
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
                        disabled={!joinable}
                        className="flex-1 bg-preply-pink text-foreground hover:bg-preply-pink/90 gap-1.5"
                        onClick={() => navigate(`/session/${session.id}/room`)}
                      >
                        <Video className="h-4 w-4" />
                        {joinable ? "Join" : "Join"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
