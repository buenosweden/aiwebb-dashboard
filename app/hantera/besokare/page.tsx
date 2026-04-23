import { Topbar } from "@/components/layout/topbar";

export default function BesOkarePage() {
  return (
    <>
      <Topbar pageKicker="Tillväxt" pageTitle="Besökare" />
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-12 text-center max-w-md">
          <p className="text-sm font-medium mb-1">Kommer snart</p>
          <p className="text-sm text-muted-foreground">Trafik, källor och beteende på din sajt.</p>
        </div>
      </div>
    </>
  );
}
