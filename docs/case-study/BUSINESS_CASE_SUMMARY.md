# Business Case Summary — Pr3ply Shared Immersion Sessions

## Business context

Marketplace tutoring platforms monetize primarily through 1-on-1 hours. Group formats exist but underperform because they collapse into unstructured video calls. The unlock is a group format that preserves perceived quality — increasing tutor-hour revenue without cannibalizing 1-on-1 supply.

## Problem

- Learners want speaking practice at a lower price point than 1-on-1 but abandon generic group calls that lack structure.
- Tutors have unfilled hours they can't monetize at 1-on-1 rates.
- Neither side has an artifact of progress after a session, so retention leans on habit rather than evidence.

## Proposed solution

A tutor-moderated, small-group (2 learners per room) shared immersion product with three differentiators inside the room and one after:

1. **AI role-play prompts** conditioned on level, scenario, and participant count.
2. **Tutor-controlled turn-taking + speaking timer**, synced live across participants.
3. **Browser-mediated transcription** without application-managed audio storage.
4. **AI feedback report + rebook loop** so every session produces a tangible artifact and a next step.

## MVP

- Single tutor + 6 curated themed sessions.
- Booking with server-enforced capacity.
- Live room (Agora) with the learning rail described above.
- Per-student feedback page + rebook CTA on the dashboard.
- Per-user Google Calendar sync.

MVP intentionally excludes multi-tutor onboarding, payments, and peer-only matching so that measurement isolates the learning-experience hypothesis.

## Product strategy

- **Prove differentiation first, then scale supply.** Payments and multi-tutor onboarding come only after MVP KPIs cross their thresholds (see [../MEASUREMENT_PLAN.md](../MEASUREMENT_PLAN.md)).
- **Keep the tutor central.** AI supports moderation, does not replace it. Reduces model risk in a live speaking product.
- **Ship an artifact per session.** The feedback report is the retention engine.

## Operational impact

- **Tutor revenue per hour.** A filled 2-seat group session at the same per-seat price of a 1-on-1 doubles hourly revenue for the tutor; even at 50% per-seat pricing, revenue-per-hour is neutral with better learner economics.
- **Session ops.** Tutor prep time drops because prompts are AI-generated per session.
- **Post-session ops.** Manual per-student write-ups are replaced by AI-generated reports the tutor can optionally edit (future work).

## Risks

- **Transcription quality is browser-dependent.** Feedback usefulness will vary by device.
- **Prompt relevance risk.** Generic prompts undermine the value prop; conditioning on level/scenario is the first line of defense; a 👍/👎 signal (spec) is the correction loop.
- **Social risk.** Learners may hesitate to speak in front of strangers; publishing "who's joining" reduces friction but is a privacy trade-off (see decision D9).
- **Supply concentration.** MVP relies on one tutor; validation results are correlated with that tutor's individual quality. Cohort work needs to acknowledge this.

## Why this matters

If the MVP hypothesis holds, Pr3ply gains a second monetization axis (group hours) without adding platform risk, and learners get a lower-priced, structured practice option that produces measurable progress. If it doesn't hold, the failure is instructive: we'll know whether the constraint is the in-room experience, the feedback artifact, or the group format itself — because the MVP was scoped to isolate exactly those variables.

## Related documents

- [PRD](../PRD.md)
- [Product Spec](../PRODUCT_SPEC.md)
- [Roadmap](../ROADMAP.md)
- [Discovery](../DISCOVERY.md)
- [Measurement Plan](../MEASUREMENT_PLAN.md)
- [Product Decisions](../PRODUCT_DECISIONS.md)
- [Security and Privacy](../SECURITY_AND_PRIVACY.md)
- [Architecture](../ARCHITECTURE.md)
