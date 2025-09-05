"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "../../../../components/shadcn/Input";
import Button from "../../../../components/shadcn/Button";
import { useAuth } from "../../../../components/AuthProvider";
import { supabaseBrowser } from "../../../../lib/supabaseClient";

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  author_id: string;
};

type OptionRow = { id: string; label: string; position: number };

/**
 * EditPollPage
 *
 *  Allows poll authors to update poll title, description, and options.
 * Context: Client-side guard ensures only authors can access editing controls.
 *  Poll and options exist in Supabase and are identified by `poll_id`.
 *  Redirects non-authors; replaces options atomically to preserve order.
 *  Reads and writes via Supabase; navigates back to the poll on success.
 */
export default function EditPollPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pollId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [poll, setPoll] = useState<PollRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAuthor = useMemo(() => !!(user?.id && poll?.author_id === user.id), [user, poll]);

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser();
      if (!supabase || !pollId) return;
      const { data: p } = await supabase
        .from("polls")
        .select("id,title,description,author_id")
        .eq("id", pollId)
        .single();
      if (!p) {
        router.replace("/polls");
        return;
      }
      setPoll(p as PollRow);
      setTitle((p as PollRow).title);
      setDescription(((p as PollRow).description ?? "") as string);
      const { data: opts } = await supabase
        .from("poll_options")
        .select("id,label,position")
        .eq("poll_id", pollId)
        .order("position", { ascending: true });
      setOptions((opts || []).map((o: any) => o.label as string));
    };
    load();
  }, [pollId, router]);

  useEffect(() => {
    // If poll loaded and user not author, redirect to poll page
    if (poll && user && poll.author_id !== user.id) {
      router.replace(`/polls/${poll.id}`);
    }
  }, [poll, user, router]);

  const addOption = () => setOptions(o => [...o, ""]);
  const removeOption = (idx: number) => setOptions(o => o.filter((_, i) => i !== idx));
  const changeOption = (idx: number, value: string) => setOptions(o => o.map((v, i) => (i === idx ? value : v)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poll || !isAuthor) return;
    setError(null);
    setMessage(null);
    const trimmed = options.map(o => o.trim()).filter(Boolean);
    if (!title.trim() || trimmed.length < 2) {
      setError("Provide a title and at least two options.");
      return;
    }
    setSaving(true);
    const supabase = supabaseBrowser();
    try {
      // Update poll metadata
      const { error: upErr } = await supabase!.from("polls").update({
        title: title.trim(),
        description: description.trim() || null,
      }).eq("id", poll.id);
      if (upErr) throw upErr;
      // Replace options: delete then insert to keep positions consistent
      const { error: delErr } = await supabase!.from("poll_options").delete().eq("poll_id", poll.id);
      if (delErr) throw delErr;
      const optionRows = trimmed.map((label, index) => ({ poll_id: poll.id, label, position: index }));
      const { error: insErr } = await supabase!.from("poll_options").insert(optionRows);
      if (insErr) throw insErr;
      setMessage("Poll updated.");
      router.push(`/polls/${poll.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update poll");
    } finally {
      setSaving(false);
    }
  };

  if (!poll) return null;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-4">Edit Poll</h1>
        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        {message && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{message}</div>}
        <form className="flex flex-col gap-4" onSubmit={save}>
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <Input label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
          <div>
            <label className="text-sm font-medium">Options</label>
            <div className="flex flex-col gap-2 mt-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input className="flex-1" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => changeOption(idx, e.target.value)} />
                  <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeOption(idx)}>Remove</button>
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" className="mt-2 w-fit" onClick={addOption}>+ Add option</Button>
          </div>
          <div className="flex justify-end gap-2">
            <a href={`/polls/${poll.id}`} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm">Cancel</a>
            <Button type="submit" className="bg-black text-white" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
