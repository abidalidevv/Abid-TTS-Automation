// content.js - Bootstrapper for Abid TTS content scripts

(function() {
  // Prevent duplicate content script loads
  if (window.abidTtsContentScriptLoaded) {
    return;
  }
  window.abidTtsContentScriptLoaded = true;

  // Bug 1 fix: guard against automation.js failing to load
  if (!window.automation) {
    console.error("[Abid-TTS] FATAL: automation.js did not load correctly. Aborting content script.");
    return;
  }

  utils.log("Content Script Loaded");

  let lastUrl = "";
  let automationInitiatedOnCurrentUrl = false;

  function isMatchedUrl(url) {
    return url.startsWith("https://margvoice.com/projects/execute/reading");
  }

  function handleUrlChange() {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    // Reset initiation flag on every URL change (Bug 7 fix: enables re-trigger on back-navigation)
    automationInitiatedOnCurrentUrl = false;

    if (isMatchedUrl(currentUrl)) {
      utils.log("MargVoice Detected");

      // Auto Start: check storage settings
      chrome.storage.local.get(["automationActive", "autoStartEnabled"], (data) => {
        if (!automationInitiatedOnCurrentUrl && (data.automationActive || data.autoStartEnabled)) {
          automationInitiatedOnCurrentUrl = true;
          chrome.storage.local.set({ automationActive: true }, () => {
            if (window.automation) automation.start();
          });
        }
      });
    } else {
      // Navigated away — stop automation
      if (window.automation) automation.stop();
    }
  }

  // Poll for URL change (SPA navigation detection)
  setInterval(handleUrlChange, 500);

  // Storage listener: start/stop based on user popup commands
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.automationActive) {
      const active = changes.automationActive.newValue;
      if (active && isMatchedUrl(location.href)) {
        if (!window.automation || !window.automation.isRunning) {
          automationInitiatedOnCurrentUrl = true;
          if (window.automation) automation.start();
        }
      } else {
        // Bug 10 fix: reset flag on stop so Start button works again on same URL
        automationInitiatedOnCurrentUrl = false;
        if (window.automation) automation.stop();
      }
    }
  });

  // Initial trigger on script load
  handleUrlChange();
})();
