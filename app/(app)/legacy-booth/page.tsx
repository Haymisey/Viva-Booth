import { Booth } from "@/components/booth/Booth";
import { VoiceRoot } from "@/components/booth/VoiceRoot";

export default function LegacyBoothPage() {
  return (
    <main className="p-4 max-w-7xl mx-auto">
      <Booth />
      <VoiceRoot />
    </main>
  );
}
