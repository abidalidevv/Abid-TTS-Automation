# Abid TTS Automation Extension

## Overview
Abid TTS Automation is a brand-new Chrome Extension built from scratch using Manifest V3 and Vanilla JavaScript. It is designed to automate reading projects on the MargVoice Reading campaign platform.

## Goal
Automate paragraph selection, browser-based TTS reading (`window.speechSynthesis`), and automatic next/submit page navigation, without any paid services or external APIs.

## Installation
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left corner.
5. Select the `Abid-TTS-Extension` folder from this repository.

## Features
- Dynamic Element Plus blocking dialog/modal dismissal.
- Clean text paragraph selection using Selection API.
- Native speech synthesis with automatic language detection.
- Active storage lock coordination.
- Zero external APIs or paid libraries.

## Core Automation States (v1.1.0)
The extension implements a state machine with the following states active:
- `IDLE`: Baseline resting state.
- `PAGE_DETECTED`: URL checked and matched.
- `WAIT_DOM`: Pauses execution until document readyState transitions.
- `HANDLE_POPUP`: Detects and dismisses visible overlay dialogs dynamically.
- `FIND_PARAGRAPH`: Locates target text container elements.
- `SELECT_AND_VERIFY`: Selects paragraph text and verifies selection.
- `CLICK_RECORD_START`: Click Record button to start recording.
- `START_TTS`: Triggers SpeechSynthesis API text-to-speech.
- `WAIT_TTS_FINISH`: Monitors speech status, waits 3 seconds after speech ends.
- `CLICK_RECORD_STOP`: Click Record button again to stop recording.
- `WAIT_RECORD_STOP`: Polls and verifies recording has stopped.
- `CHECK_SUBMIT`: Checks for presence of Submit button.
- `CLICK_NEXT`: Click next page button.
- `RESTART_SUBMIT`: Wait 4 seconds after submit and restart.
- `WAIT_NEW_PARAGRAPH`: Polls for paragraph text changes before continuing.

When active, the following console logs trace the workflow:
- `[Automation] Content Script Loaded`
- `[Automation] MargVoice Detected`
- `[Automation] DOM Ready`
- `[Automation] Automation Initialized`
- `[Automation] Popup Closed`
- `[Automation] Paragraph Found`
- `[Automation] Text Selected`
- `[Automation] Waiting For Stable Selection`
- `[Automation] Selection Verified`
- `[Automation] Record Clicked`
- `[Automation] Record Confirmed`
- `[Automation] Speech Cancelled`
- `[Automation] Speech Started`
- `[Automation] Speech Finished`
- `[Automation] Record Stop Clicked`
- `[Automation] Record Stop Confirmed`
- `ENTER WAIT_RECORD_STOP`
- `Record stopped confirmed`
- `ENTER CHECK_SUBMIT`
- `Submit found` / `Submit not found`
- `ENTER CLICK_NEXT`
- `Next clicked`
- `ENTER WAIT_NEW_PARAGRAPH`
- `[Automation] Next Clicked`
- `[Automation] Waiting For New Paragraph`
- `[Automation] Paragraph Changed`
- `[Automation] Submit Clicked`
- `[Automation] Restarting After Submit`

## Production Hardening & Updates (v1.2.6)
- **Dead Code Cleanup:** Checked all script scopes, validated the injection sequence, and removed unused bindings.
- **Leak Prevention:** Added fail-safe loops ensuring all timers, speech playbacks, and page observers disconnect on stop triggers.
- **Instance Safety:** Enforced singleton storage locks restricting multiple concurrent execution cycles.
- **Record Toggle Workflow:** Adapted Play click to a full Record Toggle flow to support campaign recording.
- **Voice Selection:** Dynamic SpeechSynthesis voice list and selection dropdown persisted in chrome storage.
- **Premium UI/UX Facelift:** Redesigned popup UI/UX using Vercel/Linear dark theme, SVG icons, iOS switches, and status pulsing indicators.
- **Toggle Loop Safety:** Fixed Record Stop verification to prevent toggling recording back on.
- **Workflow Prioritization:** Prioritizes clicking Next button on pages 1-4, only checking/submitting on the final page when Next is disabled.
- **Task Navigation Verification:** Evaluates Task Navigation highlight (bg-violet-600) to confirm page progress and retry Next clicks.
- **Timing Synchronization Hardening:** Increased record stop confirmation loop fallback limit to 6 seconds and added 3-second enabled/visible polling for Next buttons before clicks.
