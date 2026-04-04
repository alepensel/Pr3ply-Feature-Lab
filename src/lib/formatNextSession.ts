import { isToday, isTomorrow, parse, format } from "date-fns";

/**
 * Formats a next_session string like "Sun, Apr 6 · 6:30 PM"
 * into "Sunday, 6:30 PM (Tomorrow)" style.
 * Falls back to the original string if parsing fails.
 */
export function formatNextSession(raw: string): string {
  if (!raw) return raw;

  try {
    // Try parsing common formats from the DB
    // The stored format is typically like "Sun, Apr 6 · 6:30 PM" or a date string
    // First try ISO format
    let date = new Date(raw);

    // If invalid, try parsing the display format
    if (isNaN(date.getTime())) {
      // Try "Sun, Apr 6 · 6:30 PM" style
      const cleaned = raw.replace("·", "").replace(/\s+/g, " ").trim();
      date = parse(cleaned, "EEE, MMM d h:mm a", new Date());
    }

    if (isNaN(date.getTime())) {
      return raw; // fallback
    }

    const dayName = format(date, "EEEE");
    const time = format(date, "h:mm a");

    let label = "";
    if (isToday(date)) {
      label = " (Today)";
    } else if (isTomorrow(date)) {
      label = " (Tomorrow)";
    }

    return `${dayName}, ${time}${label}`;
  } catch {
    return raw;
  }
}
