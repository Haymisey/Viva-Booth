import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractFields, titleSimilarity } from "../../lib/server/services/citations";

describe("Citation Verification Service", () => {
  it("heuristically extracts DOI from citation string", async () => {
    const raw = "Vaswani, A. et al. (2017). Attention Is All You Need. doi: 10.48550/arXiv.1706.03762.";
    const fields = await extractFields(raw);

    assert.equal(fields.doi, "10.48550/arXiv.1706.03762");
    assert.equal(fields.year, 2017);
  });

  it("heuristically extracts year and title from quotes", async () => {
    const raw = 'John Doe. (2023). "Deep Learning for Amharic Speech Recognition". Ethiopian Journal of Computing.';
    const fields = await extractFields(raw);

    assert.equal(fields.year, 2023);
    assert.equal(fields.title, "Deep Learning for Amharic Speech Recognition");
  });

  it("calculates exact title similarity as 1.0", () => {
    const titleA = "Attention Is All You Need";
    const titleB = "Attention Is All You Need";
    const sim = titleSimilarity(titleA, titleB);

    assert.equal(sim, 1.0);
  });

  it("calculates high similarity for minor title punctuation/case variations", () => {
    const titleA = "Attention Is All You Need";
    const titleB = "Attention is all you need: A transformer approach";
    const sim = titleSimilarity(titleA, titleB);

    // High token overlap
    assert.ok(sim >= 0.60);
  });

  it("calculates low similarity for unrelated titles", () => {
    const titleA = "Convolutional Neural Networks for Image Segmentation";
    const titleB = "Economic Growth and Macroeconomic Stability in East Africa";
    const sim = titleSimilarity(titleA, titleB);

    assert.ok(sim < 0.20);
  });
});
