export function talkWordCount(transcript: string) {
  const clean = transcript.trim();
  if (!clean) return 0;
  return clean.split(/\s+/).length;
}

export function talkIsReady(seconds: number, transcript: string) {
  return seconds >= 20 && talkWordCount(transcript) >= 40;
}
