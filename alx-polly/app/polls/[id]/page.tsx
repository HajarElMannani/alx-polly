"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "../../../components/shadcn/Button";
import { getPollById, updatePoll, deletePoll, type StoredPoll } from "../../../lib/storage";

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const pollId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [poll, setPoll] = useState<StoredPoll | null>(null);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (!pollId) return;
    const p = getPollById(pollId);
    if (!p) {
      router.replace("/polls");
      return;
    }
    setPoll(p);
  }, [pollId, router]);

  if (!poll) return null;

  const submitVote = () => {
    if (!selected) {
      alert("Please select an option.");
      return;
    }
    updatePoll(poll.id, (p) => ({ ...p, votes: (p.votes ?? 0) + 1 }));
    router.push("/polls");
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this poll?")) {
      deletePoll(poll.id);
      router.push("/polls");
    }
  };

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="w-full max-w-xl mx-auto mb-4 flex items-center justify-between">
        <a href="/polls" className="text-blue-600 hover:underline flex items-center gap-2">
          <span aria-hidden>←</span>
          <span>Back to Polls</span>
        </a>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="border-black text-black !text-black hover:bg-gray-100">Edit Poll</Button>
          <Button className="bg-red-600 text-white hover:opacity-90" onClick={handleDelete}>Delete</Button>
        </div>
      </div>
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold">{poll.title}</h1>
        {poll.description && (
          <p className="text-gray-600 mt-1">{poll.description}</p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          {poll.options.map((opt, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                selected === opt ? "border-black bg-gray-200 font-medium" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="vote-option"
                className="sr-only"
                value={opt}
                checked={selected === opt}
                onChange={() => setSelected(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        <Button className="mt-6 bg-black text-white" onClick={submitVote}>Submit Vote</Button>
        <div className="mt-6 text-xs text-gray-500">
          <span>Created by {poll.authorName ?? "Anonymous"}</span>
          <span className="mx-2">•</span>
          <span>Created on {new Date(poll.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </main>
  );
}
