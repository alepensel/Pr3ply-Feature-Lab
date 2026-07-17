# Architecture

This document describes what actually exists in the repo. No aspirational infrastructure.

## High level

- **Client:** React 18 + TypeScript SPA built with Vite. Tailwind + shadcn/ui for styling. React Router for routing.
- **Backend:** Supabase (managed via Lovable Cloud) — Postgres with RLS, Auth, Realtime, Edge Functions (Deno), Storage.
- **Third-party:** Agora Web SDK for real-time video; Lovable AI Gateway (Google Gemini) for prompt and feedback generation; Google Calendar OAuth for per-user calendar sync; browser-native Web Speech API for transcription.

```text
 Browser (React SPA)
   │
   ├── Supabase JS client  ──►  Postgres (RLS-guarded)
   │                        ──►  Auth (email + Google OAuth)
   │                        ──►  Realtime (channel: room-state-{sessionId})
   │                        ──►  Edge Functions
   │
   ├── Agora Web SDK       ──►  Agora RTC (token issued by edge function)
   │
   └── Web Speech API      ──►  browser recognizer  ──►  upsert session_transcripts
```

## Frontend structure

- `src/pages/` — routes: `Index`, `Auth`, `SessionDetail`, `SessionRoom`, `SessionFeedback`, `StudentDashboard`, `TutorDashboard`, `ProfileSettings`, `NotFound`.
- `src/components/` — feature components (`SessionCard`, `SessionsGrid`, `SessionParticipants`, `ParticipantMap`, `AgoraVideoCall`, `LearningRail`, `SpeakingTimer`, `CalendarSettings`, ...) and `ui/` (shadcn primitives).
- `src/hooks/` — domain hooks: `useSessions`, `useUserRole`, `useProfile`, `useSessionPrompts`, `useSessionRoomState`, `useSessionRecording`.
- `src/contexts/AuthContext.tsx` — wraps the Supabase auth session.
- `src/integrations/supabase/` — auto-generated client and types; not hand-edited.
- `src/data/mockData.ts` — synthetic tutor profile and testimonial content used for the landing page.
- `src/lib/` — small helpers (`countryFlag`, `formatNextSession`, `utils`).

## Database

All tables live in the `public` schema with RLS enabled and explicit GRANTs.

| Table | Purpose |
|---|---|
| `profiles` | Per-user profile (name, avatar, `country`, `current_country`) |
| `user_roles` | RBAC (app_role enum: `student`, `tutor`, `admin`); writes blocked from client |
| `sessions` | Curated shared sessions (theme, scenario, level, capacity, `scheduled_at`) |
| `bookings` | Learner ↔ session with status |
| `session_roleplay_prompts` | Cached AI prompt payload per session |
| `session_room_state` | Realtime-mirrored tutor controls (current prompt index, speaker, timer) |
| `session_transcripts` | Per-user, per-session text transcript |
| `session_feedback` | Per-user, per-session AI feedback report |
| `google_calendar_connections` | Per-user OAuth tokens + preferences |

A `public_sessions` view exposes safe columns (no `meet_link`) to `anon` and `authenticated` for the catalog.

### Access-control helpers

- `has_role(_user_id uuid, _role app_role)` — security-definer, guarded so a user can only check their own role.
- `is_session_tutor(_session uuid)` / `is_session_participant(_session uuid)` — used in RLS policies and realtime allow-lists.
- `check_session_capacity` trigger on `bookings` prevents overbooking under concurrency with a row lock on the parent session.

### Realtime

`realtime.messages` policy allow-lists topics matching `room-state-%` and requires `is_session_participant` for the corresponding session.

## Edge functions

| Function | Role |
|---|---|
| `agora-token` | Verifies caller is tutor or confirmed booker; issues short-lived Agora RTC token |
| `generate-roleplay-prompts` | Calls Lovable AI with structured output; caches result |
| `finalize-session` | Tutor-only; iterates transcripts and generates per-user feedback via Lovable AI |
| `google-calendar-oauth-start` | Builds Google auth URL with HMAC-signed state |
| `google-calendar-oauth-callback` | Validates state + relative redirect; stores tokens |
| `google-calendar-list` | Lists the user's calendars |
| `google-calendar-disconnect` | Deletes the user's calendar tokens |

All functions return generic error messages to the client; details go to server logs.

## Data flow — booking a session

1. Client inserts into `bookings` (RLS: `user_id = auth.uid()`).
2. `check_session_capacity` trigger locks the session row, counts confirmed bookings, rejects if full.
3. UI re-fetches session via `useSessions`; `spots_left` updates.

## Data flow — live room

1. Route guard checks tutor OR confirmed booking.
2. Client calls `agora-token` with `session_id`; receives token + deterministic UID.
3. Client joins Agora channel keyed by session id.
4. Client subscribes to `room-state-{sessionId}` for tutor-controlled state.
5. The browser's Web Speech recognizer produces text, which is upserted to `session_transcripts` every ~10s. Audio handling depends on the browser implementation.
6. Tutor "End session" → invokes `finalize-session` → writes `session_feedback` rows.

## Demo data

- `src/data/mockData.ts` provides synthetic landing-page tutor and testimonial content.
- Seed sessions are inserted via migrations (currently a handful of dated sessions across mid-2026).
- No real learner PII is bundled with the repo; learner rows are created by real sign-ups.

## Current limitations

- Single-tutor scope; no marketplace mechanics.
- Transcription quality depends on the browser's Web Speech implementation.
- Feedback generation is best-effort; there is no retry queue.
- No analytics pipeline; the event spec in `MEASUREMENT_PLAN.md` is not yet instrumented.
- No payments.
- No native mobile app.

## Future production considerations

- Move AI generation to a background queue with retry and idempotency keys.
- Add an events table (or 3rd-party analytics) once the measurement plan is instrumented.
- Introduce a payments boundary (Stripe Connect or Paddle) with tutor payout schedule.
- Add automated policy tests for RLS coverage before onboarding more tutors.
