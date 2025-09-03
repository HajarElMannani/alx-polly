export type StoredPoll = {
  id: string;
  title: string;
  description?: string;
  question?: string;
  options: string[];
  optionVotes: number[]; // per-option votes
  votes?: number;
  createdAt: string;
  authorId?: string;
  authorName?: string;
  voters?: string[]; // user ids who voted
  settings?: {
    allowMultiple: boolean;
    requireLogin: boolean;
    endDate?: string;
  };
};

const KEY = "alx_polly_polls";
const VOTED_PREFIX = "alx_polly_voted_";

export function getPolls(): StoredPoll[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredPoll[]) : [];
  } catch {
    return [];
  }
}

export function savePolls(polls: StoredPoll[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(polls));
}

export function addPoll(poll: Omit<StoredPoll, "id" | "createdAt" | "optionVotes"> & { id?: string; createdAt?: string }) {
  const all = getPolls();
  const optionVotes = new Array(poll.options.length).fill(0) as number[];
  const newPoll: StoredPoll = {
    id: poll.id ?? crypto.randomUUID(),
    createdAt: poll.createdAt ?? new Date().toISOString(),
    title: poll.title,
    description: poll.description,
    question: poll.question,
    options: poll.options,
    optionVotes,
    votes: poll.votes ?? 0,
    authorId: poll.authorId,
    authorName: poll.authorName ?? "Anonymous",
    voters: poll.voters ?? [],
    settings: poll.settings,
  };
  all.unshift(newPoll);
  savePolls(all);
  return newPoll;
}

export function getPollById(id: string): StoredPoll | undefined {
  return getPolls().find(p => p.id === id);
}

export function updatePoll(id: string, updater: (p: StoredPoll) => StoredPoll): StoredPoll | undefined {
  const all = getPolls();
  const idx = all.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  const updated = updater(all[idx]);
  all[idx] = updated;
  savePolls(all);
  return updated;
}

export function deletePoll(id: string): boolean {
  const all = getPolls();
  const next = all.filter(p => p.id !== id);
  if (next.length === all.length) return false;
  savePolls(next);
  return true;
}

export function hasVotedBrowser(pollId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(VOTED_PREFIX + pollId) === "1";
}

export function setVotedBrowser(pollId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOTED_PREFIX + pollId, "1");
}

export function recordVote(pollId: string, optionIndex: number, voterId?: string): StoredPoll | undefined {
  const all = getPolls();
  const idx = all.findIndex(p => p.id === pollId);
  if (idx === -1) return undefined;

  const current = all[idx];

  // Validate option index early and bail out without writing if invalid
  const optionsLength = current.options.length;
  if (optionIndex < 0 || optionIndex >= optionsLength) return undefined;

  // Build next state with defensive copies only where needed
  const next: StoredPoll = { ...current };

  // Ensure optionVotes exists and matches options length
  let optionVotes = next.optionVotes;
  if (!optionVotes || optionVotes.length !== optionsLength) {
    optionVotes = new Array(optionsLength).fill(0);
  } else {
    optionVotes = optionVotes.slice();
  }
  optionVotes[optionIndex] = (optionVotes[optionIndex] ?? 0) + 1;
  next.optionVotes = optionVotes;

  next.votes = (next.votes ?? 0) + 1;

  if (voterId) {
    const existing = next.voters ?? [];
    if (existing.length === 0) {
      next.voters = [voterId];
    } else if (!existing.includes(voterId)) {
      // Append without rebuilding when not necessary
      next.voters = [...existing, voterId];
    } else {
      // Keep the same reference to avoid unnecessary allocations
      next.voters = existing;
    }
  }

  // Write once
  all[idx] = next;
  savePolls(all);
  return next;
}
