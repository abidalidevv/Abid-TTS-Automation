// popup.js - Controller for Abid TTS Automation popup UI

document.addEventListener("DOMContentLoaded", () => {
  const btnStart = document.getElementById("btnStart");
  const btnStop = document.getElementById("btnStop");
  const chkAutoStart = document.getElementById("chkAutoStart");
  const voiceSelect = document.getElementById("voiceSelect");
  const speedSelect = document.getElementById("speedSelect");
  const pitchSelect = document.getElementById("pitchSelect");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  const statusEl = document.getElementById("status");
  const stateEl = document.getElementById("state");
  const logsEl = document.getElementById("logs");

  let voices = [];

  // Helper to categorize voice locales into target groups
  function getLanguageGroup(voice) {
    const lang = voice.lang.toLowerCase();
    if (lang.startsWith('en')) return 'English';
    if (lang.startsWith('hi')) return 'Hindi';
    if (lang.startsWith('ur')) return 'Urdu';
    if (lang.startsWith('ta')) return 'Tamil';
    return 'Other';
  }

  // Retrieve base language display names for Other categories
  function getLanguageName(langCode) {
    try {
      const parts = langCode.split('-');
      const baseLang = new Intl.DisplayNames(['en'], { type: 'language' }).of(parts[0]);
      return baseLang || langCode;
    } catch (e) {
      return langCode;
    }
  }

  // Format option names to match branding requirements
  function formatVoiceOptionText(voice, groupName) {
    let name = voice.name;
    
    // Clean up Microsoft/Google redundant descriptors
    name = name.replace(/Desktop - [^-]+/gi, '');
    name = name.replace(/ - [^-]+/gi, '');
    name = name.replace(/Natural/gi, 'Natural');
    
    if (name.length > 25) {
      name = name.slice(0, 24) + '…';
    }
    
    const langLabel = groupName === 'Other' ? getLanguageName(voice.lang) : groupName;
    return `${name} (${langLabel})`;
  }

  // Load voices, filter duplicates, sort alphabetically, and group by optgroup
  function populateVoices() {
    if (typeof window.speechSynthesis === 'undefined') return;
    
    voices = window.speechSynthesis.getVoices();
    const currentVal = voiceSelect.value;
    
    // Clear dropdown and add default
    voiceSelect.innerHTML = '<option value="">(Default Browser Voice)</option>';
    
    const groups = {
      English: [],
      Hindi: [],
      Urdu: [],
      Tamil: [],
      Other: []
    };

    const seenNames = new Set();
    const sortedVoices = [...voices].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedVoices.forEach(voice => {
      if (seenNames.has(voice.name)) return;
      seenNames.add(voice.name);
      
      const groupName = getLanguageGroup(voice);
      groups[groupName].push(voice);
    });

    // Populate each non-empty group category
    Object.keys(groups).forEach(groupName => {
      const list = groups[groupName];
      if (list.length === 0) return; // Hide group if no voices match

      const optGroup = document.createElement("optgroup");
      optGroup.label = groupName;
      
      list.forEach(voice => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = formatVoiceOptionText(voice, groupName);
        optGroup.appendChild(option);
      });
      voiceSelect.appendChild(optGroup);
    });

    // Restore selection state
    if (currentVal) {
      voiceSelect.value = currentVal;
    } else {
      chrome.storage.local.get(["selectedVoice"], (data) => {
        if (data.selectedVoice) {
          voiceSelect.value = data.selectedVoice;
        }
      });
    }
  }

  // Handle async SpeechSynthesis API voice loads
  if (typeof window.speechSynthesis !== 'undefined') {
    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }

  // Save voice selection changes
  voiceSelect.addEventListener("change", () => {
    const val = voiceSelect.value;
    chrome.storage.local.set({ selectedVoice: val }, () => {
      addLog(`Selected voice: ${val || "Default"}`);
    });
  });

  // Load and apply speech settings
  function loadVoiceSettings() {
    chrome.storage.local.get(["speed", "pitch", "volume"], (data) => {
      if (data.speed !== undefined) {
        speedSelect.value = data.speed;
      }
      if (data.pitch !== undefined) {
        pitchSelect.value = data.pitch;
      }
      if (data.volume !== undefined) {
        volumeSlider.value = data.volume;
        volumeValue.textContent = `${data.volume}%`;
      }
    });
  }

  // Bind speed, pitch, and volume adjustments
  speedSelect.addEventListener("change", () => {
    chrome.storage.local.set({ speed: speedSelect.value }, () => {
      addLog(`Speech speed set to: ${speedSelect.value}x`);
    });
  });

  pitchSelect.addEventListener("change", () => {
    chrome.storage.local.set({ pitch: pitchSelect.value }, () => {
      addLog(`Speech pitch set to: ${pitchSelect.value}`);
    });
  });

  volumeSlider.addEventListener("input", (e) => {
    const val = e.target.value;
    volumeValue.textContent = `${val}%`;
    chrome.storage.local.set({ volume: val });
  });

  volumeSlider.addEventListener("change", (e) => {
    addLog(`Speech volume set to: ${e.target.value}%`);
  });

  // Load state and updates popup UI
  function updateUI() {
    chrome.storage.local.get(["automationActive", "autoStartEnabled", "currentState", "selectedVoice"], (data) => {
      const isActive = !!data.automationActive;
      const isAutoStart = !!data.autoStartEnabled;
      const currentState = data.currentState || "IDLE";

      // Translate status into premium indicators
      let statusLabel = "Stopped";
      let statusClass = "status-stopped";
      let dotClass = "dot-stopped";

      if (isActive) {
        if (currentState === "IDLE" || currentState === "PAGE_DETECTED" || currentState === "WAIT_DOM") {
          statusLabel = "Ready";
          statusClass = "status-ready";
          dotClass = "dot-ready";
        } else {
          statusLabel = "Running";
          statusClass = "status-running";
          dotClass = "dot-running";
        }
      }

      statusEl.textContent = statusLabel;
      statusEl.className = `status-text ${statusClass}`;
      
      const indicatorEl = document.getElementById("statusIndicator");
      if (indicatorEl) {
        indicatorEl.className = `status-dot ${dotClass}`;
      }

      stateEl.textContent = currentState;

      btnStart.disabled = isActive;
      btnStop.disabled = !isActive;
      chkAutoStart.checked = isAutoStart;

      if (data.selectedVoice && voiceSelect.value !== data.selectedVoice) {
        voiceSelect.value = data.selectedVoice;
      }
    });
  }

  // Bind Start button
  btnStart.addEventListener("click", () => {
    chrome.storage.local.set({ automationActive: true }, () => {
      addLog("Automation activated by user");
      updateUI();
    });
  });

  // Bind Stop button
  btnStop.addEventListener("click", () => {
    chrome.storage.local.set({ automationActive: false }, () => {
      addLog("Automation deactivated by user");
      updateUI();
    });
  });

  // Bind Auto Start checkbox
  chkAutoStart.addEventListener("change", (e) => {
    chrome.storage.local.set({ autoStartEnabled: e.target.checked }, () => {
      addLog(`Auto-start turned ${e.target.checked ? "on" : "off"}`);
    });
  });

  // Helper to add dynamic UI logs
  function addLog(message) {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logsEl.appendChild(entry);
    logsEl.scrollTop = logsEl.scrollHeight;
  }

  // Watch for storage changes to update UI elements live
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {
      updateUI();
    }
  });

  // Initial load
  updateUI();
  loadVoiceSettings();
});
