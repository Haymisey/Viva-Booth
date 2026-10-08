import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-and-build-secret-key-32-chars-minimum",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "student" },
      plan: { type: "string", defaultValue: "free" },
      credits: { type: "number", defaultValue: 5 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await prisma.userSettings.create({
              data: { userId: user.id },
            });
          } catch (err) {
            console.error("Failed to create UserSettings for user:", user.id, err);
          }
        },
      },
    },
  },
});

export async function getSessionUser() {
  const { getUser } = await import("./server/session");
  return getUser();
}

