"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function deletePoll(pollId: string) {
  const cookieStore = cookies();
  const supabase = supabaseServer(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }

  const { error } = await supabase.from("polls").delete().eq("id", pollId).eq("author_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { success: true };
}
