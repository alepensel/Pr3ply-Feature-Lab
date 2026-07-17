# Pr3ply — Shared Immersion Sessions

A group-format language tutoring prototype where a tutor runs live, structured English conversation sessions for small groups (2 learners per room). Built as a Product Manager portfolio case study exploring how to turn a generic group video call into a differentiated learning experience.

**Live demo:** [Open Pr3ply Shared Sessions](https://pr3ply-shared-sessions.lovable.app/)
**Repository:** https://github.com/alepensel/Pr3ply-Feature-Lab
**Portfolio context:** functional prototype with synthetic session, tutor, and testimonial data. No real learner data is bundled with the repository.

## Project Status & Usage Notice

This is an independent product-management portfolio prototype created by Ale Pensel.

This is not a commercial product, not an official tool, and not intended for production use.

All rights are reserved. This project may not be copied, reused, redistributed, sublicensed, sold, or claimed by others without explicit written permission from Ale Pensel.

Any third-party product names, brands, or references are used only for contextual and educational purposes.

---


## Problem

1-on-1 tutoring is effective but expensive and isolating. Existing group offerings usually collapse into an unstructured video call: no turn-taking, no per-student feedback, no reason to come back. The prototype tests whether a tutor-moderated group room with AI-assisted structure can deliver 1-on-1-quality learning outcomes at a group-hour price.

## Target users

- **Adult learners (B1–C1)** who want conversational practice and are price-sensitive.
- **Tutors** who want to monetize group hours without sacrificing perceived quality.

## What the prototype demonstrates

1. Browsing and booking curated **shared immersion sessions**.
2. A live room with a **learning rail**: AI-generated role-play prompts, tutor-controlled speaker turns, and a synced speaking timer.
3. A **post-session loop**: live browser transcription, AI-generated per-student feedback, and a rebook CTA.

## Key features (all present in this repo)

| Feature | Where it lives |
|---|---|
| Email + Google OAuth auth, role-based access (student / tutor / admin) | `src/pages/Auth.tsx`, `src/hooks/useUserRole.ts` |
| Shared session catalog and detail view with participant map + country flags | `src/components/SessionsGrid.tsx`, `src/pages/SessionDetail.tsx`, `src/components/ParticipantMap.tsx` |
| Booking with server-side overbooking prevention (DB trigger + row lock) | `src/hooks/useSessions.ts`, migration `check_session_capacity` |
| Live video room via Agora Web SDK with server-issued RTC tokens | `src/components/AgoraVideoCall.tsx`, `supabase/functions/agora-token` |
| Learning rail: AI role-play prompts, tutor turn-taking, speaking timer | `src/components/LearningRail.tsx`, `src/components/SpeakingTimer.tsx`, `supabase/functions/generate-roleplay-prompts` |
| Live transcription via the browser Web Speech API | `src/hooks/useSessionRecording.ts` |
| AI feedback report + rebook loop | `supabase/functions/finalize-session`, `src/pages/SessionFeedback.tsx` |
| Student & tutor dashboards | `src/pages/StudentDashboard.tsx`, `src/pages/TutorDashboard.tsx` |
| Per-user Google Calendar integration | `supabase/functions/google-calendar-*`, `src/components/CalendarSettings.tsx` |

## Key product decisions and trade-offs

- **Agora Web SDK over an embedded Google Meet.** Native controls, per-tile UI, and server-side token security are worth the added integration cost. See [`docs/PRODUCT_DECISIONS.md`](docs/PRODUCT_DECISIONS.md).
- **Web Speech API over application-managed audio upload for transcription.** Zero incremental application cost and good-enough quality for feedback generation. Browser implementations may use a remote recognition service; the trade-off is documented in the decisions log.
- **Tutor-controlled turn-taking instead of automated moderation.** Reduces model risk, keeps the tutor central to perceived value.
- **Single-tutor MVP scope.** Removes marketplace complexity so the prototype can test the learning experience itself. See [`docs/PRD.md`](docs/PRD.md).

## Tech stack

- React 18, TypeScript, Vite 5
- Tailwind CSS 3 + shadcn/ui
- Supabase (Postgres, RLS, Realtime, Edge Functions, Storage) via Lovable Cloud
- Agora Web SDK (`agora-rtc-sdk-ng`) with server-issued tokens
- Lovable AI Gateway (Google Gemini) for role-play prompts and feedback
- Web Speech API for in-browser transcription

## Repository structure

```text
.
├── README.md
├── docs/                       # Product documentation (see below)
├── src/
│   ├── pages/                  # Route-level components
│   ├── components/             # Feature and UI components (shadcn under ui/)
│   ├── hooks/                  # Data/domain hooks (useSessions, useUserRole, ...)
│   ├── contexts/               # Auth context
│   ├── integrations/supabase/  # Auto-generated client + types (do not edit)
│   ├── lib/                    # Small utilities (countryFlag, formatNextSession, ...)
│   └── data/mockData.ts        # Synthetic tutor + review demo data
└── supabase/
    ├── functions/              # Edge functions (Agora token, AI, calendar OAuth)
    └── config.toml
```

## Documentation

- [PRD](docs/PRD.md) — problem, personas, scope, requirements, success metrics
- [Product spec](docs/PRODUCT_SPEC.md) — feature specs, workflows, acceptance criteria
- [Roadmap](docs/ROADMAP.md) — MVP → V1 → future
- [Architecture](docs/ARCHITECTURE.md) — actual technical structure of this repo
- [Discovery](docs/DISCOVERY.md) — JTBD, hypotheses, validation plan
- [Measurement plan](docs/MEASUREMENT_PLAN.md) — KPIs and event spec
- [Product decisions](docs/PRODUCT_DECISIONS.md) — decision log with trade-offs
- [Security and privacy](docs/SECURITY_AND_PRIVACY.md) — public-readiness review
- [Business case summary](docs/case-study/BUSINESS_CASE_SUMMARY.md)

## Status and honest limitations

- Single tutor, curated sessions — not a live marketplace.
- No payments integration.
- Transcription quality depends on the browser's Web Speech implementation (Chrome-based browsers are best).
- AI role-play prompts and feedback are best-effort; the UI degrades gracefully when generation fails.
- No analytics pipeline is implemented yet; the event spec in [`docs/MEASUREMENT_PLAN.md`](docs/MEASUREMENT_PLAN.md) is aspirational.
