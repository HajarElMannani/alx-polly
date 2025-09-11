"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function createPoll(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const accessToken = typeof formData.get("accessToken") === "string" ? (formData.get("accessToken") as string) : undefined;
  const supabase = supabaseServer(cookieStore, accessToken);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create a poll.", pollId: null };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const options = formData.getAll("options[]") as string[];
  const allowMultiple = formData.get("allowMultiple") === "true";
  const requireLogin = formData.get("requireLogin") === "true";
  const isPublic = formData.get("isPublic") === "true";
  const endDate = formData.get("endDate") as string;

  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);

  if (!title.trim() || trimmedOptions.length < 2) {
    return { error: "Please enter a title and at least two options.", pollId: null };
  }

  try {
    await supabase.from("profiles").upsert({ id: user.id, username: user.email || "anonymous" });

    const { data: pollRow, error: pollErr } = await supabase
      .from("polls")
      .insert({
        author_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        allow_multiple: allowMultiple,
        require_login: requireLogin,
        is_public: isPublic,
        ends_at: endDate ? new Date(endDate).toISOString() : null,
      })
      .select("id")
      .single();

    if (pollErr || !pollRow) {
      throw pollErr || new Error("Failed to create poll");
    }

    const optionRows = trimmedOptions.map((label, index) => ({
      poll_id: pollRow.id,
      label,
      position: index,
    }));

    const { error: optErr } = await supabase.from("poll_options").insert(optionRows);

    if (optErr) {
      throw optErr;
    }

    revalidatePath("/polls");
    revalidatePath("/explore");
    return { error: "", pollId: pollRow.id };
  } catch (err: any) {
    return { error: err?.message || "Something went wrong while creating the poll", pollId: null };
  }
}
