import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { sharedSessions } from "@/data/mockData";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Users, Video, Loader2 } from "lucide-react";

interface BookingWithProfile {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    country: string | null;
  } | null;
}

const TutorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchAllBookings = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("bookings")
        .select("*, profiles!bookings_user_id_fkey(first_name, last_name, avatar_url, country)")
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      // If the join fails (no FK), fetch separately
      if (data && data.length > 0 && data[0].profiles !== undefined) {
        setBookings(data as BookingWithProfile[]);
      } else if (data) {
        // Fallback: fetch profiles separately
        const userIds = [...new Set(data.map((b: any) => b.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url, country")
          .in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        setBookings(
          data.map((b: any) => ({
            ...b,
            profiles: profileMap.get(b.user_id) || null,
          }))
        );
      }
      setLoading(false);
    };
    if (user) fetchAllBookings();
  }, [user]);

  // Group bookings by session
  const sessionBookings = sharedSessions.map((session) => {
    const sessionBks = bookings.filter((b) => b.session_id === session.id);
    return { session, bookings: sessionBks };
  }).filter((s) => s.bookings.length > 0);

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
          <h1 className="text-3xl font-bold tracking-tight">My Sessions (Tutor)</h1>
          <p className="text-muted-foreground mt-2">
            View all booked sessions and join your students
          </p>
        </div>

        {sessionBookings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions booked yet</h3>
              <p className="text-muted-foreground">
                No students have booked any sessions yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessionBookings.map(({ session, bookings: bks }) => (
              <Card key={session.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {session.theme} · {session.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {bks.length}/{session.maxSpots} booked
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{session.scenario}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{session.nextSession}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{session.duration}</span>
                  </div>

                  {/* Students enrolled */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Students enrolled
                    </p>
                    <div className="space-y-2">
                      {bks.map((b) => {
                        const p = b.profiles;
                        const name = p?.first_name
                          ? `${p.first_name} ${p.last_name || ""}`.trim()
                          : "Student";
                        return (
                          <div key={b.id} className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={p?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{name}</span>
                            {p?.country && (
                              <span className="text-xs text-muted-foreground">
                                ({p.country})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TutorDashboard;
