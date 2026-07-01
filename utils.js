// utils.js - Shared helper utilities for Abid TTS Automation

const LOG_PREFIX = "[Automation]";

/**
 * Log message with prefix
 */
function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

/**
 * Wait for a specified number of milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function waitMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify if an element is visible in the viewport.
 * Checks display, visibility, opacity, and physical dimensions.
 * Does NOT check pointer-events since el.click() bypasses CSS pointer-events.
 */
function isElementVisible(el) {
  if (!el) return false;
  try {
    const style = window.getComputedStyle(el);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
  } catch (e) {}
  // Must occupy real space on the page
  return el.offsetWidth > 0 && el.offsetHeight > 0;
}

/**
 * Verify if an element is enabled and visible.
 * Checks all disabled states used by Element Plus and standard HTML.
 */
function isElementEnabledAndVisible(el) {
  if (!el) return false;
  if (el.disabled) return false;
  if (el.classList.contains('disabled')) return false;
  if (el.classList.contains('is-disabled')) return false;
  if (el.getAttribute('aria-disabled') === 'true') return false;
  return isElementVisible(el);
}

/**
 * Normalize whitespace and case for robust text comparison
 */
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Make available globally in the content script context
window.utils = {
  log,
  waitMs,
  isElementVisible,
  isElementEnabledAndVisible,
  normalizeText
};
