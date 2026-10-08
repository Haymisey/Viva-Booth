import { SiteHeader } from "@/components/viva/SiteHeader";
import "@/components/marketing/haven.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="haven">
      <div className="auth-page">
        <img src="/paper-study.jpg" alt="" width={1920} height={1024} className="auth-art" />
        <SiteHeader simple />
        {children}
      </div>
    </div>
  );
}
