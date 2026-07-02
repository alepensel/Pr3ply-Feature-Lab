# Roadmap

Prioritization follows one principle from the CPO review: **prove the differentiated in-room experience before scaling supply or monetization.** Everything that doesn't defend that proof is deferred.

## MVP (current)

- Single tutor, 6 curated themed sessions.
- Booking + capacity guard.
- Live room with Agora video, learning rail (AI prompts, tutor-controlled turns, timer).
- In-browser transcription + AI feedback report + rebook CTA.
- Google Calendar sync per user.
- Student and tutor dashboards.

What MVP is designed to answer: *does the in-room learning layer + feedback loop change perceived value enough to drive rebooking?*

## V1 — after MVP validation

- **Multi-tutor onboarding.** Application flow, profile pages, per-tutor availability.
- **Payments.** Per-seat pricing, tutor payouts (likely Stripe Connect or Paddle depending on tutor geography).
- **Peer matching pilot.** Level + goal + timezone-based matching for learners who want to book into any next available session.
- **Attendance and no-show handling.** Late-cancel policy, tutor no-show refund path.
- **Mobile polish.** The rail collapses on narrow viewports today; V1 formalizes the compact layout.

## Future iterations

- Native mobile app if web attendance rates justify it.
- Marketplace pricing dynamics (surge pricing on high-demand slots, tutor-set prices).
- Richer analytics dashboard for tutors (score deltas per student across sessions).
- Session recording playback (requires storage, retention policy, and privacy work).
- Tutor moderation copilot (LLM suggests when to advance a prompt).

## Prioritization rationale

- The critique was "prove differentiation," so MVP invests exclusively in the in-room + post-session experience.
- Payments and multi-tutor supply are deliberately deferred: adding them before validating retention would compound risk.
- Peer-only matching (no tutor) is deferred because the tutor is the current source of trust and structure.

## What must be validated before scaling

| Signal | Threshold | Source |
|---|---|---|
| Booked-to-attended rate | ≥ 70% | `bookings` × transcript presence |
| Feedback view rate | ≥ 60% of attended | Feedback page open events (spec) |
| 7-day rebook rate | ≥ 25% | Repeat bookings by same learner |
| Feedback usefulness | ≥ 4/5 avg | Post-feedback micro-survey (spec) |

If these thresholds hold with the single-tutor MVP, V1 (payments + multi-tutor) is justified.