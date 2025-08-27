"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "../../../components/shadcn/Button";
import { getPollById, deletePoll, recordVote, hasVotedBrowser, setVotedBrowser, type StoredPoll } from "../../../lib/storage";
import { useAuth } from "../../../components/AuthProvider";

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pollId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [poll, setPoll] = useState<StoredPoll | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!pollId) return;
    const p = getPollById(pollId);
    if (!p) {
      router.replace("/polls");
      return;
    }
    setPoll(p);
  }, [pollId, router]);

  const alreadyVoted = useMemo(() => {
    if (!poll) return false;
    if (hasVotedBrowser(poll.id)) return true;
    if (user?.id && poll.voters?.includes(user.id)) return true;
    return false;
  }, [poll, user]);

  if (!poll) return null;

  const submitVote = () => {
    if (poll.settings?.requireLogin && !user) {
      router.push("/login");
      return;
    }
    if (alreadyVoted) {
      alert("You have already voted on this poll.");
      return;
    }
    if (selectedIndex === null) {
      alert("Please select an option.");
      return;
    }
    const updated = recordVote(poll.id, selectedIndex, user?.id);
    if (updated) {
      setVotedBrowser(poll.id);
      router.push(`/polls/${poll.id}/results`);
    }
  };

  const isAuthor = user?.id && poll.authorId === user.id;

  const handleDelete = () => {
    if (!isAuthor) return;
    if (confirm("Are you sure you want to delete this poll?")) {
      deletePoll(poll.id);
      router.push("/polls");
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="w-full max-w-xl mx-auto mb-4 flex items-center justify-between">
        <a href="/polls" className="text-blue-600 hover:underline flex items-center gap-2">
          <span aria-hidden>←</span>
          <span>Back to Polls</span>
        </a>
        <div className="flex items-center gap-2">
          {isAuthor && (
            <>
              <a href={`/polls/${poll.id}/edit`} className="inline-flex items-center px-3 py-2 border border-black text-black hover:bg-gray-100 rounded-md">Edit Poll</a>
              <Button className="bg-red-600 text-white hover:opacity-90" onClick={handleDelete}>Delete</Button>
            </>
          )}
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
                selectedIndex === idx ? "border-black bg-gray-200 font-medium" : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="vote-option"
                className="sr-only"
                value={idx}
                checked={selectedIndex === idx}
                onChange={() => setSelectedIndex(idx)}
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
        <div className="mt-6 flex items-center justify-between">
          <a className="text-blue-600 hover:underline" href={`/polls/${poll.id}/results`}>View Results</a>
          <div className="text-sm text-gray-600">Share link: <a className="text-blue-600 hover:underline" href={shareUrl}>{shareUrl}</a></div>
        </div>
      </div>
    </main>
  );
}
