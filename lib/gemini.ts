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
