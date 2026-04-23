"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

export function PublishButton() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");

  async function handlePublish() {
    setState("loading");
    setMessage("");

    try {
      const res = await fetch("/api/publish", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setState("error");
        setMessage(data.error ?? "Något gick fel");
        setTimeout(() => setState("idle"), 4000);
        return;
      }

      setState("success");
      setMessage(data.action === "created" ? "Sida skapad!" : "Sida uppdaterad!");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setMessage("Kunde inte nå servern");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {state === "success" && (
        <span className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle className="h-3.5 w-3.5" />
          {message}
        </span>
      )}
      {state === "error" && (
        <span className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />
          {message}
        </span>
      )}

      <Button
        size="sm"
        onClick={handlePublish}
        disabled={state === "loading"}
      >
        {state === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {state === "loading" ? "Publicerar..." : "Publicera"}
      </Button>
    </div>
  );
}
