import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { boothReducer, initialBoothContext, type MachineSnapshot } from "../../lib/hooks/useBoothMachine";

describe("Booth Finite State Machine", () => {
  it("progresses through Take 1, Take 2, and Examiner Q&A to COMPLETE", () => {
    let snapshot: MachineSnapshot = {
      state: "IDLE",
      context: { ...initialBoothContext },
    };

    // 1. Start Take 1
    snapshot = boothReducer(snapshot, { type: "START_TAKE_1" });
    assert.equal(snapshot.state, "RECORDING_1");

    // 2. Stop recording Take 1
    snapshot = boothReducer(snapshot, {
      type: "STOP_RECORDING_1",
      payload: { transcript: "My thesis defense on NLP.", durationMs: 45000 },
    });
    assert.equal(snapshot.state, "TRANSCRIBED_1");
    assert.equal(snapshot.context.take1?.transcript, "My thesis defense on NLP.");

    // 3. Request Debrief 1
    snapshot = boothReducer(snapshot, { type: "REQUEST_DEBRIEF_1" });
    assert.equal(snapshot.state, "DEBRIEFING_1");

    // 4. Debrief 1 Success
    snapshot = boothReducer(snapshot, {
      type: "DEBRIEF_1_SUCCESS",
      payload: { debrief: { keep: ["Good pace"], fix: ["Cite more"], say: "Model" }, score: 72 },
    });
    assert.equal(snapshot.state, "DEBRIEFED_1");
    assert.equal(snapshot.context.take1?.score, 72);

    // 5. Start Take 2 (Re-take drill)
    snapshot = boothReducer(snapshot, { type: "START_TAKE_2" });
    assert.equal(snapshot.state, "RECORDING_2");

    // 6. Stop recording Take 2
    snapshot = boothReducer(snapshot, {
      type: "STOP_RECORDING_2",
      payload: { transcript: "My improved thesis defense on NLP citing Vaswani.", durationMs: 48000 },
    });
    assert.equal(snapshot.state, "TRANSCRIBED_2");

    // 7. Request Debrief 2
    snapshot = boothReducer(snapshot, { type: "REQUEST_DEBRIEF_2" });
    assert.equal(snapshot.state, "DEBRIEFING_2");

    // 8. Debrief 2 Success (Graded against Take 1)
    snapshot = boothReducer(snapshot, {
      type: "DEBRIEF_2_SUCCESS",
      payload: { debrief: { verdict: "improved", delta: 14 }, score: 86 },
    });
    assert.equal(snapshot.state, "GRADED");
    assert.equal(snapshot.context.take2?.score, 86);

    // 9. Start Examiner Q&A
    const questions = [
      { text: "How did you evaluate BLEU score?" },
      { text: "What is your main contribution?" },
    ];
    snapshot = boothReducer(snapshot, { type: "START_EXAMINER", payload: { questions } });
    assert.equal(snapshot.state, "EXAMINER_Q");
    assert.equal(snapshot.context.activeQuestionIndex, 0);

    // 10. Candidate answers Question 1
    snapshot = boothReducer(snapshot, { type: "ANSWER_START" });
    assert.equal(snapshot.state, "ANSWER_RECORDING");

    snapshot = boothReducer(snapshot, {
      type: "ANSWER_STOP",
      payload: { answerTranscript: "We used sacreBLEU with standard tokenization." },
    });
    assert.equal(snapshot.state, "ANSWER_GRADING");

    snapshot = boothReducer(snapshot, {
      type: "ANSWER_GRADED",
      payload: { score: 90, feedback: "Precise answer." },
    });
    assert.equal(snapshot.state, "EXAMINER_Q");
    assert.equal(snapshot.context.questions[0].answerScore, 90);

    // 11. Move to next question
    snapshot = boothReducer(snapshot, { type: "NEXT_QUESTION" });
    assert.equal(snapshot.state, "EXAMINER_Q");
    assert.equal(snapshot.context.activeQuestionIndex, 1);

    // Candidate answers Question 2
    snapshot = boothReducer(snapshot, { type: "ANSWER_START" });
    snapshot = boothReducer(snapshot, {
      type: "ANSWER_STOP",
      payload: { answerTranscript: "Low-resource benchmark dataset." },
    });
    snapshot = boothReducer(snapshot, {
      type: "ANSWER_GRADED",
      payload: { score: 85, feedback: "Good." },
    });

    // Final question answered -> moves to COMPLETE
    snapshot = boothReducer(snapshot, { type: "NEXT_QUESTION" });
    assert.equal(snapshot.state, "COMPLETE");
  });

  it("handles recoverable errors and returns to previous state on RETRY", () => {
    let snapshot: MachineSnapshot = {
      state: "RECORDING_1",
      context: { ...initialBoothContext },
    };

    // Encounter network failure while recording
    snapshot = boothReducer(snapshot, {
      type: "ERROR",
      payload: { message: "Microphone lost connection", recoverable: true },
    });
    assert.equal(snapshot.state, "ERROR");
    assert.equal(snapshot.context.previousState, "RECORDING_1");

    // Retry restores previous state
    snapshot = boothReducer(snapshot, { type: "RETRY" });
    assert.equal(snapshot.state, "RECORDING_1");
    assert.equal(snapshot.context.error, undefined);
  });

  it("rehydrates correctly from database state", () => {
    const initial: MachineSnapshot = {
      state: "IDLE",
      context: { ...initialBoothContext },
    };

    const rehydrated = boothReducer(initial, {
      type: "REHYDRATE",
      payload: {
        take1: { transcript: "Text 1", durationMs: 30000, debrief: {}, score: 70 },
        take2: { transcript: "Text 2", durationMs: 32000, debrief: {}, score: 85 },
      },
    });

    assert.equal(rehydrated.state, "GRADED");
    assert.equal(rehydrated.context.take1?.score, 70);
    assert.equal(rehydrated.context.take2?.score, 85);
  });
});
