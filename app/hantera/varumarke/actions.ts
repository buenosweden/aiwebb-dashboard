"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function updateBrand(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!site) return;

  await supabase.from("sites").update({
    brand: {
      name: formData.get("name") as string,
      primary_color: formData.get("primary_color") as string,
      tone: formData.get("tone") as string,
    }
  }).eq("id", site.id);

  revalidatePath("/hantera/varumarke");
}
