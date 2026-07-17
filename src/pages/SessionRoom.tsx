import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSessions";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AgoraVideoCall from "@/components/AgoraVideoCall";
import LearningRail from "@/components/LearningRail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Video, Users, Clock, ArrowLeft, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { countryFlag } from "@/lib/countryFlag";
import { useSessionRecording } from "@/hooks/useSessionRecording";

const SessionRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isTutor } = useUserRole();
  const navigate = useNavigate();
  const { session, loading } = useSession(id);
  const [inCall, setInCall] = useState(false);
  const [authzChecked, setAuthzChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const channelName = `session-${id}`;

  const langMap: Record<string, string> = {
    english: "en-US", spanish: "es-ES", french: "fr-FR", german: "de-DE",
    italian: "it-IT", portuguese: "pt-BR", japanese: "ja-JP", korean: "ko-KR",
    chinese: "zh-CN", russian: "ru-RU", arabic: "ar-SA", dutch: "nl-NL",
  };
  const sttLang = langMap[(session?.language || "english").toLowerCase()] || "en-US";

  const { recording, error: recordingError } = useSessionRecording({
    sessionId: id,
    userId: user?.id,
    enabled: inCall,
    language: sttLang,
  });

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user || !session || !id) return;
      if (isTutor && session.tutor_id === user.id) {
        setIsAuthorized(true);
        setAuthzChecked(true);
        return;
      }
      const { data } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("session_id", id)
        .eq("status", "confirmed")
        .maybeSingle();
      setIsAuthorized(!!data);
      setAuthzChecked(true);
    };
    verifyAccess();
  }, [user, session, id, isTutor]);

  const displayName = useMemo(() => {
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return user?.email?.split("@")[0] || "Student";
  }, [profile, user]);

  if (loading || (user && session && !authzChecked)) {
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

  if (!isAuthorized) {
    navigate(`/session/${id}`);
    return null;
  }

  return (
    <div className={cn("bg-background flex flex-col", inCall ? "h-screen overflow-hidden" : "min-h-screen")}>
      <Header />
      <main className={cn("flex-1 flex flex-col", inCall ? "min-h-0" : "")}>
        {inCall ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-semibold">
                  {session.theme}
                </Badge>
                <span className="text-sm font-medium">{session.scenario}</span>
                {recording && (
                  <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground" title="Your browser transcribes speech to generate post-session feedback. Pr3ply stores the recognized text, not an audio recording.">
                    <Circle className="h-2 w-2 fill-destructive text-destructive animate-pulse" />
                    Live transcription on
                  </span>
                )}
                {recordingError && (
                  <span className="hidden sm:flex items-center gap-1.5 text-xs text-destructive" title={recordingError}>
                    Transcription unavailable
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{session.maxSpots} participants</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              <div className="flex-1 min-h-0 flex flex-col">
                <AgoraVideoCall
                  channelName={channelName}
                  displayName={displayName}
                  sessionId={id!}
                  onLeave={() => setInCall(false)}
                />
              </div>
              <LearningRail
                sessionId={id!}
                isTutor={isTutor && session.tutor_id === user.id}
                tutor={{ id: session.tutor_id, name: session.tutor.name, avatar: session.tutor.avatar }}
              />
            </div>
          </div>
        ) : (
          <div className="container py-8 md:py-16 max-w-3xl mx-auto">
            <Button variant="ghost" asChild className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to My Sessions
              </Link>
            </Button>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="bg-preply-pink-light p-8 text-center">
                <Badge variant="secondary" className="mb-3 bg-background font-semibold">{session.theme}</Badge>
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{session.scenario}</h1>
                <p className="mt-2 text-muted-foreground">{session.description}</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {isTutor ? (
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="h-16 w-16 border-4 border-primary">
                        <AvatarImage src={profile?.avatar_url || session.tutor.avatar} alt={session.tutor.name} className="object-cover" />
                        <AvatarFallback>{session.tutor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="text-sm font-semibold">
                          {session.tutor.name} {countryFlag(session.tutor.country) && <span>{countryFlag(session.tutor.country)}</span>}
                        </p>
                        <Badge variant="outline" className="text-xs bg-preply-pink-light">Tutor (You)</Badge>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-16 w-16 border-4 border-primary">
                          <AvatarImage src={session.tutor.avatar} alt={session.tutor.name} className="object-cover" />
                          <AvatarFallback>{session.tutor.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="text-sm font-semibold">
                            {session.tutor.name} {countryFlag(session.tutor.country) && <span>{countryFlag(session.tutor.country)}</span>}
                          </p>
                          <Badge variant="outline" className="text-xs">Tutor</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-16 w-16 border-4 border-preply-pink">
                          <AvatarImage src={profile?.avatar_url || undefined} alt="You" className="object-cover" />
                          <AvatarFallback className="text-lg font-bold bg-secondary text-muted-foreground">
                            {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="text-sm font-semibold">
                            {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : "You"}
                            {countryFlag(profile?.country) && <> <span>{countryFlag(profile?.country)}</span></>}
                          </p>
                          <Badge variant="outline" className="text-xs bg-preply-pink-light">You</Badge>
                        </div>
                      </div>
                    </>
                  )}
                  {Array.from({ length: Math.max(0, session.maxSpots - (isTutor ? 1 : 2)) }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="h-16 w-16 rounded-full bg-secondary border-4 border-border flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-muted-foreground">Open spot</p>
                        <Badge variant="outline" className="text-xs">Participant</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span>{session.duration}</span></div>
                  <div className="flex items-center gap-1.5"><Video className="h-4 w-4" /><span>Video call</span></div>
                </div>

                <div className="text-center pt-4">
                  <Button size="lg" className="bg-preply-pink text-foreground hover:bg-preply-pink/90 rounded-full px-10 py-6 text-lg font-semibold gap-2" onClick={() => setInCall(true)}>
                    <Video className="h-5 w-5" />
                    Join Session
                  </Button>
                  <p className="mt-3 text-sm text-muted-foreground">The video call will start inside this page</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {!inCall && <Footer />}
    </div>
  );
};

export default SessionRoom;
