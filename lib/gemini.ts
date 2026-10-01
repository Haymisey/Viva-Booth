import { significantTokens } from "./citation-match";

type GeminiJson = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

function geminiKey() {
  return process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";
}

function geminiUrl() {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey()}`;
}

function stripFence(raw: string) {
  return raw.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "").trim();
}

type GeminiCall = { text: string; status: number; detail: string };

function retryAfterSeconds(detail: string) {
  const match = detail.match(/retry in ([0-9.]+)\s*s/i);
  if (!match) return 0;
  const seconds = Math.ceil(Number(match[1]));
  if (!Number.isFinite(seconds) || seconds < 1) return 0;
  return Math.min(seconds + 1, 70);
}

async function callGemini(prompt: string, temperature: number): Promise<GeminiCall> {
  const key = geminiKey();
  if (!key) return { text: "", status: 0, detail: "" };
  const res = await fetch(geminiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("Gemini debrief failed", res.status, detail.slice(0, 500));
    return { text: "", status: res.status, detail };
  }
  const data = (await res.json()) as GeminiJson;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) console.error("Gemini debrief returned no text");
  return { text, status: res.status, detail: "" };
}

async function generateJson(prompt: string, temperature: number) {
  const result = await callGemini(prompt, temperature);
  return result.text;
}

const EXAMINER_PROMPT = `You are an expert, world-class presentation coach. Your users range from young students to university professors. Your goal is to help them craft an A+ presentation.

Your persona is an objective, helpful, calm, and specific examiner.
- Never use shaming language. Never say "you failed."
- Be direct, clear, and highly constructive.
- Do not use fake, polished filler lines (e.g., do not say "This work is a testament to...").

You will be provided with the user's transcript, the duration (in seconds), the word count, and (if applicable) citation check flags (e.g., in_corpus, not_found, elsewhere, unverified).

CRITICAL RULES REGARDING FACTS AND CITATIONS:
1. NEVER invent or hallucinate a paper, author, year, or title.
2. Only quote names exactly as you heard/read them in the transcript.
3. Citation flags mean ONLY what the check returned. Do not interpret them beyond their literal meaning.

EVALUATION LOGIC (Follow this strictly based on the provided time/word count):

SCENARIO A: TOO SHORT (Under 20 seconds OR under 40 words)
- DO NOT praise the user. Do not provide a "KEEP" section.
- Calmly state that the talk was too short to evaluate properly.
- Give them this exact, simple fix: "Try again. Next time, say three things: 1) What the question is, 2) What you did, and 3) What you found. Then stop."
- Output ONLY a "FIX:" section.

SCENARIO B: THIN TALK (Over 20s/40w, but lacks depth or substance)
- Provide EXACTLY ONE "FIX:".
- Focus on the single most obvious missing piece (e.g., Missing the result, missing who the audience is, or no clear ending).
- Do not invent a second fix just to fill space. Keep it brief and focused.

SCENARIO C: REAL TALK (Sufficient length and fully developed)
- Focus on the SHAPE of the presentation first (e.g., Was the opening too long? Did the main question come too late? Was the ending thin?).
- Format your response using "KEEP:" (one thing that worked well regarding structure/delivery) and "FIX:" (how to improve the shape).
- Address citations ONLY if the user explicitly named a source in the transcript. If they did, use the provided citation flags to calmly note if their sources were verified or not.

Always format your final output cleanly. Remember: Your job is to help them get an A+ by mastering structure and clarity, not by flattering them.`;

type DebriefInput = {
  transcript: string;
  citations: { text: string; status: string; hitTitle?: string }[];
  seconds: number;
  wordCount: number;
};

export function talkWordCount(transcript: string) {
  const clean = transcript.trim();
  if (!clean) return 0;
  return clean.split(/\s+/).length;
}

export async function extractCitationAttempts(transcript: string): Promise<string[]> {
  const talk = transcript.trim();
  if (!talk || !geminiKey()) return [];

  const prompt = `List citation attempts from this viva transcript. Speech-to-text may have misheard names.

Rules:
- Copy short phrases from the transcript only: paper titles, author+year, journals, books, or institutes used as a source.
- Do not fix spelling toward a famous paper.
- Do not add any source that was not spoken.
- Skip ordinary sentences that are not citations.
- At most 8 items.

Talk:
${talk}

JSON only:
{"claims":["…"]}`;

  const raw = await generateJson(prompt, 0.1);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(stripFence(raw)) as { claims?: unknown };
    if (!Array.isArray(parsed.claims)) return [];
    return parsed.claims
      .filter((c): c is string => typeof c === "string")
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function generateDebrief(input: DebriefInput): Promise<string> {
  if (!geminiKey()) return "";

  const prompt = `${EXAMINER_PROMPT}

Duration: ${Math.max(0, Math.round(input.seconds))} seconds
Word count: ${input.wordCount}

Transcript:
${input.transcript.trim() || "(none)"}

Citations:
${input.citations.map((c) => `- ${c.text} [${c.status}]${c.hitTitle ? ` hit:${c.hitTitle}` : ""}`).join("\n") || "(none)"}`;

  let result = await callGemini(prompt, 0.2);
  if (!result.text && result.status === 429) {
    const wait = retryAfterSeconds(result.detail);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      result = await callGemini(prompt, 0.2);
    }
  }
  if (!result.text && result.status === 429) {
    throw new Error("QUOTA");
  }
  return stripFence(result.text);
}

export type QuestionHit = {
  title: string;
  abstract?: string;
};

export type QuestionInput = {
  language: "en" | "am";
  abstract: string;
  transcript: string;
  hits: QuestionHit[];
  count?: number;
  matchedElsewhere?: boolean;
};

export type ExaminerTurn = {
  note: string | null;
  questions: string[];
};

export type AnswerMark = "answered" | "partial" | "missed";

export type Verdict = {
  question: string;
  mark: AnswerMark;
  say: string;
};

function speechNote(language: "en" | "am") {
  return language === "am"
    ? "ያንን ወረቀት በScholarxiv አላገኘሁትም። ከተናገርከው ነገር እጠይቅሃለሁ።"
    : "I did not find that paper in Scholarxiv. I will ask you from what you said.";
}

function elsewhereNote(language: "en" | "am") {
  return language === "am"
    ? "ያንን ወረቀት በScholarxiv አላገኘሁትም። ተመሳሳይ ርዕስ ሌላ ቦታ አለ፣ ስለዚያ እጠይቃለሁ።"
    : "I did not find that paper in Scholarxiv. A matching title is elsewhere, so I will ask about that.";
}

function usableQuestion(text: string) {
  const q = text.trim();
  if (q.length < 12 || q.length > 180) return false;
  if (/^you said\b/i.test(q)) return false;
  if (/\b(first|second|third|fourth) question\b/i.test(q)) return false;
  if (/\ban examiner would\b/i.test(q)) return false;
  return true;
}

function speechQuestions(input: QuestionInput, count: number): string[] {
  const am = input.language === "am";
  const pool = am
    ? [
        "ያ ክስ በአንድ አረፍተ ነገር ምንድን ነው?",
        "ያ ቁጥር ወይም ያ ክፍል ትክክል ካልሆነ ምን ይሰበራል?",
        "ይህ ለማን ነው፣ ለማን አይደለም?",
        "ይህን እውነት ለማሳየት ምን ትለካለህ?",
      ]
    : [
        "What is the one claim, in a single sentence?",
        "What breaks if that number or that definition is wrong?",
        "Who does this apply to, and who does it leave out?",
        "What would you measure to show this is true?",
      ];
  return pool.slice(0, count);
}

export function fallbackExaminerQuestions(input: QuestionInput): ExaminerTurn {
  const count = input.count ?? 4;
  const am = input.language === "am";
  const t0 = input.hits[0]?.title;
  const t1 = input.hits[1]?.title;
  if (t0) {
    const pool = am
      ? [
          `“${t0}” ጠቅሰሃል። ያ ሥራ በትክክል ምን ይከራከራል?`,
          t1 ? `“${t1}” የተናገርከውን ዓረፍተ ነገር እንዴት ይደግፋል?` : "ያ ምንጭ የተናገርከውን ዓረፍተ ነገር እንዴት ይደግፋል?",
          `“${t0}” ካልተሳሳተ ክስህ ምን ይሆናል?`,
          "ከዚህ ምንጭ ውጭ የምትናገረው ነገር የት ይቆማል?",
        ]
      : [
          `You cited ${t0}. What does that work actually claim?`,
          t1
            ? `How does ${t1} support the sentence you just said?`
            : "How does that source support the sentence you just said?",
          `If ${t0} is wrong, what happens to your argument?`,
          `Where does your claim go beyond ${t0}?`,
        ];
    return {
      note: input.matchedElsewhere ? elsewhereNote(input.language) : null,
      questions: pool.slice(0, count),
    };
  }
  return { note: speechNote(input.language), questions: speechQuestions(input, count) };
}

function aboutSpeech(text: string, transcript: string) {
  const spoken = new Set(significantTokens(transcript).filter((w) => w.length > 4));
  if (spoken.size === 0) return true;
  return significantTokens(text).some((w) => spoken.has(w));
}

function groundedQuestion(text: string, hits: QuestionHit[], transcript: string) {
  if (hits.length === 0) return aboutSpeech(text, transcript);
  const hay = text.toLowerCase();
  return hits.some((h) => hay.includes(h.title.toLowerCase()));
}

export async function generateExaminerQuestions(input: QuestionInput): Promise<ExaminerTurn> {
  const fallback = fallbackExaminerQuestions(input);
  const count = input.count ?? 4;
  if (!geminiKey()) return fallback;

  const titles = input.hits.map((h) => h.title);
  const fromSpeech = titles.length === 0;
  const prompt = `You are a thesis examiner. Write exactly ${count} short spoken questions.

Rules:
- Never invent a paper, author, or year.
- You may only name these confirmed titles: ${titles.join("; ") || "(none — do not name a paper)"}.
- If there are confirmed titles, each question must name at least one of them.
- If there are none, ask about a claim in the talk: a number, a definition, a cause, or what fails if it is wrong.
- Do not start with "You said". Do not quote a sentence back. Do not mention "the first question".
- Use words that appear in the talk, such as the subject and the figure, inside a real question.
- Respond in ${input.language === "am" ? "Amharic (Ge'ez script)" : "English"}.

Packed abstract:
${input.abstract || "(none)"}

Talk:
${input.transcript || "(none)"}

Confirmed papers:
${input.hits.map((h) => `- ${h.title}${h.abstract ? `\n  abstract: ${h.abstract.slice(0, 400)}` : ""}`).join("\n") || "(none)"}

JSON only:
{"questions":["…","…"]}`;

  const raw = await generateJson(prompt, fromSpeech ? 0.2 : 0.3);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(stripFence(raw)) as { questions?: unknown };
    if (!Array.isArray(parsed.questions)) return fallback;
    const cleaned = parsed.questions
      .filter((q): q is string => typeof q === "string")
      .map((q) => q.trim())
      .filter((q) => usableQuestion(q) && groundedQuestion(q, input.hits, input.transcript));
    const questions = [...cleaned];
    for (const q of fallback.questions) {
      if (questions.length >= count) break;
      if (!questions.includes(q)) questions.push(q);
    }
    if (questions.length === 0) return fallback;
    const note = input.matchedElsewhere
      ? elsewhereNote(input.language)
      : fromSpeech
        ? speechNote(input.language)
        : null;
    return { note, questions: questions.slice(0, count) };
  } catch {
    return fallback;
  }
}

function asMark(value: unknown): AnswerMark {
  return value === "answered" || value === "missed" ? value : "partial";
}

export async function nameTalk(transcript: string): Promise<string> {
  const clean = transcript.replace(/\s+/g, " ").trim();
  const fallback = clean.split(" ").slice(0, 6).join(" ") || "Open talk";
  if (!geminiKey() || !clean) return fallback;
  const prompt = `Name this spoken talk in 3 to 6 words. It is a session name, not a paper title. Do not invent an author, year, or citation. No quotes.

Talk:
${clean.slice(0, 1200)}

JSON only:
{"title":"…"}`;
  const raw = await generateJson(prompt, 0.2);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(stripFence(raw)) as { title?: unknown };
    const title = typeof parsed.title === "string" ? parsed.title.replace(/["']/g, "").trim() : "";
    const words = title.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 8) return words.join(" ");
  } catch {
    /* fall through */
  }
  return fallback;
}

export async function judgeAnswers(input: {
  language: "en" | "am";
  transcript: string;
  questions: string[];
  followUps: boolean;
}): Promise<{ keep: string; verdicts: Verdict[]; followUps: string[] }> {
  const spoken = input.transcript.trim();
  const fallbackVerdicts: Verdict[] = input.questions.map((question) => ({
    question,
    mark: spoken.length > 80 ? "partial" : "missed",
    say: input.language === "am" ? "ያንን ጥያቄ በአንድ አረፍተ ነገር መልስ።" : "Answer that question in one sentence.",
  }));
  const fallbackFollow = input.followUps
    ? speechQuestions({ ...input, abstract: "", hits: [], count: 2 }, 2)
    : [];
  const fallbackKeep =
    input.language === "am" ? "መልስህን በግልጽ ተናግረሃል።" : "You answered in your own words.";
  if (!geminiKey() || input.questions.length === 0) {
    return { keep: fallbackKeep, verdicts: fallbackVerdicts, followUps: fallbackFollow };
  }

  const prompt = `You are the examiner who just asked these questions. Judge ONLY the talk. Never invent a paper, author, or year.

For each question, in the same order:
- answered: they state their own position on that question.
- partial: they describe the topic, or they describe what an examiner might ask, and never state their own answer.
- missed: they do not address it.
Narrating "an examiner would challenge" is not an answer.
say: ONE sentence in the student's voice. Do not start with "An examiner would". Do not summarise their whole turn.

${input.followUps ? `followUps: TWO new questions that push on a number, a definition, or a limit in the talk. Do not start with "You said". Do not quote them. Do not say "first question". Do not repeat the questions below. Do not name a paper.` : "followUps: empty array."}
keep: one short sentence on what they did well.

Respond in ${input.language === "am" ? "Amharic (Ge'ez script)" : "English"}.

Questions:
${input.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Talk:
${spoken || "(none)"}

JSON only:
{"keep":"…","verdicts":[{"mark":"answered","say":"…"}],"followUps":["…","…"]}`;

  const raw = await generateJson(prompt, 0.2);
  if (!raw) return { keep: fallbackKeep, verdicts: fallbackVerdicts, followUps: fallbackFollow };
  try {
    const parsed = JSON.parse(stripFence(raw)) as {
      keep?: unknown;
      verdicts?: unknown;
      followUps?: unknown;
    };
    const rows = Array.isArray(parsed.verdicts) ? parsed.verdicts : null;
    if (!rows) {
      return { keep: fallbackKeep, verdicts: fallbackVerdicts, followUps: fallbackFollow };
    }
    const verdicts = input.questions.map((question, i) => {
      const row = rows[i] as { mark?: unknown; say?: unknown } | undefined;
      const say = typeof row?.say === "string" && row.say.trim() ? row.say.trim() : fallbackVerdicts[i].say;
      return { question, mark: asMark(row?.mark), say };
    });
    const followUps = input.followUps && Array.isArray(parsed.followUps)
      ? parsed.followUps
          .filter((q): q is string => typeof q === "string")
          .map((q) => q.trim())
          .filter((q) => usableQuestion(q))
          .slice(0, 2)
      : [];
    return {
      keep: typeof parsed.keep === "string" && parsed.keep.trim() ? parsed.keep.trim() : fallbackKeep,
      verdicts,
      followUps: followUps.length === 2 ? followUps : fallbackFollow,
    };
  } catch {
    return { keep: fallbackKeep, verdicts: fallbackVerdicts, followUps: fallbackFollow };
  }
}
