"use client";

import { useEffect, useState } from "react";
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiSet, setGeminiSet] = useState(false);
  const [masked, setMasked] = useState("");
  const [busy, setBusy] = useState<"name" | "password" | "key" | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/settings/keys");
      const json = await res.json();
      if (json.ok) {
        setGeminiSet(Boolean(json.geminiSet));
        setMasked(String(json.masked || ""));
      }
    })();
  }, []);

  function note(text: string, error = false) {
    setIsError(error);
    setMessage(text);
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setBusy("name");
    note("");
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) note(json.error || "Could not save your name.", true);
      else {
        note("Name saved.");
        router.refresh();
      }
    } catch {
      note("Could not save your name.", true);
    } finally {
      setBusy(null);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setBusy("password");
    note("");
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) note(json.error || "Could not change password.", true);
      else {
        setCurrentPassword("");
        setNewPassword("");
        note("Password changed. Other devices will need to sign in again.");
      }
    } catch {
      note("Could not change password.", true);
    } finally {
      setBusy(null);
    }
  }

  async function saveKey(event: React.FormEvent) {
    event.preventDefault();
    setBusy("key");
    note("");
    try {
      const res = await fetch("/api/settings/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiKey }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) note(json.error || "Could not save the key.", true);
      else {
        setGeminiKey("");
        setGeminiSet(Boolean(json.geminiSet));
        setMasked(String(json.masked || ""));
        note("Your Gemini key is saved. Debriefs will use it.");
      }
    } catch {
      note("Could not save the key.", true);
    } finally {
      setBusy(null);
    }
  }

  async function clearKey() {
    setBusy("key");
    note("");
    try {
      const res = await fetch("/api/settings/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiKey: null }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) note(json.error || "Could not remove the key.", true);
      else {
        setGeminiSet(false);
        setMasked("");
        note("Using the shared Gemini key again.");
      }
    } catch {
      note("Could not remove the key.", true);
    } finally {
      setBusy(null);
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
          <p>Name, password, and an optional Gemini key for your talks.</p>
        </div>

        {message ? (
          <div role={isError ? "alert" : "status"} className={`auth-message ${isError ? "error" : ""}`}>
            {message}
          </div>
        ) : null}

        <form className="auth-form" onSubmit={saveName}>
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
              disabled={busy !== null}
            />
          </div>
          <div>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} readOnly disabled />
          </div>
          <button type="submit" className="viva-button" disabled={busy !== null}>
            {busy === "name" ? <LoaderCircle className="animate-spin" size={16} /> : <>Save name <ArrowUpRight size={16} /></>}
          </button>
        </form>

        <form className="auth-form settings-block" onSubmit={savePassword}>
          <p className="settings-kicker">Password</p>
          <div>
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={busy !== null}
            />
          </div>
          <div>
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={busy !== null}
            />
          </div>
          <button type="submit" className="viva-button" disabled={busy !== null}>
            {busy === "password" ? <LoaderCircle className="animate-spin" size={16} /> : <>Change password <ArrowUpRight size={16} /></>}
          </button>
        </form>

        <form className="auth-form settings-block" onSubmit={saveKey}>
          <p className="settings-kicker">Your Gemini key</p>
          <p className="settings-help">
            {geminiSet
              ? `Saved ${masked}. Debriefs use this key until you remove it.`
              : "Optional. Paste a Gemini API key if the shared limit is full."}
          </p>
          <div>
            <label htmlFor="gemini-key">Gemini API key</label>
            <input
              id="gemini-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={geminiKey}
              onChange={(event) => setGeminiKey(event.target.value)}
              disabled={busy !== null}
              placeholder={geminiSet ? "Paste a new key to replace it" : "AIza…"}
            />
          </div>
          <div className="settings-row">
            <button type="submit" className="viva-button" disabled={busy !== null || !geminiKey.trim()}>
              {busy === "key" ? <LoaderCircle className="animate-spin" size={16} /> : <>Save key <ArrowUpRight size={16} /></>}
            </button>
            {geminiSet ? (
              <button type="button" className="settings-clear" disabled={busy !== null} onClick={() => void clearKey()}>
                Remove key
              </button>
            ) : null}
          </div>
        </form>
      </main>
    </div>
  );
}
