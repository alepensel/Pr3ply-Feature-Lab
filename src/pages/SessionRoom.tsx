import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sharedSessions } from "@/data/mockData";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Users, Clock, ArrowLeft, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const JITSI_DOMAIN = "meet.jit.si";

const SessionRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const session = sharedSessions.find((s) => s.id === id);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [inCall, setInCall] = useState(false);
  const apiRef = useRef<any>(null);

  const roomName = `preply-shared-${id}`;

  const endCall = () => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    setInCall(false);
  };

  useEffect(() => {
    if (!inCall || !jitsiContainerRef.current || !user) return;

    const initJitsi = () => {
      if (!jitsiContainerRef.current) return;

      // @ts-ignore
      const jitsiApi = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user.email?.split("@")[0] || "Student",
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [
            "microphone", "camera", "desktop", "chat",
            "raisehand", "tileview", "hangup",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
        },
      });

      jitsiApi.addListener("readyToClose", () => {
        endCall();
      });

      apiRef.current = jitsiApi;
    };

    // @ts-ignore
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement("script");
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      document.head.appendChild(script);
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCall]);

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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        {inCall ? (
          <div className="flex-1 flex flex-col">
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
            <div ref={jitsiContainerRef} className="flex-1 bg-black" style={{ minHeight: "500px" }} />
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
                  <div className="flex flex-col items-center gap-2">
                    <img src={session.tutor.avatar} alt={session.tutor.name} className="h-16 w-16 rounded-full object-cover border-4 border-primary" />
                    <div className="text-center">
                      <p className="text-sm font-semibold">{session.tutor.name}</p>
                      <Badge variant="outline" className="text-xs">Tutor</Badge>
                    </div>
                  </div>
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
