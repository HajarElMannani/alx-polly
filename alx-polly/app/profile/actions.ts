"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { cookies } from "next/headers";

export async function updateProfile(formData: FormData) {
  const cookieStore = cookies();
  const supabase = supabaseServer(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to update your profile." };
  }

  const username = formData.get("username") as string;

  const { error } = await supabase.auth.updateUser({ data: { username } });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const cookieStore = cookies();
  const supabase = supabaseServer(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to update your password." };
  }

  const oldPassword = formData.get("oldPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: oldPassword,
  });

  if (signInError) {
    return { error: "Old password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
