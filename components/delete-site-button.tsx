"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteSiteButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/sites/" + siteId, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        setLoading(false);
        setConfirming(false);
      }
    } catch {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground hidden sm:block">Radera {siteName}?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ja, radera"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
        >
          Avbryt
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs px-2 py-1.5 text-muted-foreground hover:text-red-500 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
