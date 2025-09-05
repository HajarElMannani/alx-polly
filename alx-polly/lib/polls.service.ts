import { addPoll, deletePoll, getPollById, getPolls, hasVotedBrowser, recordVote, setVotedBrowser, type StoredPoll, updatePoll } from "./storage";
import { createPollSchema, voteSchema, ValidationError } from "./validators/poll";
import { canVote } from "./authz";

/**
 * pollsService
 *
 *  In-memory/localStorage backed service that encapsulates poll CRUD and voting.
 *  UI components call this boundary to avoid duplicating business rules.
 *  Browser environment with access to `localStorage`.
 *  Duplicate voting prevention via user id and browser flag; closed polls disallow votes.
 *  Coordinates with validators, authorization helpers, and storage utilities.
 */

export type CreatePollServiceInput = {
  title: string;
  options: string[];
  description?: string;
  allowMultiple?: boolean;
  requireLogin?: boolean;
  endDate?: string | null;
};

export type ServiceUser = { id: string; email?: string | null; username?: string | null } | null | undefined;

function normalizeTitleToSlug(title: string): string {
  return title
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const pollsService = {
  list(ownerId?: string): StoredPoll[] {
    const all = getPolls();
    return ownerId ? all.filter((p) => p.authorId === ownerId) : all;
  },

  get(id: string): StoredPoll | undefined {
    return getPollById(id);
  },

  create(input: CreatePollServiceInput, user: ServiceUser): StoredPoll {
    // Validate minimal, required fields using our schema.
    const parsed = createPollSchema.parse({ title: input.title, options: input.options });

    // Derive normalized and display fields from input and user.
    const title = parsed.title;
    const slug = normalizeTitleToSlug(title);
    const authorId = user?.id;
    const authorName = user?.username ?? user?.email ?? "Anonymous";

    const created = addPoll({
      title,
      description: input.description?.trim() || undefined,
      question: title, // align question with title for now
      options: parsed.options,
      authorId,
      authorName,
      settings: {
        allowMultiple: Boolean(input.allowMultiple),
        requireLogin: Boolean(input.requireLogin),
        endDate: input.endDate ?? undefined,
      },
      // Keep track of voters to prevent duplicate votes by user id.
      voters: [],
    });

    // Note: Slug currently unused; we may map id to slug in future routing.
    return created;
  },

  vote(pollId: string, optionIndex: number, user?: ServiceUser): StoredPoll {
    const poll = getPollById(pollId);
    if (!poll) throw new Error("Poll not found");

    // Validate the selected option index and its bounds against options count.
    voteSchema.parse({ optionIndex }, { optionsCount: poll.options.length });

    // Prevent duplicate votes via both user id (authoritative) and
    // a best-effort browser flag for anonymous sessions.
    const voterId = user?.id ?? undefined;
    if (voterId && (poll.voters ?? []).includes(voterId)) {
      throw new ValidationError("Duplicate vote", ["User has already voted"]);
    }
    if (hasVotedBrowser(pollId)) {
      throw new ValidationError("Duplicate vote", ["This browser has already voted on this poll"]);
    }

    // Check that the poll is open and the user meets login requirements.
    const endsAt = poll.settings?.endDate ? new Date(poll.settings.endDate) : null;
    const authz = canVote(user ?? null, {
      authorId: poll.authorId ?? null,
      requireLogin: poll.settings?.requireLogin ?? false,
      endsAt: endsAt ? endsAt.toISOString() : null,
    });
    if (!authz) {
      throw new ValidationError("Voting not allowed", ["Poll is closed or login required"]);
    }

    const updated = recordVote(pollId, optionIndex, voterId);
    if (!updated) throw new Error("Failed to record vote");

    // Mark browser as having voted only after persistence succeeds.
    setVotedBrowser(pollId);
    return updated;
  },

  close(id: string): StoredPoll {
    const updated = updatePoll(id, (p) => {
      const next = { ...p };
      const nowIso = new Date().toISOString();
      next.settings = {
        allowMultiple: Boolean(p.settings?.allowMultiple),
        requireLogin: Boolean(p.settings?.requireLogin),
        endDate: nowIso,
      };
      return next;
    });
    if (!updated) throw new Error("Poll not found");
    return updated;
  },

  remove(id: string): boolean {
    return deletePoll(id);
  },
};


