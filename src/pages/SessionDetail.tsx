import { useParams, useNavigate, Link } from "react-router-dom";
import { Clock, Users, Globe, Star, Zap, ArrowLeft, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sharedSessions } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingBooking, setCheckingBooking] = useState(true);

  const session = sharedSessions.find((s) => s.id === id);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-16">
        {/* Back button */}
        <Button
          variant="ghost"
          asChild
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link to="/#sessions">
            <ArrowLeft className="h-4 w-4" />
            Back to sessions
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-preply-pink-light p-8">
              <Badge variant="secondary" className="mb-4 bg-background font-semibold">
                {session.theme}
              </Badge>
              <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">
                {session.scenario}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">{session.description}</p>

              {/* Meta info */}
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">{session.language}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">{session.duration}</span>
                </div>
                <Badge variant="outline" className="font-semibold text-base px-3 py-1">
                  {session.level}
                </Badge>
              </div>
            </div>

            {/* What you'll practice */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">What you'll practice</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-muted-foreground">Real-world vocabulary and expressions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-muted-foreground">Natural conversation flow and turn-taking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-muted-foreground">Listening comprehension with native-like speech</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-muted-foreground">Confidence building in a supportive group setting</span>
                </li>
              </ul>
            </div>

            {/* Tutor info */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Your tutor</h2>
              <div className="flex items-center gap-4">
                <img
                  src={session.tutor.avatar}
                  alt={session.tutor.name}
                  className="h-16 w-16 rounded-full object-cover border-4 border-primary"
                />
                <div>
                  <p className="text-lg font-bold text-foreground">{session.tutor.name}</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    From {session.tutor.country} · TEFL Certified
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-semibold">{session.tutor.rating}</span>
                    </div>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">
                      {session.tutor.reviewCount} reviews
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">
                      {session.tutor.lessonCount.toLocaleString()} lessons
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">{session.tutor.bio}</p>
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-lg">
              {/* Price */}
              <div className="text-center mb-6">
                <p className="text-4xl font-extrabold text-foreground">${session.price}</p>
                <p className="text-sm text-muted-foreground">per seat</p>
              </div>

              {/* Next session */}
              <div className="rounded-lg bg-secondary p-4 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Next session</p>
                </div>
                <p className="text-lg font-bold text-foreground">{session.nextSession}</p>
              </div>

              {/* Spots left */}
              <div className="flex items-center justify-center gap-2 mb-6 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {session.spotsLeft} of {session.maxSpots} spots left
                </span>
              </div>

              {/* Book button */}
              {checkingBooking ? (
                <Button disabled className="w-full rounded-full py-6 text-lg font-semibold">
                  Loading...
                </Button>
              ) : isBooked ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                    <CheckCircle className="h-5 w-5" />
                    <span>You're booked!</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCancelBooking}
                    disabled={isLoading}
                    className="w-full rounded-full"
                  >
                    {isLoading ? "Cancelling..." : "Cancel booking"}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleBookSession}
                  disabled={isLoading || session.spotsLeft === 0}
                  className="w-full bg-preply-pink text-foreground hover:bg-preply-pink/90 rounded-full py-6 text-lg font-semibold gap-2"
                >
                  {isLoading ? (
                    "Booking..."
                  ) : (
                    <>
                      <Zap className="h-5 w-5 fill-current" />
                      Book lesson
                    </>
                  )}
                </Button>
              )}

              {!user && !checkingBooking && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  You'll need to sign in to book this session
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SessionDetail;
