import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { HttpError } from "./http";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  credits: number;
  image?: string | null;
}

export async function getUser(): Promise<SessionUser | null> {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({
      headers: headerList,
    });
    if (!session?.user) {
      return null;
    }
    const u = session.user as unknown as Record<string, unknown>;
    return {
      id: String(u.id),
      email: String(u.email),
      name: String(u.name ?? ""),
      role: String(u.role ?? "student"),
      plan: String(u.plan ?? "free"),
      credits: typeof u.credits === "number" ? u.credits : 5,
      image: u.image ? String(u.image) : null,
    };
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Error reading session:", err);
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    throw new HttpError("UNAUTHENTICATED", "Authentication required", 401);
  }
  return user;
}
