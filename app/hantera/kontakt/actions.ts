"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function updateContact(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const contact = {
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    address: formData.get("address") as string,
    hours: formData.get("hours") as string,
  };

  await supabase
    .from("sites")
    .update({ contact })
    .eq("user_id", user.id);

  revalidatePath("/hantera/kontakt");
  return { success: true };
}
