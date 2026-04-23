"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  hero: "Hero",
  usp_row: "USP-rad",
  text_block: "Textblock",
  table: "Tabell",
  cta_band: "CTA-band",
  faq: "FAQ",
  feature_grid: "Funktionsrutnät",
};

interface SectionCardProps {
  type: string;
  preview: string;
  onClick?: () => void;
  className?: string;
}

export function SectionCard({ type, preview, onClick, className }: SectionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 w-full p-4 rounded-lg border bg-background hover:border-foreground/20 transition-colors text-left",
        className
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {typeLabels[type] ?? type}
          </span>
        </div>
        <div className="text-sm text-foreground truncate">{preview}</div>
      </div>
    </button>
  );
}
