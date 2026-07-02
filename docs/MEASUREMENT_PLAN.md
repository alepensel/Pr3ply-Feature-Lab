# Measurement Plan

> No analytics pipeline is instrumented in the repo yet. This document is the spec that instrumentation should be built against.

## Product KPIs

| KPI | Definition | Target |
|---|---|---|
| Booked-to-attended rate | Bookings that produced a transcript row / total bookings for past sessions | ≥ 70% |
| Feedback view rate | Users who opened `/session/:id/feedback` / users with generated feedback | ≥ 60% |
| 7-day rebook rate | Learners who book another session within 7d of a completed one / learners with a completed session | ≥ 25% |
| Tutor utilization | Filled seats / available seats, rolling 7 days | ≥ 60% within 4 weeks |

## Operational metrics

- **Session fill rate:** seats booked at t-1h / seat capacity.
- **No-show rate:** bookings with no transcript / confirmed bookings.
- **Tutor punctuality:** seconds from `scheduled_at` to first tutor presence in the room.
- **Room stability:** Agora reconnect events per session (client-side).

## Quality and control metrics

- **Transcript completeness:** transcript character count normalized by session duration.
- **Feedback generation success:** feedback rows created / expected (one per attended learner).
- **Feedback usefulness:** post-feedback 1–5 micro-survey (spec).
- **Prompt relevance:** learner-facing 👍/👎 on each prompt used (spec).

## AI-assist evaluation metrics

- **Role-play prompts** — automated relevance rubric: level match, scenario coverage, vocabulary appropriateness. Sample audit of 10 sessions per week.
- **Feedback reports** — automated checks: presence of all five sections, no PII leakage, no more than N tokens.
- Human review sample of 5 reports per week for hallucination and tone.

## Event tracking plan (spec — not implemented)

Event names use `snake_case`. Every event includes `session_id`, `user_id` (or `anon_id`), `role` (`student`/`tutor`), `timestamp`.

| Event | Properties |
|---|---|
| `session_viewed` | `session_id`, `source` (`grid`, `deep_link`) |
| `booking_started` | `session_id` |
| `booking_confirmed` | `session_id`, `spots_left_after` |
| `booking_rejected_capacity` | `session_id` |
| `room_join_attempted` | `session_id` |
| `room_joined` | `session_id`, `agora_token_ms` |
| `prompt_generated` | `session_id`, `count`, `regenerated` (bool) |
| `prompt_advanced` | `session_id`, `prompt_index` |
| `speaker_selected` | `session_id`, `speaker_id` |
| `timer_started` | `session_id`, `duration_seconds` |
| `timer_expired` | `session_id` |
| `transcript_flushed` | `session_id`, `char_delta` |
| `session_finalized` | `session_id`, `feedback_rows_created` |
| `feedback_viewed` | `session_id` |
| `feedback_rated` | `session_id`, `score` (1–5) |
| `rebook_clicked` | `session_id`, `suggested_session_id` |
| `calendar_connected` | `provider` |

## Reporting cadence

- **Daily:** operational metrics (fill, no-show, room stability).
- **Weekly:** product KPIs, AI quality audit.
- **Post-cohort:** hypothesis-level analysis (see [DISCOVERY.md](DISCOVERY.md)).