import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sharedSessions } from "@/data/mockData";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Users, Clock, ArrowLeft, ExternalLink } from "lucide-react";

const SessionRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const session = sharedSessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20 text-center">
          <h1 className="text-2xl font-bold">Session not found</h1>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-16 max-w-3xl mx-auto">
        <Button
          variant="ghost"
          asChild
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to My Sessions
          </Link>
        </Button>

        {/* Session room card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="bg-preply-pink-light p-8 text-center">
            <Badge variant="secondary" className="mb-3 bg-background font-semibold">
              {session.theme}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
              {session.scenario}
            </h1>
            <p className="mt-2 text-muted-foreground">{session.description}</p>
          </div>

          {/* Meeting info */}
          <div className="p-8 space-y-6">
            {/* Participants */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {/* Tutor */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={session.tutor.avatar}
                  alt={session.tutor.name}
                  className="h-16 w-16 rounded-full object-cover border-4 border-primary"
                />
                <div className="text-center">
                  <p className="text-sm font-semibold">{session.tutor.name}</p>
                  <Badge variant="outline" className="text-xs">Tutor</Badge>
                </div>
              </div>

              {/* Student placeholders */}
              {Array.from({ length: session.maxSpots - 1 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-secondary border-4 border-border flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-muted-foreground">Student {i + 1}</p>
                    <Badge variant="outline" className="text-xs">Participant</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Session details */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{session.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                <span>Google Meet</span>
              </div>
            </div>

            {/* Join button */}
            <div className="text-center pt-4">
              <Button
                asChild
                size="lg"
                className="bg-preply-pink text-foreground hover:bg-preply-pink/90 rounded-full px-10 py-6 text-lg font-semibold gap-2"
              >
                <a href={session.meetLink} target="_blank" rel="noopener noreferrer">
                  <Video className="h-5 w-5" />
                  Join on Google Meet
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">
                You'll be redirected to Google Meet in a new tab
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SessionRoom;
