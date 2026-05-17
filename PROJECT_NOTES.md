# PROJECT NOTES

## Source Of Truth

Read this file first when starting future Codex work on this app. If chat context gets compacted, this is the handoff map.

Keep changes modular and targeted. Do not put everything in `App.jsx`. Use components, data files, and utility files so the app can keep growing without turning into one giant cursed scroll.

## App

**Name:** The Timeline of What The Fuck

**Purpose:** A funny fake gaming lore timeline for me and my friend. We play/watch games together and invent ridiculous fake stories that connect games into one cursed shared universe. The site should feel like a serious official archive for deeply unserious lore.

## Tone

- Dark
- Funny
- Chaotic
- Sarcastic
- Cursed
- Fake corporate/government bureaucracy
- Satire of annoying modern websites
- Useful enough to actually track lore
- Not bland, not corporate, not generic random humor

Recurring vibe: mock modern internet annoyance through fake lore bureaucracy, ID checks, consent bars, ToS sludge, fake ads, fake security, subscriptions, CAPTCHA garbage, compliance theater, and apps acting like they own your spine.

## Architecture Rules

- Keep components modular.
- Keep repeatable/random joke copy in `src/data/`.
- Keep persistence and non-UI helpers in `src/utils/`.
- For every new silly popup/feature, prefer multiple randomized variants instead of one repeated joke.
- Keep all dark-mode text readable: inputs, selects, modals, translucent bars, cards, buttons, and placeholders.
- Everything is local only. No analytics, no server, no real tracking.

## 2026-05-17 Architecture / Source / Polish Pass

New files/components/services added:

- `src/utils/colorUtils.js`
- `src/utils/mockAuth.js`
- `src/services/timelineSources/timelineSourceManager.js`
- `src/services/timelineSources/localTimelineSource.js`
- `src/services/timelineSources/mockSyncedTimelineSource.js`
- `src/services/timelineSources/exampleTimelineSource.js`
- `src/components/TimelineSourceSelector.jsx`
- `src/components/AccountWindow.jsx`

Admin Reset is now **Wipe** in user-facing UI. Wipe only removes app-specific `twtaf:*` keys and known legacy `twotf.*` keys; never clear unrelated browser storage.

Disasters now support optional `accentColor`. Valid `#RGB`/`#RRGGBB` colors are normalized to `#RRGGBB`; invalid colors are dropped and the UI falls back to controlled theme/tag/game colors. Accent colors affect timeline cards, dots, top stripes, borders/glows, detail accents, Node Web node colors, and node collision particles. Node collision particles now use the dragged node color, target node color, and a mixed color from `mixHexColors()`.

Timeline source architecture now exists as local/static/mock only:

- `twtaf:selectedTimelineSource` stores `local`, `synced_mock`, or `example`.
- `TimelineSourceSelector` opens from the timeline heading and lists Local Timelines, Shared Timelines, and Example.
- `localTimelineSource` manages local timelines and old single-timeline migration.
- `mockSyncedTimelineSource` simulates the future shared/real timeline using localStorage only.
- `exampleTimelineSource` documents Example as its own source category.
- No real network calls, Supabase, Firebase, Cloudflare, or backend sync exist yet.

Multiple local timelines:

- `twtaf:timelineIndex` stores local timeline metadata.
- `twtaf:activeTimelineId` stores the active local timeline.
- Per-timeline data keys are `twtaf:timeline:<timelineId>:events`, `:tags`, and `:plannedGames`.
- Users can create, rename, duplicate, delete, and switch local timelines from the selector.
- Deleting the final local timeline is blocked.
- If old `twtaf:events`, `twtaf:tags`, or `twtaf:plannedGames` exist and no timeline index exists, migration creates one default Local Timeline, copies old data into per-timeline keys, sets active timeline, and marks `twtaf:migratedSingleTimeline = true`.
- Old single-timeline keys are left in place as backup.

App-wide data: achievements, known secrets, Admin mode, ToS flags, selected source, mock auth session, and general UI/source settings. Per-timeline data: disasters/events, tags, planned games, and future timeline media/settings metadata.

Mock synced timeline:

- Uses `twtaf:mockSyncedTimeline:events`, `:tags`, `:plannedGames`, `:updatedAt`, and `:revision`.
- Represents the future Shared/Real Timeline.
- Uses `SYNC_POLL_INTERVAL_MS = 7000`.
- Polling starts only while viewing `synced_mock`, stops on source switch/unmount, checks revision/updatedAt, diffs IDs, and marks added/removed/updated entries for animations.
- Admin Panel has `Simulate Remote Update`, which writes a fake event/revision locally for polling tests.
- Synced timeline is view-only unless mock auth session has `canEditRealTimeline`.
- Local timelines remain editable without login.
- Example remains session-editable for testing.

Mock account/login:

- `AccountWindow` is frontend-only/static/mock.
- Session key is `twtaf:mockAuthSession`.
- Mock session shape: `{ username, role, canEditRealTimeline }`.
- Fake Make Account uses joke-button reactions and does not create a real account.
- No real credentials are stored or sent anywhere.
- This is not security. Real auth must later be backend-enforced with backend-only password hashes/sessions/permissions.

Future shared friend timelines are planned but not implemented. The selector architecture should later support Shared Timelines separate from Real Timeline, such as friend/joined timelines with backend `users`, `timelines`, `timeline_members`, and `events` tables.

Example Timeline:

- Example data now has varied controlled `accentColor` values.
- Example Mode is the official feature test sandbox: same-year reorder clusters, custom colors, direct connections, generated/manual media, broken media, captions, tags, games, connection notes, scrolling, create/delete animations, Node Web, export/import, and media previews should be tested there first.
- Example Timeline can be exported intentionally after warning.
- Example exports use `timelineType: "example"` and `isExampleExport: true`, and include current session-only edits.
- Import preview identifies Example exports and defaults to importing as a new local timeline.

Export/import:

- Export active timeline by default and include timeline metadata.
- `.uhoh` payload includes `timelineType`, `timeline`, `mediaIncluded: false`, and normalized `accentColor`.
- Import options: Import as New Local Timeline, Merge Into Current Timeline, Replace Current Timeline, Cancel.
- Import as new local timeline is the safest/default path.
- Photos/videos are still not included; imported media metadata is marked missing so placeholders render honestly.

Touch/mobile:

- Tap targets are larger on coarse pointers.
- Timeline hover-only actions have touch-visible alternatives.
- Floating windows clamp/fill better on small screens with safe-area-aware sizing.
- Media lightbox supports swipe left/right.
- Node Web nodes are touch-draggable and use `touch-none` on node handles without disabling page scroll globally.
- Achievement toasts already support horizontal drag/swipe dismissal.

Hidden touch access:

- Typed triggers remain: `ID`, `nrop`, `Ads`, `ach`, `tos`, `cap`, `ADMIN`, `lore`.
- Long-press the title badge `Officially unofficial canon. Legally stupid.` for about 4.5 seconds to enable Admin on touch.
- In Admin mode, long-press/triple-tap the same badge to open Website Lore Ledger.
- Website Lore Ledger acts as the touch hidden-feature control center: achievements, ID popup, ToS, CAPTCHA, fake ad, orb, and Node Web.
- Idle orb supports pointer/touch hold panic trigger.

Timeline animations:

- Timeline cards use Framer Motion layout/AnimatePresence with stable disaster IDs.
- Local create/delete, synced incoming/delete/update, import create, and Example create/delete get distinct badges/copy.
- Reduced motion falls back to simpler fade/settle behavior.

## Current Key Files

```text
src/
  App.jsx
  data/
    achievements.js
    ageGateMessages.js
    brokenMediaMessages.js
    buttonReactions.js
    captchaVariants.js
    defaultPlannedGames.js
    defaultTags.js
    exampleMediaConfig.js
    exampleTimeline.js
    fakeAds.js
    footerMessages.js
    generatedExampleMedia.js
    nodeCollisionReactions.js
    secretRegistry.js
    tagStyles.js
    timelineWarnings.js
    tosLongSections.js
    tosMessages.js
    typedSecrets.js
    websiteLore.js
  components/
    AchievementsWindow.jsx
    AchievementToast.jsx
    AdminModeOverlay.jsx
    AdminPanel.jsx
    AgeGateModal.jsx
    BackgroundLights.jsx
    BrokenMediaPlaceholder.jsx
    ChaosOrb.jsx
    DeleteConfirmWindow.jsx
    DisasterDetailWindow.jsx
    DisasterForm.jsx
    ExampleModeBanner.jsx
    FakeAdWindow.jsx
    FakeCaptchaModal.jsx
    FloatingWindow.jsx
    GamesPanel.jsx
    Header.jsx
    ImportPreviewWindow.jsx
    JokeButton.jsx
    LongTosWindow.jsx
    MediaLightbox.jsx
    NodeBobbleBurst.jsx
    NodeWebModal.jsx
    ReactionOverlayHost.jsx
    ReactionOverlay.jsx
    SearchBar.jsx
    TermsBar.jsx
    Timeline.jsx
    TimelineCard.jsx
    TimelineToast.jsx
    WebsiteLoreLedger.jsx
  utils/
    achievements.js
    graphUtils.js
    helpers.js
    keyboardTriggers.js
    mediaUtils.js
    orbUtils.js
    exportImport.js
    storage.js
scripts/
  generateExampleMediaManifest.js
```

## Disaster Shape

Timeline entries are called **disasters**. A disaster is fake lore/story/canon tied to a game and year.

```js
{
  id: "unique-id",
  year: "2077",
  sortOrder: 0,
  title: "Night City Accidentally Becomes The Main Character",
  source: "Cyberpunk 2077",
  tag: "100% Bullshit Canon",
  summary: "Everyone is depressed, chrome-plated, and one firmware update away from becoming soup.",
  connections: [
    "Old outbreak zones are now corporate black sites."
  ],
  directConnections: ["Halo", "Warhammer 40K"],
  media: []
}
```

Rules:

- Timeline starts empty by default.
- Do not include example timeline entries as real starting data.
- Use stable IDs with `crypto.randomUUID()` when available, falling back to timestamp plus random suffix.
- Editing and deleting use disaster IDs, not array indexes.
- Existing data without `media` must continue to work.

## Storage

Use namespaced `localStorage` keys only:

- `twtaf:events`
- `twtaf:tags`
- `twtaf:plannedGames`
- `twtaf:achievements`
- `twtaf:knownSecrets`
- `twtaf:flags`
- `twtaf:tosDismissed`
- `twtaf:adminMode`
- `twtaf:exampleMode`

Old `twotf.*` keys may be migrated/read for compatibility. Wipe must only clear this app's own namespaced and legacy keys, never unrelated browser storage.

Persist:

- disasters/timeline events
- tags
- planned games
- achievements
- known typed secrets
- dismissed ToS flags
- admin mode

Do not store raw photos/videos in localStorage. Future real media blobs/files should use IndexedDB. localStorage should only store metadata/IDs.

## Export / Import

Files:

- `src/utils/exportImport.js`
- `src/components/ImportPreviewWindow.jsx`

The app has a future-proof text export/import system for real user timeline data using `.uhoh` files. Export/import operates on real local data, not Admin Example Mode session data. If the user starts the flow while Example Mode is active, warn that exporting/importing fake demo nonsense is probably not what they meant.

`.uhoh` files use a readable header followed by JSON after the marker:

```text
--- UH OH TIMELINE EXPORT ---
App: The Timeline of What The Fuck
Format: .uhoh
Export Version: 1
Created: 2026-05-16T00:00:00.000Z
Warning: This file contains timeline disasters, tags, planned games, and optional metadata. Photos/videos are NOT included yet.
Do not edit below this line unless you enjoy breaking things.
--- DATA ---
```

JSON payload rules:

- `schema` is `twtaf.timeline.export`.
- `exportVersion` is versioned with `CURRENT_EXPORT_VERSION`.
- `storageVersion` is versioned with `CURRENT_STORAGE_VERSION`.
- Export includes events/disasters, tags, planned games, known secrets, and achievements.
- Photos/videos are not included yet. Export preserves lightweight media metadata but strips session-only URLs.
- Imported media metadata is marked `storage: "missing-import-media"` and `missing: true` so the UI uses missing/broken evidence placeholders instead of pretending files exist.

Import behavior:

- Accept `.uhoh`, `.json`, `text/plain`, and `application/json`.
- If `--- DATA ---` exists, parse JSON after it; otherwise try parsing the whole file.
- Show `ImportPreviewWindow` before applying anything.
- Preview shows app name, created date, export/storage versions, event/tag/future-game counts, media status, compatibility warnings, and whether unknown future fields exist.
- `Merge Import` adds imported disasters, avoids duplicate event IDs, merges tags/planned games, and preserves current data.
- `Replace Current Timeline` requires a second confirmation and replaces events/tags/planned games with imported data.
- Import is best-effort and migration-based. Missing or old fields are normalized safely, and unknown future event fields are preserved where possible.
- Invalid files show: `The archive tried to read this file and immediately regretted it.`

## Media Model

Media metadata shape:

```js
{
  id: "media-id",
  disasterId: "disaster-id",
  fileName: "image.png",
  fileType: "image/png",
  fileSize: 123456,
  width: 1920,
  height: 1080,
  createdAt: "ISO timestamp",
  caption: "",
  order: 0,
  storage: "indexeddb" | "example" | "broken",
  objectUrl: "session-only if applicable"
}
```

Current implementation supports display structure, Admin Example Mode media, and session-only staged media attachments in the form. Real durable user media persistence still needs IndexedDB. Do not store raw media in localStorage.

## Timeline

- Display disasters sorted by numeric/string year first, then `sortOrder` inside the same year.
- Search filters by year, title, game/source, summary, and tag.
- Timeline cards show year, title, game/source, tag badge, summary, direct connected games, optional connection notes, and media count when present.
- Timeline cards show compact media previews when media exists: up to 3 media items, image thumbnails when possible, compact broken-media placeholder for missing evidence, video labels for video evidence, and `+N more` count.
- Timeline cards open a `DisasterDetailWindow` when clicked.
- Clicking Edit/Delete must not open the detail window.
- Timeline card top metadata/actions use a flex layout with action width transition so game/tag/media badges slide/move cleanly when Edit/Delete appears.
- Edit/Delete buttons are horizontal with `flex-nowrap` and `whitespace-nowrap`.
- Edit/Delete appear visually on hover/focus and remain keyboard accessible.

## Disaster Form

- Save/Update closes the form after successful save.
- If CAPTCHA appears during save, the form closes only after CAPTCHA completion saves the pending disaster.
- Successful new save toast: `Disaster archived. The timeline got worse.`
- Successful update toast: `History rewritten. Very normal behavior.`
- Game dropdown placeholder/default text is `Pre-existing games...`
- Form includes an evidence/media area with `Attach Evidence`.
- Accepts images and videos: png, jpg/jpeg, webp, gif, mp4, webm.
- Staged media previews in the form with file name, size, thumbnail when possible, and remove button.
- Each staged/existing media item has an optional caption/comment field.
- Current real-user media attachment is session-only until IndexedDB storage is implemented.
- Helper text must explain local/session-only media honestly.

### Timeline Drag Mode

- The Main Timeline has a `Timeline Drag Mode` button.
- The duplicate `View Live Web` button was removed from the timeline header. Keep the primary `Open Node Web` access in the hero/title card, plus Admin/detail-window access where relevant.
- When off, timeline behaves normally and is sorted by year then `sortOrder`.
- When on, each card shows a drag handle.
- Reordering is only allowed inside the same year group.
- Reordering updates only `sortOrder` values for items in that year and persists to localStorage.
- If a drag goes too far vertically, show a randomized warning from `src/data/timelineWarnings.js`.

## Disaster Detail Window

File: `src/components/DisasterDetailWindow.jsx`

Behavior:

- Opens in shared `FloatingWindow` when a timeline card is clicked.
- Shows title, year, game/source, tag, summary, direct game connections, optional connection notes, and media gallery.
- Has Edit, Delete, and Open Node Web buttons when relevant.
- Media gallery shows file name, dimensions, size, caption, and image preview.
- Clicking media opens `MediaLightbox.jsx`, a high-z-index fullscreen-style viewer with caption, file name, dimensions, close, Escape/backdrop close, and next/previous navigation.
- Failed/missing media uses `BrokenMediaPlaceholder`.
- Detail window is scrollable and should not become absurdly tall.

## Delete Confirmation

File: `src/components/DeleteConfirmWindow.jsx`

Delete confirmation copy:

- Prompt: `Delete this disaster? The timeline will deny knowing it.`
- Confirm button: `Delete Evidence`
- Cancel button: `Abort Cover-Up`

Use this confirmation flow for timeline/detail/form deletes.

## Broken Media Placeholder

Files:

- `src/components/BrokenMediaPlaceholder.jsx`
- `src/data/brokenMediaMessages.js`

Purpose:

- If image/video media fails to load, show a dark intentional placeholder instead of broken UI.
- Uses randomized blame text.
- Includes the line: `This may not actually be your fault. The website has chosen violence.`

## Admin Example Mode

Example data lives in `src/data/exampleTimeline.js`.

Rules:

- Example mode never overwrites real user data.
- Example mode edits are session-only and temporary.
- Leaving Example Mode discards edits.
- Re-entering Example Mode reloads original `exampleTimeline.js` plus generated/manual example media.
- Page refresh resets example data to original unless future code intentionally adds session persistence.
- Example data includes 16 fuller/funnier entries across Resident Evil, Resident Evil 4, The Last of Us, Portal / Aperture Science, Half-Life, Control, Cyberpunk 2077, Doom, Fallout, Dead Space, Halo, and Warhammer 40K.
- Includes same-year clusters for 1998, 2013, 2077, 2552, and 40000 to test same-year reorder mode.
- Includes custom example tags such as `Corporate Did It`, `Friend Disputed This`, `Orb Approved`, `Cutscene Skipped`, and `Load-Bearing Bullshit`.
- Includes at least one intentionally broken media item so the placeholder can be previewed.
- The final/bottom example entry includes intentionally broken media: `example-media-broken-final`.
- Example banner visibly says demo/example timeline content was made by AI; real user lore is human-made.

Admin Example Mode banner:

- File: `src/components/ExampleModeBanner.jsx`
- Mostly text-focused, with randomized/funny Example Mode copy.
- Clearly says real timeline is safe and edits are temporary.
- Shows suggested media folder path.
- Has `Load Example Media Folder`.
- Has `Select Example Files`.
- Has `Exit Example Mode`.

## Example Media Support

Files:

- `src/data/exampleMediaConfig.js`
- `src/data/generatedExampleMedia.js`
- `src/utils/mediaUtils.js`
- `scripts/generateExampleMediaManifest.js`

Config:

```js
{
  publicFolder: "public/example_media",
  publicUrlBase: "/example_media",
  supportedExtensions: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm"]
}
```

Browser limitation:

- A normal browser app cannot silently scan arbitrary `C:\` paths at runtime.
- To make example media appear automatically, copy demo files into `public/example_media/`.
- Run `npm run generate:example-media` or rely on `predev`/`prebuild` to create `src/data/generatedExampleMedia.js`.

Behavior:

- Generated manifest scans png, jpg/jpeg, webp, gif, mp4, and webm.
- Images get dimensions when the script can read them.
- Example Mode imports `generatedExampleMedia` and distributes media across example disasters automatically.
- If no generated media exists, Example Mode still works and uses any built-in broken media placeholders.
- File System Access folder picker remains optional/manual.
- Fallback file picker accepts the same supported media types.
- Manually loaded media are session-only object URLs.
- Image dimensions are read from `naturalWidth`/`naturalHeight`.
- Loaded example media is distributed across example session disasters in order.
- Manual picker media uses `storage: "example-picker"` and can be replaced without touching real timeline data.
- Example media does not overwrite real user media.
- Example media is not stored in localStorage.

## Games Panel

Panel title: **Games In This Mess**

Tabs:

- Current
- Future

Current tab:

- Auto-lists all games used by disasters.
- Auto-updates when disasters change.
- Shows event/disaster count per game.

Future tab:

- Lets user add/remove planned games.
- Separate from actual timeline.
- Starts blank for new users: `defaultPlannedGames` is `[]`.
- Current and Future lists use fixed max-height scroll containers so the panel does not grow forever.

## Live Node Web

- Opened by `Open Node Web` / `View Live Web`.
- Uses shared `FloatingWindow`.
- Only shows games as nodes.
- Do not show disaster entries or notes as nodes.
- Only draw lines between directly connected games.
- Auto-update when disasters/direct connections change.
- Game nodes are draggable and keep their circle, label, and connected line endpoints synced.
- Node web drag stores current node positions in React state and renders line endpoints from those same positions, avoiding transform-only desync.
- Blue-to-red node/link styling is preferred.
- Dragging one node into another detects collisions using current state-based node coordinates.
- Valid node collisions are cooldown-limited so dragging over one node does not count every frame.
- After enough repeated node bashes, unlock hidden achievement `node_basher` / `Personal Space Violation`.
- Bashing a node creates `NodeBobbleBurst` bubbles and occasional randomized text from `src/data/nodeCollisionReactions.js`.
- Collision effects are temporary and must not permanently alter graph layout.

## Background And Theme

- Main base is dark zinc/black.
- Theme gradient is blue to red: cyan/blue start, optional indigo/violet bridge, red/crimson end.
- Avoid rainbow overload.
- `BackgroundLights.jsx` provides slow drifting blue/red/indigo blobs behind content.
- Background lights are intentionally more vibrant than the plain gray version, but still subdued enough for readable cards/text.

## Hero / Title Card

- Hero card keeps a clean dark/glass look with a subtle white border and shadow.
- The previous colored top edge/stripe is removed.
- The badge text `Officially unofficial canon. Legally stupid.` becomes subtly interactive only in Admin mode.
- Triple-click that badge within 4 seconds in Admin mode to open the Website Lore Ledger.

## Footer And AI Disclosure

Footer messages live in `src/data/footerMessages.js`.

Behavior:

- Random footer message on page load.
- Footer visibly discloses that the website/code was made with AI help.
- Stories, jokes, lore, and bad human decisions are human-made.
- Keep hidden disclaimer too:

> This website's code is sadly made by AI.

Every footer variant includes clickable phrase `Canon level`. Clicking `Canon level` 5 times within 4 seconds opens achievements.

## Keyboard Triggers

Triggers are case-insensitive, work within 3 seconds, and must not fire while typing in `input`, `textarea`, `select`, or `contenteditable` fields.

Current triggers:

- `ID` manually triggers fake age verification and unlocks `Timeline Legal`.
- `nrop` manually triggers the blue-red chaos orb and unlocks `Orb Summoner`.
- `Ads` manually triggers fake ad popup and unlocks `Ad Blocker Failed Successfully`.
- `tos` manually triggers the ToS bar, works even if dismissed, and unlocks `Terms Necromancer`.
- `cap` manually triggers fake CAPTCHA and records the secret.
- `ach` opens hidden achievements and records the secret as known.
- `ADMIN` enables admin mode.
- `lore` opens the Website Lore Ledger, but only after admin mode is active.

Important: the orb trigger is `nrop`. Do not reintroduce the previous backwards-adult-word trigger.

## Known Typed Secrets

Typed secrets are sourced from `src/data/secretRegistry.js`.

`src/data/typedSecrets.js` maps `secretRegistry` into the shape older components expect.

Use localStorage key `twtaf:knownSecrets`.

Inside the achievements window, show **Known Forbidden Inputs** with discovered secrets visible and undiscovered secrets redacted.

The achievements window shows hidden keyword progress like `3 / 8 discovered`.

For normal/non-admin users, undiscovered registered secrets should not reveal trigger words. Render undiscovered entries as:

- trigger: `???`
- title: `Undiscovered input`
- description: `The archive knows something you do not. Annoying, isn't it?`

Admin mode shows all secrets, including `lore`.

The Website Lore Ledger is admin-only and may show the full registry, but it should still show discovered-vs-total counts for clarity.

Future hidden triggers should be added to `secretRegistry.js` so AchievementsWindow and Website Lore Ledger can display them without custom UI surgery.

## Website Lore Ledger

Files:

- `src/components/WebsiteLoreLedger.jsx`
- `src/data/websiteLore.js`
- `src/data/secretRegistry.js`

Purpose:

- Hidden admin-only registry for the website's internal lore, known typed secrets, button behavior, orb behavior, broken-image blame policy, and fake legal nonsense.
- Uses shared `FloatingWindow`.
- Draggable and outside-click closeable.
- Feels like a secret system file inside the archive.

Access:

- First enable admin mode by typing `ADMIN` outside text fields.
- Then type `lore` outside text fields, or triple-click the hero/title badge `Officially unofficial canon. Legally stupid.` within 4 seconds.
- Opening it discovers the `lore` secret and unlocks `website_lore_ledger` / `Read The Source Code's Diary`.

Ledger sections:

- Known Typed Secrets / Secret Registry, rendered from `secretRegistry.js`.
- Website Creature Lore.
- Micro-Reaction Catalog.
- Admin Tools: open achievements/secrets, show ToS, trigger CAPTCHA, trigger ad, trigger orb.
- Future Hidden Things section reminding future work to add secret triggers to `secretRegistry.js`.
- Disclaimer that the ledger describes website behavior/lore; user-created timeline stories are human-made unless demo/example content is intentionally imported.

## Admin Mode

Trigger: type `ADMIN` within 3 seconds outside text fields.

When triggered:

- Set `adminMode` to true and persist it.
- Unlock all achievements.
- Mark all typed secrets as known.
- Show a visible 2.5-4 second fake terminal/admin unlock animation.
- Open/show the Admin Panel button/window.

Admin panel:

- Uses shared `FloatingWindow`.
- Shows storage/status counts.
- Can open achievements/secrets.
- Can open Website Lore Ledger and Node Web.
- Can enter/exit example timeline mode.
- Has Data Management controls for `Export Timeline (.uhoh)` and `Import Timeline (.uhoh)`.
- Shows an animated `Load Example Media Folder` button beside Example Mode controls when Example Mode is active.
- Has `Show ToS Bar` for testing.
- Triggering popups/events from Admin Panel closes/minimizes Admin Panel first, then fires the action after a short delay.
- Example Mode controls may stay visible so the animated media folder button can appear.
- Has wipe website flow with confirmation:
  - Prompt: `This will wipe your local timeline, achievements, secrets, settings, and app data like a BIOS update with anger issues. Continue?`
  - Buttons: `Wipe It` and `Abort Wipe`

Wipe only clears this app's own localStorage keys and resets state to brand-new defaults.

Do not auto-close Admin Panel before destructive/confirmation-based wipe actions.

## Rare Event Rules

Rare events must actually be rare:

- Age gate on load: 10%.
- Fake ads on load/after delay: 3% to 5%.
- ToS bottom bar on load: 5%, unless already dismissed.
- Fake CAPTCHA on save/update: 5% to 8%.
- Chaos orb random interval: 3% to 4% per interval, every 16-25 seconds.

Avoid popup spam:

- Do not show multiple random popups at the same time.
- If a major modal/window is open, suppress random popups where reasonable.
- Manual triggers can override if reasonable, but avoid accidental chaos stacking.

## Chaos Orb

Files:

- `src/components/ChaosOrb.jsx`
- `src/utils/orbUtils.js`

Behavior:

- Visual style is blue-to-red liquid/glass blob with cyan highlights, crimson edge, inner shine, glow, outline/ring, wobble, squash/stretch, and rotation.
- Random chance remains rare.
- Manual trigger is `nrop`.
- Hover trigger: if the user holds the pointer over the idle/background orb for roughly 1.2-1.8 seconds, the orb panics and runs the same full sequence. Leaving before the timer completes cancels the trigger.
- Hover feedback makes the idle orb sharpen/glow/tremble slightly and may show subtle randomized suspicion text. This only works in idle/background mode, not during panic/escape/return.
- Hover-triggered panic unlocks hidden achievement `orb_observer` / `Orb Observer`.
- There is an idle/background mode: low opacity, blurred, behind content, slow drift.
- Triggered orb events use a state flow: idle/background -> panic exit -> foreground escape -> return to idle -> idle/background.
- ChaosOrb uses one persistent orb shell so the visible creature does not swap unrelated elements during the sequence.
- Panic exit makes the background orb sharpen/glow slightly and zip offscreen for roughly 500-900ms.
- Panic exit stays visible; do not fade it to zero.
- There is an escape/foreground mode: high z-index, sharp/glowy, fast movement above windows/modals, then exits.
- Return-to-idle animates the orb from the foreground escape path back into a blurred background position over roughly 700-1200ms.
- The orb should not abruptly disappear after a manual or random trigger.
- Escape paths are generated at runtime with random start side, exit side, 5-9 points, random scale/rotation/wobble, and duration around 2.1-3.2 seconds.
- Do not use the same hardcoded orb path every time.

## Hidden Button Micro-Lore

Files:

- `src/data/buttonReactions.js`
- `src/components/JokeButton.jsx`
- `src/components/ReactionOverlay.jsx`
- `src/components/ReactionOverlayHost.jsx`

Purpose:

- Some harmless joke/dismiss buttons have quick personality reactions before closing or responding.
- This is subtle website micro-lore: the UI is petty, bureaucratic, orb-touched, nervous, dramatic, or weirdly happy.
- Do not use this for destructive actions like Wipe/Delete unless there is a deliberate confirmation flow.
- Reactions should be quick, roughly 300-900ms, and not annoying.
- Reactions are real visual/physical animations: wiggle/squish, shake, progress bar, scoot, orb glow/ring, or dramatic stamp.
- Reaction text/stamps render through a body-level portal with high z-index so they are not clipped by FloatingWindow overflow.
- Reaction overlays are dispatched to `ReactionOverlayHost` so they can linger even if the parent window closes.
- Button physical animation stays quick, but reaction text/stamps should remain readable for roughly 1.4-2.2 seconds with a softer fade.
- Reactions are used in age gate buttons, fake ads, ToS buttons, long ToS buttons, and CAPTCHA joke buttons.
- Hidden achievement `button_whisperer` unlocks when the user discovers a joke-button reaction.

## Age Verification Popup

- Random 10% chance on page load.
- Manual trigger: `ID`.
- No ID input field.
- Only Yes/No style buttons.
- Clicking either closes it.
- Randomly choose one of three messages in `src/data/ageGateMessages.js`.
- Looks semi-legit/government/security, but funny.

## Fake Ads

Files:

- `src/data/fakeAds.js`
- `src/components/FakeAdWindow.jsx`

Behavior:

- Rare random chance after page load: 3% to 5%.
- Manual trigger: `Ads`.
- Manual trigger immediately shows one random ad.
- Draggable via shared `FloatingWindow`.
- Randomized fake ads.
- Main CTA closes ad.
- Secondary `Report Ad To The Orb` closes ad.

## Terms Of Service

Files:

- `src/data/tosMessages.js`
- `src/components/TermsBar.jsx`
- `src/data/tosLongSections.js`
- `src/components/LongTosWindow.jsx`

ToS bottom bar:

- Rare random chance after page load: around 5%.
- Respects dismissed/accepted flag for random appearance.
- Manual trigger `tos` shows it immediately even if previously dismissed.
- Fixed bottom bar, not a full modal.
- Dark/translucent/blurred with top border.
- Dismissible and stored in localStorage.

Long ToS window:

- Opens from review/read button on ToS bar.
- Uses shared `FloatingWindow`.
- Looks official-ish, dense, scrollable, and legally haunted.
- Uses core sections plus randomized optional sections from `tosLongSections.js`.
- Accepting closes long window, dismisses ToS, and unlocks `I Did Not Read This`.
- Opening long ToS unlocks `Actually Tried To Read It`.
- Manual `tos` unlocks `Terms Necromancer`.
- Scrolling near bottom unlocks hidden `Suspiciously Literate`.

## Fake CAPTCHA

Files:

- `src/data/captchaVariants.js`
- `src/components/FakeCaptchaModal.jsx`

Behavior:

- Rarely appears when saving/updating a disaster: 5% to 8%.
- Manual trigger: `cap`.
- Manual `cap` shows CAPTCHA immediately without requiring a save.
- Manual `cap` unlocks/uses `Definitely Human`.
- Validate form first.
- If CAPTCHA appears, store pending disaster temporarily.
- After completing/skipping CAPTCHA, save pending disaster.
- CAPTCHA variants include joke/empty buttons with micro-reactions.
- Should be quick, funny, and rare.

## Achievements

Files:

- `src/data/achievements.js`
- `src/utils/achievements.js`
- `src/components/AchievementsWindow.jsx`
- `src/components/AchievementToast.jsx`

Achievement hooks include:

- first disaster
- first direct connection
- custom tag
- opened node web
- opened achievements ledger (`opened_achievements` / `Achievement For Achievements`)
- manual age gate
- manual orb
- orb hover observer
- manual ads
- manual ToS
- manual CAPTCHA
- button micro-reactions
- opened/read ToS
- accepted ToS
- scrolled long ToS
- CAPTCHA complete
- Website Lore Ledger discovery
- node bashing/collision (`node_basher` / `Personal Space Violation`)
- five disasters
- ten disasters

Toast behavior:

- `AchievementToast.jsx` is a bottom-right cursed archive notification with dark glass styling, blue-to-red accent, icon/seal, slide/fade animation, and glow pulse.
- Achievements queue in App state so multiple unlocks do not stack on top of each other.
- Achievement toasts can be dragged/swiped horizontally. A swipe past roughly 100px dismisses the toast early and advances the queue.
- Auto-dismiss still works, but the timer pauses while the toast is being dragged.

Hidden access:

- Click `Canon level` in footer 5 times within 4 seconds.
- Or type `ach` outside text fields.

## Shared FloatingWindow

File: `src/components/FloatingWindow.jsx`

Used for:

- Live Node Web
- Fake ads
- Achievements panel
- CAPTCHA
- Admin panel
- Disaster detail window
- Long ToS window
- Delete confirmation
- Future desktop-style popups

Requirements:

- Dark desktop/program window.
- Title bar with fake window controls.
- Close button.
- Draggable by title bar.
- Framer Motion drag.
- `dragMomentum={false}`.
- Small `dragElastic`.
- Default `keepInViewport={true}`.
- On drag release, shared `FloatingWindow` checks its bounding box against the viewport and snaps back with a spring if the window is too far offscreen.
- Keep at least about 80-120px visible horizontally and keep the title bar/controls reachable vertically.
- Clamp on release only; do not hard-lock dragging while the user is actively moving the window.
- If a window is rescued, App listens for `twtaf:window-rescued` and may show a short randomized containment toast.
- Readable text.
- Good z-index.
- Supports `closeOnOutsideClick` and `closeOnEscape`.
- Outside-click close uses a top-window stack so only the topmost floating window closes.
- Reaction overlays are ignored by outside-click detection.
- Admin panel and delete confirmation intentionally disable outside-click/escape close for safety.

## Copy/Tone Examples

- Officially unofficial canon. Legally stupid.
- Feed the timeline. The timeline hungers.
- Rewrite history. Very normal behavior.
- No games yet. The timeline is empty, peaceful, and frankly suspicious.
- Can't connect spaghetti to itself, sadly.
- The note spaghetti got fired.
- Security theater, but make it canon.
- Verification failed successfully.
- The barrel was foreshadowing.
- Stored locally in your browser because the timeline remembers. Unfortunately.
