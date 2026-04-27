import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ siteId: string }> }
) {
  const params = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await supabase
    .from("sites")
    .delete()
    .eq("id", params.siteId)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
