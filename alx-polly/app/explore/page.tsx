import { supabaseServer } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import Link from "next/link";

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  poll_options: { count: number }[];
  votes: { count: number }[];
};

export default async function ExplorePage() {
  const cookieStore = await cookies();
  const supabase = supabaseServer(cookieStore);

  const { data: polls, error } = await supabase
    .from("polls")
    .select("id,title,description,created_at,poll_options(count),votes(count)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <main className="w-full py-10 px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Explore Polls</h1>
        <p className="text-sm text-gray-600 mt-1">Browse public polls and cast your vote.</p>
      </div>
      {error ? (
        <div className="text-red-500">Error loading polls.</div>
      ) : polls.length === 0 ? (
        <div className="text-gray-500">No public polls yet.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {(polls as PollRow[]).map((poll) => (
            <Link href={`/polls/${poll.id}`} key={poll.id}>
              <div
                className="bg-white border rounded-lg shadow p-3 flex flex-col gap-2 text-sm cursor-pointer hover:shadow-md transition h-full"
              >
                <h2 className="text-base font-semibold">{poll.title}</h2>
                {poll.description && <p className="text-gray-700 text-xs line-clamp-2">{poll.description}</p>}
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>{poll.poll_options?.[0]?.count ?? 0} options</span>
                  <span>{poll.votes?.[0]?.count ?? 0} total votes</span>
                </div>
                <div className="text-xs text-gray-400 mt-auto">
                  Created on {new Date(poll.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
