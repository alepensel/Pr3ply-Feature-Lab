import { useParams, useNavigate, Link } from "react-router-dom";
import ParticipantMap from "@/components/ParticipantMap";
import { Clock, Users, Globe, Zap, ArrowLeft, CheckCircle, Calendar, Star, Crown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/hooks/useSessions";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { formatNextSession } from "@/lib/formatNextSession";

interface Participant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
}

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, loading: sessionLoading } = useSession(id);
  const { isTutor } = useUserRole();
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingBooking, setCheckingBooking] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const checkExistingBooking = async () => {
      if (!user || !session) {
        setCheckingBooking(false);
        return;
      }
      const { data } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("session_id", session.id)
        .maybeSingle();
      setIsBooked(!!data);
      setCheckingBooking(false);
    };
    checkExistingBooking();
  }, [user, session]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!session) return;
      const { data: bookings } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("session_id", session.id)
        .eq("status", "confirmed");
      if (!bookings || bookings.length === 0) {
        setParticipants([]);
        return;
      }
      const userIds = bookings.map((b) => b.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, country")
        .in("user_id", userIds);
      setParticipants(profiles || []);
    };
    fetchParticipants();
  }, [session, isBooked]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Session not found</h1>
          <Button asChild className="mt-4">
            <Link to="/">Go back home</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleBookSession = async () => {
    if (!user) {
      navigate("/auth", { state: { returnTo: `/session/${session.id}` } });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      session_id: session.id,
    });
    setIsLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("You've already booked this session");
        setIsBooked(true);
      } else {
        toast.error("Failed to book session. Please try again.");
      }
      return;
    }
    setIsBooked(true);
    toast.success("Session booked successfully!");
  };

  const handleCancelBooking = async () => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("user_id", user.id)
      .eq("session_id", session.id);
    setIsLoading(false);
    if (error) {
      toast.error("Failed to cancel booking. Please try again.");
      return;
    }
    setIsBooked(false);
    toast.success("Booking cancelled");
  };

  const filledSlots = participants.length;
  const emptySlots = Math.max(0, session.maxSpots - filledSlots);

  const practicePoints = [
    "Real-world vocabulary and expressions",
    "Natural conversation flow and turn-taking",
    "Listening comprehension with native-like speech",
    "Confidence building in a supportive group",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container py-4 flex-1 flex flex-col">
        <Button
          variant="ghost"
          asChild
          size="sm"
          className="mb-3 gap-1.5 text-muted-foreground hover:text-foreground text-sm self-start"
        >
          <Link to="/#sessions">
            <ArrowLeft className="h-4 w-4" />
            Back to sessions
          </Link>
        </Button>

        <div className="flex flex-col gap-4 flex-1">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl bg-preply-pink-light p-5 flex flex-col">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="secondary" className="bg-background font-semibold text-sm">
                  {session.theme}
                </Badge>
                <Badge variant="outline" className="font-semibold text-sm">
                  {session.level}
                </Badge>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1.5 text-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium text-sm">{session.language}</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-sm">{session.duration}</span>
                </div>
              </div>

              <h1 className="text-2xl font-extrabold text-foreground lg:text-3xl">
                {session.scenario}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{session.description}</p>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {practicePoints.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1 rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-baseline justify-center gap-1 mb-3">
                  <span className="text-4xl font-extrabold text-foreground">${session.price}</span>
                  <span className="text-sm text-muted-foreground">/ seat</span>
                </div>

                <div className="rounded-lg bg-secondary p-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Next session</span>
                  </div>
                  <p className="text-base font-bold text-foreground mt-1">{formatNextSession(session.nextSession)}</p>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{session.spotsLeft} of {session.maxSpots} spots left</span>
                </div>
              </div>

              <div>
                {isTutor && session.tutor_id === user?.id ? (
                  <Button
                    onClick={() => navigate(`/session/${session.id}/room`)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-2.5 text-base font-semibold gap-2"
                  >
                    <Zap className="h-5 w-5 fill-current" />
                    Join Session
                  </Button>
                ) : checkingBooking ? (
                  <Button disabled className="w-full rounded-full py-2.5 text-sm font-semibold">
                    Loading...
                  </Button>
                ) : isBooked ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-primary font-semibold text-base">
                      <CheckCircle className="h-5 w-5" />
                      <span>You're booked!</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleCancelBooking}
                      disabled={isLoading}
                      className="w-full rounded-full text-sm"
                      size="sm"
                    >
                      {isLoading ? "Cancelling..." : "Cancel booking"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleBookSession}
                    disabled={isLoading || session.spotsLeft === 0}
                    className="w-full bg-preply-pink text-foreground hover:bg-preply-pink/90 rounded-full py-2.5 text-base font-semibold gap-2"
                  >
                    {isLoading ? "Booking..." : (
                      <>
                        <Zap className="h-5 w-5 fill-current" />
                        Book lesson
                      </>
                    )}
                  </Button>
                )}
                {!user && !checkingBooking && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Sign in to book this session
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 items-start">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-bold text-foreground mb-2">Your tutor</h2>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={session.tutor.avatar} alt={session.tutor.name} className="object-cover" />
                  <AvatarFallback className="text-sm font-bold bg-primary text-primary-foreground">
                    {session.tutor.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{session.tutor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.tutor.country} · TEFL Certified
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs font-semibold">{session.tutor.rating}</span>
                    <span className="text-xs text-muted-foreground">· {session.tutor.reviewCount} reviews</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">{session.tutor.bio}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-foreground">Who's joining</h2>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{filledSlots}/{session.maxSpots}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2.5 rounded-lg bg-accent/50 p-2.5">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarImage src={session.tutor.avatar} alt={session.tutor.name} className="object-cover" />
                    <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                      {session.tutor.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{session.tutor.name}</p>
                    <p className="text-[10px] text-muted-foreground">Tutor</p>
                  </div>
                  <Crown className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                </div>

                {participants.map((p) => {
                  const isYou = p.user_id === user?.id;
                  const name = p.display_name || "Student";
                  return (
                    <div key={p.user_id} className="flex items-center gap-2.5 rounded-lg bg-secondary/50 p-2.5">
                      <Avatar className="h-8 w-8 border-2 border-border">
                        <AvatarImage src={p.avatar_url || undefined} alt={name} className="object-cover" />
                        <AvatarFallback className="text-xs font-bold bg-secondary text-muted-foreground">
                          {name[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {name}
                          {isYou && <span className="ml-1 text-[10px] font-medium text-primary">(You)</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Student</p>
                      </div>
                    </div>
                  );
                })}

                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex items-center gap-2.5 rounded-lg border-2 border-dashed border-border p-2.5">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Open spot</p>
                      <p className="text-[10px] text-muted-foreground/60">Waiting for a student</p>
                    </div>
                  </div>
                ))}
              </div>

              {filledSlots > 0 && emptySlots > 0 && !isBooked && (
                <div className="mt-2 rounded-lg bg-accent p-2 text-center">
                  <p className="text-xs font-medium text-accent-foreground">
                    {filledSlots === 1
                      ? "1 student joined — book your spot!"
                      : `${filledSlots} students joined — book yours!`}
                  </p>
                </div>
              )}
            </div>

            <ParticipantMap
              tutorCountry={session.tutor.country}
              participantCountries={participants.map((p) => p.country)}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SessionDetail;
