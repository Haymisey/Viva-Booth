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
  paper: string;
  paperAdd: string;
  paperHint: string;
  paperUpload: string;
  paperReading: string;
  paperClear: string;
  paperTitle: string;
  paperQuestion: string;
  paperPaste: string;
  paperTooLarge: string;
  paperPages: string;
  paperType: string;
  paperEmpty: string;
  paperFailed: string;
  exam: string;
  examYou: string;
  examHint: string;
  examAsk: string;
  examAsking: string;
  examTooShort: string;
  examAnswer: string;
  examSend: string;
  examSpeak: string;
  examStopSpeak: string;
  examWaiting: string;
  examListening: string;
  examFailed: string;
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
  paper: "Paper",
  paperAdd: "Add paper",
  paperHint: "Optional. One PDF, {pages} pages or 10 MB, or paste the abstract.",
  paperUpload: "Upload PDF",
  paperReading: "Reading…",
  paperClear: "Remove",
  paperTitle: "Title (optional)",
  paperQuestion: "Research question (optional)",
  paperPaste: "Or paste the abstract / a short excerpt",
  paperTooLarge: "That file is over 10 MB. Use a smaller PDF or paste the abstract.",
  paperPages: "That PDF is over 20 pages. Upload a shorter cut or paste the abstract.",
  paperType: "Upload a PDF, or paste the abstract below.",
  paperEmpty: "No readable text in that PDF. Paste the abstract instead.",
  paperFailed: "Could not read that PDF. Paste the abstract instead.",
  exam: "Examiner",
  examYou: "You",
  examHint: "The talk is long enough. Ask for one viva question at a time.",
  examAsk: "Ask me questions",
  examAsking: "Asking…",
  examTooShort: "Too short to examine. Say the question, what you did, and what you found, then stop.",
  examAnswer: "Answer in a few sentences",
  examSend: "Answer",
  examSpeak: "Speak",
  examStopSpeak: "Stop speaking",
  examWaiting: "Waiting…",
  examListening: "Listening…",
  examFailed: "The examiner could not answer just now. Wait a moment and try again.",
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
  paper: "ወረቀት",
  paperAdd: "ወረቀት ጨምር",
  paperHint: "አማራጭ። አንድ PDF፣ {pages} ገጽ ወይም 10 MB፣ ወይም abstract ለጥፍ።",
  paperUpload: "PDF ጫን",
  paperReading: "በማንበብ ላይ…",
  paperClear: "አስወግድ",
  paperTitle: "ርዕስ (አማራጭ)",
  paperQuestion: "የምርምር ጥያቄ (አማራጭ)",
  paperPaste: "ወይም abstract / አጭር ጽሑፍ ለጥፍ",
  paperTooLarge: "ፋይሉ ከ10 MB በላይ ነው። አነስ ያለ PDF ወይም abstract ለጥፍ።",
  paperPages: "PDF ከ20 ገጽ በላይ ነው። አጭር ቅጂ ጫን ወይም abstract ለጥፍ።",
  paperType: "PDF ጫን፣ ወይም abstract ከዚህ በታች ለጥፍ።",
  paperEmpty: "በዚያ PDF የሚነበብ ጽሑፍ የለም። abstract ለጥፍ።",
  paperFailed: "PDF ማንበብ አልተቻለም። abstract ለጥፍ።",
  exam: "ፈታኝ",
  examYou: "አንተ",
  examHint: "ንግግሩ በቂ ነው። አንድ የቫይቫ ጥያቄ በአንድ ጊዜ ጠይቅ።",
  examAsk: "ጥያቄ ጠይቀኝ",
  examAsking: "በመጠየቅ ላይ…",
  examTooShort: "ለመፈተን በጣም አጭር ነው። ጥያቄውን፣ ያደረግከውን፣ ያገኘኸውን በል፣ ከዚያ አቁም።",
  examAnswer: "በጥቂት ዓረፍተ ነገሮች መልስ",
  examSend: "መልስ",
  examSpeak: "ተናገር",
  examStopSpeak: "መናገር አቁም",
  examWaiting: "በመጠበቅ ላይ…",
  examListening: "በማዳመጥ ላይ…",
  examFailed: "ፈታኙ አሁን መመለስ አልቻለም። ትንሽ ጠብቅና ድገም።",
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
