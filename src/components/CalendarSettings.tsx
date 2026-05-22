import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Connection {
  google_email: string;
  selected_calendar_id: string;
  reminder_minutes: number;
}

interface CalendarOption {
  id: string;
  summary: string;
  primary: boolean;
}

const REMINDER_OPTIONS = [
  { value: -1, label: "No notification" },
  { value: 15, label: "15 min before a lesson" },
  { value: 60, label: "60 min before a lesson" },
  { value: 1440, label: "24 hours before a lesson" },
];

const CalendarSettings = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState("primary");
  const [reminder, setReminder] = useState<number>(15);

  const loadConnection = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("google_calendar_connections" as any)
      .select("google_email, selected_calendar_id, reminder_minutes")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      const c = data as unknown as Connection;
      setConnection(c);
      setSelectedCalendar(c.selected_calendar_id);
      setReminder(c.reminder_minutes);
      // fetch calendar list
      const { data: list, error } = await supabase.functions.invoke("google-calendar-list");
      if (!error && list?.calendars) setCalendars(list.calendars);
    } else {
      setConnection(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConnection();
    if (searchParams.get("connected") === "1") {
      toast({ title: "Google Calendar connected!" });
      searchParams.delete("connected");
      setSearchParams(searchParams, { replace: true });
    }
    const err = searchParams.get("error");
    if (err) {
      toast({ title: "Connection failed", description: err, variant: "destructive" });
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    const { data, error } = await supabase.functions.invoke("google-calendar-oauth-start", {
      body: { redirectTo: `${window.location.origin}/profile?tab=calendar&connected=1` },
    });
    if (error || !data?.url) {
      toast({ title: "Could not start sign-in", description: error?.message || "Unknown error", variant: "destructive" });
      setConnecting(false);
      return;
    }
    window.location.href = data.url;
  };

  const handleDisconnect = async () => {
    setSaving(true);
    const { error } = await supabase.functions.invoke("google-calendar-disconnect");
    setSaving(false);
    if (error) { toast({ title: "Disconnect failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Disconnected" });
    setConnection(null);
    setCalendars([]);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase
      .from("google_calendar_connections" as any)
      .update({ selected_calendar_id: selectedCalendar, reminder_minutes: reminder })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Calendar settings saved" });
  };

  if (loading) {
    return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-6">Google Calendar</h1>

        {!connection ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Connect your Google Calendar to automatically add your booked sessions and receive reminders before each lesson.
            </p>
            <Button onClick={handleConnect} disabled={connecting} className="gap-2">
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              Connect Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <div>
                  <p className="text-xs text-muted-foreground">Currently connected account</p>
                  <p className="font-semibold">{connection.google_email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleDisconnect} disabled={saving}>
                Disconnect
              </Button>
            </div>

            <div>
              <h3 className="font-bold text-foreground mb-1">Add sessions to calendar</h3>
              <p className="text-sm text-muted-foreground mb-3">Choose which calendar your booked sessions are added to.</p>
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.length === 0 && (
                    <SelectItem value="primary">Primary calendar</SelectItem>
                  )}
                  {calendars.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.summary}{c.primary ? " (primary)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-bold text-foreground mb-1">Remind me before a lesson</h3>
              <p className="text-sm text-muted-foreground mb-3">How far in advance you would like a reminder before your scheduled lesson.</p>
              <RadioGroup value={String(reminder)} onValueChange={(v) => setReminder(Number(v))}>
                {REMINDER_OPTIONS.map(o => (
                  <div key={o.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(o.value)} id={`rem-${o.value}`} />
                    <Label htmlFor={`rem-${o.value}`} className="font-normal cursor-pointer">{o.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button onClick={handleSave} disabled={saving} className="bg-preply-pink text-foreground hover:bg-preply-pink/90 font-semibold rounded-full py-6 px-12 text-base">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSettings;