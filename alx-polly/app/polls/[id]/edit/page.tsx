"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "../../../../components/shadcn/Input";
import Button from "../../../../components/shadcn/Button";
import { getPollById, updatePoll, type StoredPoll } from "../../../../lib/storage";
import { useAuth } from "../../../../components/AuthProvider";

export default function EditPollPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pollId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [poll, setPoll] = useState<StoredPoll | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!pollId) return;
    const p = getPollById(pollId);
    if (!p) {
      router.replace("/polls");
      return;
    }
    setPoll(p);
    setTitle(p.title);
    setDescription(p.description ?? "");
    setOptions(p.options);
  }, [pollId, router]);

  const isAuthor = user?.id && poll?.authorId === user.id;

  const addOption = () => setOptions(o => [...o, ""]);
  const removeOption = (idx: number) => setOptions(o => o.filter((_, i) => i !== idx));
  const changeOption = (idx: number, value: string) => setOptions(o => o.map((v, i) => i === idx ? value : v));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!isAuthor) {
      setError("Only the author can edit this poll.");
      return;
    }
    const trimmed = options.map(o => o.trim()).filter(Boolean);
    if (!title.trim() || trimmed.length < 2) {
      setError("Provide a title and at least two options.");
      return;
    }
    const updated = updatePoll(pollId, (p) => {
      const next = { ...p };
      next.title = title.trim();
      next.description = description.trim() || undefined;
      // If options changed length, reset optionVotes to match new length
      if (trimmed.length !== next.options.length) {
        next.optionVotes = new Array(trimmed.length).fill(0);
        next.votes = 0;
      }
      next.options = trimmed;
      return next;
    });
    if (updated) {
      setMessage("Poll updated.");
      router.push(`/polls/${pollId}`);
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
            <a href={`/polls/${pollId}`} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm">Cancel</a>
            <Button type="submit" className="bg-black text-white">Save</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
