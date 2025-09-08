import { supabaseServer } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import VoteForm from "./VoteForm";

type OptionRow = { id: string; label: string; position: number; vote_count: number };

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  require_login: boolean;
  created_at: string;
  author_id: string;
};

export default async function VotePage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = supabaseServer(cookieStore);
  const pollId = params.id;

  const { data: poll } = await supabase
    .from("polls")
    .select("id,title,description,require_login,created_at,author_id")
    .eq("id", pollId)
    .single();

  if (!poll) {
    return (
      <main className="min-h-screen py-10 px-4">
        <div className="w-full max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Poll not found</h1>
          <p className="text-gray-600 mt-2">
            The poll you are looking for does not exist or has been deleted.
          </p>
          <a href="/polls" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Polls
          </a>
        </div>
      </main>
    );
  }

  const { data: opts } = await supabase
    .from("poll_options")
    .select("id,label,position, votes:votes(count)")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  const normalizedOptions = (opts || []).map((o: any) => ({
    id: o.id,
    label: o.label,
    position: o.position,
    vote_count: o.votes?.[0]?.count ?? 0,
  }));

  return <VoteForm poll={poll as PollRow} options={normalizedOptions as OptionRow[]} />;
}
