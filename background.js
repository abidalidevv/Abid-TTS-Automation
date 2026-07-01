// background.js - Service worker for Abid TTS Automation Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log("Abid TTS Automation Extension installed successfully.");
  
  // Set default settings
  chrome.storage.local.set({
    automationActive: false,
    autoStartEnabled: false
  });
});
