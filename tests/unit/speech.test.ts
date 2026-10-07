import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeMetrics, countWords } from "../../lib/speech/metrics";

describe("Speech Metrics & Word Counting", () => {
  it("counts English words accurately", () => {
    const text = "This is a thesis defense presentation on artificial intelligence.";
    assert.equal(countWords(text, "en-US"), 9);
  });

  it("counts Amharic words accurately using Unicode/Intl.Segmenter", () => {
    const amharicText = "ይህ የጥናት ጽሁፍ መከላከያ ንግግር ነው።";
    assert.equal(countWords(amharicText, "am-ET"), 6);
  });

  it("computes WPM accurately", () => {
    const text = "One two three four five six seven eight nine ten."; // 10 words
    // 30 seconds = 30000ms = 0.5 minutes -> 20 WPM
    const metrics = computeMetrics(text, 30000, "en-US");
    assert.equal(metrics.wordCount, 10);
    assert.equal(metrics.wpm, 20);
  });

  it("detects single and multi-word English fillers", () => {
    const spoken = "Um, this model is, like, basically accurate, you know, sort of.";
    const metrics = computeMetrics(spoken, 60000, "en-US");

    assert.equal(metrics.fillerCount, 5);
    assert.equal(metrics.fillers["um"], 1);
    assert.equal(metrics.fillers["like"], 1);
    assert.equal(metrics.fillers["basically"], 1);
    assert.equal(metrics.fillers["you know"], 1);
    assert.equal(metrics.fillers["sort of"], 1);
  });

  it("detects Amharic fillers accurately", () => {
    const amharic = "ማለት ይህ ውጤት ያው ጥሩ ነው እ።";
    const metrics = computeMetrics(amharic, 60000, "am-ET");

    assert.ok(metrics.fillerCount >= 2);
    assert.equal(metrics.fillers["ማለት"], 1);
    assert.equal(metrics.fillers["ያው"], 1);
  });

  it("handles empty or zero-duration safely", () => {
    const metrics = computeMetrics("", 0, "en-US");
    assert.equal(metrics.wordCount, 0);
    assert.equal(metrics.wpm, 0);
    assert.equal(metrics.fillerCount, 0);
  });
});
