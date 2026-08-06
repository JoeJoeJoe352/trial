# Decision Log

This is a curated companion to the raw logs in this folder (`prompts.txt`, `plan.txt`,
`checks.txt`) and to the full session transcripts. Those are the timestamped evidence;
this document is the narrative — the moments where a decision got made, an AI claim got
challenged, or AI-produced code got rejected, with pointers back to the exact prompt so
it can be verified rather than taken on faith.

Three work sessions, all 2026-08-05/06:
- **Session 1** (12:46–15:29) — greenfield build: architecture, auth, admin CRUD, ingestion.
- **Session 2** (17:33–19:13) — hardening: code review, email batching, soft delete.
- **Session 3** (this session, 05:57–now) — Slack/email delivery simulation, tests, a live
  bug investigation.

---

## 1. Framing decisions — interpreting an ambiguous spec

The original brief (`prompts.txt` #3) was a one-paragraph, informally-written feature
request ("users should get notified... email and Slack... flexible enough to add more
channels later"). Several structural decisions had to be made that the brief didn't
spell out, and I made them explicit rather than letting the AI pick silently:

- **RSS over WebSocket for v1** (`prompts.txt` #4–5): asked the AI's opinion on RSS
  ingestion first, then explicitly deferred WebSocket support rather than building it
  speculatively — "simpler solution for a prototype like this," per `checks.txt`. The
  adapter interface was still generalized (`SourceAdapter`) so it wasn't a dead end.
- **"Add more channels later" ≠ "let users pick a channel."** The brief could be read as
  per-user Slack configuration. I deliberately read it the other way — one predefined
  Slack webhook per *category*, shared by everyone subscribed — and said so plainly in
  `prompts.txt` #7: *"there will be pre defined slack channels for each category. So it
  is not belongs to the user."* `checks.txt` flags this explicitly as an interpretation
  call, not a spec requirement.
- **Scope cuts stated up front, not discovered late**: no `user_channel` table, category
  subscription only (no per-source or per-keyword subscriptions), 1:1 source-category
  relation. All in `prompts.txt` #7, before any code existed for them.

## 2. Course-corrections — redirecting the AI mid-build

- **Email cadence** (`prompts.txt` #33–35): the AI's first working version sent one email
  per news item. Rejected: *"One mail per news item is too often. Let's wait 15 minutes
  between email/users."* Crucially, the follow-up wasn't "just fix it" — it was *"Make a
  plan how would you implement it"* first, then a separate *"yes, implement it please"*
  once the plan (cooldown timestamp on `users`, digest flusher) was reviewed. Design
  reviewed before code was written, not after.
- **Slack simulation discarded real functionality** (this session): asked to simulate
  Slack delivery to local files since no real webhook was configured. My first pass
  ripped out the working `fetch()`-to-webhook code entirely and replaced it with
  file-writes unconditionally. Caught with *"keep the original behavior too"* — meaning
  the real webhook POST had to survive for any category that *does* get a real webhook
  configured later, with the file-write only as a fallback when `destination` is empty.
  I'd effectively regressed working code to build the demo feature; the correction forced
  a branch (`if (destination) { fetch(...) } else { simulate to file }`) instead of a
  replacement. The same "preserve original, add alongside" instruction was then applied
  proactively to the email channel without needing to be repeated.

## 3. Bugs found in AI-produced code

- **Zoneless Angular signals bug** (`prompts.txt` #16, found by manual testing, not by
  the AI): login/register forms used plain class fields
  (`errorMessage`, `submitting`) instead of Angular signals. In this project's zoneless
  change-detection setup, a field mutated inside an async `subscribe()` callback never
  triggers a re-render — so a wrong password produced *zero visible error*, silently.
  Reported directly: *"these are not signals so even if they change the component won't
  change... there isn't any error message."* The AI's own assessment after fixing it:
  *"Good catch — that's a real correctness bug that would've silently swallowed every
  login/register error in the UI."* This is the kind of failure that passes a type-check
  and a casual glance at the diff and only shows up by actually clicking through the UI —
  which is why it was caught by hand, not by asking the AI to review its own work.
- **Self-review surfaced two silent-failure bugs** (`prompts.txt` #30, *"please look for
  mistakes or potential errors in the code"*): asking the AI to audit its own
  `categories-page.ts` found (a) `forkJoin` failing all-or-nothing with no user-facing
  error, so a 401 on one of two parallel calls rendered an empty list indistinguishable
  from "no categories exist," and (b) subscribe/unsubscribe failures reverting the UI
  silently with no explanation. Both were real gaps, not false positives — but note the
  fix wasn't auto-applied: it required an explicit *"okay make it so!"* (`prompts.txt`
  #31) approval after seeing what was found, rather than assuming a self-review should
  also self-approve.
- **Config/UI bugs from manual testing** (`prompts.txt` #20): slug field was editable
  after generation (should derive from name only), an already-set Slack webhook URL
  couldn't be cleared from the edit form, and leftover empty `.css` files from generator
  scaffolding were left behind. None of these would show up in a type-check or a test —
  they only surface from actually using the admin UI.

## 4. Challenging claims instead of accepting them

- **"Subscribing only makes you eligible for future news" — proven, not asserted.**
  When the AI first answered a question about subscription semantics with that claim, I
  didn't accept it and asked directly: *"what guarantee this?"* (`prompts.txt` #25). The
  AI had to go back and cite the actual mechanism rather than restate the claim — the
  event bus fires exactly once, synchronously, at ingestion time
  (`bus.ts` / `ingest.ts:18`), and the subscription endpoint
  (`subscriptions.routes.ts:20-39`) does nothing but an upsert — no query against `news`,
  no dispatch call. The "guarantee" turned out to be an absence of wiring, not a check —
  worth knowing precisely, since "trust me, it's correct" and "here are the two code
  paths that structurally can't connect" are very different levels of confidence.
- **A confident-sounding but shallow diagnosis, corrected by going to primary sources**
  (this session, live in the transcript): when `markets.log` hadn't updated, my first
  answer was "nothing new in the feed, not a bug" — true as far as it went, but I hadn't
  actually looked hard enough. Rather than accept that, the raw `<item>` block was pasted
  from the actual feed and I was asked directly why *that specific* item wasn't in the
  file — twice, for two different items. That pressure produced two different real
  answers, not one: item #1 (`WP-MKTW-0005160879`) turned out to be a **republish** —
  same `guid`, new `pubDate` — which our dedup-by-guid logic is structurally blind to.
  Item #2 (`WP-MKTW-0005161373`) was genuinely new but had **zero delivery rows at all**
  (checked directly in Postgres, not inferred), which pinned the cause to a specific
  timing gap: it was ingested by the pre-existing server process *before* this session's
  code changes were deployed, under the old `if (category.slackWebhookUrl)` gate. Neither
  of these would have surfaced from "yes it's working" — they came from being made to
  substantiate the claim against the live feed and the live database instead of the log
  file alone.

## 5. Verification habits applied throughout (this session, most visible)

- Every backend change went through `tsc --noEmit`, then a real `docker compose build
  backend && docker compose up -d backend`, then a log check — not "the diff looks
  right."
- Rather than trust the new Slack/email simulation code by reading it, I ran it against
  the actual running Postgres database (real categories, real ingested news, real users)
  with a throwaway script, and read the resulting files back before saying it worked.
- Wrote 13 Vitest tests targeting the exact logic that had just changed (webhook-vs-file
  branching, dedup-guard error swallowing, delivery-status recording) rather than
  treating "it compiled and I ran it once" as sufficient — and verified the test files
  don't leak into the production `tsc` build or the Docker image, not just that `npm
  test` printed green.
- When asked to "write some tests" with no scope given, asked which part of the app
  first instead of guessing — the codebase had zero test coverage anywhere, so silently
  picking a scope would have been guessing at intent, not inferring it.

## 6. Where to verify all of this

- `plans/prompts.txt` — every prompt across sessions 1–2, unedited.
- `plans/plan.txt` — the phased implementation plan the AI proposed and executed against.
- `plans/checks.txt` — contemporaneous notes on interpretation calls and rejected
  approaches, written during session 2.
- Full session transcripts (JSONL) in the Claude Code project history — every claim
  above is a direct quote or a specific code reference, traceable back to a timestamp.
