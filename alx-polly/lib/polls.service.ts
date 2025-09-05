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

/**
 * Transforms a free-form title into a URL-safe slug.
 * Why: Normalizes titles so we can reuse for URLs/anchors without leaking punctuation.
 * Assumptions: ASCII letters/numbers are retained; other characters are stripped.
 * Edge cases: Multiple spaces collapse to a single hyphen; leading/trailing hyphens removed.
 * Connects: Optionally used by routes or share links; currently not persisted.
 */
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
    /**
     * Returns all polls or filters by owner for dashboard views.
     * Why: Helps dashboards render only the requesting user's polls without extra logic upstream.
     * Assumptions: Storage returns well-formed polls; filtering is cheap in-memory.
     * Edge cases: No polls or unknown owner returns an empty array.
     * Connects: Used by pages listing polls; can be replaced by server/API in future.
     */
    const all = getPolls();
    return ownerId ? all.filter((p) => p.authorId === ownerId) : all;
  },

  get(id: string): StoredPoll | undefined {
    return getPollById(id);
  },

  create(input: CreatePollServiceInput, user: ServiceUser): StoredPoll {
    /**
     * Validates and persists a new poll authored by the current user.
     * Why: Centralizes validation and derivation (slug/author) to keep UI simple and safe.
     * Assumptions: Title/options provided by user; username/email shown for author display.
     * Edge cases: Empty/duplicate options rejected; description optional and trimmed.
     * Connects: Invoked by `PollForm`; feeds `PollList` and detail pages.
     */
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
    /**
     * Applies a vote once per user (and per browser as best-effort) for a poll option.
     * Why: Prevents ballot stuffing and enforces closed/login-required policies.
     * Assumptions: Option index comes from UI; validators enforce bounds.
     * Edge cases: Duplicate vote detected by voter id or browser flag; closed poll; login required.
     * Connects: Called by vote buttons; updates are reflected in results components.
     */
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
    /**
     * Closes an active poll by setting its end date to now.
     * Why: Simplifies business logic for stopping new votes.
     * Assumptions: Poll exists in storage; UI prevents closing twice.
     * Edge cases: Missing poll id → error; idempotent behavior is acceptable.
     * Connects: Admin/owner controls for lifecycle management.
     */
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
    /**
     * Removes a poll by id.
     * Why: Keeps destructive action behind a single function for auditability.
     * Assumptions: Caller is authorized at a higher level; storage returns a boolean.
     * Edge cases: Unknown id returns false so callers can distinguish not-found.
     * Connects: Used by admin/owner delete actions in UI.
     */
    return deletePoll(id);
  },
};


