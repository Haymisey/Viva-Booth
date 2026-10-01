type Props = {
  questions: [string, string] | null;
};

export function ExaminerQuestions({ questions }: Props) {
  return (
    <section className="rounded-2xl border border-rule bg-card px-6 py-6 md:px-8">
      <h3 className="font-display text-2xl text-ink">Examiner</h3>
      {questions ? (
        <ol className="mt-4 flex flex-col gap-3">
          {questions.map((q, i) => (
            <li key={i} className="flex gap-4 text-[15px] leading-relaxed text-ink/85">
              <span className="font-display text-lg text-ink/50">{i + 1}</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-[15px] text-ink/55">
          Stop once. Two questions from sources Scholarxiv can see.
        </p>
      )}
    </section>
  );
}
