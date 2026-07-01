# Changelog

## Version 1.2.6 (Record Stop & Next Click Synchronization Hardening)

### Fixed
- **Record Stop Wait Time:** Increased the verification timeout in `WAIT_RECORD_STOP` to 6 seconds (60 polling iterations) to allow the recorder UI time to fully clear its active/loading classes and SVG states on slower page loads.
- **Next Button Visibility Polling:** Added 3-second (150ms intervals) polling for the Next button in `CLICK_NEXT` to prevent timing-related lookup failures when the Next button is not instantly visible or enabled after recording stops.

## Version 1.2.5 (Task Navigation Match Precision Fix)

### Fixed
- **Strict Task Navigation Matching:** Fixed a regression in `getCurrentTaskIndex()` where checking wildcard background classes (like `bg-violet` or `bg-purple` without strict limits) caused the selector to match static numbers or total tasks on page 1, resulting in premature page 5 transitions. It now strictly queries `.bg-violet-600` and enforces exact digit length checks (`/^[1-5]$/`).

## Version 1.2.4 (Task 5 Detection & Verification Bugfix)

### Fixed
- **Task 5 Detection:** Refined `getCurrentTaskIndex()` in `selectors.js` to target purple highlighted elements using `.bg-violet-600` and related classes, and safely extract the active digit using regex matches to avoid text whitespace length mismatching. Added temporary diagnostic logging for the index and the matched element's outerHTML.

## Version 1.2.3 (Task Navigation Page Change Verification)

### Added
- **Task Navigation Indexing:** Added `getCurrentTaskIndex()` to `selectors.js` to dynamically identify which of the 5 campaign tasks is active by scanning for elements with the `bg-violet-600` class.

### Fixed
- **Navigation Priority by Page Index:** Configured `WAIT_RECORD_STOP` to query `getCurrentTaskIndex()`. If the current page index is less than 5, the state machine transitions directly to `CLICK_NEXT`, completely bypassing Submit.
- **Submit Waiting on Page 5:** On page 5, the state machine transitions to `CHECK_SUBMIT`. If the Submit button is disabled or not yet present, it now polls/waits until it becomes active instead of erroneously falling back to Next.
- **Next Click Change Verification:** Updated `WAIT_NEW_PARAGRAPH` to verify page transition by checking both page index changes (via the Task Navigation widget) and paragraph text changes. Added automatic Next button click retries (up to 2 retries) upon verification timeout before halting with an error.

## Version 1.2.2 (Workflow Navigation Prioritization Bugfix)

### Fixed
- **Navigation Priority (Next over Submit):** Fixed a workflow routing bug where the automation checked for Submit immediately after record stop confirmation, causing premature submissions. The automation now prioritizes the Next button, transitioning from `WAIT_RECORD_STOP` directly to `CLICK_NEXT` on Paragraphs 1-4.
- **Next Button Disabled Check:** Updated `findNextButton()` in `selectors.js` to ensure the matching Next button is active (`isElementEnabledAndVisible`). On the final paragraph (Page 5), where Next is disabled, it resolves to `null` so the workflow correctly falls back to `CHECK_SUBMIT` to submit the campaign task.

## Version 1.2.1 (Record Toggle Loop Bugfix)

### Fixed
- **Record Toggle Infinite Click Loop:** Fixed a critical state machine bug where `WAIT_RECORD_STOP` transitioned back to `CLICK_RECORD_STOP` on verification delay, causing the toggle button to be clicked repeatedly forever. The automation now waits for up to 3 seconds for the recording state to clear and unconditionally transitions to `CHECK_SUBMIT` to ensure it never toggles recording back on.

## Version 1.2.0 (Premium UI/UX Facelift)

### Added
- **Premium Design System:** Implemented a clean, Vercel/Linear-inspired dark interface with custom cards, borders, rounded corners, soft shadows, and typography.
- **Status Indicators:** Re-engineered the status section into a card with a dynamic colored status dot (pulse animation) and user-friendly states: Stopped (inactive), Ready (idle/waiting), and Running (actively executing).
- **Voice Format Enhancement:** Leveraged `Intl.DisplayNames` to dynamically translate locale codes into human-readable language labels and clean up voice engine names.
- **iOS Toggle Switch:** Replaced default browser checkboxes with a customized toggle switch.
- **SVG Vector Icons:** Inlined vector icons (microphone, chevron, play, stop, logs) for instantaneous visual feedback.
- **Micro-interactions:** Programmed hover transitions, focus borders, active button scale press feedbacks, and custom log scrollbars.

## Version 1.1.1 (Workflow & Startup Reliability Fixes)

### Fixed
- **Record Stop Confirmation:** Modified `isPagePlaying()` in `selectors.js` to dynamically and statelessly evaluate the current DOM state of the circular Record button (checking classes, SVG icon content, and disabled attributes). This resolves the issue where the automation permanently hung in `WAIT_RECORD_STOP` after clicking Stop.
- **Manual Start Reliability:** Updated the storage change listener in `content.js` to allow starting the automation when it is not already running, completely bypassing the single-trigger flag lock that was causing manual Start buttons to fail.
- **Popup Closing Reliability:** Refined the `HANDLE_POPUP` state body in `automation.js` into an active, retrying close loop that checks for popups and clicks the close button every 500ms for up to 4 seconds.
- **Diagnostics:** Added requested trace logging messages for the final workflow steps in `automation.js`.

## Version 1.1.0 (Record Toggle Workflow & Voice Selection)

### Added
- **Voice Selection Dropdown:** Added a dropdown selection in the popup to choose from any available SpeechSynthesis voices.
- **Voice Selection Persistence:** Selected voice is saved in `chrome.storage.local` and loaded dynamically.
- **TTS Voice Application:** TTS engine in `tts.js` retrieves the selected voice from storage and applies it to the `SpeechSynthesisUtterance`.
- **Record Toggle Workflow:** Shifted the automation flow from a simple "Play" action to a "Record Toggle" action:
  - First click on the Record button starts the recording.
  - Speech synthesis reads the text.
  - On speech finish, the automation waits a 3-second buffer.
  - Second click on the SAME Record button stops the recording.
  - The automation waits until recording has fully stopped (button returns to idle state) before proceeding to Next or Submit.
- **Submit Wait:** Reduced post-Submit task restart delay to 4 seconds.

## Version 1.0.0-alpha (Phase 1)

### Added
- Created brand-new extension folder `Abid-TTS-Extension`.
- Configured declarative injection rules matching `margvoice.com` URLs in `manifest.json`.
- Implemented core service worker shell `background.js` and bootstrapper `content.js`.
- Created skeleton script layouts for logging (`utils.js`), DOM target paths (`selectors.js`), SpeechSynthesis (`tts.js`), and state machine controller (`automation.js`).
- Structured popup monitor interface files (`popup.html`, `popup.css`, `popup.js`).
- Synchronized initial documentation files.

## Version 1.0.0-beta (Phase 2)

### Added
- Configured matching rule verification logic to ignore all query parameters.
- Implemented SPA navigation listener checking for location changes using a lightweight 500ms polling cycle in `content.js`.
- Added duplicate load prevention check `window.abidTtsContentScriptLoaded` at execution start.
- Developed `IDLE`, `PAGE_DETECTED`, and `WAIT_DOM` states inside `automation.js`.
- Configured all required console logs: `Content Script Loaded`, `MargVoice Detected`, `DOM Ready`, and `Automation Initialized`.

## Version 1.0.0-rc1 (Phase 3)

### Added
- Created modal visibility check `findVisibleModal` and close button tracker `findModalCloseButton` inside `selectors.js`.
- Implemented `findParagraphToRead`, `findPlayButton`, and Selection API helper `selectElementText` inside `selectors.js`.
- Added auto-language detection logic to `BrowserTTS` wrapper in `tts.js`.
- Implemented core states: `HANDLE_POPUP`, `FIND_PARAGRAPH`, `SELECT_TEXT`, `VERIFY_SELECTION`, `CLICK_PLAY`, `START_TTS`, and `WAIT_TTS_FINISH` in `automation.js`.
- Wired user interface triggers in `popup.html`, `popup.css`, and `popup.js` to control and update the `automationActive` lock values in storage.
- Configured exact console logs tracking selection verification, button clicks, and speech events.

## Version 1.0.0-rc2 (Phase 4 & 5)

### Added
- Integrated Submit button checking `findSubmitButton` scanning innerText, values, and types in `selectors.js`.
- Added Next button locator `findNextButton` verifying active button classes in `selectors.js`.
- Implemented audio player checking `isPagePlaying` tracking active audio playback in `selectors.js`.
- Programmed loop workflows: `RESTART_SUBMIT` (5 seconds delay) and `WAIT_NEW_PARAGRAPH` polling for changes in `automation.js`.
- Implemented selection stability wait states (`Waiting For Stable Selection`) and 200ms delays before Play button clicks in `automation.js`.
- Configured duplicate start ignores on manual execution triggers in `automation.js`.
- Enforced active synthesis cancels `speechSynthesis.cancel()` and 100ms pauses before starting TTS.
- Wired all trace logging statements including Play Confirmed, Speech Cancelled, Next Clicked, and Paragraph Changed.

## Version 1.0.0-rc3 (Phase 5 Workflow Bugfixes)

### Fixed
- **Bug 1: Play button click bypass:** Refined `CLICK_PLAY` in `automation.js` to poll and retry play button clicks dynamically rather than defaulting to speech synthesis.
- **Bug 2: Early Submit detection:** Re-implemented `findSubmitButton` in `selectors.js` using strict, candidate-based checks for visibility, enabled state, `aria-disabled !== "true"`, and text containing "Submit".
- **Bug 3: Next/Submit button prioritizations:** Ensured `findSubmitButton` matches only when all strict rules are satisfied, allowing the workflow to correctly click Next instead of Submit until the final paragraph is completed.


## Version 1.0.0-rc5 (Senior Review — Sequential Workflow Reliability)

### Fixed

**utils.js**
- `isElementVisible()` now checks `opacity === 0` — Element Plus hides buttons via opacity during transitions; they were previously treated as visible and clickable.

**tts.js**
- Added a `setInterval` keepalive (pause + resume every 10s) inside `speak()` to prevent Chrome's documented `speechSynthesis` stall bug where `onend` never fires on longer utterances. Interval is cleaned up in both `onend` and `onerror` handlers.

**selectors.js**
- `isPagePlaying()` now accepts the specific element that was clicked as a parameter. Check 3 (DOM removal) only fires if THAT element is gone — not any time `findPlayButton()` returns null. Previous implementation returned `true` whenever no play button was found, creating a false-positive that could "confirm" a click that never happened.
- `findParagraphToRead()` fallback removed. The generic leaf-node fallback was matching navigation labels, error messages, and breadcrumb text. Named selectors only — if they don't match, retry logic handles it.
- `selectElementText()` wrapped in try/catch to handle edge-case DOM exceptions.
- `findSubmitButton()` and `findNextButton()` query narrowed to `button`, `input`, and `[role="button"]` — removed `a`, `.el-button`, `.btn` which were causing false matches on generic link elements.

**automation.js**
- **Critical: Fire-and-forget TTS callback corruption.** `START_TTS` now captures `ttsGen = this._loopGen` at launch. The `.then()/.catch()` callback only sets `ttsDone = true` if `this._loopGen === ttsGen`. Stale callbacks from previous stop/start cycles are silently discarded.
- **Critical: HANDLE_POPUP does not confirm popup disappeared.** Replaced 500ms fixed wait with a poll loop (up to 3 seconds) that waits until `findVisibleModal()` returns null. Automation no longer moves forward with an active popup.
- **Critical: FIND_PARAGRAPH halts immediately if element not found.** Now retries for up to 5 seconds, handling SPA rendering delays after popup close.
- **Critical: isPagePlaying false positive.** CLICK_PLAY now passes the clicked button element to `isPagePlaying(playBtn)`. Separate retry counters for "button not found" (20 × 200ms = 4s) and "click not confirmed" (5 attempts).
- **Moderate: SELECT_TEXT + VERIFY_SELECTION race condition.** Collapsed into a single `SELECT_AND_VERIFY` state. Eliminates the 50ms inter-state gap during which focus could move. Selection, wait, re-enforce, verify, and retry all happen inside one atomic state block.
- **Moderate: switch case `const` variable conflicts.** All switch case bodies wrapped in `{}` braces creating proper block scope, preventing potential "cannot access before initialization" errors when the same variable name appears in multiple cases.
- `WAIT_NEW_PARAGRAPH` timeout extended from 10s to 15s for slow MargVoice task transitions.
- TTS timeout calculation updated to 500ms/word (more realistic for Chrome TTS ~130 wpm), minimum 15s, maximum 120s.


### Fixed
- **Bug 1 — Silent startup crash:** Added `window.automation` existence guard in `content.js`; if `automation.js` fails to load, the script logs a fatal error and aborts gracefully instead of throwing unhandled exceptions.
- **Bug 2 — Concurrent loop race condition:** Introduced `_loopGen` generation counter in `automation.js`; any superseded loop instance self-terminates, preventing two concurrent state machines from running simultaneously on SPA navigation.
- **Bug 3 — Speech silently skipped:** Removed early-return guard `if (this.synth.speaking) return` from `tts.js`; speech now always cancels existing synthesis then starts cleanly.
- **Bug 4 — CLICK_PLAY infinite retry:** Added 15-attempt maximum retry counter in `CLICK_PLAY`; automation halts with a clear error log instead of hanging silently.
- **Bug 5 — isPagePlaying() too strict:** Added a third detection condition in `selectors.js`; if the play button disappears from DOM after click, that is treated as confirmed playback acceptance.
- **Bug 6 — Wrong paragraph matched:** Constrained `findParagraphToRead()` fallback to `main`/`article`/`[role="main"]` semantic containers only; increased minimum text length to 30 chars to avoid matching nav labels and footer text.
- **Bug 7 — SPA back-navigation does not restart:** `automationInitiatedOnCurrentUrl` is now reset on every URL change so returning to the reading page always re-triggers the automation.
- **Bug 8 — Single selection failure halts automation:** `VERIFY_SELECTION` now retries `SELECT_TEXT` up to 3 times before halting, handling transient selection failures gracefully.
- **Bug 9 — TTS watchdog missing:** Added a text-length-based timeout (80ms/word, min 10s, max 120s) to `WAIT_TTS_FINISH`; if `speechSynthesis.onend` never fires (known browser bug), the automation forces continuation.
- **Bug 10 — Stop then Start on same URL does nothing:** `automationInitiatedOnCurrentUrl` is now reset in the stop branch of the `storage.onChanged` listener, allowing the Start button to re-trigger automation on the same URL.
