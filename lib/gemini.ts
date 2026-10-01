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
  return raw.replace(/^```json\s*|\s*```$/g, "").trim();
}

async function generateJson(prompt: string, temperature: number) {
  const key = geminiKey();
  if (!key) return "";
  const res = await fetch(geminiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    }),
  });
  if (!res.ok) return "";
  const data = (await res.json()) as GeminiJson;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

type DebriefInput = {
  transcript: string;
  abstract: string;
  citations: { text: string; status: string; hitTitle?: string }[];
  language: "en" | "am";
};

export type DebriefBody = {
  keep: string;
  fixes: [string, string];
  say: string;
};

export function formatDebrief(body: DebriefBody) {
  return `Keep: ${body.keep}\nFix: ${body.fixes[0]}\nFix: ${body.fixes[1]}\nSay: ${body.say}`;
}

export function fallbackDebrief(input: DebriefInput): DebriefBody {
  const am = input.language === "am";
  const ok = input.citations.filter((c) => c.status === "in_corpus");
  const bad = input.citations.filter(
    (c) => c.status === "not_found" || c.status === "unverified",
  );
  const keep = am
    ? ok[0]
      ? `በScholarxiv የተገኘ ምንጭ ጠቅሰሃል፦ ${ok[0].hitTitle || ok[0].text}.`
      : "ንግግርህ ግልጽ የሆነ መስመር አለው።"
    : ok[0]
      ? `You named a source Scholarxiv can see: ${ok[0].hitTitle || ok[0].text}.`
      : "You kept a clear through-line in the talk.";
  const fixes: [string, string] = am
    ? [
        bad[0]
          ? `“${bad[0].text}” ላይ አትመስረት — Scholarxiv ይህን ምንጭ አላረጋገጠም።`
          : "የምርምር ጥያቄህን በአንድ አረፍተ ነገር ግለጽ።",
        bad[1]
          ? `“${bad[1].text}” ከፓነሉ በፊት አረጋግጥ ወይም ተው።`
          : input.abstract
            ? "እያንዳንዱን ክስ ከዝግጅት አብስትራክትህ ጋር አያይዝ።"
            : "ዓመት እና ጆርናል እውነተኛ ሲሆን ብቻ ጥቀስ።",
      ]
    : [
        bad[0]
          ? `Do not lean on “${bad[0].text}” — Scholarxiv did not confirm that source.`
          : "State the research question in one sentence.",
        bad[1]
          ? `Drop or verify “${bad[1].text}” before the panel.`
          : input.abstract
            ? "Tie each claim back to the abstract you packed."
            : "Name year and venue only when the paper is real.",
      ];
  const say = am
    ? ok[0]?.hitTitle
      ? `ይህ ሥራ ${ok[0].hitTitle} ላይ ይመሠረታል።`
      : "ይህ ሥራ አንድ ጥያቄ ይጠይቃል እና ማሳየት ከምንችለው ምንጭ ይመልሳል።"
    : ok[0]?.hitTitle
      ? `This work follows ${ok[0].hitTitle}.`
      : "This work asks one question and answers it from sources we can show.";
  return { keep, fixes, say };
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

export async function generateDebrief(input: DebriefInput): Promise<DebriefBody> {
  if (!geminiKey()) return fallbackDebrief(input);

  const confirmed = input.citations
    .filter((c) => c.status === "in_corpus")
    .map((c) => c.hitTitle || c.text);

  const prompt = `You coach a student for a second take. Use ONLY the talk, packed abstract, and Scholarxiv statuses. Never invent a paper, author, or year.

in_corpus means Scholarxiv found a matching title. not_found means Scholarxiv did not confirm that source. unverified means the check failed. These are not a student bibliography.

Tone: calm, specific, useful. No shame. Do not say unacceptable, only, entire talk, or you have failed.
Quote names as heard in the talk. Do not "correct" Vans to Vance or invent a real title.
Respond in ${input.language === "am" ? "Amharic (Ge'ez script)" : "English"}.

keep: one short sentence about what they did well (usually an in_corpus source).
fixes: two short sentences. For not_found or unverified, say not to cite that heard phrase until Scholarxiv can see it.
say: ONE sentence they can speak next time ("This work…"). Use only confirmed titles: ${confirmed.join("; ") || "(none — do not name a paper)"}.

Abstract:
${input.abstract || "(none)"}

Talk:
${input.transcript || "(none)"}

Scholarxiv:
${input.citations.map((c) => `- ${c.text} [${c.status}]${c.hitTitle ? ` hit:${c.hitTitle}` : ""}`).join("\n") || "(none)"}

JSON only:
{"keep":"…","fixes":["…","…"],"say":"…"}`;

  const raw = await generateJson(prompt, 0.3);
  if (!raw) return fallbackDebrief(input);
  const json = stripFence(raw);
  try {
    const parsed = JSON.parse(json) as Partial<DebriefBody>;
    if (
      typeof parsed.keep === "string" &&
      Array.isArray(parsed.fixes) &&
      parsed.fixes.length >= 2 &&
      typeof parsed.say === "string"
    ) {
      return {
        keep: parsed.keep,
        fixes: [parsed.fixes[0], parsed.fixes[1]],
        say: parsed.say,
      };
    }
  } catch {
    /* fall through */
  }
  return fallbackDebrief(input);
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
