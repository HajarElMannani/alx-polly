"use client";
import React, { useEffect, useState } from "react";
import Button from "../../components/shadcn/Button";
import { getPolls, type StoredPoll } from "../../lib/storage";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";

export default function PollsDashboard() {
  const [polls, setPolls] = useState<StoredPoll[]>([]);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const all = getPolls();
    setPolls(user ? all.filter(p => p.authorId === user.id) : all);
  }, [user]);

  return (
    <main className="w-full py-10 px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Polls</h1>
        <Button
          className="bg-black text-white hover:bg-gray-900"
          onClick={() => (window.location.href = "/create-poll")}
        >
          Create a New Poll
        </Button>
      </div>
      {!user && (
        <div className="mb-4 text-sm text-gray-600">Login to see and manage your polls.</div>
      )}
      {polls.length === 0 ? (
        <div className="text-gray-500">No polls yet. Create your first poll.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white border rounded-lg shadow p-3 flex flex-col gap-1 text-sm cursor-pointer hover:shadow-md transition"
              onClick={() => router.push(`/polls/${poll.id}`)}
            >
              <h2 className="text-base font-semibold">{poll.title}</h2>
              {poll.description && (
                <p className="text-gray-700 text-xs">{poll.description}</p>
              )}
              <div className="flex gap-2 text-xs text-gray-500 mt-1">
                <span>{poll.options.length} options</span>
                <span>{poll.votes ?? 0} total votes</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Created on {new Date(poll.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
