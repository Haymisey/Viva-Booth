import type { PaperContext } from "./paper";
import { formatPaperForPrompt } from "./paper";

type ChatTurn = {
  role: string;
  content: string;
};

type EvaluateChatInput = {
  sessionTitle: string;
  transcript: string;
  history: ChatTurn[];
  studentReply: string;
  paper?: PaperContext | null;
  priorNotes?: string;
  language?: "en" | "am";
  wordCount?: number;
};

type GeminiJson = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

function retryAfterSeconds(detail: string) {
  const match = detail.match(/retry in ([0-9.]+)\s*s/i);
  const seconds = match ? Math.ceil(Number(match[1])) : 0;
  if (!Number.isFinite(seconds) || seconds < 1) return 0;
  return Math.min(seconds + 1, 70);
}

export async function generateExaminerReply(input: EvaluateChatInput): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, "");
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  if (!geminiKey) return "";

  const historyContext = input.history
    .map((turn) => `${turn.role === "student" ? "Candidate" : "Examiner"}: ${turn.content}`)
    .join("\n");

  const prompt = `You are a rigorous thesis examiner in a live viva. Be helpful, specific, and fair. Never invent a paper, author, year, or title.

Topic: "${input.sessionTitle}"
Language: ${input.language === "am" ? "Amharic (Ge'ez script)" : "English"}

Packed paper (this is the subject; do not go outside it plus the talk):
${formatPaperForPrompt(input.paper)}

Earlier talks (at most 10; use only to notice repeating gaps):
${input.priorNotes?.trim() || "(none)"}

Candidate's talk (${input.wordCount ?? 0} words):
${input.transcript.slice(0, 4000) || "(none)"}

Previous viva turns:
${historyContext || "(none)"}

The candidate just answered:
${input.studentReply}

Reply in two short parts:
1. Real feedback: did they answer, hedge, or miss? Say what was strong and what is still missing, in 1-2 sentences. Give a sentence they could have said if the answer was thin.
2. One follow-up question about method, a number, a limit, or a claim in THIS paper/talk.

No greetings. No fake praise. Do not dump a list of four questions.`;

  const call = async () => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      },
    );
    const detail = res.ok ? "" : await res.text();
    if (!res.ok) {
      console.error("Gemini examiner chat error", res.status, detail.slice(0, 500));
      return { text: "", status: res.status, detail };
    }
    const data = (await res.json()) as GeminiJson;
    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "",
      status: res.status,
      detail: "",
    };
  };

  let result = await call();
  if (!result.text && result.status === 429) {
    const wait = retryAfterSeconds(result.detail);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      result = await call();
    }
  }
  if (!result.text && result.status === 429) throw new Error("QUOTA");
  return result.text;
}
