import type { SpeechLocale } from "./metrics";

export type RecognizerErrorReason =
  | "unsupported"
  | "permission_denied"
  | "language_not_supported"
  | "unavailable"
  | "network"
  | "start_failed"
  | "no_speech"
  | "unknown";

export type RecognizerOptions = {
  locale?: SpeechLocale;
  onInterim?: (interimText: string) => void;
  onFinal?: (finalSegment: string, fullTranscript: string) => void;
  onError?: (reason: RecognizerErrorReason, rawError?: string) => void;
  onEnd?: () => void;
  onStateChange?: (isListening: boolean) => void;
};

export type RecognizerInstance = {
  start: () => Promise<boolean>;
  stop: () => void;
  abort: () => void;
  getTranscript: () => string;
  setTranscript: (text: string) => void;
  setLocale: (locale: SpeechLocale) => void;
  isListening: () => boolean;
};

// Rate-limiting window for auto-restart loops: max 3 restarts per 5000ms
const RESTART_WINDOW_MS = 5000;
const MAX_RESTARTS_IN_WINDOW = 3;

function getSpeechRecognitionConstructor(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export async function getMicrophonePermissionStatus(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (typeof navigator === "undefined" || !navigator.permissions) {
    return "unsupported";
  }
  try {
    const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return result.state;
  } catch {
    return "unsupported";
  }
}

/**
 * Creates an intelligent, continuous SpeechRecognition wrapper.
 * Features auto-restart with loop protection and Ge'ez (Amharic) / English locale support.
 */
export function createRecognizer(options: RecognizerOptions = {}): RecognizerInstance {
  const SpeechRecognitionCtor = getSpeechRecognitionConstructor();

  let activeLocale: SpeechLocale = options.locale || "en-US";
  let recognition: any = null;
  let isDesiredRunning = false;
  let currentlyListening = false;
  let accumulatedTranscript = "";
  let restartTimestamps: number[] = [];

  const mapError = (errString: string): RecognizerErrorReason => {
    switch (errString) {
      case "not-allowed":
      case "service-not-allowed":
        return "permission_denied";
      case "language-not-supported":
        return "language_not_supported";
      case "audio-capture":
        return "unavailable";
      case "network":
        return "network";
      case "no-speech":
        return "no_speech";
      default:
        return "unknown";
    }
  };

  const notifyState = (state: boolean) => {
    if (currentlyListening !== state) {
      currentlyListening = state;
      options.onStateChange?.(state);
    }
  };

  const setupInstance = () => {
    if (!SpeechRecognitionCtor) return null;

    const instance = new SpeechRecognitionCtor();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = activeLocale.startsWith("am") ? "am-ET" : "en-US";

    instance.onstart = () => {
      notifyState(true);
    };

    instance.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || "";
        if (item.isFinal) {
          accumulatedTranscript = accumulatedTranscript.trim()
            ? `${accumulatedTranscript.trim()} ${text.trim()}`
            : text.trim();
          options.onFinal?.(text.trim(), accumulatedTranscript);
        } else {
          interim += text;
        }
      }
      options.onInterim?.(interim);
    };

    instance.onerror = (event: any) => {
      const errorMsg = event.error || "unknown";
      const reason = mapError(errorMsg);

      // "no-speech" is a benign browser timeout; don't terminate desired state
      if (reason === "no_speech") {
        return;
      }

      options.onError?.(reason, errorMsg);

      if (reason === "permission_denied" || reason === "language_not_supported") {
        isDesiredRunning = false;
      }
    };

    instance.onend = () => {
      notifyState(false);
      options.onEnd?.();

      // Auto-restart if we are still supposed to be recording
      if (isDesiredRunning) {
        const now = Date.now();
        restartTimestamps = restartTimestamps.filter((t) => now - t < RESTART_WINDOW_MS);

        if (restartTimestamps.length >= MAX_RESTARTS_IN_WINDOW) {
          isDesiredRunning = false;
          options.onError?.("unknown", "Excessive microphone restart loop detected.");
          return;
        }

        restartTimestamps.push(now);
        try {
          instance.start();
        } catch {
          // Restart attempt failed; recreate instance on next cycle
          recognition = setupInstance();
          try {
            recognition?.start();
          } catch {
            isDesiredRunning = false;
          }
        }
      }
    };

    return instance;
  };

  return {
    start: async () => {
      if (!SpeechRecognitionCtor) {
        options.onError?.("unsupported");
        return false;
      }

      isDesiredRunning = true;
      restartTimestamps = [];

      try {
        if (!recognition) {
          recognition = setupInstance();
        }
        recognition.start();
        return true;
      } catch (err: unknown) {
        // If already started, ignore error
        if (currentlyListening) return true;

        // Try fresh recreation once
        recognition = setupInstance();
        try {
          recognition.start();
          return true;
        } catch {
          isDesiredRunning = false;
          options.onError?.("start_failed", String(err));
          return false;
        }
      }
    },

    stop: () => {
      isDesiredRunning = false;
      try {
        recognition?.stop();
      } catch {
        /* ignore */
      }
      notifyState(false);
    },

    abort: () => {
      isDesiredRunning = false;
      try {
        recognition?.abort();
      } catch {
        /* ignore */
      }
      notifyState(false);
    },

    getTranscript: () => accumulatedTranscript,

    setTranscript: (text: string) => {
      accumulatedTranscript = text;
    },

    setLocale: (newLocale: SpeechLocale) => {
      activeLocale = newLocale;
      if (recognition) {
        recognition.lang = newLocale.startsWith("am") ? "am-ET" : "en-US";
      }
    },

    isListening: () => currentlyListening,
  };
}
