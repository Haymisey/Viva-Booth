type ChatTurn = {
  role: string;
  content: string;
};

type EvaluateChatInput = {
  sessionTitle: string;
  transcript: string;
  history: ChatTurn[];
  studentReply: string;
};

export async function generateExaminerReply(input: EvaluateChatInput): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, "");
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

  if (!geminiKey) {
    // Intelligent fallback response when Gemini key is not configured
    const replies = [
      `Thank you for that clarification on "${input.sessionTitle}". You defended your approach well, but remember to explicitly mention how you controlled for confounding variables. How would you justify your choice of baseline compared to recent literature?`,
      `Good response. You addressed the core point directly. In a formal viva, examiners often press on scalability: what are the main computational or resource bottlenecks if this was deployed at 10x scale?`,
      `Understood. That explains the rationale behind your findings. If an examiner challenges your sample size or data collection method, what empirical evidence would you point them toward?`,
      `Concise answer. You kept your composure and stated the key metric. One critique: avoid hedging words like 'maybe' or 'we kind of thought'. Be authoritative about your own data.`
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  const historyContext = input.history
    .map((h) => `${h.role === "student" ? "Candidate" : "Examiner"}: ${h.content}`)
    .join("\n");

  const prompt = `You are a rigorous, academic thesis defense examiner conducting a live viva voce.
Topic: "${input.sessionTitle}"
Candidate's Initial Defense Presentation Transcript:
"${input.transcript.slice(0, 1500)}"

Previous viva examination conversation:
${historyContext}

The candidate just answered:
"${input.studentReply}"

Provide an examiner reply:
1. Briefly evaluate their answer in 1-2 constructive sentences (note if it was precise, if they evaded the question, or if they need clearer academic phrasing).
2. Ask one sharp, logical follow-up question regarding their research methodology, citations, or findings.
Keep your response concise, objective, and professorial. Do not use filler greetings like "Hello" or "Great job".`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini responded with ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) return text;
  } catch (error) {
    console.error("Gemini examiner chat error:", error);
  }

  return `I understand your point regarding ${input.sessionTitle}. To deepen this defense: what specific threats to validity did you identify during this investigation, and how did you mitigate them?`;
}
