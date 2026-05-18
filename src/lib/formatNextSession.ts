import { isToday, isTomorrow, parse, format } from "date-fns";

/**
 * Formats a next_session string into:
 * "April 8, Wednesday - 18:30 (Tomorrow)"
 */
export function formatNextSession(raw: string, scheduledAt?: string): string {
  // Prefer the authoritative scheduled_at timestamp when available
  if (scheduledAt) {
    const d = new Date(scheduledAt);
    if (!isNaN(d.getTime())) {
      const monthDay = format(d, "MMMM d");
      const dayName = format(d, "EEEE");
      const time = format(d, "HH:mm");
      let label = "";
      if (isToday(d)) label = " (Today)";
      else if (isTomorrow(d)) label = " (Tomorrow)";
      return `${monthDay}, ${dayName} - ${time}${label}`;
    }
  }

  if (!raw) return raw;

  try {
    let date = new Date(raw);

    if (isNaN(date.getTime())) {
      const cleaned = raw.replace("·", "").replace(/\s+/g, " ").trim();
      date = parse(cleaned, "EEE, MMM d h:mm a", new Date());
    }

    if (isNaN(date.getTime())) {
      // Try "EEE, h:mm a" (no day number)
      const cleaned = raw.replace("·", "").replace(/\s+/g, " ").trim();
      date = parse(cleaned, "EEE, h:mm a", new Date());
    }

    if (isNaN(date.getTime())) return raw;

    const monthDay = format(date, "MMMM d");
    const dayName = format(date, "EEEE");
    const time = format(date, "HH:mm");

    let label = "";
    if (isToday(date)) {
      label = " (Today)";
    } else if (isTomorrow(date)) {
      label = " (Tomorrow)";
    }

    return `${monthDay}, ${dayName} - ${time}${label}`;
  } catch {
    return raw;
  }
}
