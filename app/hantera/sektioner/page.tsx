import { Topbar } from "@/components/layout/topbar";

export default function SektionerPage() {
  return (
    <>
      <Topbar pageKicker="Innehåll" pageTitle="Sektioner" />
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-12 text-center max-w-md">
          <p className="text-sm font-medium mb-1">Kommer snart</p>
          <p className="text-sm text-muted-foreground">Hantera alla sektioner på dina sidor.</p>
        </div>
      </div>
    </>
  );
}
