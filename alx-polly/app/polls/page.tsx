"use client";
import React, { useEffect, useState } from "react";
import Button from "../../components/shadcn/Button";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { supabaseBrowser } from "../../lib/supabaseClient";

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  poll_options: { count: number }[];
  votes: { count: number }[];
};

export default function PollsDashboard() {
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPolls = async () => {
      setLoading(true);
      const supabase = supabaseBrowser();
      if (!supabase || !user) {
        setPolls([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("polls")
        .select("id,title,description,created_at,poll_options(count),votes(count)")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setPolls(data as unknown as PollRow[]);
      setLoading(false);
    };
    fetchPolls();
  }, [user]);

  const shareUrl = (id: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/polls/${id}`;
  };

  const qrUrl = (id: string) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl(id))}`;

  const [sharePollId, setSharePollId] = useState<string | null>(null);

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(id));
      alert("Link copied to clipboard");
    } catch {}
  };

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
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : polls.length === 0 ? (
        <div className="text-gray-500">No polls yet. Create your first poll.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white border rounded-lg shadow p-3 flex flex-col gap-2 text-sm cursor-pointer hover:shadow-md transition"
              onClick={() => router.push(`/polls/${poll.id}`)}
            >
              <h2 className="text-base font-semibold">{poll.title}</h2>
              {poll.description && (
                <p className="text-gray-700 text-xs">{poll.description}</p>
              )}
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{poll.poll_options?.[0]?.count ?? 0} options</span>
                <span>{poll.votes?.[0]?.count ?? 0} total votes</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">Created on {new Date(poll.created_at).toLocaleDateString()}</div>
                <button
                  className="text-blue-600 hover:underline text-xs"
                  onClick={(e) => { e.stopPropagation(); setSharePollId(poll.id); }}
                  type="button"
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sharePollId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSharePollId(null)}>
          <div className="w-full max-w-md bg-white rounded-lg shadow p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Share this poll</h3>
            <p className="mt-2 text-sm text-gray-600 break-all">{shareUrl(sharePollId)}</p>
            <div className="mt-3 flex items-center gap-2">
              <Button className="bg-black text-white" onClick={() => copyLink(sharePollId)}>Copy Link</Button>
              <a className="text-blue-600 hover:underline text-sm" href={shareUrl(sharePollId)} target="_blank" rel="noreferrer">Open</a>
            </div>
            <div className="mt-5 flex items-center justify-center">
              <img src={qrUrl(sharePollId)} alt="QR Code" className="w-32 h-32" />
            </div>
            <div className="mt-5 text-right">
              <button className="text-sm text-gray-600 hover:underline" onClick={() => setSharePollId(null)} type="button">Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
