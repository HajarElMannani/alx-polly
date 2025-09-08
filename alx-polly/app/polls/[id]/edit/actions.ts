"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updatePoll(pollId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = supabaseServer(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const options = formData.getAll("options[]") as string[];

  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);

  if (!title.trim() || trimmedOptions.length < 2) {
    return { error: "Please enter a title and at least two options." };
  }

  try {
    const { data: poll, error: fetchError } = await supabase
      .from("polls")
      .select("author_id")
      .eq("id", pollId)
      .single();

    if (fetchError || !poll) {
      return { error: "Poll not found." };
    }

    if (poll.author_id !== user.id) {
      return { error: "You are not authorized to edit this poll." };
    }

    const { error: updateError } = await supabase
      .from("polls")
      .update({
        title: title.trim(),
        description: description.trim() || null,
      })
      .eq("id", pollId);

    if (updateError) {
      throw updateError;
    }

    const { error: deleteError } = await supabase.from("poll_options").delete().eq("poll_id", pollId);

    if (deleteError) {
      throw deleteError;
    }

    const optionRows = trimmedOptions.map((label, index) => ({
      poll_id: pollId,
      label,
      position: index,
    }));

    const { error: insertError } = await supabase.from("poll_options").insert(optionRows);

    if (insertError) {
      throw insertError;
    }

    revalidatePath(`/polls/${pollId}`);
    revalidatePath(`/polls/${pollId}/edit`);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Something went wrong while updating the poll" };
  }
}
