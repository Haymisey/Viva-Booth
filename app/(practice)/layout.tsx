import "@/components/marketing/haven.css";

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="haven min-h-screen"
      style={{ fontFamily: "var(--font-manrope), var(--font-ethiopic), sans-serif" }}
    >
      {children}
    </div>
  );
}
