// automation.js - Core state machine for Abid TTS Automation

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY STATE MACHINE DIAGNOSTIC LOGGING
// Remove stateLog() calls before release
// ─────────────────────────────────────────────────────────────────────────────
function stateLog(type, stateName, detail) {
  const prefix = {
    enter: "[State] ENTER  ->",
    success: "[State] SUCCESS ->",
    failed: "[State] FAILED  ->"
  }[type] || "[State]";
  if (detail) {
    console.log(prefix, stateName, "|", detail);
  } else {
    console.log(prefix, stateName);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

class AbidAutomation {
  constructor() {
    this.state = "IDLE";
    this.isRunning = false;
    this.retries = {};
    this.activeObserver = null;
    this.activeTimeout = null;

    // Workflow values
    this.paragraphElement = null;
    this.paragraphText = "";
    this.ttsDone = false;

    // Loop generation counter.
    // Incremented on every start() call so any lingering loop from a previous
    // run self-terminates, and stale TTS callbacks don't corrupt current state.
    this._loopGen = 0;
    this._ttsTimeoutMs = 0;
    this._ttsStartTime = 0;
  }

  logState(msg) {
    utils.log(`[${this.state}]`, msg);
  }

  transitionTo(nextState) {
    this.logState(`Transitioning to: ${nextState}`);
    this.state = nextState;
    this.cleanup();
  }

  cleanup() {
    if (this.activeObserver) {
      this.activeObserver.disconnect();
      this.activeObserver = null;
    }
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      this.activeTimeout = null;
    }
  }

  async start() {
    if (this.isRunning) {
      utils.log("Automation is already running. Ignoring start request.");
      return;
    }

    this._loopGen++;
    const myGen = this._loopGen;

    this.isRunning = true;
    this.retries = {};
    this.ttsDone = false;
    this._ttsStartTime = 0;
    utils.log("Automation Initialized");
    this.transitionTo("PAGE_DETECTED");
    this.loop(myGen);
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      this.cleanup();
      this.state = "IDLE";
      tts.cancel();
      utils.log("Automation stopped");
    }
  }

  async loop(myGen) {
    while (this.isRunning && this._loopGen === myGen) {
      try {
        switch (this.state) {

          // ───────────────────────────────────────────────────────────────────
          case "PAGE_DETECTED": {
            stateLog("enter", "PAGE_DETECTED");
            this.transitionTo("WAIT_DOM");
            stateLog("success", "PAGE_DETECTED");
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "WAIT_DOM": {
            stateLog("enter", "WAIT_DOM", `readyState="${document.readyState}"`);
            if (document.readyState === "complete" || document.readyState === "interactive") {
              utils.log("DOM Ready");
              this.transitionTo("HANDLE_POPUP");
              stateLog("success", "WAIT_DOM", `readyState="${document.readyState}"`);
            } else {
              await utils.waitMs(100);
            }
            break;
          }

          case "HANDLE_POPUP": {
            stateLog("enter", "HANDLE_POPUP");

            // Poll and try to find/close modal for up to 4 seconds
            let popupGone = false;
            for (let i = 0; i < 40; i++) {
              const modal = selectors.findVisibleModal();
              if (!modal) {
                popupGone = true;
                break;
              }

              // Only attempt click every 500ms (every 5 iterations)
              if (i % 5 === 0) {
                const closeBtn = selectors.findModalCloseButton(modal);
                if (closeBtn) {
                  closeBtn.click();
                  utils.log("Popup Close button clicked");
                } else {
                  utils.log("Popup visible but close button not found yet.");
                }
              }

              await utils.waitMs(100);
              if (!this.isRunning) break;
            }

            if (popupGone) {
              stateLog("success", "HANDLE_POPUP", "Popup dismissed and confirmed gone");
            } else if (this.isRunning) {
              utils.log("Warning: Popup did not disappear after 4s. Proceeding.");
              stateLog("failed", "HANDLE_POPUP", "Popup still visible after 4s — proceeding anyway");
            }
            this.transitionTo("FIND_PARAGRAPH");
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "FIND_PARAGRAPH": {
            stateLog("enter", "FIND_PARAGRAPH");
            let foundP = null;
            let attempt = 0;
            for (let i = 0; i < 50; i++) {
              foundP = selectors.findParagraphToRead();
              attempt = i + 1;
              if (foundP) break;
              await utils.waitMs(100);
              if (!this.isRunning) break;
            }
            if (foundP && this.isRunning) {
              this.paragraphElement = foundP;
              this.paragraphText = foundP.innerText.trim();
              this.retries.selectVerify = 0;
              utils.log("Paragraph Found");
              stateLog("success", "FIND_PARAGRAPH", `found on attempt ${attempt}, text="${this.paragraphText.slice(0, 60)}..."`);
              this.transitionTo("SELECT_AND_VERIFY");
            } else if (this.isRunning) {
              utils.log("Paragraph not found after 5 seconds. Halting.");
              stateLog("failed", "FIND_PARAGRAPH", "No paragraph matched after 50 attempts (5s) — check [Abid-TTS-Debug] logs");
              this.stop();
            }
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "SELECT_AND_VERIFY": {
            stateLog("enter", "SELECT_AND_VERIFY", `attempt ${(this.retries.selectVerify || 0) + 1}/3`);
            selectors.selectElementText(this.paragraphElement);
            utils.log("Text Selected");

            // Wait 200ms for any SPA re-render to settle
            await utils.waitMs(200);
            if (!this.isRunning) break;

            // Re-enforce the selection (focus may have moved during the wait)
            utils.log("Waiting For Stable Selection");
            selectors.selectElementText(this.paragraphElement);
            await utils.waitMs(100);
            if (!this.isRunning) break;

            const selectedText = window.getSelection().toString().trim();
            if (utils.normalizeText(selectedText) === utils.normalizeText(this.paragraphText)) {
              utils.log("Selection Verified");
              stateLog("success", "SELECT_AND_VERIFY", `selected ${selectedText.length} chars`);
              this.retries.playNotFound = 0;
              this.retries.playNotConfirmed = 0;
              this.transitionTo("CLICK_RECORD_START");
            } else {
              this.retries.selectVerify = (this.retries.selectVerify || 0) + 1;
              if (this.retries.selectVerify < 3) {
                utils.log(`Selection verify failed (attempt ${this.retries.selectVerify}/3), retrying...`);
                stateLog("failed", "SELECT_AND_VERIFY",
                  `attempt ${this.retries.selectVerify}/3 — selected="${selectedText.slice(0, 60)}" expected="${this.paragraphText.slice(0, 60)}"`);
                // Remain in SELECT_AND_VERIFY
              } else {
                utils.log("Selection failed after 3 attempts. Halting.");
                stateLog("failed", "SELECT_AND_VERIFY", "3 attempts exhausted — halting");
                this.stop();
              }
            }
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "CLICK_RECORD_START": {
            stateLog("enter", "CLICK_RECORD_START",
              `notFound=${this.retries.playNotFound || 0} notConfirmed=${this.retries.playNotConfirmed || 0}`);
            const recordBtn = selectors.findPlayButton();

            if (!recordBtn) {
              // Button not in DOM — wait for it (up to 4 seconds)
              this.retries.playNotFound = (this.retries.playNotFound || 0) + 1;
              if (this.retries.playNotFound >= 20) {
                utils.log("Record button not found after 4 seconds. Halting.");
                stateLog("failed", "CLICK_RECORD_START", "Record button never appeared in DOM after 20 attempts");
                this.stop();
              } else {
                stateLog("failed", "CLICK_RECORD_START",
                  `attempt ${this.retries.playNotFound}/20 — button not found, waiting 200ms`);
                await utils.waitMs(200);
              }
              break;
            }

            // Button found — reset the not-found counter
            this.retries.playNotFound = 0;
            recordBtn.click();
            utils.log("Record Clicked");
            stateLog("enter", "WAIT_RECORD_START", "polling isPagePlaying() for up to 1.5s");

            // Poll until the page confirms recording has started (up to 1.5 seconds)
            let accepted = false;
            for (let i = 0; i < 15; i++) {
              await utils.waitMs(100);
              if (!this.isRunning) break;
              if (selectors.isPagePlaying(recordBtn)) {
                accepted = true;
                break;
              }
            }

            if (accepted) {
              utils.log("Record Confirmed");
              stateLog("success", "CLICK_RECORD_START", "Record confirmed — transitioning to START_TTS");
              this.retries.playNotConfirmed = 0;
              this.transitionTo("START_TTS");
            } else {
              // Click happened but page did not confirm — retry the click
              this.retries.playNotConfirmed = (this.retries.playNotConfirmed || 0) + 1;
              if (this.retries.playNotConfirmed >= 5) {
                utils.log("Record could not be confirmed after 5 attempts. Halting.");
                stateLog("failed", "CLICK_RECORD_START",
                  "5 click attempts, none confirmed");
                this.stop();
              } else {
                utils.log(`Record not confirmed (attempt ${this.retries.playNotConfirmed}/5), retrying click...`);
                stateLog("failed", "CLICK_RECORD_START",
                  `attempt ${this.retries.playNotConfirmed}/5 — not confirmed, will retry`);
                // Remain in CLICK_RECORD_START to retry
              }
            }
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "START_TTS": {
            stateLog("enter", "START_TTS",
              `text length=${this.paragraphText.length} chars, words=${this.paragraphText.split(/\s+/).filter(Boolean).length}`);
            this.ttsDone = false;

            // Generous timeout: ~500ms per word (Chrome TTS ~130 wpm ≈ 460ms/word).
            // Minimum 15s, maximum 120s.
            const wordCount = this.paragraphText.split(/\s+/).filter(Boolean).length;
            this._ttsTimeoutMs = Math.min(Math.max(wordCount * 500, 15000), 120000);
            this._ttsStartTime = Date.now();

            const ttsGen = this._loopGen; // capture current generation

            stateLog("success", "START_TTS",
              `speaking started, watchdog=${this._ttsTimeoutMs}ms, gen=${ttsGen}`);
            this.transitionTo("WAIT_TTS_FINISH");

            tts.speak(this.paragraphText)
              .then(() => {
                if (this._loopGen === ttsGen) {
                  console.log("[State] SUCCESS -> WAIT_TTS_FINISH | TTS onend fired");
                  this.ttsDone = true;
                } else {
                  console.log("[State] IGNORED  -> TTS onend from stale gen", ttsGen, "current gen", this._loopGen);
                }
              })
              .catch((err) => {
                utils.log("TTS error:", err.message || err);
                if (this._loopGen === ttsGen) {
                  console.log("[State] FAILED  -> START_TTS | TTS error:", err.message || err, "— forcing ttsDone");
                  this.ttsDone = true;
                }
              });
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "WAIT_TTS_FINISH": {
            if (this.ttsDone) {
              this.ttsDone = false;
              this._ttsStartTime = 0;

              // Wait an additional 3 seconds after speech finishes
              utils.log("Speech Finished. Waiting 3 seconds before stopping record...");
              stateLog("success", "WAIT_TTS_FINISH", "TTS done — waiting 3s buffer");
              await utils.waitMs(3000);
              if (!this.isRunning) break;

              this.transitionTo("CLICK_RECORD_STOP");
            } else {
              // Watchdog: force continuation if TTS hangs past timeout
              if (this._ttsStartTime > 0 && (Date.now() - this._ttsStartTime) > this._ttsTimeoutMs) {
                utils.log("TTS watchdog: speech timed out. Forcing continuation.");
                console.log("[State] FAILED  -> WAIT_TTS_FINISH | TTS watchdog fired after",
                  this._ttsTimeoutMs, "ms — onend never fired");
                tts.cancel();
                this.ttsDone = true;
              } else {
                await utils.waitMs(100);
              }
            }
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "CLICK_RECORD_STOP": {
            stateLog("enter", "CLICK_RECORD_STOP");
            const recordBtn = selectors.findPlayButton();

            if (!recordBtn) {
              this.retries.stopBtnNotFound = (this.retries.stopBtnNotFound || 0) + 1;
              if (this.retries.stopBtnNotFound >= 20) {
                utils.log("Record button not found for stopping after 4 seconds. Halting.");
                stateLog("failed", "CLICK_RECORD_STOP", "Record button never appeared in DOM for stop after 20 attempts");
                this.stop();
              } else {
                await utils.waitMs(200);
              }
              break;
            }

            this.retries.stopBtnNotFound = 0;
            recordBtn.click();
            utils.log("Record Stop Clicked");
            this.retries.stopNotConfirmed = 0;
            this.transitionTo("WAIT_RECORD_STOP");
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "WAIT_RECORD_STOP": {
            console.log("ENTER WAIT_RECORD_STOP");
            stateLog("enter", "WAIT_RECORD_STOP", "waiting for recording to stop");
            
            let stopped = false;
            for (let i = 0; i < 60; i++) { // 60 * 100ms = 6 seconds fallback
              const currentBtn = selectors.findPlayButton();
              if (currentBtn && !selectors.isPagePlaying(currentBtn)) {
                stopped = true;
                break;
              }
              await utils.waitMs(100);
              if (!this.isRunning) break;
            }

            if (stopped) {
              console.log("Record stopped confirmed");
              utils.log("Record Stop Confirmed");
              stateLog("success", "WAIT_RECORD_STOP", "Recording stopped successfully");
            } else {
              console.log("Record stop could not be confirmed within 6s. Proceeding anyway.");
              utils.log("Record stop could not be confirmed within 6s. Proceeding to Submit/Next anyway.");
              stateLog("failed", "WAIT_RECORD_STOP", "Recording stop not confirmed within 6s — proceeding anyway");
            }
            const currentTask = selectors.getCurrentTaskIndex();
            utils.log(`Current Task index: ${currentTask || "unknown"}`);
            
            if (currentTask !== null) {
              if (currentTask < 5) {
                this.transitionTo("CLICK_NEXT");
              } else {
                this.transitionTo("CHECK_SUBMIT");
              }
            } else {
              // Fallback if index not found: check if Next button is present
              const nextBtn = selectors.findNextButton();
              if (nextBtn) {
                this.transitionTo("CLICK_NEXT");
              } else {
                this.transitionTo("CHECK_SUBMIT");
              }
            }
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "CHECK_SUBMIT": {
            console.log("ENTER CHECK_SUBMIT");
            stateLog("enter", "CHECK_SUBMIT");
            const submitBtn = selectors.findSubmitButton();
            if (submitBtn) {
              console.log("Submit found");
              submitBtn.click();
              utils.log("Submit Clicked");
              stateLog("success", "CHECK_SUBMIT", "Submit button found and clicked");
              this.transitionTo("RESTART_SUBMIT");
            } else {
              console.log("Submit not found or disabled yet. Waiting...");
              await utils.waitMs(200);
            }
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "CLICK_NEXT": {
            console.log("ENTER CLICK_NEXT");
            stateLog("enter", "CLICK_NEXT");
            
            // Poll for Next button to become enabled and visible (up to 3 seconds)
            let nextBtn = null;
            for (let i = 0; i < 20; i++) { // 20 * 150ms = 3000ms
              nextBtn = selectors.findNextButton();
              if (nextBtn) {
                break;
              }
              await utils.waitMs(150);
              if (!this.isRunning) break;
            }

            if (nextBtn) {
              console.log("Next clicked");
              
              // Capture pre-click state if this is the first attempt
              if (!this.retries.nextClickAttempts) {
                this._preClickPageNum = selectors.getCurrentTaskIndex();
                this._preClickParagraphText = this.paragraphText;
                this.retries.nextClickAttempts = 1;
              } else {
                this.retries.nextClickAttempts++;
              }
              
              nextBtn.click();
              utils.log(`Next Clicked (attempt ${this.retries.nextClickAttempts}/3)`);
              stateLog("success", "CLICK_NEXT", `Next button clicked, attempt ${this.retries.nextClickAttempts}`);
              this.transitionTo("WAIT_NEW_PARAGRAPH");
            } else {
              utils.log("Neither Submit nor Next button found. Halting.");
              stateLog("failed", "CLICK_NEXT", "No Next button found — check [Abid-TTS-Debug] logs");
              this.stop();
            }
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "RESTART_SUBMIT": {
            stateLog("enter", "RESTART_SUBMIT", "waiting 4 seconds before next task");
            utils.log("Restarting After Submit");
            await utils.waitMs(4000); // Wait exactly 4 seconds
            stateLog("success", "RESTART_SUBMIT", "4s elapsed, restarting workflow");
            this.transitionTo("PAGE_DETECTED");
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "WAIT_NEW_PARAGRAPH": {
            console.log("ENTER WAIT_NEW_PARAGRAPH");
            stateLog("enter", "WAIT_NEW_PARAGRAPH",
              `previous text="${this._preClickParagraphText.slice(0, 60)}"`);
            utils.log("Waiting For New Paragraph or Navigation Number Change");
            
            let changed = false;
            for (let i = 0; i < 50; i++) { // 50 × 100ms = 5 seconds
              await utils.waitMs(100);
              if (!this.isRunning) break;

              // Check Indicator 2 (Preferred): Task Navigation Widget Page Number
              const currentTask = selectors.getCurrentTaskIndex();
              if (currentTask !== null && this._preClickPageNum !== null && currentTask !== this._preClickPageNum) {
                changed = true;
                console.log("[State] SUCCESS -> WAIT_NEW_PARAGRAPH | Page navigation change confirmed:",
                  `page changed from ${this._preClickPageNum} to ${currentTask}`);
                break;
              }

              // Check Indicator 1: Paragraph Text
              const currentP = selectors.findParagraphToRead();
              if (currentP) {
                const currentText = currentP.innerText.trim();
                if (utils.normalizeText(currentText) !== utils.normalizeText(this._preClickParagraphText)) {
                  changed = true;
                  console.log("[State] SUCCESS -> WAIT_NEW_PARAGRAPH | Paragraph text change confirmed:",
                    `"${currentText.slice(0, 60)}"`);
                  break;
                }
              }
            }

            if (changed) {
              utils.log("Paragraph Changed successfully");
              this.retries.nextClickAttempts = 0; // Reset counter
              this.transitionTo("FIND_PARAGRAPH");
            } else if (this.isRunning) {
              if (this.retries.nextClickAttempts < 3) {
                utils.log(`Next click verify failed. Retrying Next click (attempt ${this.retries.nextClickAttempts}/3)...`);
                stateLog("failed", "WAIT_NEW_PARAGRAPH", `attempt ${this.retries.nextClickAttempts}/3 failed — retrying Next click`);
                this.transitionTo("CLICK_NEXT");
              } else {
                utils.log("Error: Page did not change after 3 Next attempts. Halting.");
                stateLog("failed", "WAIT_NEW_PARAGRAPH", "Page did not change after 3 attempts — halting");
                this.stop();
              }
            }
            break;
          }

          // ───────────────────────────────────────────────────────────────────
          case "IDLE":
          default: {
            this.isRunning = false;
            break;
          }
        }
      } catch (err) {
        utils.log(`Unhandled error in [${this.state}]: ${err.message}`);
        stateLog("failed", this.state, `Unhandled exception: ${err.message}`);
        this.cleanup();
        this.state = "IDLE";
        this.isRunning = false;
      }

      // Yield between iterations to prevent CPU spin.
      // Only yield if we are still the active loop generation.
      if (this.isRunning && this._loopGen === myGen) {
        await utils.waitMs(50);
      }
    }
  }
}

// Make available globally in the content script context
window.automation = new AbidAutomation();
