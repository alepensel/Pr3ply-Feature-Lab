import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Session } from "@/hooks/useSessions";

const THEMES = ["Travel", "Workplace", "Social", "Academic", "Daily Life"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DURATIONS = ["30 min", "45 min", "60 min", "90 min"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: Session | null;
  onSaved: () => void;
}

const SessionFormDialog = ({ open, onOpenChange, session, onSaved }: Props) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [theme, setTheme] = useState("Travel");
  const [scenario, setScenario] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("English");
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["B1"]);
  const [duration, setDuration] = useState("45 min");
  const [price, setPrice] = useState("16");
  const [maxSpots, setMaxSpots] = useState("2");
  const [meetLink, setMeetLink] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("14:00");
  const [nextSessionLabel, setNextSessionLabel] = useState("");

  useEffect(() => {
    if (session) {
      setTheme(session.theme);
      setScenario(session.scenario);
      setDescription(session.description);
      setLanguage(session.language);
      setSelectedLevels(session.level.split(", ").map((l) => l.trim()));
      setDuration(session.duration);
      setPrice(String(session.price));
      setMaxSpots(String(session.max_spots));
      setMeetLink(session.meet_link);
      setNextSessionLabel(session.next_session);
      const d = new Date(session.scheduled_at);
      setScheduledDate(d);
      setScheduledTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    } else {
      setTheme("Travel");
      setScenario("");
      setDescription("");
      setLanguage("English");
      setSelectedLevels(["B1"]);
      setDuration("45 min");
      setPrice("16");
      setMaxSpots("2");
      setMeetLink("");
      setScheduledDate(undefined);
      setScheduledTime("14:00");
      setNextSessionLabel("");
    }
  }, [session, open]);

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleSave = async () => {
    if (!user || !scenario.trim()) {
      toast.error("Please fill in the session title");
      return;
    }
    if (!scheduledDate) {
      toast.error("Please select a date");
      return;
    }
    if (selectedLevels.length === 0) {
      toast.error("Please select at least one level");
      return;
    }

    setSaving(true);
    const [h, m] = scheduledTime.split(":").map(Number);
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(h, m, 0, 0);

    const label = nextSessionLabel.trim() || format(scheduled, "EEE, h:mm a");

    const row = {
      tutor_id: user.id,
      theme,
      scenario: scenario.trim(),
      description: description.trim(),
      language,
      level: selectedLevels.sort((a, b) => LEVELS.indexOf(a) - LEVELS.indexOf(b)).join(", "),
      duration,
      price: parseFloat(price) || 16,
      max_spots: parseInt(maxSpots) || 2,
      meet_link: meetLink.trim(),
      scheduled_at: scheduled.toISOString(),
      next_session: label,
    };

    if (session) {
      const { error } = await supabase
        .from("sessions")
        .update(row)
        .eq("id", session.id);
      if (error) {
        toast.error("Failed to update session");
        setSaving(false);
        return;
      }
      toast.success("Session updated!");
    } else {
      const { error } = await supabase.from("sessions").insert(row);
      if (error) {
        toast.error("Failed to create session");
        setSaving(false);
        return;
      }
      toast.success("Session created!");
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? "Edit Session" : "Create New Session"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Theme */}
          <div>
            <Label>Category</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {THEMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="e.g. Ordering at a café abroad" />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What students will practice..." rows={3} />
          </div>

          {/* Levels multi-select */}
          <div>
            <Label>English Level(s)</Label>
            <div className="flex flex-wrap gap-3 mt-1">
              {LEVELS.map((lvl) => (
                <label key={lvl} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox
                    checked={selectedLevels.includes(lvl)}
                    onCheckedChange={() => toggleLevel(lvl)}
                  />
                  <span className="text-sm">{lvl}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Duration & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price ($)</Label>
              <Input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          {/* Max spots */}
          <div>
            <Label>Max participants</Label>
            <Input type="number" min="1" max="10" value={maxSpots} onChange={(e) => setMaxSpots(e.target.value)} />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
          </div>

          {/* Display label */}
          <div>
            <Label>Display label (optional)</Label>
            <Input value={nextSessionLabel} onChange={(e) => setNextSessionLabel(e.target.value)} placeholder="e.g. Tomorrow, 2:00 PM" />
            <p className="text-xs text-muted-foreground mt-1">Shown on the card. Auto-generated if empty.</p>
          </div>

          {/* Meet link */}
          <div>
            <Label>Meeting link</Label>
            <Input value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..." />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-preply-pink text-foreground hover:bg-preply-pink/90 font-semibold">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : session ? "Update Session" : "Create Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionFormDialog;
