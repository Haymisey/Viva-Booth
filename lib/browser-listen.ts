type ResultRow = { isFinal: boolean; 0?: { transcript?: string } };
type RecError = { error?: string };

type Rec = {
  start: () => void;
  stop: () => void;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<ResultRow> }) => void) | null;
  onerror: ((ev: RecError) => void) | null;
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
  onFinal: (text: string) => void;
  onError: (reason: MicFailureReason) => void;
}): () => void {
  const Ctor = ctor();
  if (!Ctor) {
    options.onError("unsupported");
    return () => {};
  }
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = options.lang;
  rec.onerror = (ev) => {
    const reason = reasonFromError(ev.error);
    if (reason) options.onError(reason);
  };
  rec.onresult = (ev) => {
    let piece = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const row = ev.results[i];
      if (row.isFinal) piece += row[0]?.transcript ?? "";
    }
    if (piece.trim()) options.onFinal(piece);
  };
  try {
    rec.start();
  } catch {
    options.onError("start_failed");
    return () => {};
  }
  return () => {
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  };
}
