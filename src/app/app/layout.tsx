import { getRequestIdentity } from "@/lib/request-identity"
import { AppShell } from "@/components/layout/app-shell"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const identity = await getRequestIdentity()

  if (!identity.isAuthenticated) {
    redirect('/login-code')
  }

  return <AppShell userEmail={identity.email}>{children}</AppShell>
}
