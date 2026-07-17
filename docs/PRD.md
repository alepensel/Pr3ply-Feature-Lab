# Product Requirements — Pr3ply Shared Immersion Sessions

## Overview

Pr3ply Shared Immersion is a group-format language tutoring product: a live tutor runs 45–60 minute themed English conversation rooms for up to 2 learners at a time, using AI-generated role-play prompts, tutor-controlled turn-taking, and a per-student AI feedback report after each session.

## Problem and opportunity

1-on-1 tutoring converts well but is expensive; existing group formats degrade into a generic video call and fail to deliver a differentiated learning experience. The opportunity is to increase tutor-hour monetization while offering learners a lower-priced, more social alternative that still produces measurable progress.

The current prototype was reviewed by a CPO whose core critique was: "the browse/book shell is proven, the differentiated in-room learning experience is not." Every requirement below traces back to closing that gap.

## Personas

- **Adult learner (B1–C1)** — practicing English for work, travel, or interviews. Time-boxed. Wants low-friction booking, real speaking time, and evidence of progress.
- **Tutor** — professional teacher, wants to fill more hours per week without lowering perceived quality. Needs simple in-room controls and something to hand back to each student.
- **Ops / admin (future)** — curates tutors, monitors session quality and safety.

## User needs

- Learner: "Give me speaking time with peers, not a lecture. Tell me what I did well and what to fix. Make it easy to come back."
- Tutor: "Give me structure so a group room doesn't fall apart. Let me control who speaks. Save me the feedback write-up."

## MVP scope

- Single synthetic tutor persona with 6 curated themed sessions.
- Email + Google auth, RBAC (student, tutor, admin).
- Session catalog, detail page (participant map, country flags), booking with overbooking prevention.
- Live room: Agora video, AI role-play prompt rail, tutor turn/timer controls, live in-browser transcription.
- Post-session: AI feedback per student, rebook CTA on the dashboard.
- Optional per-user Google Calendar sync of booked sessions.

## Out of scope for MVP

- Payments and payouts.
- Multi-tutor onboarding, tutor discovery, ratings.
- Peer-only (tutor-less) matching.
- Native mobile apps.
- Recording playback or long-term audio storage.
- Automated moderation / AI-driven turn assignment.

## Functional requirements

1. A visitor can browse sessions without logging in; booking requires auth.
2. A learner can book a seat only if `spots_left > 0`. Capacity is enforced server-side.
3. Only the session tutor or a learner with a confirmed booking can enter the live room.
4. The tutor can generate/regenerate role-play prompts for a session; results are cached per session.
5. The tutor can select the current speaker, advance prompts, and start/pause/skip the speaking timer. State is synced to all participants in real time.
6. Each participant's speech is transcribed through the browser's Web Speech implementation and periodically written to their own transcript row.
7. When the tutor ends the session, an AI feedback report is generated per student and made visible on their dashboard and on `/session/:id/feedback`.
8. Learners can rebook from the feedback page.

## Non-functional requirements

- **Security:** RLS on every public-schema table; per-session realtime channel allow-list; tokens issued server-side for Agora; per-user OAuth for Google Calendar with HMAC-signed state; no service-role usage from the client.
- **Privacy:** The application does not upload or store audio itself. Browser speech-recognition implementations may use a remote recognition service. Stored transcripts are text only and scoped to the owning learner and the session tutor.
- **Resilience:** AI generation is best-effort; the UI must degrade gracefully if prompt or feedback generation fails.
- **Performance:** Session catalog < 1s to first paint on a warm cache; room state updates propagate < 500ms via Supabase Realtime.

## Success metrics

See [MEASUREMENT_PLAN.md](MEASUREMENT_PLAN.md) for the full spec. Headline metrics:

- Booked-to-attended rate ≥ 70%.
- Feedback view rate (attended → feedback opened) ≥ 60%.
- 7-day rebook rate ≥ 25%.
- Tutor utilization (booked seats / available seats) ≥ 60% within 4 weeks of launch.

## Risks and assumptions

- **Assumption:** learners perceive tutor-moderated group sessions as ≥ 70% as valuable as 1-on-1 at ~40% of the price. Not yet validated.
- **Risk:** browser transcription quality is uneven across devices; feedback quality suffers when transcripts are poor.
- **Risk:** AI prompts feel generic. Mitigation: prompts are conditioned on level, theme, scenario, and participant count.
- **Risk:** low fill rate for group sessions early on because supply and demand haven't been matched. Curated single-tutor MVP scope is the mitigation.

## Open questions

- Should the tutor be able to override an AI feedback report before it reaches the learner?
- What is the right session length for retention — 45 or 60 minutes?
- Do we need a "no-show" penalty to protect the group experience?
