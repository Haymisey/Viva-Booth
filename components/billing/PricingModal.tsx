"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { AuthUser } from "@/components/auth/AuthModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onPlanUpdated: (updatedUser: AuthUser) => void;
  onRequireAuth: () => void;
};

export function PricingModal({
  isOpen,
  onClose,
  user,
  onPlanUpdated,
  onRequireAuth,
}: Props) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleCheckout = async (plan: "pro_monthly" | "pack_10") => {
    if (!user) {
      onClose();
      onRequireAuth();
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoadingPlan(plan);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      if (data.mode === "live" && data.checkoutUrl) {
        // Redirect to Chapa Payment page
        window.location.href = data.checkoutUrl;
        return;
      }

      // Test mode / Simulated confirmation
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txRef: data.txRef }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.ok) {
        throw new Error(verifyData.error || "Failed to confirm payment");
      }

      setSuccessMsg("Success! Your plan was upgraded.");
      if (verifyData.user) {
        onPlanUpdated(verifyData.user);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment error occurred");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-3xl border border-rule bg-card p-6 shadow-2xl md:p-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4">
          <h2 className="font-display text-3xl text-ink">Viva Plans & Credits</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink/40 hover:bg-ink/5 hover:text-ink transition"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-ink/65 mb-6">
          Prepare for your academic viva defense with grounded AI examiner feedback and real citation verification.
        </p>

        {user ? (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rule bg-paper px-5 py-3 text-sm">
            <div>
              <span className="text-ink/60">Current Plan: </span>
              <span className="font-semibold uppercase tracking-wider text-ink">{user.plan}</span>
            </div>
            <div>
              <span className="text-ink/60">Available Takes: </span>
              <span className="font-semibold text-ink">
                {user.plan === "pro" ? "Unlimited" : `${user.credits} takes remaining`}
              </span>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-xl border border-rust/30 bg-rust/5 p-3 text-sm text-rust">
            {error}
          </div>
        ) : null}

        {successMsg ? (
          <div className="mb-4 rounded-xl border border-moss/30 bg-moss/10 p-3 text-sm text-moss">
            {successMsg}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {/* 10 Takes Pack */}
          <div className="flex flex-col justify-between rounded-2xl border border-rule bg-paper p-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                Practice Pack
              </span>
              <h3 className="font-display mt-1 text-2xl text-ink">10 Takes</h3>
              <p className="mt-2 text-3xl font-display text-ink">
                99 <span className="text-base font-sans text-ink/60">ETB</span>
              </p>
              <ul className="mt-4 space-y-2 text-xs text-ink/75">
                <li>✓ 10 full defense recordings</li>
                <li>✓ Scholarxiv citation verification</li>
                <li>✓ Interactive examiner Q&A chat</li>
                <li>✓ Never expires</li>
              </ul>
            </div>
            <Button
              tone="line"
              type="button"
              className="mt-6 w-full"
              disabled={loadingPlan !== null}
              onClick={() => handleCheckout("pack_10")}
            >
              {loadingPlan === "pack_10" ? "Processing..." : "Get 10 Takes"}
            </Button>
          </div>

          {/* Pro Monthly */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-ink bg-paper p-5 relative">
            <span className="absolute -top-3 right-4 rounded-full bg-ink px-3 py-0.5 text-[11px] font-semibold text-paper uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-moss">
                Pro Candidate
              </span>
              <h3 className="font-display mt-1 text-2xl text-ink">Unlimited Pro</h3>
              <p className="mt-2 text-3xl font-display text-ink">
                299 <span className="text-base font-sans text-ink/60">ETB / mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-xs text-ink/75">
                <li>✓ Unlimited thesis practice sessions</li>
                <li>✓ Full examiner chat dialogue history</li>
                <li>✓ Priority speech & citation checks</li>
                <li>✓ Comprehensive PDF debrief exports</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
            <Button
              tone="solid"
              type="button"
              className="mt-6 w-full"
              disabled={loadingPlan !== null || user?.plan === "pro"}
              onClick={() => handleCheckout("pro_monthly")}
            >
              {loadingPlan === "pro_monthly"
                ? "Processing..."
                : user?.plan === "pro"
                ? "Active Plan"
                : "Upgrade to Pro"}
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-ink/50">
          Secure payment supported via Chapa (Telebirr, CBE Birr, Debit Cards) and local bank transfers.
        </div>
      </div>
    </div>
  );
}
