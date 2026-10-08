import { redirect } from "next/navigation";
import { getUser } from "@/lib/server/session";
import { AppShell } from "@/components/shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
