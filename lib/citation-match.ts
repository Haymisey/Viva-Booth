const STOP = new Set([
  "journal",
  "the",
  "and",
  "of",
  "for",
  "in",
  "on",
  "a",
  "an",
  "to",
  "volume",
  "page",
  "transactions",
  "ieee",
  "paper",
  "from",
  "with",
]);

function yearsIn(text: string) {
  return text.match(/\b(?:19|20)\d{2}\b/g) ?? [];
}

export function significantTokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w) && !/^\d{4}$/.test(w));
}

const GENERIC = new Set([
  ...STOP,
  "energy",
  "system",
  "systems",
  "data",
  "model",
  "models",
  "learning",
  "network",
  "networks",
  "based",
  "using",
  "approach",
  "study",
  "analysis",
  "performance",
  "smart",
  "real",
  "time",
  "method",
  "methods",
  "novel",
  "towards",
  "via",
  "modern",
  "using",
]);

function normalized(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distinctive(text: string) {
  return normalized(text)
    .split(" ")
    .filter((w) => w.length > 2 && !GENERIC.has(w) && !/^\d+$/.test(w));
}

/** True only when the two titles are the same work, not a nearby topic. */
export function titleMatchesClaim(query: string, title: string) {
  const q = normalized(query);
  const t = normalized(title);
  if (!q || !t) return false;
  if (q === t) return true;

  const qw = q.split(" ").filter((w) => w.length > 1);
  const tw = t.split(" ").filter((w) => w.length > 1);
  if (qw.length >= 4 && t.includes(q)) return true;
  if (tw.length >= 4 && q.includes(t)) return true;

  const qt = distinctive(query);
  const tt = distinctive(title);
  if (qt.length < 2 || tt.length < 2) return false;
  const titleWords = new Set(tt);
  const shared = qt.filter((w) => titleWords.has(w));
  const union = new Set([...qt, ...tt]).size;
  return shared.length / union >= 0.72 && shared.length >= 2;
}

const WEAK = new Set([
  "international",
  "national",
  "global",
  "world",
  "conference",
  "competition",
  "proceedings",
  "annual",
  "report",
  "workshop",
  "symposium",
]);

/** A nearby title worth showing. An unrelated first hit is not. */
export function isUsefulClosest(query: string, title: string) {
  if (!title.trim() || titleMatchesClaim(query, title)) return false;
  const qt = distinctive(query).filter((w) => w.length > 4 && !WEAK.has(w));
  const tt = new Set(distinctive(title).filter((w) => w.length > 4 && !WEAK.has(w)));
  return qt.filter((w) => tt.has(w)).length >= 2;
}

/** True when the claim's content words actually appear in the heard talk. */
export function claimGroundedInTranscript(claim: string, transcript: string) {
  const qt = significantTokens(claim);
  if (qt.length === 0) return false;
  const hay = transcript.toLowerCase();
  const hit = qt.filter((w) => hay.includes(w)).length;
  if (qt.length <= 2) return hit === qt.length;
  return hit >= Math.ceil(qt.length * 0.6);
}
