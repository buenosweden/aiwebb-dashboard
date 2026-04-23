import { Topbar } from "@/components/layout/topbar";

export default function DomenPage() {
  return (
    <>
      <Topbar pageKicker="Inställningar" pageTitle="Domän" />
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-12 text-center max-w-md">
          <p className="text-sm font-medium mb-1">Koppla din domän</p>
          <p className="text-sm text-muted-foreground">Peka din domän mot din aiwebb-sajt med en CNAME-post.</p>
        </div>
      </div>
    </>
  );
}
