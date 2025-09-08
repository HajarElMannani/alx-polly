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

/**
 * PollsDashboard
 *
 *  Lists the authenticated user's polls with quick actions (results, edit, delete, share).
 * Context: Primary dashboard for authors to manage content and navigate to detail pages.
 *  User is logged in; Supabase schema provides counts via relationships.
 *  Shows login prompt when unauthenticated; handles empty lists and loading states.
 *  Links to EditPollPage, ResultsPage, and the voting page; invokes Supabase mutations.
 */
export default function PollsDashboard() {
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharePollId, setSharePollId] = useState<string | null>(null);
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

  // If not logged in, show a login prompt card
  if (!user) {
    return (
      <main className="w-full py-16 px-8">
        <div className="max-w-xl mx-auto bg-white border rounded-xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Your Polls</h1>
          <p className="text-gray-600 mb-6">Log in to create polls and view the ones you have created.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/login" className="inline-flex rounded-md px-4 py-2 text-white bg-blue-600 hover:bg-blue-700">Login</a>
            <a href="/register" className="inline-flex rounded-md px-4 py-2 border hover:bg-gray-50">Register</a>
          </div>
        </div>
      </main>
    );
  }

  const shareUrl = (id: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/polls/${id}`;
  };

  const qrUrl = (id: string) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl(id))}`;

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(id));
      alert("Link copied to clipboard");
    } catch {}
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/polls/${id}/edit`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this poll? This cannot be undone.")) return;
    const supabase = supabaseBrowser();
    if (!supabase) return;
    const { error } = await supabase.from("polls").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setPolls(prev => prev.filter(p => p.id !== id));
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
                <div className="flex items-center gap-3">
                  <a
                    href={`/polls/${poll.id}/results`}
                    className="text-xs text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Results
                  </a>
                  <button className="text-xs text-blue-600 hover:underline" onClick={(e) => handleEdit(e, poll.id)} type="button">Edit</button>
                  <button className="text-xs text-red-600 hover:underline" onClick={(e) => handleDelete(e, poll.id)} type="button">Delete</button>
                  <button
                    className="text-blue-600 hover:underline text-xs"
                    onClick={(e) => { e.stopPropagation(); setSharePollId(poll.id); }}
                    type="button"
                  >
                    Share
                  </button>
                </div>
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
