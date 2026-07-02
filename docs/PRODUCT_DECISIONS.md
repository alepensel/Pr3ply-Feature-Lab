# Product Decisions

Decision log for the Pr3ply Shared Immersion prototype. Each entry captures the actual trade-off made during the build.

---

### D1 — Agora Web SDK over an embedded Google Meet

- **Context:** the initial prototype opened a Google Meet iframe from `session.meet_link`.
- **Decision:** replace with native Agora Web SDK with server-issued RTC tokens.
- **Rationale:** the iframe blocked every in-room product surface (per-tile UI, tutor controls, in-room prompts, transcription). It also relied on the tutor manually creating a Meet link.
- **Trade-off:** more integration surface, extra secret to manage (Agora App ID + Certificate), tokens must be issued server-side.
- **Impact:** the learning rail, speaker spotlight, and timer are only possible because the room is native.

### D2 — Web Speech API over server audio upload

- **Context:** first pass uploaded audio chunks to storage and transcribed via a multimodal AI call. Users reported "transcriptions are not real."
- **Decision:** switch to the browser's Web Speech API; upsert text to `session_transcripts` every ~10s.
- **Rationale:** no audio egress, zero incremental AI cost, and higher fidelity in supported browsers.
- **Trade-off:** Web Speech is Chrome-family-first; other browsers get a degraded state.
- **Impact:** feedback quality improved substantially because transcripts stopped hallucinating.

### D3 — Lovable AI Gateway (Gemini) over BYO OpenAI

- **Context:** need structured prompt and feedback generation.
- **Decision:** use Lovable AI Gateway with `google/gemini-3-flash-preview` and tool-calling for structured output.
- **Rationale:** no user-managed key required for the prototype; structured output is stable enough for the schemas used.
- **Trade-off:** vendor lock-in on the gateway abstraction; future production may want provider-agnostic routing.
- **Impact:** unblocks AI features for a portfolio prototype without asking the reviewer for a key.

### D4 — Tutor-controlled turn-taking over automated moderation

- **Context:** could have driven turns via LLM heuristics on live transcription.
- **Decision:** the tutor picks the speaker, advances prompts, and drives the timer. UI is realtime-synced.
- **Rationale:** the tutor is the source of trust; automated moderation carries model-risk in a live speaking context.
- **Trade-off:** requires the tutor to be attentive; no autopilot mode.
- **Impact:** perceived value stays anchored on the tutor; AI stays in a supporting role.

### D5 — RBAC in a separate `user_roles` table

- **Context:** roles could be denormalized onto `profiles`.
- **Decision:** dedicated `user_roles` table with `app_role` enum, checked via a `SECURITY DEFINER` `has_role` function used inside RLS.
- **Rationale:** prevents self-escalation attacks; avoids recursive RLS on `profiles`.
- **Trade-off:** one extra join and one extra migration when adding roles.
- **Impact:** roles cannot be modified from the client because writes on `user_roles` are ungranted to `authenticated` / `anon`.

### D6 — Harden `has_role` to only allow self-checks

- **Context:** scanner flagged that `has_role` could enumerate other users' roles.
- **Decision:** guard `has_role(_user_id, _role)` so callers can only pass their own `auth.uid()`.
- **Trade-off:** admin tooling that needs to check other users' roles must use a service-role path instead.
- **Impact:** eliminates a role-enumeration vector.

### D7 — Per-user Google Calendar OAuth with HMAC-signed state

- **Context:** initial callback trusted the `state` `uid` claim as-is.
- **Decision:** HMAC-sign the `state` at start-time with the service-role key; verify on callback. Additionally reject `redirectTo` values that aren't relative paths.
- **Trade-off:** the callback becomes stateful about the signing scheme.
- **Impact:** closes UID spoofing and open-redirect vectors reported by the security scanner.

### D8 — DB trigger for booking capacity

- **Context:** UI-only capacity check is racy under concurrency.
- **Decision:** add a `BEFORE INSERT` trigger `check_session_capacity` that takes a `FOR UPDATE` lock on the parent session before comparing count vs. capacity.
- **Trade-off:** ties booking latency to session-row lock contention on hot sessions.
- **Impact:** overbooking becomes impossible even from the API.

### D9 — Public participant list on the session detail page

- **Context:** originally guarded by auth. Product wanted anonymous visitors to see "who's joining" to reduce first-booking hesitation.
- **Decision:** expose the `session_participants` RPC to anonymous users; return only display fields (name, avatar, country, current_country).
- **Trade-off:** learner names + countries are publicly visible on session detail pages.
- **Impact:** documented in [`SECURITY_AND_PRIVACY.md`](SECURITY_AND_PRIVACY.md) as intentional. Learners agree by joining a public group session.

### D10 — Single-tutor MVP scope

- **Context:** could have built a multi-tutor marketplace up front.
- **Decision:** ship with a single curated tutor and 6 themed sessions.
- **Rationale:** the differentiator being tested is the learning experience, not marketplace matching. Adding supply mechanics would dilute the signal.
- **Trade-off:** cannot test tutor-side onboarding or discovery in this phase.
- **Impact:** MVP results feed directly into a go/no-go decision on V1 (payments + multi-tutor).