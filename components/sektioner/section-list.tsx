"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { SectionEditor } from "@/components/sektioner/section-editor";
import type { Section } from "@/lib/payload";
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

function getPreview(s: Section): string {
  switch (s.type) {
    case "hero": return s.data.headline;
    case "usp_row": return `${s.data.items.length} punkter`;
    case "text_block": return s.data.heading;
    case "table": return s.data.heading;
    case "cta_band": return s.data.heading;
    case "faq": return `${s.data.items.length} frågor`;
    case "feature_grid": return s.data.heading;
  }
}

export function SectionList({ sections }: { sections: Section[] }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <>
      <div className="space-y-2 mb-4">
        {sections.map((section, i) => (
          <button
            key={i}
            onClick={() => setEditingIndex(i)}
            className={cn(
              "group flex items-center gap-3 w-full p-4 rounded-lg border bg-background hover:border-foreground/30 hover:shadow-sm transition-all text-left"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                {typeLabels[section.type] ?? section.type}
              </div>
              <div className="text-sm text-foreground truncate">{getPreview(section)}</div>
            </div>
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Redigera →
            </span>
          </button>
        ))}
      </div>

      {editingIndex !== null && (
        <SectionEditor
          section={sections[editingIndex]}
          index={editingIndex}
          open={editingIndex !== null}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </>
  );
}
