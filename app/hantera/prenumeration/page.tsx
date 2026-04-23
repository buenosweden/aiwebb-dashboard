import { Topbar } from "@/components/layout/topbar";

export default function PrenumerationPage() {
  return (
    <>
      <Topbar pageKicker="Inställningar" pageTitle="Prenumeration" />
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-12 text-center max-w-md">
          <p className="text-sm font-medium mb-1">Kommer snart</p>
          <p className="text-sm text-muted-foreground">Hantera din prenumeration och fakturering.</p>
        </div>
      </div>
    </>
  );
}
