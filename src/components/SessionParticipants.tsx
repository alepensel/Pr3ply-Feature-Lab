import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Crown, Star } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";

interface Participant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
}

interface SessionParticipantsProps {
  sessionId: string;
  maxSpots: number;
  tutor: {
    name: string;
    avatar: string;
    country: string;
    rating: number;
    reviewCount: number;
    lessonCount: number;
    bio: string;
  };
  currentUserId?: string;
  isBooked: boolean;
}

const SessionParticipants = ({
  sessionId,
  maxSpots,
  tutor,
  currentUserId,
  isBooked,
}: SessionParticipantsProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("user_id")
        .eq("session_id", sessionId)
        .eq("status", "confirmed");

      if (!bookings || bookings.length === 0) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      const userIds = bookings.map((b) => b.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, country")
        .in("user_id", userIds);

      setParticipants(profiles || []);
      setLoading(false);
    };

    fetchParticipants();
  }, [sessionId, isBooked]);

  const filledSlots = participants.length;
  const emptySlots = Math.max(0, maxSpots - filledSlots);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
      {/* Tutor profile */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Your tutor</h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-primary">
            <AvatarImage src={tutor.avatar} alt={tutor.name} className="object-cover" />
            <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
              {tutor.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-bold text-foreground">{tutor.name}</p>
            {countryFlag(tutor.country) && (
              <span className="text-base mr-1">{countryFlag(tutor.country)}</span>
            )}
            <p className="text-sm text-muted-foreground mb-1">
              From {tutor.country} · TEFL Certified
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-semibold">{tutor.rating}</span>
              </div>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{tutor.reviewCount} reviews</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{tutor.lessonCount.toLocaleString()} lessons</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground">{tutor.bio}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Who's joining */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">Who's joining</h2>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{filledSlots}/{maxSpots} students</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Tutor slot */}
          <div className="flex items-center gap-3 rounded-xl bg-accent/50 p-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={tutor.avatar} alt={tutor.name} className="object-cover" />
              <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                {tutor.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{tutor.name}</p>
              <p className="text-xs text-muted-foreground">Tutor</p>
            </div>
            <Crown className="h-4 w-4 text-primary flex-shrink-0" />
          </div>

          {/* Filled student slots */}
          {participants.map((p) => {
            const isYou = p.user_id === currentUserId;
            const name = p.display_name || "Student";
            const initials = name[0]?.toUpperCase() || "?";
            const flag = countryFlag(p.country);

            return (
              <div key={p.user_id} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarImage src={p.avatar_url || undefined} alt={name} className="object-cover" />
                  <AvatarFallback className="text-xs font-bold bg-secondary text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {name} {flag && <span aria-label="country flag">{flag}</span>}
                    {isYou && <span className="ml-1.5 text-xs font-medium text-primary">(You)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">Student</p>
                </div>
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Open spot</p>
                <p className="text-xs text-muted-foreground/60">Waiting for a student</p>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof nudge */}
        {filledSlots > 0 && emptySlots > 0 && !isBooked && (
          <div className="mt-4 rounded-lg bg-accent p-3 text-center">
            <p className="text-sm font-medium text-accent-foreground">
              {filledSlots === 1
                ? "1 student has already joined — book your spot!"
                : `${filledSlots} students have already joined — book your spot!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionParticipants;
