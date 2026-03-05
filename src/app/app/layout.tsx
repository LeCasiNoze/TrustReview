import { requireUserServer } from "@/lib/auth"
import { getTempSession } from "@/lib/temp-auth"
import { AppShell } from "@/components/layout/app-shell"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Vérifier la session Supabase d'abord
  try {
    const user = await requireUserServer()
    return <AppShell userEmail={user.email}>{children}</AppShell>
  } catch (error) {
    // Si pas de session Supabase, vérifier la session temporaire
    const tempSession = await getTempSession()
    
    if (tempSession && tempSession.verified) {
      // Utiliser la session temporaire
      return <AppShell userEmail={tempSession.email}>{children}</AppShell>
    }
    
    // Si aucune session, rediriger vers login par code
    redirect('/login-code')
  }
}
