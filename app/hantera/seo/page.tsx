import { Topbar } from "@/components/layout/topbar";

export default function SeoPage() {
  return (
    <>
      <Topbar pageKicker="Tillväxt" pageTitle="SEO-rapport" />
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-12 text-center max-w-md">
          <p className="text-sm font-medium mb-1">Kommer snart</p>
          <p className="text-sm text-muted-foreground">Keywords, positioner och trafiktrender för din sajt.</p>
        </div>
      </div>
    </>
  );
}
