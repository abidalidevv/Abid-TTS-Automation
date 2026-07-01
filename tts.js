// tts.js - Browser SpeechSynthesis API wrapper for Abid TTS Automation

class BrowserTTS {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }

  /**
   * Automatically detect document language
   */
  detectLanguage() {
    let lang = document.documentElement.lang ||
      (document.querySelector('html') ? document.querySelector('html').getAttribute('lang') : 'en-US');
    if (lang) {
      lang = lang.split(',')[0].replace(/_/g, '-').trim();
    }
    return lang || 'en-US';
  }

  /**
   * Speak the specified text using SpeechSynthesis.
   * Always cancels any existing speech first.
   * Includes a keepalive to prevent the Chrome stall bug on longer texts.
   * @param {string} text
   * @param {string|null} lang
   * @returns {Promise<void>}
   */
  async speak(text, lang = null) {
    // Always cancel existing speech before starting — never silently skip
    this.cancel();
    await utils.waitMs(100);

    return new Promise((resolve, reject) => {
      if (!text || !text.trim()) {
        resolve();
        return;
      }

      chrome.storage.local.get(["selectedVoice"], (data) => {
        const speakLang = lang || this.detectLanguage();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speakLang;

        if (data.selectedVoice) {
          const voices = this.synth.getVoices();
          const matchedVoice = voices.find(v => v.name === data.selectedVoice);
          if (matchedVoice) {
            utterance.voice = matchedVoice;
            utterance.lang = matchedVoice.lang;
            utils.log(`Using selected voice: ${matchedVoice.name}`);
          } else {
            utils.log(`Selected voice "${data.selectedVoice}" not found. Falling back to default.`);
          }
        } else {
          utils.log(`Using default voice.`);
        }

        this.currentUtterance = utterance;

        // Chrome bug fix: speechSynthesis stalls on longer texts.
        // The pause/resume keepalive every 10 seconds prevents the browser from
        // silently halting the utterance and never firing onend.
        let keepAliveInterval = setInterval(() => {
          if (this.synth.speaking) {
            this.synth.pause();
            this.synth.resume();
          }
        }, 10000);

        const cleanup = () => {
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
          }
          this.currentUtterance = null;
        };

        utterance.onend = () => {
          utils.log("Speech Finished");
          cleanup();
          resolve();
        };

        utterance.onerror = (event) => {
          if (event.error === 'interrupted' || event.error === 'canceled') {
            cleanup();
            resolve();
            return;
          }
          utils.log("Speech error:", event.error);
          cleanup();
          reject(new Error("Speech synthesis error: " + event.error));
        };

        utils.log("Speech Started");
        this.synth.speak(utterance);
      });
    });
  }

  /**
   * Cancel ongoing speech
   */
  cancel() {
    if (this.synth.speaking || this.synth.pending) {
      utils.log("Speech Cancelled");
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
}

// Make available globally in the content script context
window.tts = new BrowserTTS();
