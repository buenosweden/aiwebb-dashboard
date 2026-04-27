"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileText, Palette, Phone, Globe, TrendingUp, CreditCard, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Innehåll",
    items: [
      { label: "Startsida", href: "/hantera", icon: LayoutGrid },
      { label: "Mina sajter", href: "/hantera/sajter", icon: Globe },
      { label: "Sektioner", href: "/hantera/sektioner", icon: FileText },
      { label: "Blogg", href: "/hantera/blogg", icon: FileText },
    ],
  },
  {
    title: "Inställningar",
    items: [
      { label: "Varumärke", href: "/hantera/varumarke", icon: Palette },
      { label: "Kontakt", href: "/hantera/kontakt", icon: Phone },
      { label: "Domän", href: "/hantera/domen", icon: Globe },
      { label: "Prenumeration", href: "/hantera/prenumeration", icon: CreditCard },
    ],
  },
  {
    title: "Tillväxt",
    items: [
      { label: "SEO-rapport", href: "/hantera/seo", icon: TrendingUp },
      { label: "Besökare", href: "/hantera/besokare", icon: TrendingUp },
    ],
  },
];

interface SidebarProps {
  siteName: string;
  siteUrl?: string;
}

export function Sidebar({ siteName, siteUrl }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r bg-background flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b">
        <Link href="/hantera" className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-semibold text-xs">{siteName.slice(0, 1).toUpperCase()}</span>
          </div>
          <span className="text-sm font-medium truncate">{siteName}</span>
        </Link>
        {siteUrl && (
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors truncate">
            <Globe className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{siteUrl.replace("https://", "")}</span>
          </a>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {sections.map(section => (
          <div key={section.title}>
            <div className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/hantera" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} className={cn("app-sidebar-item", isActive && "app-sidebar-item-active")}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-3 space-y-1">
        <Link href="/onboarding" className="app-sidebar-item text-xs">
          <Plus className="h-4 w-4" />
          Ny hemsida
        </Link>
        <Link href="/hantera/konto" className="app-sidebar-item text-xs text-muted-foreground">
          Konto & inställningar
        </Link>
      </div>
    </aside>
  );
}
