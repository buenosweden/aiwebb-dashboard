import { Button } from "@/components/ui/button";
import { Eye, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

interface TopbarProps {
  pageTitle: string;
  pageKicker?: string;
  previewUrl?: string;
  publishButton?: ReactNode;
}

export function Topbar({ pageTitle, pageKicker, previewUrl, publishButton }: TopbarProps) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background sticky top-0 z-10">
      <div className="flex flex-col gap-0.5">
        {pageKicker && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {pageKicker}
          </span>
        )}
        <h1 className="text-sm font-medium">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {previewUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="h-3.5 w-3.5" />
              Förhandsvisa
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          </Button>
        )}
        {publishButton}
      </div>
    </header>
  );
}
