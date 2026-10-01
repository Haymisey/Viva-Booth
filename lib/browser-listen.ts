type ResultRow = { isFinal: boolean; 0?: { transcript?: string } };
type RecError = { error?: string };

type Rec = {
  start: () => void;
  stop: () => void;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<ResultRow> }) => void) | null;
  onerror: ((ev: RecError) => void) | null;
  onend: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
};

export type MicFailureReason =
  | "unsupported"
  | "permission_denied"
  | "unavailable"
  | "network"
  | "start_failed"
  | "unknown";

const RETRIES = 4;

function ctor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function reasonFromError(error: string | undefined): MicFailureReason | null {
  if (!error || error === "aborted" || error === "no-speech") return null;
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "permission_denied";
  }
  if (error === "audio-capture") return "unavailable";
  if (error === "network") return "network";
  return "unknown";
}

export function startBrowserListen(options: {
  lang: string;
  onText: (text: string) => void;
  onError: (reason: MicFailureReason) => void;
}): () => void {
  const Ctor = ctor();
  if (!Ctor) {
    options.onError("unsupported");
    return () => {};
  }

  let stopped = false;
  let restarts = 0;
  let rec: Rec | null = null;
  let restartTimer: number | undefined;
  let committed = "";
  let interim = "";
  let fatal = false;

  const emit = () => {
    const full = `${committed} ${interim}`.replace(/\s+/g, " ").trim();
    if (full) options.onText(full);
  };

  const scheduleRestart = (reason: MicFailureReason | null) => {
    if (stopped || restartTimer !== undefined) return;
    if (restarts >= RETRIES) {
      if (reason) options.onError(reason);
      return;
    }
    restarts += 1;
    restartTimer = window.setTimeout(() => {
      restartTimer = undefined;
      arm();
    }, 400);
  };

  const arm = () => {
    if (stopped) return;
    const next = new Ctor();
    rec = next;
    next.continuous = true;
    next.interimResults = true;
    next.lang = options.lang;
    next.onresult = (ev) => {
      restarts = 0;
      let finalPiece = "";
      let pending = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const row = ev.results[i];
        const text = row[0]?.transcript ?? "";
        if (row.isFinal) finalPiece += text;
        else pending += text;
      }
      if (finalPiece.trim()) {
        committed = `${committed} ${finalPiece}`.replace(/\s+/g, " ").trim();
        interim = "";
      }
      if (pending.trim()) interim = pending.trim();
      emit();
    };
    next.onerror = (ev) => {
      const reason = reasonFromError(ev.error);
      if (!reason) return;
      if (reason === "network") {
        scheduleRestart(reason);
        return;
      }
      fatal = true;
      options.onError(reason);
    };
    next.onend = () => {
      if (rec !== next || fatal) return;
      scheduleRestart("network");
    };
    try {
      next.start();
    } catch {
      scheduleRestart("start_failed");
    }
  };

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  arm();

  return () => {
    stopped = true;
    if (restartTimer !== undefined) window.clearTimeout(restartTimer);
    try {
      rec?.stop();
    } catch {
      /* already stopped */
    }
  };
}
