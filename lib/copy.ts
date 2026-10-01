import type { MicFailureReason } from "./browser-listen";
import type { CitationStatus, AppLanguage } from "./types";

export const quotaNotice =
  "Gemini's free limit is full. Wait a minute, then press Stop again.";

type Copy = {
  start: string;
  stop: string;
  transcript: string;
  citations: string;
  sayIt: string;
  nothingSpoken: string;
  citationsEmpty: string;
  noteEmpty: string;
  closest: string;
  keep: string;
  fix: string;
  say: string;
  quota: string;
  badge: Record<CitationStatus, string>;
  mic: Record<MicFailureReason, string>;
  api: Record<"extract" | "verify" | "debrief", string>;
};

const en: Copy = {
  start: "Start",
  stop: "Stop",
  transcript: "Transcript",
  citations: "Citations",
  sayIt: "Say it like this",
  nothingSpoken: "Nothing spoken yet.",
  citationsEmpty: "Sources you name are checked here.",
  noteEmpty: "Stop the clock. The note lands here.",
  closest: "Closest",
  keep: "Keep",
  fix: "Fix",
  say: "Say",
  quota: quotaNotice,
  badge: {
    pending: "Checking",
    in_corpus: "In corpus",
    elsewhere: "Found elsewhere",
    not_found: "Not found",
    unverified: "Unverified",
  },
  mic: {
    unsupported: "Microphone speech recognition is not supported in this browser.",
    permission_denied: "Microphone access was denied. Allow microphone permission and try again.",
    unavailable: "No working microphone was found. Connect a microphone and retry.",
    network: "Microphone transcription lost connection. Check your network and retry.",
    start_failed: "Microphone could not start. Check your microphone setup and try again.",
    unknown: "Microphone failed while listening. Please try again.",
  },
  api: {
    extract: "Citation extraction service failed. Results may be incomplete.",
    verify: "Citation verification service failed. Marked as unverified.",
    debrief: "Debrief service failed. Try again after the network recovers.",
  },
};

const am: Copy = {
  start: "ጀምር",
  stop: "አቁም",
  transcript: "ጽሑፍ",
  citations: "ማጣቀሻ",
  sayIt: "እንዲህ በል",
  nothingSpoken: "እስካሁን ምንም አልተነገረም።",
  citationsEmpty: "የጠቀስካቸው ምንጮች እዚህ ይረጋገጣሉ።",
  noteEmpty: "ሰዓቱን አቁም። ማስታወሻው እዚህ ይመጣል።",
  closest: "ቅርብ",
  keep: "ጥሩ",
  fix: "አስተካክል",
  say: "በል",
  quota: "የGemini ነጻ ገደብ ተሞልቷል። አንድ ደቂቃ ጠብቅ፣ ከዚያ አቁምን እንደገና ተጫን።",
  badge: {
    pending: "በመፈተሽ ላይ",
    in_corpus: "በክምችት ውስጥ",
    elsewhere: "ሌላ ቦታ ተገኝቷል",
    not_found: "አልተገኘም",
    unverified: "አልተረጋገጠም",
  },
  mic: {
    unsupported: "በዚህ ብራውዘር የማይክሮፎን ንግግር መለየት አይደገፍም።",
    permission_denied: "የማይክሮፎን ፍቃድ ተከልክሏል። ፍቃድ ሰጥተህ እንደገና ሞክር።",
    unavailable: "የሚሰራ ማይክሮፎን አልተገኘም። ማይክሮፎን አገናኝ እና ድገም።",
    network: "የማይክሮፎን ጽሑፍ አገልግሎት ኔትወርክ ጠፍቷል። ኔትወርክህን አረጋግጥ እና ድገም።",
    start_failed: "ማይክሮፎን መጀመር አልተቻለም። ቅንብሮችን አረጋግጥ እና ድገም።",
    unknown: "ሲያዳምጥ የማይክሮፎን ችግኝ ተፈጥሯል። እባክህ ድገም።",
  },
  api: {
    extract: "የማጣቀሻ ማውጫ አገልግሎት አልሰራም። ውጤቱ ያልተሟላ ሊሆን ይችላል።",
    verify: "የማጣቀሻ ማረጋገጫ አገልግሎት አልሰራም። ሁሉም እንደ ያልተረጋገጠ ተመዝግቧል።",
    debrief: "የግብረመልስ አገልግሎት አልሰራም። ኔትወርክ ከተመለሰ በኋላ ድገም።",
  },
};

export function copyFor(language: AppLanguage): Copy {
  return language === "am" ? am : en;
}
