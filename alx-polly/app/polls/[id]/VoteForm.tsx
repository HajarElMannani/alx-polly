"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function VoteForm({ poll, options: initialOptions }: { poll: PollRow; options: OptionRow[] }) {
  const router = useRouter();
  const { user } = useAuth();
  const [options, setOptions] = useState<OptionRow[]>(initialOptions);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  const isAuthor = useMemo(() => !!(user?.id && poll?.author_id === user.id), [user, poll]);

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
