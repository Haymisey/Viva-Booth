import { AsyncLocalStorage } from "node:async_hooks";

const store = new AsyncLocalStorage<string>();

export function platformGeminiKey() {
  return process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export function activeGeminiKey() {
  return store.getStore() || platformGeminiKey();
}

export function runWithGeminiKey<T>(key: string, fn: () => Promise<T>) {
  return store.run(key, fn);
}
