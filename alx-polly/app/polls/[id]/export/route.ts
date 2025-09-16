import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabaseServer";
import { slugifyFilename, talliesToCsv, rawVotesToCsv, type Vote } from "@/lib/export/csv";

export const runtime = "node";

function yyyymmdd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") as "tallies" | "raw" | null) || "tallies";

  const cookieStore = await cookies();
  const supabase = supabaseServer(cookieStore);
  const { id: pollId } = await ctx.params;

  // Fetch poll base data
  const { data: poll, error: pollErr } = await supabase
    .from("polls")
    .select("id,title,author_id,require_login,ends_at")
    .eq("id", pollId)
    .single();
  if (pollErr) {
    return new Response("Not found", { status: 404 });
  }
  if (!poll) {
    return new Response("Not found", { status: 404 });
  }

  // If raw is requested, ensure requester is the author
  if (mode === "raw") {
    const { data: me } = await supabase.auth.getUser();
    const userId = me?.user?.id ?? null;
    if (!userId || userId !== poll.author_id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Fetch options
  const { data: options } = await supabase
    .from("poll_options")
    .select("id,label,position")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });
  const optionsById = Object.fromEntries((options ?? []).map((o: any) => [o.id, { label: o.label }]));

  let csv = "";
  let filename = `poll-${slugifyFilename(poll.title)}-${mode}-${yyyymmdd()}.csv`;
  let cacheControl = mode === "tallies" ? "max-age=15, s-maxage=15, stale-while-revalidate=60" : "no-store";

  if (mode === "tallies") {
    // Compute tallies via grouped counts
    const { data: grouped } = await supabase
      .from("votes")
      .select("option_id, count:count(*)")
      .eq("poll_id", pollId)
      .group("option_id");

    const counts = new Map<string, number>();
    (grouped || []).forEach((g: any) => counts.set(g.option_id, Number(g.count)));
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    const tallies = (options || []).map((o: any) => {
      const count = counts.get(o.id) ?? 0;
      const percent = total > 0 ? (count / total) * 100 : 0;
      return { label: o.label, count, percent };
    });
    csv = talliesToCsv(tallies, { includeHeader: true, excelCompat: true });
  } else {
    // Raw votes for author only
    const { data: votes } = await supabase
      .from("votes")
      .select("poll_id, option_id, voter_id, created_at")
      .eq("poll_id", pollId)
      .order("created_at", { ascending: true });

    const normalized: Vote[] = (votes || []).map((v: any) => ({
      pollId: v.poll_id,
      optionId: v.option_id,
      voterId: v.voter_id ?? null,
      createdAt: v.created_at,
    }));
    csv = rawVotesToCsv({ pollTitle: poll.title, optionsById, votes: normalized }, { includeHeader: true, excelCompat: true });
  }

  const headers: HeadersInit = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": cacheControl,
  };
  return new Response(csv, { status: 200, headers });
}


