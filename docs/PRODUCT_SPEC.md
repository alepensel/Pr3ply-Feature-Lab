# Product Spec — Pr3ply Shared Immersion Sessions

Feature-level specs for each surface currently implemented in the repo. Every acceptance criterion is grounded in code that exists today.

## 1. Auth and roles

**Workflow.** Email/password or Google OAuth via `@lovable.dev/cloud-auth-js`. On first sign-in a profile row is created; role assignment lives in a separate `user_roles` table checked by the `has_role(uuid, app_role)` security-definer function.

**Acceptance criteria.**
- A signed-out visitor can browse `/`, session catalog, and session detail pages.
- Booking, dashboards, profile settings, and the live room require an authenticated user.
- `TutorDashboard` redirects non-tutors to `/dashboard` once role loading completes.
- Roles cannot be self-assigned from the client; `user_roles` write grants are revoked for `authenticated` / `anon`.

## 2. Session catalog and detail

**Workflow.** The `useSessions` hook reads `public_sessions` (a view that hides `meet_link`). The detail page (`SessionDetail.tsx`) fetches the session, participants via the `session_participants` RPC, and renders the participant map.

**Acceptance criteria.**
- Cards render in ascending order of `scheduled_at`.
- Cards keep uniform height regardless of description length (`min-h-[2.5rem] line-clamp-2` on description).
- "Who's joining" reflects `session.spotsLeft` and shows anonymized placeholders for slots the viewer can't PII-see.
- Country flag emoji next to a learner's name uses `country`; the location line reads `Student from {country}, currently based in {current_country}`.
- Participant map pins anchor on the pin base at the mapped coordinates; connection lines join at pin bases; tutor pin is pink, learner pins are black.

## 3. Booking and capacity

**Workflow.** A learner presses "Book seat"; the client inserts into `bookings`. A `BEFORE INSERT` trigger `check_session_capacity` takes a row lock on the parent session, counts confirmed bookings, and rejects if capacity is exceeded.

**Acceptance criteria.**
- Two concurrent bookings for the last seat cannot both succeed.
- `spots_left` recomputes immediately in the UI after a successful booking.
- A cancelled booking frees the seat.

**Edge cases.**
- User already has a confirmed booking → surface a "You're booked" state, not a duplicate insert.
- Session start time has passed → booking button is disabled.

## 4. Live room

**Workflow.**
1. Route guard on `/session/:id/room` verifies tutor OR confirmed booking.
2. `AgoraVideoCall` calls the `agora-token` edge function with the `session_id`; the function re-verifies eligibility and returns a short-lived RTC token with a deterministic UID.
3. Client joins the Agora channel keyed by session id.
4. `useSessionRoomState` subscribes to Realtime channel `room-state-{sessionId}` (allow-listed by `realtime.messages` policy).
5. `LearningRail` renders the prompt card, speaker spotlight, timer, and (for the tutor) controls.
6. `useSessionRecording` starts a Web Speech recognizer for the local user and upserts the growing transcript to `session_transcripts` every ~10 seconds.

**Timer states.**
- `idle` — no `turn_started_at`, controls show Start with 30/60/90/120s presets.
- `running` — countdown from `turn_started_at + turn_duration_seconds`.
- `paused` — `is_paused = true`; remaining time frozen.
- `expired` — countdown hit zero; UI dims the speaker tile and prompts the tutor to advance.

**Acceptance criteria.**
- Non-tutors never see tutor controls.
- Speaker ring is pink; non-speakers display a "🎧 Listen" indicator.
- Realtime state changes propagate < 500ms on a good network.
- If Web Speech is unavailable, the room still functions; a banner explains transcription is disabled for this browser.

## 5. AI role-play prompts

**Workflow.** First time the tutor opens the rail, `generate-roleplay-prompts` is invoked with `theme`, `scenario`, `description`, `level`, `participant_count`. It calls Lovable AI (`google/gemini-3-flash-preview`) using structured tool-calling and caches the array in `session_roleplay_prompts`. "Regenerate" produces a new set.

**Structured output shape (per prompt).**
```json
{
  "title": "string",
  "setup": "1-2 sentence context",
  "your_turn": "what the speaker should say/ask",
  "vocabulary": ["3-5 items"],
  "follow_up": "deeper question"
}
```

**Acceptance criteria.**
- Cached prompts are reused across page loads.
- If generation fails, the rail shows a manual "Retry" affordance; the room continues to work without prompts.

## 6. Transcript and AI feedback

**Workflow.** Tutor presses "End session" → `finalize-session` edge function runs. For each user with a `session_transcripts` row, it calls Lovable AI with the transcript, session context, and the prompts used, and writes a report to `session_feedback`.

**Feedback shape.**
```json
{
  "strengths": ["2-3 bullets"],
  "mistakes": [{"phrase_said": "", "suggested_phrase": "", "why": ""}],
  "vocabulary_to_remember": ["3-5 phrases"],
  "next_steps": "1-2 sentences",
  "overall_score": 1
}
```

**Acceptance criteria.**
- Only the session's tutor can invoke `finalize-session`.
- Feedback is scoped by RLS to the owning learner + the tutor.
- On failure, edge function returns a generic error; specific error details go to server logs only.

## 7. Rebook loop

**Workflow.** `/session/:id/feedback` shows the report, expandable transcript, and 2–3 suggested upcoming sessions matched on level and preferring the same tutor. Falls back to "Browse all sessions" if no match.

**Acceptance criteria.**
- "View feedback" appears in `StudentDashboard` past-lessons list once a feedback row exists.
- Past-lessons section stays visible even when empty (renders an empty state).

## 8. Google Calendar sync

**Workflow.** Per-user OAuth started by `google-calendar-oauth-start` (state is HMAC-signed with the service-role key). Callback validates the state and the `redirectTo` path (relative paths only). Settings UI in `CalendarSettings.tsx` lets the user pick target calendar and reminder minutes.

**Acceptance criteria.**
- Only the connected user can read/write their `google_calendar_connections` row.
- Open-redirect attempts through `redirectTo` are rejected in the callback.
- Disconnect removes tokens and hides the settings body.