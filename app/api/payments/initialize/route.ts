import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Please log in to upgrade." }, { status: 401 });
    }

    const body = await req.json();
    const { plan = "pro_monthly" } = body;

    const pricing: Record<string, { amount: number; label: string }> = {
      pro_monthly: { amount: 299, label: "Viva Pro (Unlimited Takes & Mock Chat)" },
      pack_10: { amount: 99, label: "10 Practice Takes Pack" },
    };

    const selected = pricing[plan] || pricing.pro_monthly;
    const txRef = `viva-tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const chapaKey = process.env.CHAPA_SECRET_KEY?.trim();

    // 1. Create a pending payment in DB
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        txRef,
        amount: selected.amount,
        currency: "ETB",
        status: "pending",
        provider: chapaKey ? "chapa" : "test",
        planPurchased: plan,
      },
    });

    // 2. If Chapa is configured, initialize live transaction with Chapa
    if (chapaKey) {
      const origin = req.headers.get("origin") || "http://localhost:3000";
      const chapaRes = await fetch("https://api.chapa.co/v1/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${chapaKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: selected.amount,
          currency: "ETB",
          email: user.email,
          first_name: user.name.split(" ")[0] || "Student",
          last_name: user.name.split(" ").slice(1).join(" ") || "Candidate",
          tx_ref: txRef,
          callback_url: `${origin}/api/payments/verify?tx_ref=${txRef}`,
          return_url: `${origin}?payment_status=success&tx_ref=${txRef}`,
          customization: {
            title: "Viva Defense Pro",
            description: selected.label,
          },
        }),
      });

      const chapaData = await chapaRes.json();
      if (chapaData.status === "success" && chapaData.data?.checkout_url) {
        return NextResponse.json({
          ok: true,
          mode: "live",
          checkoutUrl: chapaData.data.checkout_url,
          txRef,
        });
      }
    }

    // 3. Fallback / Test Checkout Mode (Instant dev simulation)
    return NextResponse.json({
      ok: true,
      mode: "test",
      txRef,
      amount: selected.amount,
      plan,
      message: "Test payment initialized. You can confirm immediately.",
    });
  } catch (error) {
    console.error("Payment init error:", error);
    return NextResponse.json({ ok: false, error: "Failed to initialize payment" }, { status: 500 });
  }
}
