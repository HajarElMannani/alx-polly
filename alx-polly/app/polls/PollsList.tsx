"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../components/shadcn/Button";
import { deletePoll } from "./actions";

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  poll_options: { count: number }[];
  votes: { count: number }[];
};

export default function PollsList({ polls }: { polls: PollRow[] }) {
  const [sharePollId, setSharePollId] = useState<string | null>(null);
  const router = useRouter();

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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this poll? This cannot be undone.")) return;
    const result = await deletePoll(id);
    if (result.error) {
      alert(result.error);
    }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/polls/${id}/edit`);
  };

  return (
    <>
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
    </>
  );
}
