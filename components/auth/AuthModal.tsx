"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  credits: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMode?: "login" | "register";
};

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = "login" }: Props) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = mode === "register" ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-rule bg-card p-6 shadow-2xl md:p-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4">
          <h2 className="font-display text-3xl text-ink">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink/40 hover:bg-ink/5 hover:text-ink transition"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-ink/60 mb-6">
          {mode === "login"
            ? "Sign in to access your viva takes, mock chat history, and pro coaching."
            : "Register to save your defense takes, track progress, and practice with examiner AI."}
        </p>

        {error ? (
          <div className="mb-4 rounded-xl border border-rust/30 bg-rust/5 p-3 text-sm text-rust">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" ? (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abebe Bikila"
                className="w-full rounded-xl border border-rule bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ink"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@university.edu.et"
              className="w-full rounded-xl border border-rule bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-rule bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ink"
            />
          </div>

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 border-t border-rule pt-4 text-center text-sm text-ink/70">
          {mode === "login" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className="font-medium text-ink underline underline-offset-4 hover:opacity-80"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="font-medium text-ink underline underline-offset-4 hover:opacity-80"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
