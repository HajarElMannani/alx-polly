"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import EditPollForm from "./EditPollForm";

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  author_id: string;
};

type OptionRow = { id: string; label: string; position: number };

export default function EditPollPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [poll, setPoll] = useState<PollRow | null>(null);
  const [options, setOptions] = useState<OptionRow[]>([]);

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();
      if (!supabase) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const { data: session } = await supabase.auth.getUser();
      const userId = session.user?.id;
      const pollId = params.id;
      const { data: pollRow } = await supabase
        .from("polls")
        .select("id,title,description,author_id")
        .eq("id", pollId)
        .single();
      if (!pollRow) {
        setPoll(null);
        setLoading(false);
        return;
      }
      if (!userId || pollRow.author_id !== userId) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const { data: opts } = await supabase
        .from("poll_options")
        .select("id,label,position")
        .eq("poll_id", pollId)
        .order("position", { ascending: true });
      setPoll(pollRow as PollRow);
      setOptions((opts as OptionRow[]) || []);
      setLoading(false);
    };
    run();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen py-10 px-4">
        <div className="w-full max-w-xl mx-auto text-center">Loading...</div>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen py-10 px-4">
        <div className="w-full max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Unauthorized</h1>
          <p className="text-gray-600 mt-2">You are not authorized to edit this poll.</p>
          <a href={`/polls/${params.id}`} className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Poll
          </a>
        </div>
      </main>
    );
  }

  if (!poll) {
    return (
      <main className="min-h-screen py-10 px-4">
        <div className="w-full max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Poll not found</h1>
          <a href="/polls" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Polls
          </a>
        </div>
      </main>
    );
  }

  return <EditPollForm poll={poll} options={options} />;
}
