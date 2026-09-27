# Changelog

Team log of what shipped, broke, or got cut. Mirror important entries to STARK Changelogs.

## 2026-09-27

- FEAT-008 claimed on `copilot/feat-008-language-spoken-errors` by eyob2one.
- Added language mode for speech flow: English (`en-US`) and tested local language Amharic (`am-ET`).
- Mic failures (permission denied, no device, unsupported browser, network/start errors) now show visual alerts and are spoken aloud.
- Citation extract/verify and debrief API failures now keep visual error messaging and also speak clear failure guidance in the active language.

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
