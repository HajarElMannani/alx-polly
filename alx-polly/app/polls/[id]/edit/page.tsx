import { supabaseServer } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import EditPollForm from "./EditPollForm";

type PollRow = {
  id: string;
  title: string;
  description: string | null;
  author_id: string;
};

type OptionRow = { id: string; label: string; position: number };

export default async function EditPollPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = supabaseServer(cookieStore);
  const pollId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: poll } = await supabase
    .from("polls")
    .select("id,title,description,author_id")
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

  if (poll.author_id !== user?.id) {
    return (
      <main className="min-h-screen py-10 px-4">
        <div className="w-full max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Unauthorized</h1>
          <p className="text-gray-600 mt-2">
            You are not authorized to edit this poll.
          </p>
          <a href={`/polls/${poll.id}`} className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Poll
          </a>
        </div>
      </main>
    );
  }

  const { data: options } = await supabase
    .from("poll_options")
    .select("id,label,position")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  return <EditPollForm poll={poll as PollRow} options={options as OptionRow[]} />;
}
