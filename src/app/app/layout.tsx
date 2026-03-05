import { requireUserServer } from "@/lib/auth"
import { AppShell } from "@/components/layout/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUserServer()

  return <AppShell userEmail={user.email}>{children}</AppShell>
}
