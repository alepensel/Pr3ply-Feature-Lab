import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { sharedSessions } from "@/data/mockData";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Video, Users, Clock, ArrowLeft, PhoneOff } from "lucide-react";
import { useMemo, useState } from "react";

const JITSI_DOMAIN = "meet.jit.si";

const SessionRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const session = sharedSessions.find((s) => s.id === id);
  const [inCall, setInCall] = useState(false);

  const roomName = `Pr3plyShared${id}`;

  const displayName = useMemo(() => {
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name || ""}`.trim();
    }
    return user?.email?.split("@")[0] || "Student";
  }, [profile, user]);

  const jitsiUrl = useMemo(() => {
    const config = [
      "config.prejoinConfig.enabled=false",
      "config.prejoinPageEnabled=false",
      "config.startWithAudioMuted=true",
      "config.startWithVideoMuted=false",
      "config.disableDeepLinking=true",
      "config.hideConferenceSubject=true",
      "config.hideConferenceTimer=true",
      "config.enableInsecureRoomNameWarning=false",
      "config.toolbarButtons=%5B%22microphone%22%2C%22camera%22%2C%22desktop%22%2C%22chat%22%2C%22raisehand%22%2C%22tileview%22%2C%22hangup%22%5D",
      "interfaceConfig.SHOW_JITSI_WATERMARK=false",
      "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false",
      "interfaceConfig.TOOLBAR_ALWAYS_VISIBLE=true",
      "interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true",
      "interfaceConfig.MOBILE_APP_PROMO=false",
      `userInfo.displayName=${encodeURIComponent(displayName)}`,
    ].join("&");

    return `https://${JITSI_DOMAIN}/${roomName}#${config}`;
  }, [roomName, displayName]);

  const endCall = () => {
    setInCall(false);
  };

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col min-h-0">
        {inCall ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-semibold">
                  {session.theme}
                </Badge>
                <span className="text-sm font-medium">{session.scenario}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{session.maxSpots} participants</span>
                </div>
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={endCall}>
                  <PhoneOff className="h-4 w-4" />
                  Leave
                </Button>
              </div>
            </div>
            <div className="relative flex-1" style={{ minHeight: 0 }}>
              <iframe
                src={jitsiUrl}
                allow="camera;microphone;fullscreen;display-capture;autoplay"
                className="absolute inset-0 w-full h-full border-0"
                title="Video session"
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
                  {/* Tutor */}
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-16 w-16 border-4 border-primary">
                      <AvatarImage src={session.tutor.avatar} alt={session.tutor.name} className="object-cover" />
                      <AvatarFallback>{session.tutor.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-sm font-semibold">{session.tutor.name}</p>
                      <Badge variant="outline" className="text-xs">Tutor</Badge>
                    </div>
                  </div>
                  {/* Current user (You) */}
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
                      </p>
                      <Badge variant="outline" className="text-xs bg-preply-pink-light">You</Badge>
                    </div>
                  </div>
                  {/* Other open spots */}
                  {Array.from({ length: Math.max(0, session.maxSpots - 2) }).map((_, i) => (
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
