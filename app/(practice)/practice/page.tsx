import { Suspense } from "react";
import { PracticeShell } from "@/components/booth/PracticeShell";
import { VoiceRoot } from "@/components/booth/VoiceRoot";

export default function PracticePage() {
  return (
    <>
      <VoiceRoot />
      <Suspense fallback={null}>
        <PracticeShell />
      </Suspense>
    </>
  );
}
