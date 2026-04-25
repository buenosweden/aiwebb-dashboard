"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { siteId: string; wpUrl?: string; }

export function PublishButton({ siteId, wpUrl }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function publish() {
    setStatus("loading");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      setStatus(res.ok ? "ok" : "err");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("err");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status === "ok" && <span className="text-xs text-green-600">Publicerad!</span>}
      {status === "err" && <span className="text-xs text-red-500">Fel vid publicering</span>}
      {wpUrl && status === "idle" && (
        <a href={wpUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">
          {wpUrl.replace("https://", "")} →
        </a>
      )}
      <Button onClick={publish} disabled={status === "loading"} size="sm">
        {status === "loading" ? <><Loader2 className="h-3 w-3 animate-spin mr-2" />Publicerar...</> : "Publicera"}
      </Button>
    </div>
  );
}
