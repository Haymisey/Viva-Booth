import { VoxideClient } from "@voxide/react";
import { vivaSnapshot, vivaStart, vivaStop } from "@/lib/session-bridge";

let client: VoxideClient | null = null;

export function getVoxideClient() {
  return client;
}

export function hushVoxide() {
  try {
    client?.interrupt();
  } catch {
    /* no session */
  }
}

export function releaseVoxide() {
  try {
    client?.interrupt();
    client?.disconnect();
  } catch {
    /* no session */
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function ensureVoxideClient(publicKey: string) {
  if (client) return client;
  const ai = new VoxideClient({
    publicKey,
    ui: { theme: "light" },
  });
  ai.register({
    startPractice: {
      description:
        "Start the viva practice timer only. Do not narrate. Do not confirm at length. After starting, stay silent while the student presents.",
      handler: async () => {
        const result = vivaStart();
        queueMicrotask(() => hushVoxide());
        return result;
      },
    },
    stopPractice: {
      description:
        "Stop the viva practice timer only. Do not summarize the talk. One short word is enough.",
      handler: async () => {
        const result = vivaStop();
        queueMicrotask(() => releaseVoxide());
        return result;
      },
    },
  });
  ai.bindState(() => vivaSnapshot());
  client = ai;
  return ai;
}
