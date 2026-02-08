import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { sharedSessions } from "@/data/mockData";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Loader2 } from "lucide-react";

interface Booking {
  id: string;
  session_id: string;
  status: string;
  created_at: string;
}

const StudentDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (!error && data) {
        setBookings(data);
      }
      setLoading(false);
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  const getSessionDetails = (sessionId: string) => {
    return sharedSessions.find((s) => s.id === sessionId);
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
              <Button onClick={() => navigate("/#sessions")}>
                Browse Sessions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => {
              const session = getSessionDetails(booking.session_id);
              if (!session) return null;

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-secondary px-2 py-0.5 rounded text-xs font-medium">
                        {session.theme}
                      </span>
                      <Badge className="bg-background/90 text-foreground">
                        {booking.status}
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
                      <MapPin className="h-4 w-4" />
                      <span>Online via Zoom</span>
                    </div>
                    
                    <div className="pt-3 flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        View Details
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
