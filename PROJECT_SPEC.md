# PROJECT SPECIFICATION: Abid TTS Automation Extension

## Goal
Automate MargVoice Reading projects using a brand-new Chrome Extension from scratch.

## Supported URL
- `https://margvoice.com/projects/execute/reading` (ignoring all query parameters).

## Functional Requirements
- **FR-01: Page Detection:** Automatically match and run on the MargVoice execute reading URL.
- **FR-02: Modal/Dialog Dismissal:** Detect and close visible overlays (Element Plus style `el-overlay`, `el-dialog`, `el-modal`, `el-message-box`) using dynamic classes.
- **FR-03: Paragraph Location:** Dynamically find target reading text.
- **FR-04: Text Selection:** Use Selection API to select paragraph contents.
- **FR-05: Selection Verification:** Compare selection text with target text.
- **FR-06: Play Trigger:** Click the MargVoice native Play/Record button.
- **FR-07: Browser TTS Execution:** Speak selected text using browser `window.speechSynthesis`.
- **FR-08: Playback Monitoring:** Wait for `SpeechSynthesisUtterance.onend` event.
- **FR-09: Smart Navigation:** 
  - If enabled/visible Submit button is detected, click it, wait 5 seconds, and restart.
  - Otherwise, click Next, wait for paragraph text update, and repeat.
- **FR-10: Error Recovery:** Halt on `ERROR` if any step fails after 5 retries.
- **FR-11: Logging:** Console logs prefixed with `[Automation]`.

## Non-Functional Requirements
- Manifest V3 compliant.
- No jQuery, React, or frameworks.
- Local browser speech API only (no keys, no cost).
- Full cleanup of observers and timeouts on state changes to prevent leaks.
