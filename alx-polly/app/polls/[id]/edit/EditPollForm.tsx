"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../../../../components/shadcn/Input";
import Button from "../../../../components/shadcn/Button";
import { updatePoll } from "./actions";

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  author_id: string;
};

type OptionRow = { id: string; label: string; position: number };

export default function EditPollForm({ poll, options: initialOptions }: { poll: PollRow; options: OptionRow[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || "");
  const [options, setOptions] = useState<string[]>(initialOptions.map((o) => o.label));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addOption = () => setOptions(o => [...o, ""]);
  const removeOption = (idx: number) => setOptions(o => o.filter((_, i) => i !== idx));
  const changeOption = (idx: number, value: string) => setOptions(o => o.map((v, i) => (i === idx ? value : v)));

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    options.forEach((option) => {
      formData.append("options[]", option);
    });

    const result = await updatePoll(poll.id, formData);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage("Poll updated.");
      router.push(`/polls/${poll.id}`);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-4">Edit Poll</h1>
        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        {message && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{message}</div>}
        <form className="flex flex-col gap-4" onSubmit={save}>
          <Input name="title" label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <Input name="description" label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
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
