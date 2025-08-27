"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getPollById, type StoredPoll } from "../../../../lib/storage";

export default function ResultsPage() {
  const params = useParams();
  const pollId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [poll, setPoll] = useState<StoredPoll | null>(null);

  useEffect(() => {
    if (!pollId) return;
    const p = getPollById(pollId);
    if (p) setPoll(p);
  }, [pollId]);

  const totals = useMemo(() => {
    if (!poll) return { total: 0, percents: [] as number[] };
    const total = (poll.optionVotes ?? []).reduce((a, b) => a + b, 0);
    const percents = (poll.optionVotes ?? []).map(v => (total === 0 ? 0 : Math.round((v * 100) / total)));
    return { total, percents };
  }, [poll]);

  if (!poll) return null;

  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/polls/" + poll.id : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold">Results: {poll.title}</h1>
        <div className="mt-4 text-sm text-gray-600">Total votes: {totals.total}</div>
        <div className="mt-6 space-y-3">
          {poll.options.map((opt, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm">
                <span>{opt}</span>
                <span>{poll.optionVotes?.[idx] ?? 0} ({totals.percents[idx] ?? 0}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-black rounded"
                  style={{ width: `${totals.percents[idx] ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600 break-all">
            Share link: <a className="text-blue-600 hover:underline" href={shareUrl}>{shareUrl}</a>
          </div>
          <img src={qrUrl} alt="QR Code" className="w-20 h-20" />
        </div>
      </div>
    </main>
  );
}
