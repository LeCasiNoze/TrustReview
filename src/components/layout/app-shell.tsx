import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

interface AppShellProps {
  children: React.ReactNode
  title?: string
  userEmail?: string
}

export function AppShell({ children, title, userEmail }: AppShellProps) {
  return (
    <div className="layout-container flex h-screen">
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userEmail={userEmail} />
        
        <main className="flex-1 overflow-y-auto" style={{
          background: "hsl(220 20% 96%)",
          backgroundImage: "radial-gradient(ellipse 80% 50% at 100% 0%, hsla(226,71%,55%,0.03) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 0% 100%, hsla(262,83%,58%,0.025) 0%, transparent 55%)",
          padding: "1.5rem",
        }}>
          <div className="mx-auto max-w-6xl animate-fadein">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
