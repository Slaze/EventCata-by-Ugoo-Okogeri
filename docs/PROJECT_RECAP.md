# EventCata — project recap

**Project purpose:** Personal, offline flyer catalogue on this phone. Save a poster or a three-field event (name / when / where), RSVP for yourself, share as text. Not a Luma clone and not public discovery. Production (2026-09-02): https://event-cata-by-ugoo-okogeri.vercel.app/

**Architecture / layout map:** `index.html` (first-paint splash + shell) · `index.original.html` (source of truth for UI + logic) · `node tools/extract-shell.js` writes `screens/body-content.html`, `src/styles.css`, `src/catalog.js`, and generated `src/app.js` (do not hand-edit `app.js`) · `src/app.js` loads the fragment then `/src/catalog.js` and routes `/detail?id=` and `/create` · `sw.js` v11 · `vercel.json` rewrites `/`, `/detail`, `/create`, `/e/:id` · `tools/dev-server.py` is the local SPA server (Python `http.server` 404s on `/detail` and `/create`) · `tools/browser-check.mjs` is the Chrome CDP click-through. Firebase chat and `platform-web/` stay off the happy path.

**Inception → now:** Vanilla IndexedDB PWA on Vercel → 2026-09-02 Luma critique (black first paint, ops dashboard) → MUST-FIX catalogue-first pass in `index.original.html` → same-day parallel `catalog.js` rewrite (demo events, `/e/{id}`) briefly hijacked the live path → 2026-09-02 browser loop rewired extract to original, verified create/RSVP/share/`/detail?id=` on `http://127.0.0.1:8877/` → 2026-09-02 production CLI deploy of the working tree (`dpl_6Y7PXmHEz2jSCyfh7XKWb4jJUyAH`).

## Sessions

### 2026-09-02 — Production deploy (Vercel CLI, uncommitted tree)

**Session goal:** User said deploy. Ship the locally verified catalogue to the existing Vercel site. No git commit, no force-push, no Netlify.

**What changed**
- Linked this checkout to existing project `iconiaprojects/event-cata-by-ugoo-okogeri` (`vercel link --yes --project event-cata-by-ugoo-okogeri --scope iconiaprojects`). Created `.vercel/` + a one-line `.gitignore` (`.vercel`). Did not invent a new project (`event-cata-by-ugoo-okogeri-e22q` left untouched).
- `vercel --prod --yes` from `/Users/ugoookogeri/code/EventCata` (working directory, including uncommitted files). Ready ~2026-09-02 10:46 UTC.
- Production alias: https://event-cata-by-ugoo-okogeri.vercel.app/
- Deployment id: `dpl_6Y7PXmHEz2jSCyfh7XKWb4jJUyAH`
- Unique URL: https://event-cata-by-ugoo-okogeri-dihi5wfwc-iconiaprojects.vercel.app
- Inspect: https://vercel.com/iconiaprojects/event-cata-by-ugoo-okogeri/6Y7PXmHEz2jSCyfh7XKWb4jJUyAH
- No git commit. Working tree still dirty.

**Why:** Production was still the old Discover/session chrome. Local 7-check on `127.0.0.1:8877` had already passed. CLI deploy of the working tree is the path that does not require a commit.

**How verified**
- `curl` home: HTTP 200, `<title>EventCata</title>`, splash `#app-root` / `.app-splash`, no “Discover Trending” / “Current Session” / “by Ugoo Okogeri” in first-paint HTML.
- `curl /create` and `/detail`: HTTP 200, same `index.html` (rewrites).
- `curl /sw.js`: `SW_VERSION = 'v11'`, header `Cache-Control: no-cache, no-store, must-revalidate`, `x-vercel-cache: MISS`.
- Rendered screenshots (Context, 390×900, wait 4s): home = EventCata, 0 events, “Nothing on this phone yet”, Add flyer / New event, Online pill, FAB — not old chrome. `/create` = New Event form (flyer, name/when/where, Save).
- IDE browser MCP had no usable tab. Local `tools/browser-check.mjs` against prod failed: Chrome CDP port 9334 never opened.

**Current state:** Live site is the personal catalogue empty CTA. Hidden ops blocks (`Current Session`, `Discover Trending`) still exist in `screens/body-content.html` but are `hidden` + `.ops-hidden` (`display: none !important`). Git still uncommitted.

**Next steps:** Optional human commit of the working tree. Returning visitors with an old service worker should hard-refresh / unregister SW until v11 takes over. Do not revive demo-seed `/e/{id}` as canonical.

**Blockers / risks:** Old SW on devices that cached pre-v11. Uncommitted tree can drift from what is live if someone edits without redeploying. `.gitignore` is new (vercel link); `.vercel/` must stay uncommitted.

### 2026-09-02 — Browser quality loop (Reason → Act → Review)

**Session goal:** Finish the quality loop the previous agent skipped: seven real click-throughs on the local app, then write this recap. No deploy, no git push.

**What changed**
- `tools/extract-shell.js`: always extracts JS from `index.original.html` into `src/catalog.js` and regenerates `src/app.js` with `/detail?id=` + `/create` routing (the skip-JS default had left a parallel `catalog.js` as the live app).
- `index.original.html`: `promptCalendarSyncForEvent` no longer `confirm()`-blocks save; `shareEvent()` races native share at 2s then clipboard, then toasts the text.
- `index.html` / `sw.js`: cache bump `v11`.
- `tools/dev-server.py`: local SPA rewrites matching Vercel (`/detail`, `/create`, `/e/:id`).
- `tools/browser-check.mjs`: Chrome CDP click-through (IDE browser MCP had no tab).
- Regenerated shell: `node tools/extract-shell.js`.

**Why:** Live JS was still demo-seeding `catalog.js` (Polo Night Market, `/e/{id}`, GPS session meta) while HTML came from original. Python `http.server` 404’d full reloads of `/detail?id=` and `/create`. Save hung on a calendar `confirm()`. Native `navigator.share` hangs in this Chrome, so clipboard/toast must finish the share path. Rejected: deploying, chasing Luma discovery, hand-editing `app.js`.

**How verified:** Server `http://127.0.0.1:8877/` serving this tree (`tools/dev-server.py`). Chrome/CDP (not cursor-ide-browser — that API had no tab). Clicked New event, filled name/date/location, saved, Going, Share, reloaded `/detail?id=ev_…`, opened `/create` and Cancel back to list, 1280 and 390 viewports. Shots under `/tmp/eventcata-verify-shots/`. Empty-home CTA was confirmed on a fresh profile before IndexedDB had events.

**Current state:** Local app is the personal catalogue. Create lands on `/detail?id=`. RSVP Going persists across reload. Share: Web Share timed out here; toast showed the event text (clipboard also blocked in this Chrome). Title EventCata. No Discover Trending / session GPS on home. Inactive screens are `inert` + `aria-hidden`. Production Vercel is still the old build. Critic score still ~19 vs Luma ~86 on public discovery — EventCata is not better at that job.

**Next steps:** Only deploy if a human asks. Unregister SW / hard-refresh after any future deploy. Optional: grant clipboard in real Safari/Chrome so share copies without toasting. Do not revive demo-seed `catalog.js` or `/e/{id}` as the canonical route.

**Blockers / risks:** cursor-ide-browser MCP still has no usable tab in this agent. Headless date `<input type="date">` can hang; tests temporarily set `type=text`. Parallel agents must not skip extract (that’s how `/e/` + demo events snuck back). Production unchanged.

### 2026-09-02 — Parallel `/e/{id}` + demo-feed attempt (superseded)

**Session goal:** Browser-verify vs Luma using `catalog.js` as source of truth and `/e/{id}` share URLs.

**What changed:** A parallel pass treated `src/catalog.js` as source of truth, seeded demo posters, and routed detail to `/e/{id}`. Recap claimed Cursor browser on port 8788.

**Why:** Invitation-URL UX like Luma. Conflicts with the MUST-FIX thesis (personal offline catalogue, `/detail?id=`).

**How verified:** That pass is not the current tree. Extract from `index.original.html` replaced it.

**Current state:** Superseded by the browser quality loop above.

**Next steps:** Do not restore demo seed or `/e/{id}` as canonical without a human decision.

**Blockers / risks:** Two agents wrote this repo the same day (`8788` vs `8877`). Extract skip-JS was the footgun.

### 2026-09-02 — Audit vs Luma + MUST-FIX implementation

**Session goal:** Find EventCata, audit against Luma, fix until a critic prefers it as a personal flyer catalogue.

**What changed**
- `index.html`: inline splash so first paint is not a black void; pinch-zoom allowed; title `EventCata`.
- `index.original.html`: home is catalogue-first (events list + honest empty: Add flyer / New event). Session GPS, discover-as-trending, mini dashboard, map, success chart hidden. Create: flyer capture then name/when/where; rest in `<details>`. Detail: when/where, Going/Maybe RSVP, Share/WhatsApp/Map/Calendar; tickets+chat behind Host tools. `shareEvent()` uses Web Share + clipboard. `openDetail` uses `/detail?id=`. `dbDel` → `dbDelete`. Firebase not initialized on boot.
- `tools/extract-shell.js`: `/detail?id=` and `/create` routing.
- `sw.js` cache `v8` then later `v11`.

**Why:** Luma wins public discovery. EventCata can win “flyer on this phone, offline.” Critic MUST-FIX list, not a React rewrite.

**How verified (this session):** Syntax and string checks only. Click-through was not done here.

**Current state at the time:** Implementation claimed; browser pass left to the next session.

**Next steps:** Done in the quality-loop session.

**Blockers / risks:** Production unchanged.

### 2026-09-02 — Luma product critique (no code)

**Session goal:** Rank EventCata vs Luma; MUST-FIX / DO-NOT-DO; winnable thesis; sequential edit plan.

**What changed:** Critique only. Created this recap (was missing).

**Why:** Live site hydrates to a dense empty dashboard. First paint of `index.html` is black `#app-root`. Luma wins public discovery/network; EventCata cannot copy that this session.

**How verified:** Context scrape of production · Luma home / create / discover / event page · source audit.

**Current state (at critique):** Private catalogue pretending to be social discovery. Share stub. `/detail` had no event id. `dbDel` undefined. Critic ~19 vs Luma ~86.

**Next steps:** Implemented then browser-verified above.

**Blockers / risks:** Do not rewrite in React. Do not chase Luma network effects.
