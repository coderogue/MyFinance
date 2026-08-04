import { WorkbookApp } from "@/components/workbook/workbook-app";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <WorkbookApp accountControls={<span className="flex items-center gap-3"><span>{user.email}</span><LogoutButton /></span>} />;
}
