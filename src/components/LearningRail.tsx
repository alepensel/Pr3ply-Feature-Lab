import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Pause, Play, Plus, RefreshCw, SkipForward, Sparkles, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionPrompts, type RoleplayPrompt } from "@/hooks/useSessionPrompts";
import { useSessionRoomState } from "@/hooks/useSessionRoomState";
import SpeakingTimer from "./SpeakingTimer";
import { toast } from "sonner";

interface Participant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  sessionId: string;
  isTutor: boolean;
  tutor: { id: string; name: string; avatar: string };
}

const DURATION_PRESETS = [30, 60, 90, 120];

const LearningRail = ({ sessionId, isTutor, tutor }: Props) => {
  const navigate = useNavigate();
  const { prompts, loading: promptsLoading, generating, generate } = useSessionPrompts(sessionId, isTutor);
  const { state, update } = useSessionRoomState(sessionId, isTutor);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [finalizing, setFinalizing] = useState(false);

  // Auto-generate prompts the first time the tutor opens the rail
  useEffect(() => {
    if (isTutor && !promptsLoading && !prompts && !generating) {
      generate(false);
    }
  }, [isTutor, promptsLoading, prompts, generating, generate]);

  // Load participants for speaker picker
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("session_participants", { _session_id: sessionId });
      if (data) setParticipants(data as any);
    })();
  }, [sessionId]);

  const everyone: Participant[] = [
    { user_id: tutor.id, display_name: `${tutor.name} (Tutor)`, avatar_url: tutor.avatar },
    ...participants.filter((p) => p.user_id !== tutor.id),
  ];

  const promptIndex = state?.current_prompt_index ?? 0;
  const currentPrompt: RoleplayPrompt | undefined = prompts?.[promptIndex];
  const duration = state?.turn_duration_seconds ?? 60;

  const advancePrompt = (delta: number) => {
    if (!prompts) return;
    const next = Math.max(0, Math.min(prompts.length - 1, promptIndex + delta));
    update({ current_prompt_index: next, turn_started_at: null, current_speaker_id: null, is_paused: true });
  };

  const pickSpeaker = (userId: string) => {
    update({ current_speaker_id: userId, turn_started_at: new Date().toISOString(), is_paused: false });
  };

  const togglePause = () => {
    if (!state?.turn_started_at) {
      update({ turn_started_at: new Date().toISOString(), is_paused: false });
      return;
    }
    update({ is_paused: !state.is_paused });
  };

  const addTime = () => {
    update({ turn_duration_seconds: duration + 15 });
  };

  const skipTurn = () => {
    update({ turn_started_at: null, current_speaker_id: null, is_paused: true });
  };

  const setDuration = (d: number) => {
    update({ turn_duration_seconds: d, turn_started_at: state?.turn_started_at ? new Date().toISOString() : null });
  };

  const endSession = async () => {
    setFinalizing(true);
    toast.message("Generating transcripts and feedback…", { description: "This can take a minute or two." });
    const { error } = await supabase.functions.invoke("finalize-session", { body: { sessionId } });
    setFinalizing(false);
    if (error) {
      toast.error("Could not finalize session", { description: error.message });
      return;
    }
    toast.success("Session ended", { description: "Feedback is ready in students' dashboards." });
    navigate(`/session/${sessionId}/feedback`);
  };

  const speakerProfile = state?.current_speaker_id
    ? everyone.find((p) => p.user_id === state.current_speaker_id)
    : null;

  return (
    <aside className="flex flex-col bg-card border-l border-border w-full md:w-[360px] md:min-w-[360px] h-full overflow-y-auto">
      {/* Prompt card */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="gap-1.5"><Sparkles className="h-3 w-3" />Role-play</Badge>
          {prompts && (
            <span className="text-xs text-muted-foreground">
              {promptIndex + 1} / {prompts.length}
            </span>
          )}
        </div>

        {(promptsLoading || generating) && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            {generating ? "Generating prompts…" : "Loading prompts…"}
          </div>
        )}

        {!promptsLoading && !generating && !prompts && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {isTutor ? "No prompts yet." : "Waiting for the tutor to start…"}
            {isTutor && (
              <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => generate(false)}>
                <Sparkles className="h-3.5 w-3.5" /> Generate prompts
              </Button>
            )}
          </div>
        )}

        {currentPrompt && (
          <div className="space-y-3">
            <h3 className="font-bold text-foreground leading-tight">{currentPrompt.title}</h3>
            <p className="text-sm text-muted-foreground">{currentPrompt.setup}</p>

            <div className="bg-preply-pink-light/40 rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70 mb-1">Your turn</p>
              <p className="text-sm">{currentPrompt.your_turn}</p>
            </div>

            {currentPrompt.vocabulary?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Useful phrases</p>
                <div className="flex flex-wrap gap-1.5">
                  {currentPrompt.vocabulary.map((v) => (
                    <span key={v} className="text-xs px-2 py-1 rounded-full bg-secondary text-foreground">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {currentPrompt.follow_up && (
              <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                Follow-up: {currentPrompt.follow_up}
              </p>
            )}
          </div>
        )}

        {isTutor && prompts && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => advancePrompt(-1)} disabled={promptIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => advancePrompt(1)} disabled={promptIndex >= prompts.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => generate(true)} disabled={generating}>
              <RefreshCw className={cn("h-3.5 w-3.5", generating && "animate-spin")} /> Regenerate
            </Button>
          </div>
        )}
      </div>

      {/* Speaking turn */}
      <div className="p-4 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Speaking turn</p>
        <div className="flex items-center gap-4">
          <SpeakingTimer
            startedAt={state?.turn_started_at ?? null}
            durationSeconds={duration}
            paused={state?.is_paused ?? true}
          />
          <div className="flex-1 min-w-0">
            {speakerProfile ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9 ring-2 ring-preply-pink">
                  <AvatarImage src={speakerProfile.avatar_url || undefined} />
                  <AvatarFallback>{(speakerProfile.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{speakerProfile.display_name || "Speaker"}</p>
                  <p className="text-xs text-muted-foreground">Speaking now</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{isTutor ? "Pick a speaker below to start the turn" : "Waiting for the tutor to pick a speaker"}</p>
            )}
          </div>
        </div>

        {isTutor && (
          <>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={togglePause}>
                {state?.is_paused || !state?.turn_started_at ? <><Play className="h-3.5 w-3.5" /> Start</> : <><Pause className="h-3.5 w-3.5" /> Pause</>}
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={addTime}>
                <Plus className="h-3.5 w-3.5" />15s
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={skipTurn}>
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </Button>
            </div>
            <div className="flex gap-1.5 mt-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={cn(
                    "flex-1 text-xs py-1 rounded-md border transition-colors",
                    duration === d ? "bg-preply-pink text-foreground border-transparent font-semibold" : "bg-background text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {d}s
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Participants / speaker picker */}
      {isTutor && (
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Tap to set speaker</p>
          <div className="flex flex-col gap-1.5">
            {everyone.map((p) => (
              <button
                key={p.user_id}
                onClick={() => pickSpeaker(p.user_id)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
                  state?.current_speaker_id === p.user_id ? "bg-preply-pink-light font-semibold" : "hover:bg-secondary"
                )}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{(p.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <span className="truncate">{p.display_name || "Participant"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* End session */}
      {isTutor && (
        <div className="p-4 mt-auto">
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={endSession}
            disabled={finalizing}
          >
            {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
            End session & generate feedback
          </Button>
        </div>
      )}
    </aside>
  );
};

export default LearningRail;