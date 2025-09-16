import { supabaseServer } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import ExportButton from "./ExportButton";

type PollRow = { id: string; title: string; author_id: string };

type OptionRow = { id: string; label: string; vote_count: number };

export default async function ResultsPage(props: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = supabaseServer(cookieStore);
  const { id: pollId } = await props.params;

  const { data: poll } = await supabase
    .from("polls")
    .select("id,title,author_id")
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
    .select("id,label, votes:votes(count)")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  const options = (opts || []).map((o: any) => ({
    id: o.id,
    label: o.label,
    vote_count: o.votes?.[0]?.count ?? 0,
  }));

  const totalVotes = options.reduce((acc, o) => acc + o.vote_count, 0);

  const { data: me } = await supabase.auth.getUser();
  const meId = me?.user?.id ?? null;
  const isAuthor = Boolean(meId && meId === (poll as any).author_id);

  const shareUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/polls/${poll.id}` : `http://localhost:3000/polls/${poll.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold">Results: {poll.title}</h1>
        <div className="mt-4 text-sm text-gray-600">Total votes: {totalVotes}</div>
        <div className="mt-4 flex gap-2">
          <ExportButton pollId={poll.id} mode="tallies" />
          {isAuthor ? <ExportButton pollId={poll.id} mode="raw" /> : null}
        </div>
        <div className="mt-6 space-y-3">
          {options.map((opt) => (
            <div key={opt.id}>
              <div className="flex justify-between text-sm">
                <span>{opt.label}</span>
                <span>
                  {opt.vote_count} ({totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-black rounded"
                  style={{ width: `${totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600 break-all">
            Share link:{" "}
            <a className="text-blue-600 hover:underline" href={shareUrl}>
              {shareUrl}
            </a>
          </div>
          <img src={qrUrl} alt="QR Code" className="w-20 h-20" />
        </div>
      </div>
    </main>
  );
}
