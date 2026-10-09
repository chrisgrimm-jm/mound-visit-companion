# Mound Visit — Companion Module

A [Bitfocus Companion](https://bitfocus.io/companion) module for the teleprompter half of
[Mound Visit](https://github.com/chrisgrimm-jm/mound-visit). Trigger a read from a
physical button, and see which one is live reflected back onto your board.

It talks directly to the same Firebase Realtime Database Mound Visit already uses (open,
unauthenticated — same access model the app itself relies on). No server of its own to run.

## What it does
- **Action: Trigger read (pick from library)** — dropdown of read names, live-updated as the
  Script Library changes in Mound Visit.
- **Action: Trigger read (type exact name)** — a text-entry fallback, matched case-insensitively.
- **Action: Show/hide an overlay element** — teleprompter, producer note, timer, clock, or the whole talent display (hiding it shows the test pattern).
- **Action: Toggle an overlay element** — same five elements, flips whatever it's currently set to
  instead of setting an explicit state.
- **Action: Timer start/pause/reset**.
- **Feedback: Read is LIVE** — make a button turn a color while its read is the one on the prompter.
- **Feedback: Overlay element is shown** — make a button turn a color while the selected element
  (teleprompter/producer note/timer/clock/talent display) is actually visible on the monitor, regardless of which
  button (or Mound Visit's own UI) last changed it.
- **Variables:** `live_read_name`, `read_count`.
- **Presets** — ready-made buttons for every read currently in the library (colored while live),
  every show/hide/toggle action (colored to match current visibility), and all three timer
  transport actions. Drag them onto a button and
  they work as-is; the read presets update automatically as the Script Library changes.

Show/hide and timer actions need Mound Visit's Control page open in a browser tab — it's
the one listening on Firebase and applying the change, the same as it does for triggering a read.

## Install as a developer module (not published to the module store)
1. Clone this repo — `node_modules` is committed, so there's nothing else to install.
2. In Companion's launcher window, click the **cog** (top right) → **Advanced Settings**.
3. Under **Developer**, set the **Developer modules path** to the *parent* folder of this repo —
   not this folder itself. e.g. if this repo lives at `~/Claude/mound-visit-companion`, set
   the path to `~/Claude`, not `~/Claude/mound-visit-companion`.
4. Enable **Enable Developer Modules**, then reopen the Companion GUI.
5. Add a new connection — it should now show up under **Jomboy Media → Mound Visit** (its internal id stays `jomboy-confidence-monitor` so connections made before the rename keep working) (as a **dev** module if a
   store version of the same id ever exists too).
6. In the connection's config, set **Topic** to match the Topic field on the Teleprompter card in
   Mound Visit's Control page (`adread` by default — they have to match exactly).

Companion auto-restarts the connection whenever you save a file in this folder, so you can edit
and test live.

## Sanity-checking without Companion running
`node test-harness.js` exercises the action/feedback/variable logic against the real Firebase
project (read-only by default — it reads the live library and current content, and prints what
the module would show/do). It does **not** fire a live trigger unless you explicitly set
`RUN_LIVE_TRIGGER=1`, since that would actually change what's on the real prompter.

## Why Firebase directly, not a Companion → app HTTP round trip
Mound Visit's own Control page already listens on this same Firebase path for triggers
(originally built for Companion's generic HTTP action to PATCH). This module does the identical
write, just from a proper Companion connection instead of a raw HTTP action per button — which is
what makes the dropdown-of-live-read-names and the LIVE feedback possible, since the module can
also *read* the same data Mound Visit reads.

---
Jomboy Media
