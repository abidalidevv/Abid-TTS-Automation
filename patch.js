// patch.js - Intercept SpeechSynthesis to apply speed, pitch, and volume from local storage
// This script runs before the core automation files, keeping them 100% frozen.

(function() {
  let speed = 1.0;
  let pitch = 1.0;
  let volume = 1.0;

  // Initialize settings from chrome storage
  chrome.storage.local.get(["speed", "pitch", "volume"], (data) => {
    if (data.speed !== undefined) speed = parseFloat(data.speed);
    if (data.pitch !== undefined) pitch = parseFloat(data.pitch);
    if (data.volume !== undefined) volume = parseFloat(data.volume) / 100.0;
  });

  // Keep settings in sync with live storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {
      if (changes.speed !== undefined) {
        speed = parseFloat(changes.speed.newValue);
      }
      if (changes.pitch !== undefined) {
        pitch = parseFloat(changes.pitch.newValue);
      }
      if (changes.volume !== undefined) {
        volume = parseFloat(changes.volume.newValue) / 100.0;
      }
    }
  });

  // Intercept speak method to apply customized properties to SpeechSynthesisUtterance
  const originalSpeak = window.speechSynthesis.speak;
  window.speechSynthesis.speak = function(utterance) {
    if (utterance && utterance instanceof SpeechSynthesisUtterance) {
      utterance.rate = speed;
      utterance.pitch = pitch;
      utterance.volume = volume;
    }
    return originalSpeak.call(window.speechSynthesis, utterance);
  };
})();
