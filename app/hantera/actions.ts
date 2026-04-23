"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import type { Section } from "@/lib/payload";

export async function updateSection(index: number, updatedSection: Section) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: site } = await supabase
    .from("sites")
    .select("sections")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!site) return { error: "no_site" };

  const sections = [...((site.sections as Section[]) ?? [])];
  sections[index] = updatedSection;

  await supabase
    .from("sites")
    .update({ sections })
    .eq("user_id", user.id);

  revalidatePath("/hantera");
  return { success: true };
}
