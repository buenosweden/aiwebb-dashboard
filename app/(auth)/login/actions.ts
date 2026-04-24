"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) redirect("/login?error=" + encodeURIComponent(error.message));
  revalidatePath("/", "layout");
  redirect("/hantera");
}

export async function signup(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const fullName = `${formData.get("full_name") ?? ""} ${formData.get("last_name") ?? ""}`.trim();
  const companyName = formData.get("company_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/hantera`,
      data: { full_name: fullName, company_name: companyName },
    },
  });
  if (error) redirect("/signup?error=" + encodeURIComponent(error.message));
  if (data.user) {
    await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName, company_name: companyName, email });
  }
  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
