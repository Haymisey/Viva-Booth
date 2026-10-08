"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/practice";

  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Invalid email or password");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Sign in failed:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
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
        <h1>Welcome back.</h1>
        <p>Take a breath. Your quiet space is waiting.</p>
      </div>

      {errorMessage ? (
        <div role="alert" className="auth-message error">
          {errorMessage}
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              placeholder="Your password"
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
          {isLoading ? <LoaderCircle className="animate-spin" size={16} /> : <>Step into Viva <ArrowUpRight size={16} /></>}
        </button>
      </form>

      <div className="auth-divider">or take the familiar way</div>
      <button type="button" className="google-button" onClick={handleGoogle} disabled={isLoading}>
        <span className="google-mark">G</span>
        Continue with Google
      </button>

      <div className="auth-switch">
        New here?
        <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Create an account</Link>
      </div>
      <p className="auth-note">
        <LockKeyhole size={11} />
        Just your account. No extra profile needed.
      </p>
    </main>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense fallback={<main className="auth-main">Loading sign-in...</main>}>
      <SignInForm />
    </React.Suspense>
  );
}
