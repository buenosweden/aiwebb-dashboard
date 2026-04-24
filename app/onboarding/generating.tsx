"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "🔍", label: "Analyserar ditt företag...", color: "text-blue-500" },
  { icon: "✍️", label: "Skriver texter...", color: "text-purple-500" },
  { icon: "🏗️", label: "Skapar sektioner...", color: "text-orange-500" },
  { icon: "🎨", label: "Applicerar design...", color: "text-pink-500" },
  { icon: "🔎", label: "SEO-optimerar...", color: "text-green-500" },
  { icon: "🚀", label: "Publicerar din sajt...", color: "text-indigo-500" },
];

export function GeneratingScreen() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStep(prev => (prev + 1) % STEPS.length);
        setVisible(true);
      }, 300);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const current = STEPS[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-sm px-6">
        <div
          className={`mx-auto h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center transition-all duration-300 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
        >
          <span className="text-4xl">{current.icon}</span>
        </div>

        <div className={`transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <h2 className={`text-lg font-medium mb-2 ${current.color}`}>
            {current.label}
          </h2>
          <p className="text-sm text-muted-foreground">
            Vi bygger din sajt med AI. Tar bara några sekunder.
          </p>
        </div>

        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1800 ease-linear"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-secondary"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
