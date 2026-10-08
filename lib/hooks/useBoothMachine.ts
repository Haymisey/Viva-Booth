"use client";

import { useReducer } from "react";

export type BoothState =
  | "IDLE"
  | "RECORDING_1"
  | "TRANSCRIBED_1"
  | "DEBRIEFING_1"
  | "DEBRIEFED_1"
  | "RECORDING_2"
  | "TRANSCRIBED_2"
  | "DEBRIEFING_2"
  | "GRADED"
  | "EXAMINER_Q"
  | "ANSWER_RECORDING"
  | "ANSWER_GRADING"
  | "COMPLETE"
  | "ERROR";

export type TakeRecord = {
  id?: string;
  transcript: string;
  durationMs: number;
  score?: number;
  debrief?: any;
};

export type QuestionRecord = {
  id?: string;
  text: string;
  groundedIn?: any;
  answerTranscript?: string;
  answerScore?: number;
  answerFeedback?: string;
};

export type BoothContext = {
  projectId?: string;
  locale: "en-US" | "am-ET";
  micPermission: "prompt" | "granted" | "denied" | "unsupported";
  interimText: string;
  take1?: TakeRecord;
  take2?: TakeRecord;
  questions: QuestionRecord[];
  activeQuestionIndex: number;
  error?: { message: string; recoverable: boolean };
  previousState?: BoothState;
};

export type MachineSnapshot = {
  state: BoothState;
  context: BoothContext;
};

export type BoothEvent =
  | { type: "START_TAKE_1" }
  | { type: "STOP_RECORDING_1"; payload: { transcript: string; durationMs: number } }
  | { type: "REQUEST_DEBRIEF_1" }
  | { type: "DEBRIEF_1_SUCCESS"; payload: { debrief: any; score: number } }
  | { type: "START_TAKE_2" }
  | { type: "STOP_RECORDING_2"; payload: { transcript: string; durationMs: number } }
  | { type: "REQUEST_DEBRIEF_2" }
  | { type: "DEBRIEF_2_SUCCESS"; payload: { debrief: any; score: number } }
  | { type: "START_EXAMINER"; payload?: { questions?: QuestionRecord[] } }
  | { type: "ANSWER_START" }
  | { type: "ANSWER_STOP"; payload: { answerTranscript: string } }
  | { type: "ANSWER_GRADED"; payload: { score: number; feedback: string } }
  | { type: "NEXT_QUESTION" }
  | { type: "SET_INTERIM"; payload: string }
  | { type: "SET_MIC_PERMISSION"; payload: "prompt" | "granted" | "denied" | "unsupported" }
  | { type: "SET_LOCALE"; payload: "en-US" | "am-ET" }
  | { type: "ERROR"; payload: { message: string; recoverable?: boolean } }
  | { type: "RETRY" }
  | { type: "RESET" }
  | { type: "REHYDRATE"; payload: Partial<BoothContext> };

export const initialBoothContext: BoothContext = {
  locale: "en-US",
  micPermission: "prompt",
  interimText: "",
  questions: [],
  activeQuestionIndex: 0,
};

/**
 * Pure state reducer for the Viva Booth rehearsal cycle.
 */
export function boothReducer(snapshot: MachineSnapshot, event: BoothEvent): MachineSnapshot {
  const { state, context } = snapshot;

  // Global error handler
  if (event.type === "ERROR") {
    return {
      state: "ERROR",
      context: {
        ...context,
        previousState: state !== "ERROR" ? state : context.previousState,
        error: {
          message: event.payload.message,
          recoverable: event.payload.recoverable ?? true,
        },
      },
    };
  }

  // Global retry handler
  if (event.type === "RETRY" && state === "ERROR") {
    const targetState = context.previousState || "IDLE";
    return {
      state: targetState,
      context: {
        ...context,
        error: undefined,
        previousState: undefined,
      },
    };
  }

  // Global reset
  if (event.type === "RESET") {
    return {
      state: "IDLE",
      context: {
        ...initialBoothContext,
        locale: context.locale,
        projectId: context.projectId,
      },
    };
  }

  // Context updates independent of phase
  if (event.type === "SET_INTERIM") {
    return { state, context: { ...context, interimText: event.payload } };
  }
  if (event.type === "SET_MIC_PERMISSION") {
    return { state, context: { ...context, micPermission: event.payload } };
  }
  if (event.type === "SET_LOCALE") {
    return { state, context: { ...context, locale: event.payload } };
  }
  if (event.type === "REHYDRATE") {
    return deriveRehydratedState(context, event.payload);
  }

  // State-specific transitions
  switch (state) {
    case "IDLE":
      if (event.type === "START_TAKE_1") {
        return {
          state: "RECORDING_1",
          context: { ...context, interimText: "" },
        };
      }
      break;

    case "RECORDING_1":
      if (event.type === "STOP_RECORDING_1") {
        return {
          state: "TRANSCRIBED_1",
          context: {
            ...context,
            interimText: "",
            take1: {
              transcript: event.payload.transcript,
              durationMs: event.payload.durationMs,
            },
          },
        };
      }
      break;

    case "TRANSCRIBED_1":
      if (event.type === "REQUEST_DEBRIEF_1") {
        return { state: "DEBRIEFING_1", context };
      }
      break;

    case "DEBRIEFING_1":
      if (event.type === "DEBRIEF_1_SUCCESS") {
        return {
          state: "DEBRIEFED_1",
          context: {
            ...context,
            take1: {
              ...context.take1!,
              debrief: event.payload.debrief,
              score: event.payload.score,
            },
          },
        };
      }
      break;

    case "DEBRIEFED_1":
      if (event.type === "START_TAKE_2") {
        return {
          state: "RECORDING_2",
          context: { ...context, interimText: "" },
        };
      }
      if (event.type === "START_EXAMINER") {
        const qList = event.payload?.questions || context.questions;
        return {
          state: "EXAMINER_Q",
          context: {
            ...context,
            questions: qList,
            activeQuestionIndex: 0,
          },
        };
      }
      break;

    case "RECORDING_2":
      if (event.type === "STOP_RECORDING_2") {
        return {
          state: "TRANSCRIBED_2",
          context: {
            ...context,
            interimText: "",
            take2: {
              transcript: event.payload.transcript,
              durationMs: event.payload.durationMs,
            },
          },
        };
      }
      break;

    case "TRANSCRIBED_2":
      if (event.type === "REQUEST_DEBRIEF_2") {
        return { state: "DEBRIEFING_2", context };
      }
      break;

    case "DEBRIEFING_2":
      if (event.type === "DEBRIEF_2_SUCCESS") {
        return {
          state: "GRADED",
          context: {
            ...context,
            take2: {
              ...context.take2!,
              debrief: event.payload.debrief,
              score: event.payload.score,
            },
          },
        };
      }
      break;

    case "GRADED":
      if (event.type === "START_EXAMINER") {
        const qList = event.payload?.questions || context.questions;
        return {
          state: "EXAMINER_Q",
          context: {
            ...context,
            questions: qList,
            activeQuestionIndex: 0,
          },
        };
      }
      break;

    case "EXAMINER_Q":
      if (event.type === "ANSWER_START") {
        return { state: "ANSWER_RECORDING", context };
      }
      if (event.type === "NEXT_QUESTION") {
        const nextIdx = context.activeQuestionIndex + 1;
        if (nextIdx >= context.questions.length) {
          return { state: "COMPLETE", context };
        }
        return {
          state: "EXAMINER_Q",
          context: { ...context, activeQuestionIndex: nextIdx },
        };
      }
      break;

    case "ANSWER_RECORDING":
      if (event.type === "ANSWER_STOP") {
        const updated = [...context.questions];
        const currentQ = updated[context.activeQuestionIndex];
        if (currentQ) {
          updated[context.activeQuestionIndex] = {
            ...currentQ,
            answerTranscript: event.payload.answerTranscript,
          };
        }
        return {
          state: "ANSWER_GRADING",
          context: { ...context, questions: updated },
        };
      }
      break;

    case "ANSWER_GRADING":
      if (event.type === "ANSWER_GRADED") {
        const updated = [...context.questions];
        const currentQ = updated[context.activeQuestionIndex];
        if (currentQ) {
          updated[context.activeQuestionIndex] = {
            ...currentQ,
            answerScore: event.payload.score,
            answerFeedback: event.payload.feedback,
          };
        }
        return {
          state: "EXAMINER_Q",
          context: { ...context, questions: updated },
        };
      }
      break;

    case "COMPLETE":
      // Terminal state
      break;
  }

  return snapshot;
}

/**
 * Derives initial state when reloading from persisted database takes.
 */
function deriveRehydratedState(
  baseContext: BoothContext,
  payload: Partial<BoothContext>
): MachineSnapshot {
  const merged: BoothContext = { ...baseContext, ...payload };

  let state: BoothState = "IDLE";
  if (merged.take2?.debrief) {
    state = "GRADED";
  } else if (merged.take1?.debrief) {
    state = "DEBRIEFED_1";
  } else if (merged.take1?.transcript) {
    state = "TRANSCRIBED_1";
  }

  if (merged.questions && merged.questions.length > 0) {
    const allAnswered = merged.questions.every((q) => q.answerScore !== undefined);
    if (allAnswered) {
      state = "COMPLETE";
    }
  }

  return { state, context: merged };
}

/**
 * React hook exposing the Booth state machine.
 */
export function useBoothMachine(initial?: Partial<BoothContext>) {
  const [snapshot, dispatch] = useReducer(
    boothReducer,
    {
      state: "IDLE",
      context: { ...initialBoothContext, ...initial },
    }
  );

  return {
    state: snapshot.state,
    context: snapshot.context,
    dispatch,
    // Convenience helper methods
    startTake1: () => dispatch({ type: "START_TAKE_1" }),
    stopRecording1: (transcript: string, durationMs: number) =>
      dispatch({ type: "STOP_RECORDING_1", payload: { transcript, durationMs } }),
    requestDebrief1: () => dispatch({ type: "REQUEST_DEBRIEF_1" }),
    debrief1Success: (debrief: any, score: number) =>
      dispatch({ type: "DEBRIEF_1_SUCCESS", payload: { debrief, score } }),
    startTake2: () => dispatch({ type: "START_TAKE_2" }),
    stopRecording2: (transcript: string, durationMs: number) =>
      dispatch({ type: "STOP_RECORDING_2", payload: { transcript, durationMs } }),
    requestDebrief2: () => dispatch({ type: "REQUEST_DEBRIEF_2" }),
    debrief2Success: (debrief: any, score: number) =>
      dispatch({ type: "DEBRIEF_2_SUCCESS", payload: { debrief, score } }),
    startExaminer: (questions?: QuestionRecord[]) =>
      dispatch({ type: "START_EXAMINER", payload: { questions } }),
    answerStart: () => dispatch({ type: "ANSWER_START" }),
    answerStop: (answerTranscript: string) =>
      dispatch({ type: "ANSWER_STOP", payload: { answerTranscript } }),
    answerGraded: (score: number, feedback: string) =>
      dispatch({ type: "ANSWER_GRADED", payload: { score, feedback } }),
    nextQuestion: () => dispatch({ type: "NEXT_QUESTION" }),
    setError: (message: string, recoverable?: boolean) =>
      dispatch({ type: "ERROR", payload: { message, recoverable } }),
    retry: () => dispatch({ type: "RETRY" }),
    reset: () => dispatch({ type: "RESET" }),
  };
}
