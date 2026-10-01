import type { AppLanguage } from "./types";

export type BoothSettings = {
  name: string;
  language: AppLanguage;
};

const KEY = "viva.settings";

export function loadSettings(): BoothSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { name: "", language: "en" };
    const parsed = JSON.parse(raw) as Partial<BoothSettings>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      language: parsed.language === "am" ? "am" : "en",
    };
  } catch {
    return { name: "", language: "en" };
  }
}

export function saveSettings(next: BoothSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
