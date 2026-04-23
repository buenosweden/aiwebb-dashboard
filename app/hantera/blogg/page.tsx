import { Topbar } from "@/components/layout/topbar";

export default function BloggPage() {
  return (
    <>
      <Topbar pageKicker="Innehåll" pageTitle="Blogg" />
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-12 text-center max-w-md">
          <p className="text-sm font-medium mb-1">Kommer snart</p>
          <p className="text-sm text-muted-foreground">AI-genererade blogginlägg baserade på dina keywords.</p>
        </div>
      </div>
    </>
  );
}
