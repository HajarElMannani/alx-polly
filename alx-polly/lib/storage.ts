export type StoredPoll = {
  id: string;
  title: string;
  description?: string;
  question?: string;
  options: string[];
  votes?: number;
  createdAt: string;
  authorName?: string;
  settings?: {
    allowMultiple: boolean;
    requireLogin: boolean;
    endDate?: string;
  };
};

const KEY = "alx_polly_polls";

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

export function addPoll(poll: Omit<StoredPoll, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
  const all = getPolls();
  const newPoll: StoredPoll = {
    id: poll.id ?? crypto.randomUUID(),
    createdAt: poll.createdAt ?? new Date().toISOString(),
    title: poll.title,
    description: poll.description,
    question: poll.question,
    options: poll.options,
    votes: poll.votes ?? 0,
    authorName: poll.authorName ?? "Anonymous",
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
