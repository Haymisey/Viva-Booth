import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { talkIsReady, talkWordCount } from "../../lib/talk-ready";
import { clipExcerpt, emptyPaper, formatPaperForPrompt, hasPaper, parsePaperJson } from "../../lib/paper";

describe("paper context", () => {
  it("clips excerpt to the character cap", () => {
    const clipped = clipExcerpt(`${"word ".repeat(5000)}`);
    assert.ok(clipped.length <= 18000);
  });

  it("parses saved paper json", () => {
    const paper = parsePaperJson({
      title: "Soil moisture",
      question: "Does mulch help?",
      excerpt: "Mulch reduced evaporation.",
      fileName: "soil.pdf",
    });
    assert.equal(paper?.title, "Soil moisture");
    assert.equal(hasPaper(paper ?? emptyPaper()), true);
    assert.match(formatPaperForPrompt(paper), /Soil moisture/);
  });

  it("treats empty paper as none", () => {
    assert.equal(formatPaperForPrompt(emptyPaper()), "(none)");
  });
});

describe("talk readiness", () => {
  it("rejects short talks for the examiner door", () => {
    assert.equal(talkIsReady(10, "one two three"), false);
    assert.equal(talkWordCount("a b c d"), 4);
  });

  it("accepts a talk over 20s and 40 words", () => {
    const words = Array.from({ length: 45 }, (_, i) => `w${i}`).join(" ");
    assert.equal(talkIsReady(21, words), true);
  });
});
