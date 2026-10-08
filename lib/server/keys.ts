import { decrypt, encrypt, mask } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { platformGeminiKey, runWithGeminiKey } from "@/lib/gemini-key";

export async function resolveGeminiKey(userId?: string | null) {
  if (userId) {
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (settings?.geminiKeyEnc) {
      try {
        const userKey = decrypt(settings.geminiKeyEnc).trim().replace(/^["']|["']$/g, "");
        if (userKey) return userKey;
      } catch {
        /* use platform key */
      }
    }
  }
  return platformGeminiKey();
}

export async function withUserGemini<T>(fn: () => Promise<T>) {
  const user = await getSessionUser().catch(() => null);
  const key = await resolveGeminiKey(user?.id);
  return runWithGeminiKey(key, fn);
}

export async function geminiKeyStatus(userId: string) {
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  if (!settings.geminiKeyEnc) return { set: false, masked: "" };
  try {
    return { set: true, masked: mask(decrypt(settings.geminiKeyEnc)) };
  } catch {
    return { set: true, masked: "••••••••" };
  }
}

export async function saveGeminiKey(userId: string, key: string | null) {
  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      geminiKeyEnc: key ? encrypt(key) : null,
      devMode: Boolean(key),
    },
    update: {
      geminiKeyEnc: key ? encrypt(key) : null,
      devMode: Boolean(key),
    },
  });
}
