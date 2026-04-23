"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function updateBrand(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const brand = {
    name: formData.get("name") as string,
    primary_color: formData.get("primary_color") as string,
    tone: formData.get("tone") as string,
  };

  await supabase
    .from("sites")
    .update({ brand })
    .eq("user_id", user.id);

  revalidatePath("/hantera/varumarke");
  return { success: true };
}
