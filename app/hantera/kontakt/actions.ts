"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function updateContact(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const contact = {
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    address: formData.get("address") as string,
    hours: formData.get("hours") as string,
  };

  await supabase.from("sites").update({ contact }).eq("user_id", user.id);
  revalidatePath("/hantera/kontakt");
}
