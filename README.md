# Viva booth (working title)

STARK hackathon: students **practise a thesis defence or class talk out loud**.

**Read first, then listen.** They paste the paper (title, research question, abstract, up to five references). We look those citations up on **Scholarxiv** before the mic. They talk (**Voxide**). We check the talk against **their text** and against **abstracts we actually fetched**. We coach **how to say it**. Viva questions come from **hits we pulled**, not invented papers. Host on **EthioDeploy**. No payments.

We do not decide scientific "truth." We decide: said vs their manuscript, named source exists, claim vs that abstract. Missing API hit = **unverified**.

**Open talk:** no paste. Citations come from speech only, then the same Scholarxiv check.

Not a ChatGPT tab. Not a search-only paper chatbot. Not a TED "energy" scorer. Not a full-PDF factory.

## Ideation

**Problem.** Ethiopian students rarely practise their viva out loud. They re-read notes; they do not speak. When they finally stand in front of an examiner they stumble on terminology they wrote themselves, cite papers they cannot locate, and cannot answer questions about claims in their own abstract. Existing tools either grade presentation style or are full literature-search engines. Neither closes the gap between writing a thesis and defending it verbally.

**Rejected paths.**

- *Full-PDF pipeline* — storage, latency, and privacy cost. A five-reference form covers everything an examiner pack needs. Cut.
- *Confidence / energy scorer* — grading enthusiasm says nothing about factual accuracy. A student can say a wrong claim very confidently. Cut.
- *Generic AI chatbot* — invents plausible-sounding papers. If an examiner question contains a fake citation, the student cannot look it up later. Cut.
- *Search-only paper tool* — knowing a paper exists is not the same as practising how to talk about it for two minutes. The practice loop is the product. Cut.

**Core constraint.** We only claim a paper exists if Scholarxiv confirms it. We only coach phrasing on what the student actually said. Examiner questions are grounded in abstracts we actually fetched. A missing API hit is `unverified`, never invented.

**Why EthioDeploy.** Reachable inside Ethiopia without a VPN or a credit card. No payments, no accounts, MIT-licensed.

Full ideation trail with dates: [`CHANGELOG.md § 2026-09-27`](CHANGELOG.md) — FEAT-009 (Abrham).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_VOXIDE_PUBLIC_KEY` so the voice widget appears. Whitelist `localhost` and the EthioDeploy host in the Voxide dashboard. Set `SCHOLARXIV_API_KEY` for citation checks and `GEMINI_API_KEY` for the debrief (both server only). Restart `npm run dev` after changing `.env.local`.

## Deploy on EthioDeploy

Do **not** start with `npm run dev`. That is the local compiler. The live box must build once, then serve:

- **Install:** `npm ci` (full install — Tailwind and TypeScript are needed to build)
- **Build:** `npm run build`
- **Start:** `npm run start`
- **Port:** `3000`
- **Health check:** path `/api/health`, start period at least 45 seconds

Do **not** set `NODE_ENV` in the EthioDeploy dashboard. Next.js only accepts `production` / `development` / `test` and sets it itself. A value like `Production` or `prod` is what triggers the non-standard `NODE_ENV` warning.

Do **not** turn on npm “production-only” install before the build (`npm warn config production Use --omit=dev instead`). That drops the packages `next build` needs.

Copy the same keys from `.env.example` into the EthioDeploy env panel (`NEXT_PUBLIC_VOXIDE_PUBLIC_KEY`, `SCHOLARXIV_API_KEY`, `GEMINI_API_KEY`). Whitelist the public host in Voxide.

If the dashboard still health-checks `/` in the first second, point it at `/api/health` or temporarily disable the check so the first container can stay up.

## Claim a feature

Board: [`feature_lock.json`](feature_lock.json). Statuses: `unclaimed` | `claimed` | `released`.

1. Open a PR that sets one feature to `claimed`, with your **name** (or GitHub), **branch**, and `claimed_at`. Prefer that PR to touch only the lock file.
2. One owner per `id`. If two claims collide, the first merge wins.
3. Commit mainly the paths in that feature's `deliverables`.
4. When the `verification` line is true, the same (or next) PR sets `released` and `released_at`.
5. There is no lock server. Git is the lock. Keep `main` demoable.

Work on `feat/p2-voxide`-style branches. Log releases in [`CHANGELOG.md`](CHANGELOG.md).

## Contest artifacts

1. **Thinking** — problem, rejected paths, and why this booth: [`CHANGELOG.md § 2026-09-27`](CHANGELOG.md) (FEAT-009, Abrham).
2. **Clock** — this repo + changelog + STARK changelogs.
3. **Runs** — live EthioDeploy URL (FEAT-001).

## License

MIT. See [LICENSE](LICENSE).
