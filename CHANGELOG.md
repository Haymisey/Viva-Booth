# Changelog

Team log of what shipped, broke, or got cut. Mirror important entries to STARK Changelogs.

## 2026-09-27

### FEAT-009 — Ideation trail (Abrham)

**Problem.** Ethiopian students, especially postgraduate and undergraduate thesis candidates, rarely practise their defence out loud before the real viva. They re-read notes, but they do not speak. When they finally stand in front of an examiner they stumble on terminology they wrote themselves, cite papers they cannot actually locate, and cannot answer follow-up questions about claims in their own abstract. Existing tools either grade presentation style ("you said 'um' 42 times") or are full literature-search engines. Neither closes the gap between writing a thesis and defending it verbally.

**Rejected paths.**

- *Full-PDF pipeline.* Parsing whole PDFs server-side adds storage, latency, and privacy risk. Students share short abstracts; a five-reference form is enough to build an examiner pack. Cut.
- *"Energy" / confidence scorer.* Grading how enthusiastically someone speaks says nothing about whether their claims are accurate. A student can say "the study by Vance et al., 2024 in the Journal of Applied Machine Learning showed 94 % accuracy" very confidently and still be wrong. Cut.
- *Generic AI Q&A chatbot.* A plain LLM invents plausible-sounding papers. If the examiner question contains a fake citation the student cannot look it up later. The whole point of Scholarxiv integration is that every question and every citation badge traces back to a real corpus entry or is explicitly marked unverified. Cut.
- *Search-only paper chatbot.* Knowing a paper exists is not the same as knowing how to talk about it for two minutes. The practice loop — speak → transcript → citation check → debrief → try again — is the product. Cut.

**Why Viva Booth.**
The constraint that separates this from everything above: *we only claim a paper exists if Scholarxiv confirms it; we only coach phrasing on what the student actually said; questions come from abstracts we actually fetched.* This gives the student a loop they can trust:
1. Paste your abstract and up to five references (or skip and do an open talk).
2. Speak. The browser mic transcribes.
3. Every citation you mentioned is verified against the real corpus.
4. Gemini reads your words and the abstracts it pulled, then says "keep this, fix these two, here is a better sentence."
5. The examiner questions are grounded in papers that exist.

Hosted on EthioDeploy so it is reachable inside Ethiopia without a VPN or a credit card. No payments, no accounts, MIT-licensed.

**STARK competition artefacts updated.**
- `CHANGELOG.md` — this entry; previous entries 2026-09-22 through 2026-09-24 already captured per-feature releases.
- `README.md` — Ideation section added below the run instructions.
- `feature_lock.json` — FEAT-009 set to `released`.

## 2026-09-24


- Gemini lists citation attempts from the heard transcript (verbatim only). Scholarxiv still decides in corpus / not found. Matcher needs most of the claim words, not two generic ones.
- Say it like this: Gemini debrief (keep / two fixes / one line). Falls back to citation statuses if the Gemini key is missing. FEAT-006 released.
- Citation match: a year in the claim must appear in the Scholarxiv title. Stops fake 2024 journals matching unrelated papers.
- In corpus only when the Scholarxiv title matches the claim. Author+year+journal pulled from speech (e.g. Vance 2024, Journal of …).
- Tighter speech citation extract (named 2017 paper titles). Scholarxiv search tries GET then POST. Unverified only if the API/key fails.
- Scholarxiv Papers API verifies citations: in corpus, not found, or unverified if the key/API fails. Never invent a paper. FEAT-005 released.
- Pull citations from the talk (author-year, Journal of, IEEE). Listed as pending. FEAT-004 released.
- Transcript no longer records Voxide chatter or start/stop commands. Browser listen starts after a short hush. FEAT-003 released.
- Booth layout: form collapses after Prepare, timer centered, saved packs as pills.
- Voxide start/stop: `startPractice` / `stopPractice` drive the booth timer. Widget mounts when `NEXT_PUBLIC_VOXIDE_PUBLIC_KEY` is set. FEAT-002 released.

## 2026-09-23

- Removed team label from the booth header (product name only: Viva).
- Examiner pack persists in the session: prepare from paste, or open talk with no manuscript. Citations stay pending (no Scholarxiv yet).
- `feature_lock.json`: FEAT-001 claimed (no EthioDeploy URL yet); FEAT-010 released.
- Next.js booth shell: manuscript form, timer, empty debrief panels. No Voxide or Scholarxiv yet.

## 2026-09-22

- Repo connected. Added `feature_lock.json` (claim board) and this changelog.
- Locked the loop: paste manuscript → Scholarxiv on their refs → talk → align + citation badges → questions from real hits. Open talk if they skip paste.
- Added FEAT-010 (manuscript prep). Still no app URL.
