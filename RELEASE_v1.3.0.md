# Release Notes - v1.3.0

Professional Reading Automation companion for MargVoice campaign tasks.

## Features
- **Record Toggle Automation Flow:** Complete hands-free record-toggle loop (Starts recording -> TTS speaks paragraph -> Waits 3s -> Stops recording -> Navigates to Next or Submits).
- **Vercel/Linear Dark UI:** A professional and polished dark interface, complete with card layouts, iOS switch styling, inlined SVG icons, and smooth micro-interactions.
- **Intl-Formatted Voice Dropdown:** Dynamic detection and choice of SpeechSynthesis voices, persisting the selection in local storage and listing names formatted with localized language names.
- **Task Navigation Progress Verification:** Checks both Task Navigation circle highlights (enforcing purple `.bg-violet-600` class checks) and paragraph text changes to verify page transition success.
- **Auto-Start Support:** Option to auto-start automation loop immediately upon page navigation.

## Bug Fixes
- Fixed manual Start trigger locks by bypassing URL SPA load initializers when the state machine is inactive.
- Fixed overlay modal dialog closing by implementing a retrying close loop polling every 500ms.
- Fixed Record Stop hangs by developing a stateless status checker inspecting Record button class lists, disabled attributes, and SVGs.
- Fixed premature submission triggers by prioritizing Next button navigation and verifying task navigation indices (only submitting on Page 5).
- Fixed Next-click timing errors by introducing 3-second visibility polling for Next buttons and up to 2 click retries.

## Known Limitations
- Requires Chrome SpeechSynthesis engine voices to be loaded and active.
- Only executes on matching MargVoice execute reading SPA paths.

## Installation & How to Use
Please refer to [INSTALL.md](file:///c:/Users/Ali/Desktop/umairt/Abid-TTS-Extension/INSTALL.md) for step-by-step setup instructions.

## Future Roadmap updated
- Support for custom text-to-speech rate and pitch adjustments.
- Automated error reporting/alert notifications for system-level speech synthesis issues.
  
