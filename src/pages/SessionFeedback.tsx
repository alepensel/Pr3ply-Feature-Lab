import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useSessions } from "@/hooks/useSessions";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionCard from "@/components/SessionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles, ThumbsUp, AlertCircle, BookOpen, Target, FileText } from "lucide-react";

interface FeedbackReport {
  headline: string;
  strengths: string[];
  mistakes: { phrase_said: string; suggested_phrase: string; why: string }[];
  vocabulary_to_remember: string[];
  next_steps: string;
  overall_score: number;
}

const SessionFeedback = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession(id);
  const { sessions: upcoming } = useSessions();
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return;
      const [fb, tr] = await Promise.all([
        supabase.from("session_feedback" as any).select("report, score").eq("session_id", id).eq("user_id", user.id).maybeSingle(),
        supabase.from("session_transcripts" as any).select("text").eq("session_id", id).eq("user_id", user.id).maybeSingle(),
      ]);
      if ((fb.data as any)?.report) setReport((fb.data as any).report as FeedbackReport);
      if ((tr.data as any)?.text) setTranscript((tr.data as any).text);
      setLoading(false);
    };
    if (user && id) load();
  }, [id, user]);

  const rebookOptions = useMemo(() => {
    if (!session) return upcoming.slice(0, 3);
    return upcoming
      .filter((s) => s.id !== id)
      .sort((a, b) => {
        const aSameTutor = a.tutor_id === session.tutor_id ? 0 : 1;
        const bSameTutor = b.tutor_id === session.tutor_id ? 0 : 1;
        if (aSameTutor !== bSameTutor) return aSameTutor - bSameTutor;
        const aSameLevel = a.level === session.level ? 0 : 1;
        const bSameLevel = b.level === session.level ? 0 : 1;
        return aSameLevel - bSameLevel;
      })
      .slice(0, 3);
  }, [session, upcoming, id]);

  if (authLoading || sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-8 md:py-12 max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to My Sessions</Link>
        </Button>

        {!report ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h2 className="text-xl font-bold mb-2">Feedback not ready yet</h2>
              <p className="text-muted-foreground">Your personalized feedback will appear here once the tutor ends the session.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Hero */}
            <Card className="overflow-hidden">
              <div className="bg-preply-pink-light p-6 md:p-8">
                {session && <Badge variant="secondary" className="bg-background mb-3 font-semibold">{session.theme}</Badge>}
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">{report.headline}</h1>
                {session && <p className="mt-2 text-muted-foreground">{session.scenario}</p>}
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-foreground">{report.overall_score}</span>
                  <span className="text-muted-foreground">/ 10</span>
                </div>
              </div>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><ThumbsUp className="h-5 w-5 text-preply-pink" /> Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-preply-pink mt-0.5">•</span>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Mistakes */}
            {report.mistakes?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><AlertCircle className="h-5 w-5 text-preply-pink" /> Things to improve</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.mistakes.map((m, i) => (
                    <div key={i} className="border-l-2 border-preply-pink pl-4">
                      <p className="text-sm"><span className="text-muted-foreground line-through">{m.phrase_said}</span></p>
                      <p className="text-sm font-semibold mt-1">{m.suggested_phrase}</p>
                      <p className="text-xs text-muted-foreground mt-1">{m.why}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Vocabulary */}
            {report.vocabulary_to_remember?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5 text-preply-pink" /> Vocabulary to remember</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {report.vocabulary_to_remember.map((v, i) => (
                      <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-secondary">{v}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5 text-preply-pink" /> Next steps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{report.next_steps}</p>
              </CardContent>
            </Card>

            {/* Transcript */}
            {transcript && (
              <Card>
                <CardHeader>
                  <button onClick={() => setTranscriptOpen((o) => !o)} className="flex items-center gap-2 text-left">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{transcriptOpen ? "Hide" : "Show"} transcript</CardTitle>
                  </button>
                </CardHeader>
                {transcriptOpen && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{transcript}</p>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Rebook */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keep the momentum going</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Sessions matched to your level{session ? ` and ${session.tutor.name}'s teaching style` : ""}.</p>
              </CardHeader>
              <CardContent>
                {rebookOptions.length === 0 ? (
                  <Button asChild className="bg-preply-pink text-foreground hover:bg-preply-pink/90 font-semibold">
                    <Link to="/">Browse all sessions</Link>
                  </Button>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {rebookOptions.map((s) => (
                      <SessionCard key={s.id} {...s} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SessionFeedback;