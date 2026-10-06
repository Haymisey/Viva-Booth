import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const txRef = searchParams.get("tx_ref");
  if (!txRef) {
    return NextResponse.redirect(new URL("/?payment_status=error", req.url));
  }
  return fulfillPayment(txRef, req);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { txRef } = body;
    if (!txRef) {
      return NextResponse.json({ ok: false, error: "Missing txRef" }, { status: 400 });
    }
    const result = await fulfillPaymentInternal(txRef);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

async function fulfillPaymentInternal(txRef: string) {
  const payment = await prisma.payment.findUnique({
    where: { txRef },
    include: { user: true },
  });

  if (!payment) {
    return { ok: false, error: "Payment transaction not found" };
  }

  if (payment.status === "completed") {
    return { ok: true, message: "Payment already processed", user: payment.user };
  }

  // If Chapa is configured, verify transaction with Chapa
  const chapaKey = process.env.CHAPA_SECRET_KEY?.trim();
  if (chapaKey && payment.provider === "chapa") {
    try {
      const chapaRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
        headers: { Authorization: `Bearer ${chapaKey}` },
      });
      const data = await chapaRes.json();
      if (data.status !== "success") {
        return { ok: false, error: "Transaction verification with Chapa failed" };
      }
    } catch {
      return { ok: false, error: "Could not communicate with Chapa" };
    }
  }

  // Complete payment and upgrade user
  await prisma.payment.update({
    where: { txRef },
    data: { status: "completed" },
  });

  let updatedUser;
  if (payment.planPurchased === "pro_monthly") {
    updatedUser = await prisma.user.update({
      where: { id: payment.userId },
      data: { plan: "pro" },
    });
  } else {
    // 10 credits pack
    updatedUser = await prisma.user.update({
      where: { id: payment.userId },
      data: { credits: { increment: 10 } },
    });
  }

  return {
    ok: true,
    message: "Payment successfully verified and plan activated!",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      plan: updatedUser.plan,
      credits: updatedUser.credits,
    },
  };
}

async function fulfillPayment(txRef: string, req: Request) {
  const result = await fulfillPaymentInternal(txRef);
  const status = result.ok ? "success" : "failed";
  return NextResponse.redirect(new URL(`/?payment_status=${status}`, req.url));
}
