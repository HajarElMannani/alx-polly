"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "../../../components/shadcn/Button";
import { useAuth } from "../../../components/AuthProvider";
import { supabaseBrowser } from "../../../lib/supabaseClient";

type OptionRow = { id: string; label: string; position: number; vote_count: number };

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  require_login: boolean;
  created_at: string;
  author_id: string;
};

/**
 * VotePage
 *
 *  Displays a single poll and enables selection and vote submission.
 * Context: Orchestrates auth checks, duplicate prevention, and navigation to results.
 *  Supabase tables `polls`, `poll_options`, and `votes` exist with expected columns.
 *  Redirects if poll not found; disallows multiple votes; prompts login when needed.
 *  Reads via Supabase client, writes a vote row, and then routes to results.
 */
export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pollId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [poll, setPoll] = useState<PollRow | null>(null);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  const isAuthor = useMemo(() => !!(user?.id && poll?.author_id === user.id), [user, poll]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = supabaseBrowser();
      if (!supabase || !pollId) return;
      // Load poll metadata
      const { data: p } = await supabase
        .from("polls")
        .select("id,title,description,require_login,created_at,author_id")
        .eq("id", pollId)
        .single();
      if (!p) {
        router.replace("/polls");
        return;
      }
      setPoll(p as PollRow);
      // Load options with aggregated vote counts
      const { data: opts } = await supabase
        .from("poll_options")
        .select("id,label,position, votes:votes(count)")
        .eq("poll_id", pollId)
        .order("position", { ascending: true });
      const normalized = (opts || []).map((o: any) => ({ id: o.id, label: o.label, position: o.position, vote_count: o.votes?.[0]?.count ?? 0 }));
      setOptions(normalized);
      // Check if current user has already voted to disable duplicate voting
      if (user?.id) {
        const { data: v } = await supabase
          .from("votes")
          .select("id")
          .eq("poll_id", pollId)
          .eq("voter_id", user.id)
          .limit(1)
          .maybeSingle();
        setAlreadyVoted(!!v);
      }
    };
    fetchData();
  }, [pollId, user, router]);

  if (!poll) return null;

  const submitVote = async () => {
    const supabase = supabaseBrowser();
    if (!supabase) return;
    if (poll.require_login && !user) {
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
    const option = options[selectedIndex];
    // Insert a vote row. If not logged in, we still allow voting (subject to poll settings).
    const { error } = await supabase.from("votes").insert({ poll_id: poll.id, option_id: option.id, voter_id: user?.id ?? null });
    if (error) {
      alert(error.message);
      return;
    }
    router.push(`/polls/${poll.id}/results`);
  };

  const handleDelete = async () => {
    if (!isAuthor) return;
    if (!confirm("Are you sure you want to delete this poll?")) return;
    const supabase = supabaseBrowser();
    if (!supabase) return;
    const { error } = await supabase.from("polls").delete().eq("id", poll.id);
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/polls");
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="w-full max-w-xl mx-auto mb-4 flex items-center justify-between">
        <a href="/polls" className="text-blue-600 hover:underline flex items-center gap-2">
          <span aria-hidden>←</span>
          <span>Back to Polls</span>
        </a>
        {isAuthor && (
          <div className="flex items-center gap-2">
            <a href={`/polls/${poll.id}/edit`} className="inline-flex items-center px-3 py-2 border border-black text-black hover:bg-gray-100 rounded-md">Edit Poll</a>
            <Button className="bg-red-600 text-white hover:opacity-90" onClick={handleDelete}>Delete</Button>
          </div>
        )}
      </div>
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold">{poll.title}</h1>
        {poll.description && (
          <p className="text-gray-600 mt-1">{poll.description}</p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          {options.map((opt, idx) => (
            <label
              key={opt.id}
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
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        <Button className="mt-6 bg-black text-white" onClick={submitVote}>Submit Vote</Button>
        <div className="mt-6 text-xs text-gray-500">
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600 break-all">
            Share link: <a className="text-blue-600 hover:underline" href={shareUrl}>{shareUrl}</a>
          </div>
          <img src={qrUrl} alt="QR Code" className="w-20 h-20" />
        </div>
        <div className="mt-6 text-right">
          <a className="text-blue-600 hover:underline" href={`/polls/${poll.id}/results`}>View Results</a>
        </div>
      </div>
    </main>
  );
}
