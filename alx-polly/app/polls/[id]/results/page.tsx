"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "../../../../lib/supabaseClient";

type PollRow = { id: string; title: string };

type OptionRow = { id: string; label: string; vote_count: number };

export default function ResultsPage() {
  const params = useParams();
  const pollId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [poll, setPoll] = useState<PollRow | null>(null);
  const [options, setOptions] = useState<OptionRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = supabaseBrowser();
      if (!supabase || !pollId) return;
      const { data: p } = await supabase
        .from("polls")
        .select("id,title")
        .eq("id", pollId)
        .single();
      if (p) setPoll(p as PollRow);
      const { data: opts } = await supabase
        .from("poll_options")
        .select("id,label, votes:votes(count)")
        .eq("poll_id", pollId)
        .order("position", { ascending: true });
      const normalized = (opts || []).map((o: any) => ({ id: o.id, label: o.label, vote_count: o.votes?.[0]?.count ?? 0 }));
      setOptions(normalized);
    };
    fetchData();
  }, [pollId]);

  const totals = useMemo(() => {
    const total = options.reduce((a, b) => a + (b.vote_count || 0), 0);
    const percents = options.map(o => (total === 0 ? 0 : Math.round((o.vote_count * 100) / total)));
    return { total, percents };
  }, [options]);

  if (!poll) return null;

  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/polls/" + poll.id : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold">Results: {poll.title}</h1>
        <div className="mt-4 text-sm text-gray-600">Total votes: {totals.total}</div>
        <div className="mt-6 space-y-3">
          {options.map((opt, idx) => (
            <div key={opt.id}>
              <div className="flex justify-between text-sm">
                <span>{opt.label}</span>
                <span>{opt.vote_count} ({totals.percents[idx] ?? 0}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div className="h-2 bg-black rounded" style={{ width: `${totals.percents[idx] ?? 0}%` }} />
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
