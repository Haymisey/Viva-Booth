"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { SiteHeader } from "@/components/viva/SiteHeader";

type Props = {
  name: string;
  email: string;
};

export function SettingsForm({ name: initialName, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setIsError(true);
        setMessage(json.error || "Could not save your name.");
      } else {
        setMessage("Saved.");
        router.refresh();
      }
    } catch {
      setIsError(true);
      setMessage("Could not save your name.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <img src="/paper-study.jpg" alt="" width={1920} height={1024} className="auth-art" />
      <SiteHeader simple backHref="/practice" backLabel="Back to practice" />
      <main className="auth-main">
        <div className="auth-heading">
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1>A few things about you.</h1>
          <p>Change how Viva greets you. Your talks stay on this account.</p>
        </div>

        {message ? (
          <div role={isError ? "alert" : "status"} className={`auth-message ${isError ? "error" : ""}`}>
            {message}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={save}>
          <div>
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} readOnly disabled />
          </div>
          <button type="submit" className="viva-button" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : <>Save <ArrowUpRight size={16} /></>}
          </button>
        </form>
      </main>
    </div>
  );
}
