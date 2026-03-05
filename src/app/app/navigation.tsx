"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/app", label: "Tableau de bord", icon: "📊" },
    { href: "/app/qr", label: "QR Codes", icon: "📱" },
    { href: "/app/stats", label: "Statistiques", icon: "📈" },
    { href: "/app/feedbacks", label: "Avis", icon: "💬" },
    { href: "/app/billing", label: "Facturation", icon: "💳" },
    { href: "/app/settings", label: "Paramètres", icon: "⚙️" },
  ];

  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Button>
        </Link>
      ))}
    </nav>
  );
}
