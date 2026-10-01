type Props = {
  questions: [string, string] | null;
};

export function ExaminerQuestions({ questions }: Props) {
  return (
    <article className="border-t border-rule pt-5">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-ink/40">Examiner</h3>
      {questions ? (
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink/70">
          <li>{questions[0]}</li>
          <li>{questions[1]}</li>
        </ol>
      ) : (
        <p className="mt-4 text-sm text-ink/35">
          Stop once. Two questions from sources Scholarxiv can see.
        </p>
      )}
    </article>
  );
}
