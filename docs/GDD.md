# EventCata — Game / Product Design Document

| Field | Value |
|-------|-------|
| Product | **EventCata** |
| Document version | 0.1 |
| Last updated | 2026-10-06 |
| Owner | Iconia Global / Ugoo |
| Status | Living (wave 2 draft) |
| Live URL | https://event-cata-by-ugoo-okogeri.vercel.app/ |
| Stem | **Not seeded yet** (PWA ready — pending catalog add) |
| Related | Stem (future door) · personal phone utility (not a city-wide Luma) |

### Cover blurb

EventCata is a **personal event flyer catalogue for your phone**. Snap or attach a poster, or type a simple name / when / where, mark yourself Going, and share the event as text. It works offline on the device. It is not a public discovery network and not a clone of big social event apps — it is *your* pocket archive of things you care about attending.

---

## 1. Identity

### In one sentence
A private, installable catalogue of events and flyers that live on your phone first.

### Plain English
**Genre:** Personal productivity · lifestyle · offline-first PWA.  
**Platforms:** Web app on Vercel; installable home-screen app; Stem-ready when listed.  
**Feel:** Calm catalogue, poster-forward, empty state that invites “Add flyer / New event,” not an ops dashboard.  
**Not:** Luma/Eventbrite social graph. Not “Discover Trending.” Not a check-in surveillance network.

### What people feel / do
Control and calm. “My events are here even if group chat buried the flyer.”

### Examples
Chioma photographs a wedding invite poster, saves it, taps Going, later shares the text when a cousin asks for the address.

### Copy snippets
- “Nothing on this phone yet — add a flyer.”  
- “Your catalogue. Not the internet’s party feed.”

### Open questions
- **(OPEN)** Custom domain under iconiaglobal.com (e.g. events.*) vs Vercel URL as canonical.

---

## 2. Promise / fantasy

### In one sentence
Never lose a flyer in chat scroll again — keep a living personal shelf of “what I’m going to.”

### Plain English
Fantasy:

> “This phone holds my nights out and duties ahead — posters and dates I chose — without performing them for strangers.”

Contrast with social event apps: those sell discovery and FOMO. EventCata sells **memory + intention**.

### What people feel / do
Relief at empty-but-clear home; pride when the catalogue fills with *their* events.

### In scope / out of scope
**In:** Personal save, RSVP-for-self, share-as-text, offline.  
**Out:** Public trending feeds, ticket checkout, host analytics dashboards (hidden/ops leftovers must stay hidden).

---

## 3. Core workflow

### In one sentence
Open catalogue → add flyer or new event → open detail → Going → share → return later offline.

### Plain English
1. Land on catalogue (splash then list / empty CTA).  
2. **Add flyer** (media) or **New event** (name / when / where).  
3. Save → land on detail.  
4. Mark **Going** (persists on device).  
5. **Share** (system share or copy text).  
6. Reopen list anytime; works without network for stored items.

**Session:** 1–3 minutes to capture; seconds to check “what’s next.”

### Copy snippets
- “Add flyer / New event.”  
- “Going means you — not a crowd count.”

---

## 4. Roles & surfaces

### In one sentence
One role: the phone’s owner as personal curator.

| Surface | Job |
|---------|-----|
| Home catalogue | List + empty CTA |
| Create | Flyer + fields |
| Detail | One event truth |
| Share sheet / toast | Tell a human |
| Online pill | Honesty about connectivity (data still personal-first) |

No separate “attendee social profile.” Host/organizer CRM is out of identity.

---

## 5. Systems

### In one sentence
Events live in on-device storage; routes are simple; install/offline via service worker; sharing must finish even when fancy share APIs stall.

### Plain English (non-tech wording)
- **On-phone memory** — events stay with the device catalogue.  
- **Simple links** — open a specific event detail without needing a social network account.  
- **Installable app** — home screen icon, app-like shell.  
- **Share resilience** — if the phone’s share menu hangs, still get the event text via copy/toast.  
- **No demo seed as truth** — empty catalogue is honest; fake “Polo Night” demos are not the product.

### Open questions
- **(OPEN)** Optional account sync later — only if it never forces cloud for core save.

---

## 6. World / content model

### In one sentence
The world is *your* set of events — each a poster and/or three fields — not a city map of strangers’ parties.

Atoms: event, flyer image, name, when, where, Going flag, share text. Culture comes from what the user imports (church programmes, club nights, campus posters).

---

## 7. Experience map

### In one sentence
First open shows empty honesty; first save proves the catalogue; first share proves usefulness to another human.

**Stages:** Install → empty CTA → create → Going → share → reopen offline.  
**Screenshot checklist:** empty home · create form · detail with Going · share toast · home with one poster card.

---

## 8. Monetization & constraints

### In one sentence
Free personal tool first; never sell users’ private catalogues as a public firehose.

### Plain English
Free PWA. Future **(OPEN):** optional pro sync, PDF poster packs — still personal-first.  
**Constraints:** Privacy default; no dark-pattern “make this public”; Stem listing must describe personal catalogue accurately (not “discover all events near you”).

---

## 9. Success metrics

| Metric | Why |
|--------|-----|
| Empty → first event saved | Hook |
| Going persistence after reload | Trust |
| Share completed (any path) | Usefulness |
| Weekly reopen | Habit |
| Stem install (once listed) | Distribution |

---

## 10. Out of scope & open questions

**Out:** Public discovery home. Ticket scanning empire. GPS “current session” as the hero.  
**OPEN:** Stem seed; icon filename case consistency (`icon-512.png` vs `.PNG`); custom domain; light sync.

---

## Appendix A — Glossary

| Term | Meaning |
|------|---------|
| **Catalogue** | Your personal list of events |
| **Flyer** | Poster/image attached to an event |
| **Going** | Your personal RSVP |
| **Offline-first** | Core use works without network once saved |
| **PWA** | Installable web app |

## Appendix B — Excerpt bank

**Elevator:** EventCata keeps your event flyers and dates on your phone. Add a poster or a quick name/when/where, mark Going, share as text — private catalogue, not a social discovery feed.  
**Store short:** Personal event flyer catalogue.  
**Store long:** EventCata is a personal, installable catalogue for events you care about. Save a flyer photo or a simple name, date, and place. Mark yourself Going. Share the details as text. Built to work on your phone without turning your plans into a public trending feed.  
**Tweet:** Stop losing flyers in chat. Put them in EventCata.  
**FAQ — is it like Luma?** No. Luma-style apps sell discovery. EventCata sells your private shelf.  
**FAQ — do others see my events?** Not as a public social feed — this is your phone’s catalogue.

## Appendix T — Builders (short)

Vercel production · `sw.js` versioned · extract from `index.original.html` · Stem seed pending · see `PROJECT_RECAP.md`.
