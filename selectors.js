// selectors.js - DOM element selectors for MargVoice Reading page
// ─────────────────────────────────────────────────────────────────
// TEMPORARY DEBUG MODE — remove all dbg() calls before release
// ─────────────────────────────────────────────────────────────────

const SELECTORS_DEBUG = true; // Set to false to silence debug logs

function dbg(...args) {
  if (SELECTORS_DEBUG) console.log("[Abid-TTS-Debug]", ...args);
}

function dbgElement(label, el) {
  if (!SELECTORS_DEBUG || !el) return;
  try {
    const tag = el.tagName ? el.tagName.toLowerCase() : "?";
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().replace(/\s+/g, ".").slice(0, 60)
      : "";
    const txt = (el.innerText || el.textContent || "").trim().slice(0, 80);
    const html = el.outerHTML ? el.outerHTML.slice(0, 200) : "(no outerHTML)";
    console.log(`[Abid-TTS-Debug] ${label}:`, `<${tag}${id}${cls}>`, `text="${txt}"`, "\n  HTML:", html);
  } catch (e) { }
}

function dbgRejected(el, reason) {
  if (!SELECTORS_DEBUG) return;
  try {
    const tag = el.tagName ? el.tagName.toLowerCase() : "?";
    const id = el.id ? `#${el.id}` : "";
    const txt = (el.innerText || el.textContent || "").trim().slice(0, 60);
    console.log(`[Abid-TTS-Debug]   REJECTED <${tag}${id}> text="${txt}" — reason: ${reason}`);
  } catch (e) { }
}

// ─────────────────────────────────────────────────────────────────

const SELECTORS = {
  // Paragraph/reading text containers — ordered by specificity
  paragraph: [
    '[data-testid="reading-text"]',
    '.reading-text',
    '.text-container',
    '.sentence-card',
    '.sentence',
    'div.text',
    'div.paragraph',
    '.card-body p',
    'article p',
    'main p'
  ],

  // Play/Record button
  playButton: [
    '[data-testid="play-btn"]',
    'button.play',
    '#play-button',
    '.play-btn'
  ],

  // Next button
  nextButton: [
    '[data-testid="next-btn"]',
    'button.next',
    '#next-button',
    '.next-btn'
  ],

  // Submit button
  submitButton: [
    '[data-testid="submit-btn"]',
    'button.submit',
    'button#btn-submit',
    'button[type="submit"]',
    'input[type="submit"]',
    '.submit-btn'
  ],

  // Modals / dialog overlays (Element Plus)
  modals: [
    '.el-overlay',
    '.el-dialog',
    '.el-overlay-dialog',
    '.el-message-box',
    '[class*="el-overlay"]',
    '[class*="el-dialog"]',
    '[class*="el-modal"]',
    'dialog'
  ],

  // Modal close buttons
  modalCloseButtons: [
    '.el-dialog__headerbtn',
    '.el-message-box__headerbtn',
    'button.el-dialog__close',
    '.close-btn',
    '[aria-label="Close"]',
    '[class*="close"]'
  ]
};

/**
 * Find a visible Element Plus style modal.
 */
function findVisibleModal() {
  dbg("--- POPUP SEARCH ---");
  let firstFound = null;

  for (const selector of SELECTORS.modals) {
    const el = document.querySelector(selector);
    if (el) {
      if (!firstFound) firstFound = el;
      if (utils.isElementVisible(el)) {
        dbg(`Popup FOUND via selector: "${selector}"`);
        dbgElement("Popup element", el);
        return el;
      } else {
        dbg(`  Selector "${selector}" matched but element is NOT visible`);
        dbgRejected(el, "not visible (display:none / visibility:hidden / opacity:0 / zero size)");
      }
    } else {
      dbg(`  Selector "${selector}" — no element found in DOM`);
    }
  }

  if (firstFound) {
    dbg("Popup: selectors matched but all were invisible. No visible modal.");
  } else {
    dbg("Popup: no matching elements in DOM. No modal present.");
  }
  return null;
}

/**
 * Find a close button within a modal.
 */
function findModalCloseButton(modal) {
  if (!modal) return null;
  dbg("--- POPUP CLOSE BUTTON SEARCH ---");

  for (const selector of SELECTORS.modalCloseButtons) {
    const el = modal.querySelector(selector);
    if (el) {
      if (utils.isElementEnabledAndVisible(el)) {
        dbg(`Close button FOUND via selector: "${selector}"`);
        dbgElement("Close button", el);
        return el;
      } else {
        dbg(`  Close selector "${selector}" matched but rejected`);
        dbgRejected(el, "not enabled/visible");
      }
    } else {
      dbg(`  Close selector "${selector}" — no match inside modal`);
    }
  }

  // Text/icon-based fallback
  dbg("  Falling back to text/icon scan inside modal...");
  const candidates = Array.from(modal.querySelectorAll('button, [role="button"], a'));
  dbg(`  Found ${candidates.length} button-like elements inside modal`);

  for (const btn of candidates) {
    if (!utils.isElementEnabledAndVisible(btn)) {
      dbgRejected(btn, "not enabled/visible");
      continue;
    }
    const txt = (btn.innerText || btn.textContent || '').trim().toLowerCase();
    const hasCloseIcon = btn.querySelector('.el-icon-close, [class*="close"], [class*="icon-x"]');
    const closeWords = ['x', '×', 'close', 'confirm', 'got it', 'ok', 'yes', 'बंद करें'];
    const matchedWord = closeWords.find(w => txt === w || txt.includes(w));
    if (matchedWord || hasCloseIcon) {
      dbg(`  Close button FOUND via text fallback, matched "${matchedWord || "icon"}"`);
      dbgElement("Close button (fallback)", btn);
      return btn;
    } else {
      dbgRejected(btn, `text "${txt}" did not match close keywords`);
    }
  }

  dbg("  No close button found inside modal.");
  return null;
}

/**
 * Find the reading paragraph element.
 */
function findParagraphToRead() {
  dbg("--- PARAGRAPH SEARCH ---");

  for (const selector of SELECTORS.paragraph) {
    const el = document.querySelector(selector);
    if (el) {
      const txt = el.innerText ? el.innerText.trim() : "";
      if (utils.isElementVisible(el) && txt.length > 0) {
        dbg(`Paragraph FOUND via selector: "${selector}"`);
        dbgElement("Paragraph element", el);
        return el;
      } else {
        if (!utils.isElementVisible(el)) {
          dbgRejected(el, "not visible");
        } else {
          dbgRejected(el, "empty text");
        }
      }
    } else {
      dbg(`  Paragraph selector "${selector}" — no element found`);
    }
  }

  dbg("Paragraph: no named selector matched. Returning null.");
  dbg("  TIP: Open DevTools, inspect the reading text element, and report its tag/class/id.");
  return null;
}

// Module-level cache to store the pre-click state of the play button
let lastPlayBtn = null;
let lastPlayBtnClassName = '';
let lastPlayBtnSvgHtml = '';

/**
 * Find the parent container that groups the player controls.
 * Moves up from the candidate element and finds the first ancestor containing between 3 and 6 visible button-like elements.
 */
function findControlGroupContainer(playBtn) {
  if (!playBtn) return null;
  let curr = playBtn.parentElement;
  while (curr && curr !== document.body) {
    const rawButtons = Array.from(curr.querySelectorAll('button, [role="button"], .is-circle, [class*="circle"]'))
      .filter(el => utils.isElementVisible(el));

    // Filter out inner elements that are nested inside other matched elements (e.g. paths, svgs, icons)
    const buttons = rawButtons.filter(el => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'svg' || tag === 'path' || tag === 'i') return false;
      return !rawButtons.some(other => other !== el && other.contains(el));
    });

    if (buttons.length >= 3 && buttons.length <= 6) {
      return { container: curr, buttons };
    }
    curr = curr.parentElement;
  }
  return null;
}

/**
 * Find the Play/Record button using structural class detection.
 *
 * MargVoice recorder controls always contain exactly 4 buttons:
 *   [Previous] [Reset] [Play] [Next]
 * The Play button is the large circular one with Tailwind classes:
 *   is-circle  !w-16  !h-16  (usually bg-violet-600)
 * It contains the microphone SVG — never rely on button text.
 */
function findPlayButton() {
  dbg("--- PLAY BUTTON SEARCH (structural) ---");

  // Collect all elements with the 'is-circle' class or button tag or role="button" or div/span/a
  const allElements = Array.from(document.querySelectorAll('.is-circle, [class*="is-circle"], button, [role="button"], div, span'));
  dbg(`  Total candidates on page: ${allElements.length}`);

  // ── Step 1: candidates that carry is-circle ──────────────────────────────
  const circleElements = allElements.filter(el => {
    const cls = (typeof el.className === 'string' ? el.className : (el.getAttribute && el.getAttribute('class')) || '');
    return cls.includes('is-circle');
  });
  dbg(`  Candidates with 'is-circle': ${circleElements.length}`);
  circleElements.forEach(el => dbgElement("  is-circle candidate", el));

  // ── Step 2: narrow by size classes (!w-16 !h-16) ────────────────────────
  const sizedElements = circleElements.filter(el => {
    const cls = (typeof el.className === 'string' ? el.className : (el.getAttribute && el.getAttribute('class')) || '');
    return (cls.includes('!w-16') || cls.includes('w-16')) &&
      (cls.includes('!h-16') || cls.includes('h-16'));
  });
  dbg(`  Candidates with is-circle + size classes: ${sizedElements.length}`);
  sizedElements.forEach(el => dbgElement("  sized candidate", el));

  // ── Step 3: score each sized candidate ──────────────────────────────────
  let best = null;
  let bestScore = -1;

  for (const el of sizedElements) {
    const cls = (typeof el.className === 'string' ? el.className : (el.getAttribute && el.getAttribute('class')) || '');
    const visible = utils.isElementEnabledAndVisible(el);
    if (!visible) {
      dbgRejected(el, "not enabled/visible");
      continue;
    }

    let score = 0;
    // Violet background = strong play button signal
    if (cls.includes('bg-violet')) score += 20;
    // Contains SVG
    if (el.querySelector('svg')) score += 10;

    // Check if it has 3 sibling buttons in its control group
    const groupInfo = findControlGroupContainer(el);
    if (groupInfo) {
      score += 15;
      dbg(`    Found control group with ${groupInfo.buttons.length} buttons`);
    }

    dbg(`  Scored candidate: score=${score}, class="${cls.slice(0, 100)}"`);
    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  }

  if (best) {
    dbg(`Play button FOUND via structural detection (score=${bestScore})`);
    dbgElement("Play button", best);

    // Capture pre-click state
    lastPlayBtn = best;
    lastPlayBtnClassName = (typeof best.className === 'string' ? best.className : (best.getAttribute && best.getAttribute('class')) || '');
    const svg = best.querySelector('svg');
    lastPlayBtnSvgHtml = svg ? svg.outerHTML : '';

    return best;
  }

  // ── Step 4: fall back — any is-circle button with an SVG ───────
  dbg("  No sized circle button found. Falling back to SVG scan...");
  for (const el of circleElements) {
    if (!utils.isElementEnabledAndVisible(el)) continue;
    const svg = el.querySelector('svg');
    if (svg) {
      dbg("  Play button FOUND via is-circle + SVG fallback");
      dbgElement("Play button (SVG fallback)", el);

      // Capture pre-click state
      lastPlayBtn = el;
      lastPlayBtnClassName = (typeof el.className === 'string' ? el.className : (el.getAttribute && el.getAttribute('class')) || '');
      lastPlayBtnSvgHtml = svg.outerHTML;

      return el;
    }
  }

  // ── Step 5: last resort — dump all visible buttons for manual inspection ─
  dbg("Play button: NO MATCH FOUND via any strategy.");
  dbg("  Dumping all visible enabled elements matching '.is-circle':");
  circleElements.forEach(el => {
    if (utils.isElementEnabledAndVisible(el)) {
      dbgElement("  visible circle element", el);
    }
  });
  return null;
}

/**
 * Select all text within an element using the Selection API.
 */
function selectElementText(el) {
  if (!el) return;
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (e) {
    utils.log("Selection API error:", e.message);
  }
}

/**
 * Find a visible and enabled Submit button.
 */
function findSubmitButton() {
  dbg("--- SUBMIT BUTTON SEARCH ---");
  const candidates = Array.from(document.querySelectorAll(
    'button, input[type="submit"], input[type="button"], [role="button"]'
  ));
  dbg(`  Found ${candidates.length} button-like candidates`);

  for (const el of candidates) {
    const text = (el.innerText || el.value || el.textContent || '').trim().toLowerCase();
    if (!utils.isElementVisible(el)) {
      // Only log submit-text elements to avoid flooding
      if (text.includes('submit')) dbgRejected(el, "not visible");
      continue;
    }
    if (el.disabled) { if (text.includes('submit')) dbgRejected(el, "disabled attribute"); continue; }
    if (el.classList.contains('is-disabled') || el.classList.contains('disabled')) {
      if (text.includes('submit')) dbgRejected(el, "disabled CSS class");
      continue;
    }
    if (el.getAttribute('aria-disabled') === 'true') {
      if (text.includes('submit')) dbgRejected(el, "aria-disabled=true");
      continue;
    }
    if (text.includes('submit')) {
      dbg(`Submit button FOUND, text="${text}"`);
      dbgElement("Submit button", el);
      return el;
    }
  }

  dbg("Submit: no enabled visible Submit button found.");
  return null;
}

/**
 * Find a visible and enabled Next button.
 */
function findNextButton() {
  dbg("--- NEXT BUTTON SEARCH (structural & text) ---");

  // Strategy 1: Sibling-based structural detection from Play button
  const playBtn = findPlayButton();
  if (playBtn) {
    const groupInfo = findControlGroupContainer(playBtn);
    if (groupInfo) {
      // Find the index of the play button in the control group
      const playIndex = groupInfo.buttons.indexOf(playBtn);
      if (playIndex !== -1 && playIndex + 1 < groupInfo.buttons.length) {
        const nextBtn = groupInfo.buttons[playIndex + 1];
        if (utils.isElementEnabledAndVisible(nextBtn)) {
          dbg("Next button FOUND structurally in control group after Play button");
          dbgElement("Next button (structural)", nextBtn);
          return nextBtn;
        } else {
          dbg("Next button sibling found but is disabled/invisible");
        }
      }
    }
  }

  // Strategy 2: Text/Attribute based search
  const candidates = Array.from(document.querySelectorAll(
    'button, input[type="button"], [role="button"], div, span, a'
  ));
  dbg(`  Found ${candidates.length} candidates for next button text scan`);

  for (const el of candidates) {
    if (!utils.isElementEnabledAndVisible(el)) continue;

    const text = (el.innerText || el.value || el.textContent || '').trim().toLowerCase();
    const cls = typeof el.className === 'string' ? el.className.toLowerCase() : '';
    const id = el.id ? el.id.toLowerCase() : '';
    const aria = el.getAttribute('aria-label') ? el.getAttribute('aria-label').toLowerCase() : '';

    if (
      text.includes('next') || text === 'आगे' ||
      cls.includes('next') || id.includes('next') ||
      aria.includes('next')
    ) {
      dbg("Next button FOUND via text/class/aria search");
      dbgElement("Next button", el);
      return el;
    }

    // Check SVG child
    const svg = el.querySelector('svg');
    if (svg) {
      const html = svg.outerHTML.toLowerCase();
      if (html.includes('right') || html.includes('next') || html.includes('forward') || html.includes('chevron')) {
        dbg("Next button FOUND via SVG check");
        dbgElement("Next button (SVG check)", el);
        return el;
      }
    }
  }

  dbg("Next: no enabled visible Next button found.");
  return null;
}

/**
 * Check if the page accepted the Play/Record button click.
 *
 * MargVoice does NOT use an <audio> element or text change to signal recording.
 * Instead, the button itself changes state after a successful click:
 *   - bg-violet-600 is replaced by a different color (e.g. bg-red-500 for active recording)
 *   - OR the button becomes disabled while recording processes
 *   - OR the button element is removed from the DOM (DOM swap pattern)
 *   - OR an active/recording CSS class is added
 *
 * @param {Element} clickedElement — the exact button element we clicked
 */
function isPagePlaying(clickedElement) {
  dbg("--- isPagePlaying CHECK ---");

  // Check 1: Any <audio> element is actively playing (backup signal)
  const audios = Array.from(document.querySelectorAll('audio'));
  for (const audio of audios) {
    if (!audio.paused) {
      dbg("isPagePlaying: TRUE — audio element not paused");
      return true;
    }
  }

  // Check 2: Active recording or loading indicators visible on the page
  const recordingIndicator = document.querySelector(
    '[class*="recording"], [class*="is-loading"], [aria-label*="stop"], [aria-label*="Stop"]'
  );
  if (recordingIndicator && utils.isElementVisible(recordingIndicator)) {
    dbg("isPagePlaying: TRUE — recording/loading indicator visible on page");
    return true;
  }

  // Check 3: Current state of the center circular button
  const recordBtn = findPlayButton();
  if (recordBtn) {
    // If the button itself is disabled, it is in a processing/active state
    if (recordBtn.disabled ||
      recordBtn.getAttribute('aria-disabled') === 'true' ||
      recordBtn.classList.contains('is-disabled') ||
      recordBtn.classList.contains('disabled')) {
      dbg("isPagePlaying: TRUE — Record button is disabled");
      return true;
    }

    // Check class names for active recording/playing/loading
    const cls = (typeof recordBtn.className === 'string' ? recordBtn.className : (recordBtn.getAttribute && recordBtn.getAttribute('class')) || '');
    if (cls.includes('bg-red') ||
      cls.includes('bg-rose') ||
      cls.includes('bg-orange') ||
      cls.includes('active') ||
      cls.includes('recording') ||
      cls.includes('is-loading') ||
      cls.includes('playing')) {
      dbg("isPagePlaying: TRUE — Record button has active/recording class");
      return true;
    }

    // Check SVG child for stop/pause indicators
    const svg = recordBtn.querySelector('svg');
    if (svg) {
      const title = svg.querySelector('title');
      if (title) {
        const t = (title.textContent || '').toLowerCase();
        if (t.includes('stop') || t.includes('square') || t.includes('pause')) {
          dbg("isPagePlaying: TRUE — SVG title indicates stop/pause icon: " + t);
          return true;
        }
      }
      const html = svg.outerHTML.toLowerCase();
      if (html.includes('stop') || html.includes('pause') || html.includes('square')) {
        dbg("isPagePlaying: TRUE — SVG content contains stop/pause/square");
        return true;
      }
    }
  }

  dbg("isPagePlaying: FALSE — Record button is idle");
  return false;
}

/**
 * Find the currently highlighted task index in the task navigation.
 */
function getCurrentTaskIndex() {
  dbg("--- GET CURRENT TASK INDEX ---");
  
  // Find all elements with exact bg-violet-600 highlight
  const highlighted = Array.from(document.querySelectorAll('.bg-violet-600'));
  
  for (const el of highlighted) {
    const text = (el.innerText || el.textContent || '').trim();
    if (/^[1-5]$/.test(text)) {
      const num = parseInt(text, 10);
      console.log("Current Task Index =", num);
      console.log("Purple Element HTML =", el.outerHTML);
      dbg(`getCurrentTaskIndex: FOUND active task index ${num} from highlighted element`);
      return num;
    }
  }

  // Fallback: search all elements with single digits and active class matches
  const elements = Array.from(document.querySelectorAll('span, div, button, li, a'));
  for (const el of elements) {
    const text = (el.innerText || el.textContent || '').trim();
    if (/^[1-5]$/.test(text)) {
      const cls = (typeof el.className === 'string' ? el.className : (el.getAttribute && el.getAttribute('class')) || '').toLowerCase();
      if (cls.includes('active') || cls.includes('is-active') || cls.includes('current')) {
        const num = parseInt(text, 10);
        console.log("Current Task Index (fallback) =", num);
        console.log("Purple Element HTML (fallback) =", el.outerHTML);
        dbg(`getCurrentTaskIndex (fallback): FOUND active task index ${num}`);
        return num;
      }
    }
  }
  
  console.log("Current Task Index = null");
  dbg("getCurrentTaskIndex: No highlighted task index found.");
  return null;
}

// Make available globally in the content script context
window.selectors = {
  findVisibleModal,
  findModalCloseButton,
  findParagraphToRead,
  findPlayButton,
  selectElementText,
  findSubmitButton,
  findNextButton,
  isPagePlaying,
  getCurrentTaskIndex
};
