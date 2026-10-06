# Viva-Booth — Implementation Plan

> **Audience:** Antigravity (coding agent). Execute phases strictly in order. Do not start a phase until the previous phase's **Verification Criteria** all pass.
> **Goal:** Convert the single-page, localStorage-only prototype into an authenticated, database-backed, multi-view portal with a landing page, a Figma-like dashboard, project prep, a persisted booth, settings, and Dev Mode (BYO API keys).

---

## 0. Ground Rules (read before touching code)

### 0.1 Execution rules for the agent
1. **Inspect first.** Before Phase 1, run `ls`, read `package.json`, `next.config.*`, `tsconfig.json`, and every existing file under `app/` or `src/app/`. Detect whether the repo uses a `src/` directory; **all paths below assume `src/`**. If not, drop the `src/` prefix consistently.
2. **One commit per task** (`feat(phase-1): ...`). After every phase run: `pnpm typecheck && pnpm lint && pnpm build` (use the repo's package manager; add a `typecheck` script `tsc --noEmit` if missing).
3. **Never break existing behavior silently.** Existing API routes (`/api/citations/extract`, `/api/citations/verify`, `/api/debrief`, `/api/questions`, `/api/title`, `/api/health`) keep working with their current request/response shapes until Phase 4 explicitly upgrades them. Add new fields as optional.
4. **Next.js 16 specifics:** `params` and `searchParams` are Promises in pages/layouts/route handlers (`const { id } = await params`). Request interception file is `proxy.ts` (renamed from `middleware.ts` in Next 16). Verify against the installed version's docs if anything fails to compile.
5. **No secrets in the client bundle.** API keys are only read in server code (`src/lib/server/**`, route handlers, server actions). Never prefix them with `NEXT_PUBLIC_`.
6. **Validate everything at the boundary** with Zod (`src/lib/validation/*.ts`). Every route handler: authenticate → validate → authorize (ownership) → act → return typed JSON.
7. **If an instruction here conflicts with the installed library version** (Prisma, Auth.js, Tailwind v4), follow the installed version's documented API and leave a `// NOTE(plan-deviation):` comment explaining why.

### 0.2 Target tech decisions (fixed — do not re-litigate)

| Concern | Decision |
|---|---|
| Database | PostgreSQL (local via Docker Compose; hosted on any managed Postgres) |
| ORM | Prisma. If the installed major is v7, use `prisma.config.ts` + `@prisma/adapter-pg` driver adapter; otherwise standard setup |
| Auth | Auth.js (NextAuth v5, `next-auth@beta`) with **Credentials provider**, **JWT session strategy**, `@auth/prisma-adapter` not required |
| Password hashing | `bcryptjs` (cost 12) — pure JS, safe on Node runtime |
| Validation | `zod` |
| Server state | TanStack Query (`@tanstack/react-query`) |
| Client UI state | `zustand` (dashboard canvas) and `useReducer` (booth state machine) |
| Secrets at rest | AES-256-GCM using `ENCRYPTION_KEY` (32 bytes, base64) for stored user API keys |
| Styling | Tailwind v4 + existing primitives (`Button`, `Badge`, `Field`) — extend, don't replace |
| Testing | Vitest (unit), Playwright (e2e smoke) |

### 0.3 Environment variables (`.env.example` — create it)

```
DATABASE_URL="postgresql://viva:viva@localhost:5432/vivabooth?schema=public"
AUTH_SECRET=""            # openssl rand -base64 32
AUTH_URL="http://localhost:3000"
ENCRYPTION_KEY=""         # openssl rand -base64 32 (must decode to 32 bytes)
GEMINI_API_KEY=""         # platform default key (used when user has no BYO key)
SCHOLARXIV_API_KEY=""     # platform default, optional if API is keyless
OPENALEX_MAILTO=""        # polite-pool email for OpenAlex requests
```

Add `src/lib/env.ts` that parses `process.env` with Zod at boot and throws a readable error for missing required vars (`DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`). `GEMINI_API_KEY` and `SCHOLARXIV_API_KEY` are optional at boot (Dev Mode users may supply their own) but features that need them must return a typed `KEY_MISSING` error.

### 0.4 Target directory layout (end state)

```
prisma/
  schema.prisma
  migrations/
docker-compose.yml
proxy.ts                               # route protection (root, next to package.json or src/ per Next 16 rules)
src/
  auth.ts                              # Auth.js config (exports auth, signIn, signOut, handlers)
  app/
    layout.tsx                         # root: fonts, <Providers/>
    globals.css
    (marketing)/
      layout.tsx
      page.tsx                         # "/" landing
    (auth)/
      auth/signin/page.tsx
      auth/signup/page.tsx
      layout.tsx
    (app)/
      layout.tsx                       # server-side auth guard + <AppShell/>
      dashboard/page.tsx
      projects/new/page.tsx
      projects/[id]/page.tsx           # project detail (redirects to booth if READY)
      booth/[id]/page.tsx
      settings/page.tsx
    api/
      auth/[...nextauth]/route.ts
      auth/signup/route.ts
      projects/route.ts
      projects/positions/route.ts
      projects/[id]/route.ts
      projects/[id]/references/route.ts
      projects/[id]/references/verify/route.ts
      projects/[id]/takes/route.ts
      projects/[id]/questions/route.ts
      takes/[takeId]/route.ts
      takes/[takeId]/debrief/route.ts
      questions/[questionId]/route.ts
      settings/profile/route.ts
      settings/password/route.ts
      settings/keys/route.ts
      settings/keys/test/route.ts
      account/route.ts
      citations/extract/route.ts       # existing (kept)
      citations/verify/route.ts        # existing (kept)
      debrief/route.ts                 # existing (kept, refactored to call service)
      questions/route.ts               # existing (kept, refactored to call service)
      title/route.ts                   # existing
      health/route.ts                  # existing (extend with DB ping)
  components/
    ui/                                # Button, Badge, Field + new: Card, Dialog, Tabs, Toast, Skeleton, Switch, Select
    marketing/                         # Hero, MethodSteps, QuickStart, Footer
    auth/                              # SignInForm, SignUpForm
    shell/                             # AppShell, TopNav, UserMenu
    dashboard/                         # CanvasBoard, ProjectCard, ReadinessRing, ViewToggle, EmptyState
    project/                           # ManuscriptForm, ReferenceRow, VerificationSummary
    booth/                             # Booth, VoiceRoot, SessionBar, DebriefPanel, ExaminerPanel, TakeHistory, RecentTakes
    settings/                          # ProfileForm, PasswordForm, DevModePanel, DangerZone
  lib/
    db.ts                              # Prisma singleton
    env.ts
    crypto.ts                          # encrypt/decrypt API keys
    api-client.ts                      # typed fetch wrapper for client
    validation/                        # zod schemas
    server/
      session.ts                       # requireUser()
      ownership.ts                     # requireProject(), requireTake()
      keys.ts                          # resolveKeys(userId)
      readiness.ts                     # computeReadiness()
      rate-limit.ts
      services/
        citations.ts                   # extract + verify (Scholarxiv, OpenAlex)
        debrief.ts                     # Gemini Keep/Fix/Say + Take 2 grading
        questions.ts                   # grounded examiner questions
    speech/
      recognizer.ts                    # SpeechRecognition wrapper
      metrics.ts                       # wpm, filler words
    hooks/
      useProjects.ts, useProject.ts, useTakes.ts, useSettings.ts
      useBoothMachine.ts
  stores/
    canvas.ts                          # zustand store for dashboard
  types/
    api.ts                             # shared request/response types
tests/
  unit/ e2e/
```

### 0.5 Standard API conventions
- Success: `200/201` with JSON body. Errors: `{ "error": { "code": "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "KEY_MISSING" | "UPSTREAM_FAILED" | "RATE_LIMITED", "message": string, "details"?: unknown } }` with the matching HTTP status (401/403/404/422/400/502/429).
- Implement `src/lib/server/http.ts` with `ok()`, `fail(code, message, status)`, and a `handle(fn)` wrapper that catches `ZodError` → 422 and unknown errors → 500 (log server-side, generic message to client).
- **Ownership rule:** a user must never be able to read or mutate another user's rows. Always query with `where: { id, userId }` (or via the project relation). Return `404` (not `403`) for foreign IDs to avoid leaking existence.

---

# PHASE 1 — Database Schema & Authentication

**Objective:** Postgres + Prisma schema for all domain entities; working email/password sign-up and sign-in; route protection.

## 1.1 Tasks

### T1.1 Dependencies & local DB
```
pnpm add prisma @prisma/client zod bcryptjs next-auth@beta
pnpm add -D @types/bcryptjs vitest tsx
```
Create `docker-compose.yml` with a `postgres:16` service (user/password/db = `viva`/`viva`/`vivabooth`, port 5432, named volume). Add scripts: `db:up` (`docker compose up -d db`), `db:migrate` (`prisma migrate dev`), `db:studio`, `db:generate`.

### T1.2 Prisma schema (`prisma/schema.prisma`)
Implement exactly these models (adjust generator block to installed Prisma major):

```prisma
datasource db { provider = "postgresql" }

enum ProjectStatus { DRAFT READY ARCHIVED }
enum RefStatus { UNVERIFIED VERIFIED AMBIGUOUS NOT_FOUND ERROR }
enum RefSource { SCHOLARXIV OPENALEX }
enum TakeKind { TAKE_1 TAKE_2 }
enum Locale { en_US am_ET }          // map to "en-US" / "am-ET" in app code

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  projects     Project[]
  settings     UserSettings?
}

model UserSettings {
  id               String  @id @default(cuid())
  userId           String  @unique
  user             User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  devMode          Boolean @default(false)
  geminiKeyEnc     String? // base64(iv|tag|ciphertext)
  scholarxivKeyEnc String?
  geminiModel      String?
  defaultLocale    Locale  @default(en_US)
  updatedAt        DateTime @updatedAt
}

model Project {
  id               String        @id @default(cuid())
  userId           String
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  title            String
  researchQuestion String
  abstract         String
  status           ProjectStatus @default(DRAFT)
  locale           Locale        @default(en_US)
  readiness        Int           @default(0)       // 0-100 cached score
  canvasX          Float         @default(0)
  canvasY          Float         @default(0)
  accent           String        @default("slate") // card color token
  pinned           Boolean       @default(false)
  lastTakeAt       DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  references       Reference[]
  takes            Take[]
  questions        Question[]
  @@index([userId, updatedAt])
}

model Reference {
  id          String     @id @default(cuid())
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  ordinal     Int                                  // 1..5
  rawText     String
  title       String?
  authors     String?
  year        Int?
  doi         String?
  status      RefStatus  @default(UNVERIFIED)
  source      RefSource?
  matchedId   String?
  confidence  Float?
  verifiedAt  DateTime?
  checks      CitationCheck[]
  @@unique([projectId, ordinal])
}

model CitationCheck {            // verification audit log
  id          String    @id @default(cuid())
  referenceId String
  reference   Reference @relation(fields: [referenceId], references: [id], onDelete: Cascade)
  provider    RefSource
  ok          Boolean
  latencyMs   Int
  summary     Json?              // trimmed provider response (top match only)
  createdAt   DateTime  @default(now())
}

model Take {
  id           String   @id @default(cuid())
  projectId    String
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  number       Int                              // 1-based per project
  kind         TakeKind @default(TAKE_1)
  parentTakeId String?                          // Take 2 -> Take 1
  parentTake   Take?    @relation("TakeRetake", fields: [parentTakeId], references: [id], onDelete: SetNull)
  retakes      Take[]   @relation("TakeRetake")
  locale       Locale   @default(en_US)
  transcript   String   @default("")
  durationMs   Int      @default(0)
  wordCount    Int      @default(0)
  wpm          Float?
  fillerCount  Int      @default(0)
  score        Int?                             // 0-100 from debrief
  debrief      Json?                            // { keep: string[], fix: string[], say: string, grading?: {...} }
  status       String   @default("RECORDING")   // RECORDING | TRANSCRIBED | DEBRIEFED
  startedAt    DateTime @default(now())
  endedAt      DateTime?
  @@unique([projectId, number])
  @@index([projectId, startedAt])
}

model Question {
  id               String   @id @default(cuid())
  projectId        String
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  takeId           String?
  text             String
  groundedIn       Json                          // { source: "abstract"|"reference"|"rq", refOrdinal?: number, quote?: string }
  answerTranscript String?
  answerScore      Int?
  answerFeedback   String?
  createdAt        DateTime @default(now())
  answeredAt       DateTime?
  @@index([projectId, createdAt])
}
```
Run `pnpm db:migrate --name init`. Commit the generated migration.

### T1.3 Prisma client singleton (`src/lib/db.ts`)
Standard `globalThis` cached `PrismaClient` for dev hot reload (with driver adapter if Prisma v7).

### T1.4 Crypto helper (`src/lib/crypto.ts`)
- `encrypt(plain: string): string` — AES-256-GCM, 12-byte random IV, returns `base64(iv ‖ tag ‖ ciphertext)`.
- `decrypt(blob: string): string`.
- `mask(plain: string): string` — returns e.g. `AIza••••••••9xQ2` (first 4, last 4).
- Unit test round-trip and tamper detection (flipping a byte must throw).

### T1.5 Auth.js config (`src/auth.ts`)
- Credentials provider with fields `identifier` (email **or** username) and `password`.
- `authorize`: Zod-validate → find user by email (lowercased) or username → `bcrypt.compare` → return `{ id, email, name: username }` or `null`. Use a constant-time dummy compare when the user is not found.
- `session: { strategy: "jwt", maxAge: 30 days }`.
- `callbacks.jwt`: put `userId` and `username` in the token. `callbacks.session`: expose `session.user.id` and `session.user.username`. Add module augmentation in `src/types/next-auth.d.ts`.
- `pages: { signIn: "/auth/signin" }`.
- Export `{ handlers, auth, signIn, signOut }`. Wire `src/app/api/auth/[...nextauth]/route.ts` to `handlers`.

### T1.6 Sign-up API (`POST /api/auth/signup`)
- Body schema: `{ email: email, username: /^[a-z0-9_]{3,24}$/i, password: min 10 chars, at least one letter and one digit }`.
- Normalize email to lowercase; username stored as typed but uniqueness checked case-insensitively (query `mode: "insensitive"`).
- Hash with bcryptjs cost 12. Create `User` + empty `UserSettings` in one transaction.
- Conflicts → `409`-style `fail("VALIDATION", "Email or username already in use", 409)` with a generic message (do not reveal which).
- Rate limit by IP: 5 signups/hour (`src/lib/server/rate-limit.ts`, in-memory `Map` keyed by IP with TTL; leave a `// TODO: swap for Redis in multi-instance deploys`). Apply a similar limiter (10 attempts / 10 min per identifier+IP) inside `authorize`.

### T1.7 Session helpers
- `src/lib/server/session.ts`: `requireUser()` → calls `auth()`; throws a typed `HttpError(401)` if absent; returns `{ id, email, username }`.
- `proxy.ts`: matcher for `/dashboard/:path*`, `/projects/:path*`, `/booth/:path*`, `/settings/:path*`. If no session cookie/JWT → redirect to `/auth/signin?callbackUrl=<path>`. If a signed-in user visits `/auth/signin` or `/auth/signup` → redirect `/dashboard`. **Proxy is an optimistic check only**; `(app)/layout.tsx` and every API handler must still call `auth()` / `requireUser()`.

### T1.8 Sign-in / Sign-up UI
- `src/components/auth/SignInForm.tsx` (client): fields identifier + password, show/hide password toggle, inline error region (`aria-live="polite"`), loading state. Submit via `signIn("credentials", { redirect: false, ... })` from `next-auth/react`; on success `router.replace(callbackUrl ?? "/dashboard")`.
- `SignUpForm.tsx`: email, username, password, confirm password. POST `/api/auth/signup`, then auto `signIn`. Client-side Zod mirror of server rules with field-level errors.
- Pages in `src/app/(auth)/auth/signin|signup/page.tsx` — server components that `redirect("/dashboard")` if already authenticated, wrapped in a minimal centered editorial layout (`(auth)/layout.tsx`) with a link back to `/`.
- Add `<SessionProvider>` inside `src/app/providers.tsx` (together with `QueryClientProvider`); mount in root layout.

## 1.2 Verification Criteria (Phase 1)
- [ ] `pnpm db:up && pnpm db:migrate` succeeds on a clean machine; `prisma studio` shows all tables.
- [ ] Unit tests: `crypto` round-trip + tamper; signup Zod schema accepts/rejects expected cases.
- [ ] Manual: sign up → auto signed in → lands on `/dashboard` (placeholder OK). Sign out → `/dashboard` redirects to `/auth/signin?callbackUrl=%2Fdashboard`. Sign in by **email** and by **username** both work. Wrong password shows a generic error.
- [ ] Duplicate email/username signup returns a non-revealing error.
- [ ] `curl -i localhost:3000/api/projects` without session → `401` with the standard error JSON (once route exists; until then verify via a test route or Phase 3).
- [ ] `pnpm typecheck && pnpm lint && pnpm build` pass; no `passwordHash` ever appears in any API response (grep + test).

---

# PHASE 2 — Landing Page & App Routing Architecture

**Objective:** Move from single-page to a multi-view portal with route groups, a shared app shell, and an editorial landing page. The old booth must remain reachable until Phase 4 swaps it.

## 2.1 Tasks

### T2.1 Preserve and relocate the legacy booth
- Move the current `src/app/page.tsx` content to `src/app/(app)/legacy-booth/page.tsx` (temporary, auth-guarded). Keep `Booth.tsx`, `DebriefPanel.tsx`, `SessionBar.tsx`, `VoiceRoot.tsx`, `ManuscriptForm.tsx`, `RecentTakes.tsx` where they are initially; they are moved to `components/booth/` and `components/project/` during Phases 3–4 (use `git mv`; update imports in the same commit).
- Delete `legacy-booth` at the end of Phase 4.

### T2.2 Route groups & layouts
- `src/app/layout.tsx`: `<html lang="en">`, fonts, `<Providers>` (SessionProvider + QueryClientProvider + Toast), metadata (`title.template: "%s · Viva-Booth"`).
- `(marketing)/layout.tsx`: sticky `TopNav` variant with links *Method*, *How it works*, *Open source*, and CTAs *Sign in* / *Start practicing*. Server-side: if `auth()` has a session, swap CTAs for *Open dashboard*.
- `(auth)/layout.tsx`: centered card layout (done in Phase 1).
- `(app)/layout.tsx` (server component): `const session = await auth(); if (!session) redirect("/auth/signin")`; render `<AppShell user={...}>` with `TopNav` (Dashboard, New project, Settings, `UserMenu` with sign out).
- Add `src/app/not-found.tsx`, `src/app/error.tsx`, `(app)/loading.tsx` (skeletons).

### T2.3 Landing page (`src/app/(marketing)/page.tsx`)
Sections, in order (all server components, minimal JS):
1. **Hero** — headline: "Read first. Then listen." Sub: one-sentence value prop (practice defending your thesis aloud against grounded, citation-checked examiner questions). Primary CTA → `/auth/signup`; secondary → `/auth/signin`.
2. **Method steps (4 cards)** — (1) *Read*: paste title, research question, abstract, 5 references; (2) *Verify*: citations checked against Scholarxiv/OpenAlex; (3) *Listen*: speak your defense, live transcription in English or Amharic; (4) *Defend*: Keep/Fix/Say debrief, Take 2, then examiner cross-examination.
3. **Why it's different** — grounded questions (no invented citations), substance over filler-word counting, runs on low-bandwidth friendly pages, open source.
4. **Quick start** — three-step list with a code-styled link to the repo (read repo URL from `package.json` `repository` field or `NEXT_PUBLIC_REPO_URL`).
5. **Language note** — supports `en-US` and `am-ET` capture (browser-dependent; see Phase 4 fallback).
6. **Footer** — license, GitHub link, "Built for students" line.
- Design: editorial academic — serif display font for headings (e.g., `Fraunces` or `Source Serif 4` via `next/font`), neutral paper background, one accent color, generous whitespace, WCAG AA contrast. No stock imagery; use CSS/SVG diagrams only. Add `metadata` + Open Graph tags.

### T2.4 Shared UI primitives
Add to `src/components/ui/`: `Card`, `Dialog` (focus-trapped, ESC closes), `Tabs`, `Toast` (+ `useToast`), `Skeleton`, `Switch`, `Select`. Keep API consistent with existing `Button`, `Badge`, `Field`.

### T2.5 API client & query setup
- `src/lib/api-client.ts`: `api<T>(path, init?)` — JSON fetch, throws `ApiError` with `code` and `message` parsed from the standard error shape; on `401` call `signOut({ callbackUrl: "/auth/signin" })`.
- `src/app/providers.tsx`: `QueryClient` defaults `{ staleTime: 30_000, retry: 1, refetchOnWindowFocus: false }`.

## 2.2 Verification Criteria (Phase 2)
- [ ] `/` renders the landing page for logged-out users with no client-side JS errors; Lighthouse (desktop) Accessibility ≥ 95, no layout shift from fonts.
- [ ] Logged-in user visiting `/` sees *Open dashboard* CTA.
- [ ] `/dashboard`, `/settings`, `/projects/new` redirect to sign-in when logged out and render inside `AppShell` when logged in (placeholder bodies acceptable).
- [ ] Legacy booth still functions at `/legacy-booth` (record → debrief) — no regressions.
- [ ] Unknown route shows `not-found`; thrown error in a page shows `error.tsx` with retry.
- [ ] Keyboard-only navigation works across nav, dialogs, and forms (manual check).
- [ ] `pnpm build` passes; route table in build output shows `/` as static.

---

# PHASE 3 — Figma-like Dashboard & New Project Flow

**Objective:** `/dashboard` as an interactive canvas/grid of project cards with readiness scores; `/projects/new` with manuscript prep and live citation verification; full project CRUD API.

## 3.1 Project API

### `GET /api/projects`
Returns the user's non-archived projects:
```ts
type ProjectCard = {
  id; title; status; locale; readiness: number; accent: string; pinned: boolean;
  canvasX: number; canvasY: number; lastTakeAt: string | null;
  counts: { takes: number; refsVerified: number; refsTotal: number; questionsAnswered: number };
  latestScore: number | null;
}
```
Single query with `_count` and a `take: 1` ordered subquery for the latest take score; avoid N+1.

### `POST /api/projects`
Body: `{ title (3–200), researchQuestion (10–500), abstract (100–3000), locale?, references: string[] (exactly 5, each 10–600 chars) }`. Creates project + 5 `Reference` rows (`ordinal` 1–5, status `UNVERIFIED`) in a transaction; sets initial canvas position via `nextFreeSlot()` (grid of 320×220 slots, first free in row-major order). Returns `201 { id }`.

### `GET /api/projects/[id]`
Full project with references, last 10 takes (summary only), questions.

### `PATCH /api/projects/[id]`
Partial update of `title`, `researchQuestion`, `abstract`, `locale`, `accent`, `pinned`, `status` (`ARCHIVED` allowed). If manuscript text fields change, set all references' status to remain but flag `status = DRAFT` and recompute readiness (see 3.4).

### `PATCH /api/projects/positions`
Body: `{ updates: { id: string; x: number; y: number }[] }` (max 100). Single `$transaction` of updates filtered by `userId`. Used by the dashboard with debounce.

### `DELETE /api/projects/[id]`
Hard delete (cascade). Returns `204`. Require the client to have shown a confirm dialog (typed project title, see Phase 5 danger zone patterns — reuse `ConfirmDeleteDialog`).

## 3.2 Citation verification flow

### Refactor to a service
Extract logic from the existing `/api/citations/extract` and `/api/citations/verify` handlers into `src/lib/server/services/citations.ts`:
- `extractFields(raw: string, keys): Promise<{ title?; authors?; year?; doi? }>` — heuristic parse first (DOI regex, year regex `\b(19|20)\d{2}\b`, quoted/italic title); call Gemini only if heuristics yield no title.
- `verifyReference(parsed, keys): Promise<{ status; source?; matchedId?; confidence; summary }>` — try **Scholarxiv first**, fall back to **OpenAlex** (`mailto` param from env). Matching rule: DOI exact match ⇒ `VERIFIED (1.0)`; else normalized-title similarity (token-set Jaccard or Dice) ≥ 0.85 and year within ±1 ⇒ `VERIFIED`; 0.6–0.85 ⇒ `AMBIGUOUS`; below ⇒ `NOT_FOUND`; provider failure on both ⇒ `ERROR`.
- Timeouts: 8 s per provider (`AbortSignal.timeout`), one retry on 5xx. Never throw to the route for provider failures; return `ERROR`.
- Existing routes become thin wrappers over these functions and keep their current shapes (stateless, no DB writes).

### New project-scoped endpoints
- `PUT /api/projects/[id]/references` — body `{ references: { ordinal: 1..5, rawText }[] }`; upserts rows, resets `status` to `UNVERIFIED` for changed text.
- `POST /api/projects/[id]/references/verify` — body `{ ordinals?: number[] }` (default all). Verifies in parallel with concurrency 3, **streams NDJSON** (`Content-Type: application/x-ndjson`), one line per reference as it completes: `{ ordinal, status, source, confidence, title?, matchedId? }`. Each result is persisted on `Reference` and logged in `CitationCheck`. Uses `resolveKeys(userId)` (Phase 5 finalizes it; in Phase 3 it returns env defaults).

## 3.3 Dashboard (`src/app/(app)/dashboard/page.tsx`)

### Data & state
- `useProjects()` (TanStack Query, key `["projects"]`) hydrates from a server component prefetch (`dehydrate`) to avoid a loading flash.
- `src/stores/canvas.ts` (zustand): `{ view: "canvas" | "grid"; zoom: number (0.5–1.5); pan: {x,y}; selectedId: string | null; positions: Record<id,{x,y}>; setView; setZoom; panBy; moveCard; commitPositions }`. Persist `view` and `zoom` in `localStorage` (UI preference only).

### Components
- `ViewToggle` (Canvas | Grid), zoom controls (`−`, `100%`, `+`, "Fit"), and a primary **New project** button → `/projects/new`.
- `CanvasBoard`: a pannable/zoomable surface.
  - Container `overflow: hidden; position: relative; touch-action: none`; inner layer `transform: translate(pan.x, pan.y) scale(zoom)`; subtle dot-grid background via CSS radial-gradient scaled with zoom.
  - Pan: pointer drag on empty space (pointer events, `setPointerCapture`) or Space+drag; wheel with `ctrlKey` zooms around the cursor; plain wheel pans.
  - Cards are absolutely positioned at `positions[id]`. Dragging a card (pointer events, 4 px threshold to distinguish click from drag) updates the store optimistically; on pointer-up snap to 20 px grid and call `commitPositions()` which debounces (600 ms) a `PATCH /api/projects/positions`.
  - Keyboard: arrow keys move the selected card by 20 px, `Enter` opens booth, `Delete` opens the delete dialog; cards are focusable with visible focus rings.
  - Mobile (< 768 px) auto-falls back to Grid view.
- `ProjectCard` (≈ 300×200): title (2-line clamp), `ReadinessRing` (SVG, 0–100, color thresholds <40 / 40–70 / >70), status `Badge`, citation chip (`4/5 verified`), takes count, last practiced (relative time), actions: **Launch** (→ `/booth/[id]`), overflow menu (Rename, Pin, Color, Archive, Delete).
- Grid view: responsive CSS grid of the same `ProjectCard`s sorted by `pinned desc, updatedAt desc`.
- `EmptyState`: illustration-free, explains the method, CTA → `/projects/new`.
- Right-side **Inspector panel** (collapsible) for the selected card: readiness breakdown (see 3.4), last 5 takes sparkline (scores), quick actions (Resume, New take).

### Cross-tab sync
On `window` `focus` invalidate `["projects"]`. After any mutation invalidate or `setQueryData` directly.

## 3.4 Readiness score (`src/lib/server/readiness.ts`)
`computeReadiness(projectId): Promise<number>` returns 0–100:
- **Citations (25%)**: `verified / 5`; `AMBIGUOUS` counts 0.5.
- **Latest take quality (40%)**: score of the most recent debriefed take (0 if none).
- **Improvement (15%)**: if a Take 2 exists, `clamp((take2.score − take1.score) / 20 + 0.5, 0, 1)`; otherwise 0.
- **Examiner readiness (20%)**: `answered questions with answerScore ≥ 60 / max(5, total questions)`.
Round to integer; write to `Project.readiness`. Call after: reference verification, take debrief, question answer. Return the breakdown from `GET /api/projects/[id]` as `readinessBreakdown` for the Inspector.

## 3.5 New Project page (`src/app/(app)/projects/new/page.tsx`)
- Move/refactor `ManuscriptForm.tsx` → `src/components/project/ManuscriptForm.tsx` (reuse existing field logic) into a **two-step stepper**:
  1. **Manuscript**: Title (with "Suggest title" calling existing `/api/title`), Research question, Abstract (live word/char counter, target 150–300 words), Language select (English / አማርኛ → `locale`).
  2. **Literature**: exactly 5 `ReferenceRow`s (textarea per reference, paste-multiple support: pasting text with newlines into row 1 splits across rows). A **Verify all** button hits the streaming verify endpoint; each row shows a live status chip (spinner → ✓ Verified / ⚠ Ambiguous / ✗ Not found / ! Error) with matched title + source badge and a **Retry** per row. A `VerificationSummary` shows totals.
- State: `react-hook-form` is optional; if not added, use a single `useReducer` form state with Zod validation per step. **Draft autosave** to `sessionStorage` (`vb:newProjectDraft`) so refresh doesn't lose input; clear on success.
- Submission flow: Step 2 → **Create project** → `POST /api/projects` (creates rows as `UNVERIFIED`) → immediately run `POST /api/projects/[id]/references/verify` if not already verified in-form (carry verification results from the pre-create stateless `/api/citations/verify` calls and persist them via the `PUT references` endpoint with their statuses to avoid double calls) → redirect `/booth/[id]`.
- Policy: **Unverified or Not-found references do not block creation** but show a non-dismissable warning: "Examiner questions will only cite verified references." Questions generation (Phase 4) must filter on `VERIFIED`/`AMBIGUOUS` references only.
- `src/app/(app)/projects/[id]/page.tsx`: lightweight manuscript editor (same form, prefilled) with a **Re-verify** action and a link to the booth.

## 3.6 Verification Criteria (Phase 3)
- [ ] Create a project via `/projects/new`; it appears on `/dashboard` in the first free slot; refresh keeps it.
- [ ] Drag a card; reload → position persists (check DB). Dragging in canvas never triggers navigation. Grid toggle persists across reload.
- [ ] Pinch/ctrl-wheel zoom keeps the point under the cursor stable; "Fit" frames all cards.
- [ ] Verify all: five rows update progressively (NDJSON streaming observed in Network tab); results persisted (`Reference.status`, `CitationCheck` rows exist). Killing the network to Scholarxiv yields OpenAlex fallback or `ERROR` — never a 500.
- [ ] A user B cannot `GET/PATCH/DELETE` user A's project (returns 404) — covered by an automated test with two users.
- [ ] Delete project removes it and cascades (no orphan `Reference`/`Take` rows).
- [ ] Readiness updates after verification (`Project.readiness` > 0 with 5 verified refs, no takes → 25).
- [ ] Zod rejects fewer/more than 5 references and over-length fields with field-level errors surfaced in UI.
- [ ] Unit tests for: title similarity matcher, `nextFreeSlot`, `computeReadiness` weights. `pnpm build` passes.

---

# PHASE 4 — Booth, Examiner Questions & Take 2 Synchronization

**Objective:** `/booth/[id]` loads a persisted project, captures speech (`am-ET` / `en-US`), saves takes, produces the Keep/Fix/Say debrief, runs Take 2 grading against Take 1, generates grounded examiner questions, records answers, and keeps history in the DB.

## 4.1 Booth state machine (`src/lib/hooks/useBoothMachine.ts`)
Implement with `useReducer` (pure reducer + unit tests). States and events:

```
IDLE ──START_TAKE──▶ RECORDING_1 ──STOP──▶ TRANSCRIBED_1 ──REQUEST_DEBRIEF──▶ DEBRIEFING_1 ──DEBRIEF_OK──▶ DEBRIEFED_1
DEBRIEFED_1 ──START_TAKE_2──▶ RECORDING_2 ──STOP──▶ TRANSCRIBED_2 ──REQUEST_DEBRIEF──▶ DEBRIEFING_2 ──DEBRIEF_OK──▶ GRADED
GRADED / DEBRIEFED_1 ──START_EXAMINER──▶ EXAMINER_Q (loop: ANSWER_START → ANSWER_STOP → ANSWER_GRADED → NEXT) ──DONE──▶ COMPLETE
any ──ERROR──▶ ERROR (with recoverable flag; RETRY returns to previous state)
```
Context: `{ project, currentTake, take1, take2, questions, activeQuestionIndex, interimText, finalText, locale, micPermission }`. Rehydrate from server on mount: derive initial state from the latest take statuses (so a refresh resumes at the right stage).

## 4.2 Speech capture (`src/lib/speech/`)
- `recognizer.ts` wraps `window.SpeechRecognition || window.webkitSpeechRecognition`:
  - `createRecognizer({ locale, onInterim, onFinal, onError, onEnd })`, `continuous = true`, `interimResults = true`, `lang = "en-US" | "am-ET"`.
  - **Auto-restart** on `onend` while the machine is in a RECORDING state (browsers stop continuous sessions after silence); guard against restart loops (max 3 restarts per 5 s).
  - Accumulate final segments; expose `getTranscript()`.
- **Feature detection & fallbacks (required):** if unsupported (e.g., Firefox) or if `am-ET` yields a `language-not-supported` error, show a clear banner and enable a **manual transcript mode** (textarea to paste/type the transcript) so the rest of the pipeline works. Do not assume `am-ET` works in every browser; treat it as best-effort and surface the real error. Locale switch available in `SessionBar` (persisted on the take and the project default).
- Microphone permission handling UI: `prompt` / `granted` / `denied` states with recovery instructions.
- `metrics.ts`: `computeMetrics(transcript, durationMs, locale)` → `{ wordCount, wpm, fillerCount, fillers: Record<string, number> }`. Filler lexicons: en (`um, uh, ah, like, you know, basically, actually, sort of`), am (a small configurable list in `src/lib/speech/fillers.am.ts`; mark as a starting set to be refined). Use Unicode-aware word splitting (`Intl.Segmenter` when available) so Ge'ez script is counted correctly. Fillers are **informational only** and do not drive the score.

## 4.3 Take & debrief APIs

### `POST /api/projects/[id]/takes`
Body `{ kind: "TAKE_1" | "TAKE_2", parentTakeId?: string, locale }`. Allocates `number = max+1` in a transaction, creates `Take { status: "RECORDING" }`. For `TAKE_2`, require `parentTakeId` to belong to the same project and be `TAKE_1`. Returns the take.

### `PATCH /api/takes/[takeId]`
Body `{ transcript, durationMs, final?: boolean }`. Called every ~10 s during recording (autosave, `keepalive`) and once on stop with `final: true`, which also sets `endedAt`, computes metrics server-side (`computeMetrics`) and `status = "TRANSCRIBED"`. Reject if transcript > 30,000 chars.

### `POST /api/takes/[takeId]/debrief`
- Loads take + project + (verified) references + parent take (if Take 2).
- Calls `services/debrief.ts` which wraps the **existing Gemini debrief logic** (move prompt + parsing out of `/api/debrief/route.ts`; the old route calls the same service for backward compatibility).
- Input to the model: manuscript (title, RQ, abstract), verified references (title/authors/year only), the transcript, locale, metrics, and for Take 2 the Take 1 transcript + its debrief.
- Required structured output (enforce with a JSON response schema / `responseMimeType: "application/json"` and Zod parse with one repair retry):
```ts
type Debrief = {
  score: number;                       // 0-100
  keep: string[];                      // 2-4 things done well
  fix: string[];                       // 2-4 specific issues, each tied to a transcript quote (< 15 words)
  say: string;                         // a single model sentence the student should rehearse
  grounding: { claimsChecked: number; unsupportedClaims: string[] };  // claims not in the manuscript
  grading?: { delta: number; addressedFixes: { fix: string; addressed: boolean; note: string }[]; verdict: "improved" | "flat" | "regressed" };  // Take 2 only
}
```
- Hard prompt rules: judge **only against the provided manuscript**; never invent or cite sources not in the verified reference list; flag speaker claims unsupported by the abstract; respond in the take's language for `say`/notes (English or Amharic).
- Persist `score`, `debrief`, `status = "DEBRIEFED"`; update `Project.lastTakeAt`; recompute readiness; return the debrief.
- Errors: missing key → `KEY_MISSING` (UI links to Settings → Dev Mode); Gemini failure → `UPSTREAM_FAILED` with retry button; rate limit 20 debriefs/hour/user.

### `GET /api/projects/[id]/takes`
Paged history (`?cursor=`), summary fields only (no full debrief) for `TakeHistory`; `GET /api/takes/[takeId]` returns the full record. (Add `GET` handler to the same `takes/[takeId]/route.ts`.)

## 4.4 Examiner cross-examination

### `POST /api/projects/[id]/questions` (generate)
- Refactor existing `/api/questions` logic into `services/questions.ts`.
- Inputs: manuscript + **only VERIFIED/AMBIGUOUS** references + latest debrief `fix` list (to probe weak areas).
- Output: exactly 5 questions: `{ text, groundedIn: { source: "abstract" | "reference" | "rq", refOrdinal?, quote } }`. Post-validate: if `source === "reference"`, `refOrdinal` must exist among usable references; if `quote` is not a substring (case/whitespace-normalized) of the cited source text, drop the question and regenerate once. This is the anti-hallucination guarantee — keep the check in code, not just the prompt.
- Persist as `Question` rows (idempotent: if unanswered questions already exist for the project, return them unless `?regenerate=true`).

### `PATCH /api/questions/[questionId]`
Body `{ answerTranscript }`. Server grades the answer with Gemini (0–100 + 1–2 sentence feedback, judged against the manuscript only), saves `answerScore`, `answerFeedback`, `answeredAt`, recomputes readiness.

### UI: `ExaminerPanel`
Shows one question at a time with the grounding quote (collapsible "Why this question?"), reuses `VoiceRoot` for answer capture (same recognizer + manual fallback), shows feedback after each answer, progress `3/5`, and a final summary with average score.

## 4.5 Booth page & component wiring (`src/app/(app)/booth/[id]/page.tsx`)
- Server component: `requireProject` (404 if not owner) → prefetch project, takes summary, questions → `<Booth projectId initialData />`.
- Move components to `src/components/booth/` and rewire:
  - `Booth.tsx`: composes `SessionBar` (locale, timer, take number, status), `VoiceRoot` (mic UI, live transcript), `DebriefPanel` (Keep/Fix/Say + grounding warnings + Take 2 grading delta), `ExaminerPanel`, `TakeHistory`, and a left rail with the manuscript summary and reference verification chips (read-only).
  - `RecentTakes.tsx` → becomes `TakeHistory`: list from `GET takes`, click to view a past debrief (read-only), compare Take 1 vs Take 2 side by side.
  - A **Take 2** CTA appears in `DebriefPanel` after Take 1's debrief and pre-displays the `say` sentence and `fix` list as a checklist.
- Leave the page via `beforeunload` guard only while `RECORDING_*` (and flush autosave with `navigator.sendBeacon` fallback).

## 4.6 Legacy data migration & cleanup
- One-time **import of localStorage takes**: on first dashboard load, if `localStorage["vb:legacyTakes"]` (inspect the legacy code for the real key names and shape) exists, show a dialog "Import N previous takes?" → create a project "Imported practice" (if user confirms) and POST takes with `status = "DEBRIEFED"` where debrief data exists; then set `vb:legacyImported = "1"` and remove legacy keys. Fail soft — never block the dashboard.
- Delete `src/app/(app)/legacy-booth`, remove any now-unused localStorage/sessionStorage reads except the UI preferences and the `vb:newProjectDraft` key.
- Extend `/api/health` to return `{ ok, db: "up" | "down", version }` (DB ping `SELECT 1`, 1 s timeout; no secrets).

## 4.7 Verification Criteria (Phase 4)
- [ ] End-to-end happy path (Playwright with the recognizer stubbed to emit scripted transcripts, Gemini mocked via MSW or an env-switch `VB_MOCK_AI=1`): signup → create project → booth → Take 1 → debrief → Take 2 → grading shows `delta` and `addressedFixes` → generate 5 questions → answer all → readiness > earlier value → dashboard card reflects new score.
- [ ] Refresh mid-flow at each stage resumes the correct state (RECORDING restarts safely as a new autosaved draft; DEBRIEFED_1 shows the debrief).
- [ ] Autosave: kill the tab during recording → transcript up to the last 10 s autosave exists in DB.
- [ ] Every generated reference-grounded question has a `quote` that is a literal substring of the cited source; a unit test feeds a hallucinated quote and asserts it is rejected.
- [ ] Questions are never grounded in `NOT_FOUND` references (test).
- [ ] `am-ET` selected on an unsupported browser shows the fallback banner and manual mode completes the pipeline; `en-US` works in Chrome with real mic (manual check, record the browser versions tested in the PR description).
- [ ] Take 2 requires a valid Take 1 parent; cross-project/foreign IDs return 404.
- [ ] Missing Gemini key yields `KEY_MISSING` UI with a link to `/settings`; no stack traces or keys in responses.
- [ ] No console errors/hydration warnings; `pnpm build` passes.

---

# PHASE 5 — Settings, Dev Mode & API Key Injection

**Objective:** Account management, project deletion, preferences, and secure bring-your-own-key (BYOK) support wired into every AI/citation service.

## 5.1 Settings page (`src/app/(app)/settings/page.tsx`)
Tabbed layout (`Tabs`): **Profile**, **Security**, **Preferences**, **Dev Mode**, **Danger zone**. Server component loads `GET`-equivalent data directly via `db` and passes serializable props to client forms (never pass encrypted blobs or raw keys).

### Profile (`ProfileForm`)
- Update `username` and `email`. `PATCH /api/settings/profile` body `{ username?, email? }`; same validation/uniqueness as signup; email change requires current password in the body (`currentPassword`). After success, call `update()` from `useSession` (or re-sign-in) so the JWT reflects the new username.

### Security (`PasswordForm`)
- `POST /api/settings/password` body `{ currentPassword, newPassword }`. Verify with bcrypt; apply the same strength rules; rate limit 5/10 min. On success, show a toast. (JWT sessions can't be centrally revoked; add a `passwordChangedAt` timestamp to `User` and have the `jwt` callback invalidate tokens issued before it — include a small migration.)

### Preferences
- `defaultLocale` (en-US / am-ET) and "Show filler-word counts" toggle (stored in `UserSettings` via `PATCH /api/settings/profile` → add `showFillers Boolean @default(true)` in a migration, or store as a client preference if you prefer — choose the DB route for cross-device sync).

### Danger zone (`DangerZone`)
- **Delete project(s)**: list of projects with per-row delete using `ConfirmDeleteDialog` (type the project title to confirm) → `DELETE /api/projects/[id]`.
- **Delete account**: `DELETE /api/account` body `{ password }` → verifies password → deletes user (cascade) → `signOut`. Confirm dialog requires typing `DELETE`.

## 5.2 Dev Mode — Bring Your Own API Keys

### Storage & API (`/api/settings/keys`)
- `GET` → `{ devMode: boolean, gemini: { set: boolean, masked?: string }, scholarxiv: { set: boolean, masked?: string }, geminiModel?: string }`. **Never** returns plaintext or the encrypted blob.
- `PUT` body `{ devMode?: boolean, geminiKey?: string | null, scholarxivKey?: string | null, geminiModel?: string | null }`. Non-empty string → `encrypt()` and store; `null` → clear. Trim whitespace; reject keys > 200 chars or containing whitespace.
- `DELETE` → clears both keys and sets `devMode = false`.
- `POST /api/settings/keys/test` body `{ provider: "gemini" | "scholarxiv" }` — makes a minimal call using the **stored** key (never accept a key in the test body from the client when one is stored; optionally accept a candidate key in the body for "test before save", used once and not logged) and returns `{ ok: boolean, latencyMs, message }`. Gemini test: a 1-token generation / models list call. Scholarxiv test: a trivial search query. Map provider auth errors to friendly messages.
- Audit: never log request bodies for these routes; add a redaction helper `redact(obj)` used by the global error logger.

### Resolution logic (`src/lib/server/keys.ts`)
```ts
export async function resolveKeys(userId: string): Promise<{
  gemini?: string; scholarxiv?: string; geminiModel: string; source: { gemini: "user" | "platform" | "none"; scholarxiv: "user" | "platform" | "none" };
}>
```
Rules: if `settings.devMode` **and** a user key exists → use the user key; otherwise use the platform env key; otherwise `undefined` (callers throw `KEY_MISSING`). `geminiModel` = user override (only in dev mode) or the project default constant in `src/lib/constants.ts`.
- Inject into **all** services by passing `keys` explicitly: `services/citations.ts`, `services/debrief.ts`, `services/questions.ts`, and the legacy `/api/title`, `/api/citations/*`, `/api/debrief`, `/api/questions` routes (each now calls `requireUser()` then `resolveKeys(user.id)`). **Services must not read `process.env` for provider keys directly** — add an ESLint `no-restricted-syntax` rule or a grep test to enforce.
- Surface the key source in API responses via a header `X-VB-Key-Source: user|platform` (no key material) and show a small "Using your key" badge in the booth `SessionBar` when `user`.

### Dev Mode UI (`DevModePanel`)
- `Switch` to enable Dev Mode with a warning: "Your keys are encrypted at rest and only used for your requests. Usage is billed to your provider account."
- Two masked inputs (Gemini, Scholarxiv) with **Save**, **Test**, **Clear** per key; status chip (`Not set` / `Saved ••••9xQ2` / `Tested ✓` / `Failed`); optional Gemini model select/override input.
- Inputs are `type="password"`, `autocomplete="off"`, `spellcheck={false}`; after saving, clear the input state immediately (never keep plaintext in React state longer than needed; never in Query cache).
- A collapsible "Request log (last 20)" is **out of scope** — do not implement.

## 5.3 Hardening & polish (end of phase)
- Security headers via `next.config`: `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and a baseline CSP (allow self, Google Fonts only if used; connect-src self). Test the speech recognizer still works under the CSP.
- CSRF: Auth.js covers auth routes; for custom mutation routes rely on same-site cookies (`SameSite=Lax`) **plus** an `Origin` header check helper `assertSameOrigin(req)` in `http.ts` for all non-GET handlers.
- Accessibility pass: labels, focus order, `aria-live` for streaming status, reduced-motion support for the canvas.
- Docs: update `README.md` (setup, env vars, DB, scripts, Dev Mode explainer, browser support matrix for speech) and add `docs/ARCHITECTURE.md` with the final route map and data model diagram (Mermaid).
- Deployment notes in README for the EthioDeploy target: required env vars, `prisma migrate deploy` on release, Postgres connection limits, and `AUTH_URL` set to the public origin. Confirm the platform's actual requirements with the team before finalizing — don't assume.

## 5.4 Verification Criteria (Phase 5)
- [ ] Change username → nav shows the new name without re-login; change email requires the correct current password; duplicate email/username rejected.
- [ ] Change password → old password fails, new works; tokens issued before the change are rejected (test via `passwordChangedAt`).
- [ ] With Dev Mode **on** and a user Gemini key set, a debrief request uses the user key (`X-VB-Key-Source: user`, verify with a deliberately invalid key producing `UPSTREAM_FAILED` auth error rather than silently using the platform key); with Dev Mode **off**, the platform key is used even if a user key is stored.
- [ ] Database inspection: key columns contain ciphertext only; `GET /api/settings/keys` never returns plaintext (automated test greps responses and server logs for the test key string).
- [ ] `grep -R "process.env.GEMINI_API_KEY\|process.env.SCHOLARXIV_API_KEY" src` matches only `src/lib/server/keys.ts` and `src/lib/env.ts`.
- [ ] Delete project (typed confirmation) and delete account (password + typed `DELETE`) both cascade fully; no orphan rows (SQL check script `scripts/check-orphans.ts`).
- [ ] Security headers present on responses (`curl -I`); recognizer and fonts still work.
- [ ] Full regression: run the Phase 4 Playwright flow again plus a two-user isolation test; `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass.

---

# Appendix A — Final Acceptance Checklist (whole product)

1. New visitor: `/` → sign up → dashboard empty state → New project → verify 5 citations → booth.
2. Booth: Take 1 (English) → Keep/Fix/Say → Take 2 with grading → 5 grounded examiner questions → answers graded → readiness visible on dashboard card.
3. Same account on a second browser sees identical projects, takes, and scores (no reliance on localStorage for domain data).
4. Amharic path: `am-ET` capture works where supported, otherwise manual transcript fallback completes the flow.
5. Dev Mode: user key used end-to-end; keys never exposed to the client or logs.
6. Settings: profile, password, project deletion, account deletion all work.
7. No unauthorized cross-user data access (automated test).
8. Clean build, typecheck, lint, unit and e2e tests passing; README and ARCHITECTURE docs updated.

# Appendix B — Known Risks & Decisions to Flag in PRs

| Risk | Mitigation |
|---|---|
| `am-ET` speech recognition support varies by browser/vendor service | Feature detect, surface real errors, manual transcript fallback; document tested browsers |
| Scholarxiv/OpenAlex coverage gaps for Ethiopian/regional literature | `AMBIGUOUS`/`NOT_FOUND` don't block; questions exclude unverified refs; allow manual "mark as verified (user-asserted)" as a **future** enhancement (not in this plan) |
| In-memory rate limiter not shared across instances | Documented `TODO`; swap to Redis/Upstash when horizontally scaling |
| JWT sessions can't be force-revoked | `passwordChangedAt` check; consider DB sessions later |
| Gemini output not schema-compliant | JSON schema mode + Zod parse + single repair retry; typed `UPSTREAM_FAILED` fallback |
| Prisma / Auth.js / Next 16 API drift | Follow installed versions' docs; annotate deviations with `NOTE(plan-deviation)` |

# Appendix C — Suggested Commit/PR Sequence

1. `chore: scaffolding (env, docker, scripts, lint rules)`
2. `feat(phase-1): prisma schema, crypto, auth, signup/signin`
3. `feat(phase-2): route groups, app shell, landing page, ui primitives`
4. `feat(phase-3): projects api, citation service + streaming verify`
5. `feat(phase-3): dashboard canvas/grid, new project flow, readiness`
6. `feat(phase-4): speech layer, take/debrief apis, booth state machine`
7. `feat(phase-4): examiner questions, take history, legacy import, cleanup`
8. `feat(phase-5): settings, security, dev mode keys, key resolution`
9. `chore: hardening, docs, e2e regression`
