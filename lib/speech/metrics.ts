import { ENGLISH_FILLERS } from "./fillers.en";
import { AMHARIC_FILLERS } from "./fillers.am";

export type SpeechLocale = "en-US" | "am-ET" | "en" | "am";

export type SpeechMetrics = {
  wordCount: number;
  wpm: number;
  fillerCount: number;
  fillers: Record<string, number>;
};

/**
 * Unicode-aware word segmentation that accurately parses both Latin and Ge'ez (Amharic) script.
 */
export function countWords(text: string, locale: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Use Intl.Segmenter if available in the environment
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(locale.startsWith("am") ? "am-ET" : "en-US", {
        granularity: "word",
      });
      let count = 0;
      for (const segment of segmenter.segment(trimmed)) {
        if (segment.isWordLike) {
          count++;
        }
      }
      return count;
    } catch {
      // Fallback below
    }
  }

  // Regex fallback matching Unicode letters/digits (works with Ge'ez and Latin)
  const matches = trimmed.match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
}

/**
 * Computes speech metrics including word count, WPM, and filler frequencies.
 * Fillers are informational only and do not negatively bias the core evaluation.
 */
export function computeMetrics(
  transcript: string,
  durationMs: number,
  locale: SpeechLocale = "en-US"
): SpeechMetrics {
  const clean = transcript.trim();
  if (!clean) {
    return {
      wordCount: 0,
      wpm: 0,
      fillerCount: 0,
      fillers: {},
    };
  }

  const isAmharic = locale === "am-ET" || locale === "am";
  const wordCount = countWords(clean, isAmharic ? "am-ET" : "en-US");

  // Calculate WPM
  const durationMinutes = durationMs > 0 ? durationMs / 60000 : 0;
  const wpm = durationMinutes > 0 ? Math.round((wordCount / durationMinutes) * 10) / 10 : 0;

  // Select appropriate filler lexicon
  const lexicon = isAmharic ? AMHARIC_FILLERS : ENGLISH_FILLERS;
  const fillersFound: Record<string, number> = {};
  let totalFillers = 0;

  // Normalize transcript for matching
  const lower = clean.toLowerCase();

  for (const filler of lexicon) {
    const fLower = filler.toLowerCase();
    // Escape special regex characters in the filler phrase
    const escaped = fLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // For Latin words, require word boundaries; for Ge'ez, use punctuation/whitespace boundary checks
    const regex = isAmharic
      ? new RegExp(`(?:^|[\\s፣፤፦፡!?.])${escaped}(?=[\\s፣፤፦፡!?.]|$)`, "gu")
      : new RegExp(`\\b${escaped}\\b`, "gi");

    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      fillersFound[filler] = matches.length;
      totalFillers += matches.length;
    }
  }

  return {
    wordCount,
    wpm,
    fillerCount: totalFillers,
    fillers: fillersFound,
  };
}
