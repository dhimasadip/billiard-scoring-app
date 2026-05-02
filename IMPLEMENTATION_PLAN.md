# Billiard Scoring App — Implementation Plan

> **Stack:** Bun · Next.js (App Router) · TypeScript · Zustand · Tailwind CSS  
> **Device target:** Single shared tablet/mobile device  
> **Persistence:** localStorage via Zustand `persist` middleware

---

## Milestones

| # | Milestone | Definition of Done |
|---|-----------|-------------------|
| M1 | Project scaffold & data model | Repo up, all types defined, Zustand store wired |
| M2 | Core engine complete | Schedule generation + break rotation tested with `bun test` |
| M3 | Full session playable | End-to-end: setup → matches → score entry → summary |
| M4 | UI polished | Mobile-first, responsive, all edge cases handled |
| M5 | v1 shipped | Deployed, localStorage persistence verified on real device |

---

## Phase 1 — Project Setup & Data Model

> **Goal:** Scaffold the project and lock in all TypeScript types before writing any logic or UI.

### 1.1 Scaffold Next.js with Bun

```bash
bun create next-app . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir
bun add zustand
bun add -d @types/node
```

Configure `bunfig.toml`:
```toml
[install]
exact = true
```

### 1.2 File Structure

```
src/
├── app/
│   ├── page.tsx                  # Redirect → /setup
│   ├── setup/
│   │   └── page.tsx              # Player registration & schedule config
│   └── session/
│       ├── page.tsx              # Schedule view (match list)
│       ├── match/
│       │   └── page.tsx          # Active match + score input
│       ├── scoreboard/
│       │   └── page.tsx          # Live standings
│       ├── history/
│       │   └── page.tsx          # Completed match log
│       └── summary/
│           └── page.tsx          # End-of-session results
├── lib/
│   └── engine/
│       ├── types.ts              # All TypeScript interfaces
│       ├── schedule.ts           # Match/schedule generation
│       ├── breakRotation.ts      # Break queue logic
│       ├── scoring.ts            # Score calculation
│       └── engine.test.ts        # Unit tests (bun test)
├── store/
│   └── sessionStore.ts           # Zustand store + localStorage persist
└── components/
    ├── ui/                       # Reusable primitives (Button, Badge, Card…)
    ├── match/                    # Match-specific components
    └── scoreboard/               # Scoreboard components
```

### 1.3 TypeScript Types — `lib/engine/types.ts`

```ts
export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
}

export interface Team {
  players: [PlayerId, PlayerId]; // always exactly 2
}

export interface Match {
  id: string;
  index: number;          // 1-based position in schedule
  teamA: Team;
  teamB: Team;
  breakPlayerId: PlayerId;
  sittingOut: PlayerId[]; // players not in this match
  status: 'upcoming' | 'active' | 'completed';
}

export interface MatchResult {
  matchId: string;
  teamAScore: number;
  teamBScore: number;
  winningSide: 'A' | 'B';  // no ties allowed
}

export interface PlayerStats {
  playerId: PlayerId;
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalPoints: number;
  winRate: number;        // computed: wins / gamesPlayed
}

export interface BreakCycle {
  queue: PlayerId[];      // full ordered list of all players
  pointer: number;        // index of next-to-break
  cycleNumber: number;    // how many full cycles have completed
  brokenThisCycle: PlayerId[];
}

export type ScheduleDepth = 'one-pass' | 'full';

export interface Session {
  id: string;
  players: Player[];
  schedule: Match[];
  results: MatchResult[];
  breakCycle: BreakCycle;
  currentMatchIndex: number;  // 0-based index into schedule[]
  scheduleDepth: ScheduleDepth;
  status: 'setup' | 'active' | 'completed';
  createdAt: string;
}
```

### 1.4 Zustand Store — `store/sessionStore.ts`

Slices to implement:

| Action | Description |
|--------|-------------|
| `createSession(players, depth)` | Run engine, store schedule, initialize break cycle |
| `startMatch(index)` | Set match status to `active` |
| `submitResult(matchId, scoreA, scoreB)` | Validate no tie, compute winner, update stats, advance index |
| `editLastResult(scoreA, scoreB)` | Recompute last match only |
| `resetSession()` | Clear all state, return to setup |

Use `persist` middleware targeting `localStorage` key `"billiard-session"`.

---

## Phase 2 — Core Engine (Pure Logic, No UI)

> **Goal:** All game logic as pure functions. Test thoroughly before Phase 3.

### 2.1 Schedule Generator — `lib/engine/schedule.ts`

**Algorithm:**

1. Generate all unique 4-player subsets from n players: `C(n, 4)`
2. For each subset `[p1, p2, p3, p4]`, generate all 3 unique 2v2 splits:
   - `[p1,p2] vs [p3,p4]`
   - `[p1,p3] vs [p2,p4]`
   - `[p1,p4] vs [p2,p3]`
3. In `one-pass` mode: take 1 split per subset (first split only)
4. In `full` mode: take all 3 splits per subset
5. For sessions with n > 4: populate `sittingOut` with players not in that match

**Match counts by player count:**

| Players | Subsets `C(n,4)` | One-pass matches | Full matches |
|---------|-----------------|-----------------|--------------|
| 4 | 1 | 1 | 3 |
| 5 | 5 | 5 | 15 |
| 6 | 15 | 15 | 45 |
| 7 | 35 | 35 | 105 |

### 2.2 Break Rotation Engine — `lib/engine/breakRotation.ts`

**Rules:**
- A global `BreakQueue` is initialized once with all players in registration order
- For each match: find the player who is **earliest** in the queue **and** is one of the 4 active players
- That player breaks. Mark them as `brokenThisCycle`
- Players sitting out **retain their queue position** — they will break when they next appear
- When all players have broken once → reset `brokenThisCycle`, increment `cycleNumber`

```ts
// Signature
export function assignBreakPlayer(
  match: Omit<Match, 'breakPlayerId'>,
  cycle: BreakCycle
): { breakPlayerId: PlayerId; updatedCycle: BreakCycle }
```

### 2.3 Scoring Calculator — `lib/engine/scoring.ts`

```ts
export function validateResult(scoreA: number, scoreB: number): boolean
// Returns false if scores are equal (no ties)

export function computeResult(
  match: Match,
  scoreA: number,
  scoreB: number
): { result: MatchResult; statDeltas: StatDelta[] }

export type StatDelta = {
  playerId: PlayerId;
  pointsDelta: number;  // team's score
  winDelta: 0 | 1;
}
```

### 2.4 Unit Tests — `lib/engine/engine.test.ts`

Test cases to cover:

- [ ] 4-player full round-robin produces exactly 3 matches
- [ ] 5-player one-pass produces exactly 5 matches
- [ ] Every player appears in correct number of matches
- [ ] Break player is always one of the 4 active players
- [ ] No player breaks twice before all others have broken once
- [ ] Break cycle resets correctly after full rotation
- [ ] Players who sit out hold queue position
- [ ] Tie scores are rejected (`validateResult`)
- [ ] Winner is always higher score
- [ ] Stats accumulate correctly across multiple matches

Run with:
```bash
bun test
```

---

## Phase 3 — Core UI (Functional, Not Polished)

> **Goal:** All screens wired to store. A full session is completable end-to-end.

### 3.1 Setup Screen — `/setup`

- Dynamic player name inputs (add/remove rows)
- Enforce minimum 4 players
- Schedule depth selector: `One-pass` / `Full round-robin`
- "Generate Schedule" → calls `createSession()` → navigate to `/session`
- Guard: redirect to `/session` if a session is already active (resume prompt)

### 3.2 Schedule View — `/session`

- Scrollable ordered list of all matches
- Each row shows: match #, Team A vs Team B, break player badge, sit-out names, status chip
- Current (active) match is highlighted with a CTA button
- Completed matches show final score and winner
- Bottom navigation: Schedule · Scoreboard · History

### 3.3 Active Match Screen — `/session/match`

- Large team display: player names grouped by team
- Break player prominently badged
- Two number inputs (one per team score)
- Confirm button: disabled + error message if scores are equal
- On confirm: `submitResult()` → return to schedule view

### 3.4 Scoreboard Screen — `/session/scoreboard`

Ranked table columns:

| # | Player | GP | W | L | Pts | Win% |
|---|--------|----|---|---|-----|------|

- Sort: Wins DESC, then Points DESC
- Live update after every match result
- Break cycle progress indicator (who has/hasn't broken this cycle)

### 3.5 Match History Screen — `/session/history`

- Reverse-chronological list of completed matches
- Each entry: match #, teams, score, winner tag, break player

### 3.6 Session Summary Screen — `/session/summary`

- Auto-shown when last match is completed
- Final standings (top 3 podium + full table)
- MVP: most wins (points as tiebreaker)
- "New Session" → `resetSession()` → navigate to `/setup`
- "Export CSV" button (Phase 5)

---

## Phase 4 — Polish & Edge Cases

### 4.1 Break Cycle Visual Component

- Circular avatar row or linear chip list
- Green = broken this cycle, gray = pending, highlighted ring = next in queue
- Shown on: active match screen, scoreboard tab

### 4.2 Mobile-First Layout Pass

- Test on 375px (mobile) and 768–1024px (tablet landscape)
- Large touch targets (min 44px) on score inputs and confirm button
- Bottom navigation bar with icons for shared-device ergonomics
- Prevent zoom on number input focus (add `font-size: 16px` to inputs)

### 4.3 localStorage Persistence & Recovery

- Verify Zustand `persist` saves on every state mutation
- On app load: if session exists in localStorage, show resume prompt
- Resume → navigate to current match in schedule
- New session → confirm discard → clear store

### 4.4 Edge Cases to Handle

| Scenario | Handling |
|----------|---------|
| Exactly 4 players | No sit-outs, all 4 play every match |
| 5 players (odd) | 1 sits out per match, tracked in `sittingOut` |
| All sit-outs equal | Schedule generator distributes sit-outs evenly |
| Break queue exhausted | Auto-reset cycle, start new cycle |
| Navigate back mid-match | Guard: prompt to abandon or return |
| Refresh during active match | Restore from localStorage, resume |

### 4.5 Score Correction (Edit Last Result)

- "Edit" button on the most recently completed match only
- Re-opens score input pre-filled with current values
- On save: recompute `StatDelta` diff, update accumulated stats
- No editing of older matches (keeps complexity manageable)

---

## Phase 5 — Deployment & Handoff

### 5.1 Deploy to Vercel

```bash
# vercel.json
{
  "buildCommand": "bun run build",
  "installCommand": "bun install"
}
```

Connect GitHub repo → Vercel. Set framework preset to Next.js. Verify Bun is used as package manager in project settings.

### 5.2 PWA Setup (Recommended)

Install `next-pwa` or use Next.js built-in service worker support. Add `manifest.json`:

```json
{
  "name": "Billiard Scorer",
  "short_name": "BilliardQ",
  "display": "standalone",
  "start_url": "/",
  "background_color": "#0f1117",
  "theme_color": "#1a6b3c"
}
```

Add to home screen on the shared tablet → full-screen, no browser chrome.

### 5.3 CSV Export

```ts
// Client-side, no server needed
function exportCSV(session: Session) {
  const rows = session.results.map(r => { /* ... */ });
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `billiard-session-${session.id}.csv`;
  a.click();
}
```

---

## Build Order Rule

> **Always follow:** Types → Store actions → Engine logic → Unit tests → UI

Never build a UI screen before its underlying store action and engine function exist and are tested. The schedule generator and break rotation engine are the highest-risk components — invest in tests first.

---

## Dependencies Summary

```bash
# Production
bun add zustand                    # State management + persistence

# Dev
bun add -d typescript              # Already included with Next.js
bun add -d @types/node
bun add -d eslint prettier         # Code quality

# Optional (Phase 5)
bun add next-pwa                   # PWA support
```

No external UI component library needed — Tailwind CSS covers all styling.
