import type { Language } from '@/lib/i18n';

export const supportedLanguages: Record<Language, { name: string; code: string }> = {
  en: { name: 'English', code: 'en-US' },
  hi: { name: 'हिंदी', code: 'hi-IN' },
  bn: { name: 'বাংলা', code: 'bn-IN' },
};

export function speakText(text: string, language: Language = 'en'): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if speech synthesis is available
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set language
    const langCode = supportedLanguages[language]?.code || 'en-US';
    utterance.lang = langCode;

    // Set voice properties for better quality
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to select appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.lang.startsWith(language) ||
        voice.lang.startsWith(langCode.split('-')[0])
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Handle completion
    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    // Speak the text
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeakingSupported(): boolean {
  return 'speechSynthesis' in window;
}

// Ensure voices are loaded
export function loadVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    // Voices are usually loaded, but sometimes need to be requested
    if (window.speechSynthesis.getVoices().length > 0) {
      resolve();
      return;
    }

    // Wait for voices to load
    window.speechSynthesis.onvoiceschanged = () => {
      resolve();
    };

    // Timeout after 2 seconds
    setTimeout(() => resolve(), 2000);
  });
}
