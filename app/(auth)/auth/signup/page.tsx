"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/practice";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.signUp.email({
        name: name || email.split("@")[0],
        email,
        password,
      });

      if (res.error) {
        setErrorMessage(res.error.message?.trim() || "Failed to create account.");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Sign up failed:", err);
      setErrorMessage("An unexpected error occurred during registration.");
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (err) {
      console.error("Social login with google failed:", err);
      setErrorMessage("Google sign-in did not complete. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-main reveal">
      <div className="auth-heading">
        <span className="eyebrow">YOUR WORK. YOUR WORDS.</span>
        <h1>Make yourself at home.</h1>
        <p>A little space to practice. A little more confidence.</p>
      </div>

      {errorMessage ? (
        <div role="alert" className="auth-message error">
          {errorMessage}
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="How should we greet you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" className="viva-button" disabled={isLoading}>
          {isLoading ? <LoaderCircle className="animate-spin" size={16} /> : <>Create your account <ArrowUpRight size={16} /></>}
        </button>
      </form>

      <div className="auth-divider">or take the familiar way</div>
      <button type="button" className="google-button" onClick={handleGoogle} disabled={isLoading}>
        <span className="google-mark">G</span>
        Continue with Google
      </button>

      <div className="auth-switch">
        Already have a space?
        <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Back to sign in</Link>
      </div>
      <p className="auth-note">
        <LockKeyhole size={11} />
        Just your account. No extra profile needed.
      </p>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <React.Suspense fallback={<main className="auth-main">Loading registration...</main>}>
      <SignUpForm />
    </React.Suspense>
  );
}
