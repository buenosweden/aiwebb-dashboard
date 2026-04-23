"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSection } from "@/app/hantera/actions";
import type { Section, HeroSection, TextBlockSection, CtaBandSection, FaqSection, FeatureGridSection, TableSection, UspRowSection } from "@/lib/payload";

interface SectionEditorProps {
  section: Section;
  index: number;
  open: boolean;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  hero: "Hero",
  usp_row: "USP-rad",
  text_block: "Textblock",
  table: "Tabell",
  cta_band: "CTA-band",
  faq: "FAQ",
  feature_grid: "Funktionsrutnät",
};

export function SectionEditor({ section, index, open, onClose }: SectionEditorProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState(section.data as Record<string, unknown>);

  function update(key: string, value: unknown) {
    setData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const updated = { ...section, data } as Section;
    await updateSection(index, updated);
    setSaving(false);
    setSaved(true);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle>{typeLabels[section.type] ?? section.type}</SheetTitle>
          <SheetDescription>Redigera innehållet. Klicka Spara när du är klar, sedan Publicera på startsidan.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {section.type === "hero" && <HeroEditor data={data} update={update} />}
          {section.type === "usp_row" && <UspEditor data={data} update={update} />}
          {section.type === "text_block" && <TextBlockEditor data={data} update={update} />}
          {section.type === "table" && <TableEditor data={data} update={update} />}
          {section.type === "cta_band" && <CtaBandEditor data={data} update={update} />}
          {section.type === "faq" && <FaqEditor data={data} update={update} />}
          {section.type === "feature_grid" && <FeatureGridEditor data={data} update={update} />}
        </div>

        <div className="border-t p-4 flex items-center justify-between">
          {saved && <span className="text-xs text-green-600">✓ Sparat</span>}
          {!saved && <span />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Avbryt</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Sparar..." : "Spara"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroEditor({ data, update }: EditorProps) {
  return (
    <>
      <Field label="Eyebrow-text (liten text ovan rubrik)">
        <Input value={(data.eyebrow as string) ?? ""} onChange={e => update("eyebrow", e.target.value)} placeholder="T.ex. Komplett guide" />
      </Field>
      <Field label="Rubrik">
        <Input value={(data.headline as string) ?? ""} onChange={e => update("headline", e.target.value)} placeholder="Stor rubrik" />
      </Field>
      <Field label="Underrubrik">
        <Textarea value={(data.subheadline as string) ?? ""} onChange={e => update("subheadline", e.target.value)} rows={2} />
      </Field>
      <Divider label="Primär knapp" />
      <Field label="Knapptext">
        <Input value={((data.primary_cta as Record<string,string>)?.label) ?? ""} onChange={e => update("primary_cta", { ...(data.primary_cta as object), label: e.target.value })} />
      </Field>
      <Field label="Länk">
        <Input value={((data.primary_cta as Record<string,string>)?.url) ?? ""} onChange={e => update("primary_cta", { ...(data.primary_cta as object), url: e.target.value })} placeholder="https://..." />
      </Field>
      <Divider label="Sekundär knapp (valfri)" />
      <Field label="Knapptext">
        <Input value={((data.secondary_cta as Record<string,string>)?.label) ?? ""} onChange={e => update("secondary_cta", { ...(data.secondary_cta as object ?? {}), label: e.target.value })} />
      </Field>
      <Field label="Länk">
        <Input value={((data.secondary_cta as Record<string,string>)?.url) ?? ""} onChange={e => update("secondary_cta", { ...(data.secondary_cta as object ?? {}), url: e.target.value })} placeholder="https://..." />
      </Field>
    </>
  );
}

// ── USP-rad ───────────────────────────────────────────────────────────────────

function UspEditor({ data, update }: EditorProps) {
  const items = (data.items as Array<{icon?: string; label: string; description?: string}>) ?? [];

  function updateItem(i: number, key: string, value: string) {
    const next = items.map((item, idx) => idx === i ? { ...item, [key]: value } : item);
    update("items", next);
  }

  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="space-y-2 p-3 border rounded-md">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Punkt {i + 1}</p>
          <Field label="Ikon (emoji)">
            <Input value={item.icon ?? ""} onChange={e => updateItem(i, "icon", e.target.value)} placeholder="🎾" className="w-20" />
          </Field>
          <Field label="Text">
            <Input value={item.label} onChange={e => updateItem(i, "label", e.target.value)} />
          </Field>
          <Field label="Beskrivning (valfri)">
            <Input value={item.description ?? ""} onChange={e => updateItem(i, "description", e.target.value)} />
          </Field>
        </div>
      ))}
    </>
  );
}

// ── Textblock ─────────────────────────────────────────────────────────────────

function TextBlockEditor({ data, update }: EditorProps) {
  return (
    <>
      <Field label="Rubrik">
        <Input value={(data.heading as string) ?? ""} onChange={e => update("heading", e.target.value)} />
      </Field>
      <Field label="Brödtext">
        <Textarea value={(data.body as string) ?? ""} onChange={e => update("body", e.target.value)} rows={8} />
      </Field>
    </>
  );
}

// ── Tabell ────────────────────────────────────────────────────────────────────

function TableEditor({ data, update }: EditorProps) {
  const rows = (data.rows as string[][]) ?? [];
  const columns = (data.columns as string[]) ?? [];

  function updateRow(ri: number, ci: number, value: string) {
    const next = rows.map((row, r) => r === ri ? row.map((cell, c) => c === ci ? value : cell) : row);
    update("rows", next);
  }

  return (
    <>
      <Field label="Rubrik">
        <Input value={(data.heading as string) ?? ""} onChange={e => update("heading", e.target.value)} />
      </Field>
      <Field label="Intro (valfri)">
        <Input value={(data.intro as string) ?? ""} onChange={e => update("intro", e.target.value)} />
      </Field>
      <Divider label="Rader" />
      {rows.map((row, ri) => (
        <div key={ri} className="space-y-1.5 p-3 border rounded-md">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rad {ri + 1}</p>
          {row.map((cell, ci) => (
            <Field key={ci} label={columns[ci] ?? `Kolumn ${ci + 1}`}>
              <Input value={cell} onChange={e => updateRow(ri, ci, e.target.value)} />
            </Field>
          ))}
        </div>
      ))}
    </>
  );
}

// ── CTA-band ──────────────────────────────────────────────────────────────────

function CtaBandEditor({ data, update }: EditorProps) {
  return (
    <>
      <Field label="Rubrik">
        <Input value={(data.heading as string) ?? ""} onChange={e => update("heading", e.target.value)} />
      </Field>
      <Field label="Brödtext (valfri)">
        <Textarea value={(data.body as string) ?? ""} onChange={e => update("body", e.target.value)} rows={2} />
      </Field>
      <Divider label="Knapp" />
      <Field label="Knapptext">
        <Input value={((data.cta as Record<string,string>)?.label) ?? ""} onChange={e => update("cta", { ...(data.cta as object), label: e.target.value })} />
      </Field>
      <Field label="Länk">
        <Input value={((data.cta as Record<string,string>)?.url) ?? ""} onChange={e => update("cta", { ...(data.cta as object), url: e.target.value })} placeholder="https://..." />
      </Field>
      <Field label="Bakgrund">
        <select
          value={(data.background as string) ?? "accent"}
          onChange={e => update("background", e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="accent">Mörk (primärfärg)</option>
          <option value="dark">Svart</option>
          <option value="muted">Ljus grå</option>
        </select>
      </Field>
    </>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

function FaqEditor({ data, update }: EditorProps) {
  const items = (data.items as Array<{question: string; answer: string}>) ?? [];

  function updateItem(i: number, key: string, value: string) {
    const next = items.map((item, idx) => idx === i ? { ...item, [key]: value } : item);
    update("items", next);
  }

  function addItem() {
    update("items", [...items, { question: "", answer: "" }]);
  }

  function removeItem(i: number) {
    update("items", items.filter((_, idx) => idx !== i));
  }

  return (
    <>
      <Field label="Rubrik">
        <Input value={(data.heading as string) ?? ""} onChange={e => update("heading", e.target.value)} />
      </Field>
      <Divider label="Frågor och svar" />
      {items.map((item, i) => (
        <div key={i} className="space-y-2 p-3 border rounded-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fråga {i + 1}</p>
            <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-600">Ta bort</button>
          </div>
          <Field label="Fråga">
            <Input value={item.question} onChange={e => updateItem(i, "question", e.target.value)} />
          </Field>
          <Field label="Svar">
            <Textarea value={item.answer} onChange={e => updateItem(i, "answer", e.target.value)} rows={3} />
          </Field>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full">+ Lägg till fråga</Button>
    </>
  );
}

// ── Feature-grid ──────────────────────────────────────────────────────────────

function FeatureGridEditor({ data, update }: EditorProps) {
  const items = (data.items as Array<{title: string; description: string; icon?: string}>) ?? [];

  function updateItem(i: number, key: string, value: string) {
    const next = items.map((item, idx) => idx === i ? { ...item, [key]: value } : item);
    update("items", next);
  }

  return (
    <>
      <Field label="Rubrik">
        <Input value={(data.heading as string) ?? ""} onChange={e => update("heading", e.target.value)} />
      </Field>
      <Field label="Intro (valfri)">
        <Textarea value={(data.intro as string) ?? ""} onChange={e => update("intro", e.target.value)} rows={2} />
      </Field>
      <Divider label="Funktioner" />
      {items.map((item, i) => (
        <div key={i} className="space-y-2 p-3 border rounded-md">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Funktion {i + 1}</p>
          <Field label="Ikon (emoji)">
            <Input value={item.icon ?? ""} onChange={e => updateItem(i, "icon", e.target.value)} className="w-20" />
          </Field>
          <Field label="Titel">
            <Input value={item.title} onChange={e => updateItem(i, "title", e.target.value)} />
          </Field>
          <Field label="Beskrivning">
            <Textarea value={item.description} onChange={e => updateItem(i, "description", e.target.value)} rows={2} />
          </Field>
        </div>
      ))}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

interface EditorProps {
  data: Record<string, unknown>;
  update: (key: string, value: unknown) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
