import { redirect } from "next/navigation";
import { getUser } from "@/lib/server/session";
import { SettingsForm } from "@/components/viva/SettingsForm";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/signin?callbackUrl=/settings");
  }

  return <SettingsForm name={user.name} email={user.email} />;
}
