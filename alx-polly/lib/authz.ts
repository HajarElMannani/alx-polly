// Authorization helpers for poll operations

export type AuthzUser = { id: string } | null | undefined;

export type PollAuthzFields = {
  authorId?: string | null;
  requireLogin?: boolean | null;
  endsAt?: string | null;
  // tolerate snake_case from DB rows
  require_login?: boolean | null;
  ends_at?: string | null;
};

/**
 * Returns true when both ids are non-empty and equal.
 */
export function isOwner(userId: string | null | undefined, ownerId: string | null | undefined): boolean {
  if (!userId || !ownerId) return false;
  return userId === ownerId;
}

function getRequireLogin(poll: PollAuthzFields): boolean {
  return Boolean(poll.requireLogin ?? poll.require_login ?? false);
}

function getEndsAtDate(poll: PollAuthzFields): Date | null {
  const raw = poll.endsAt ?? poll.ends_at ?? null;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Creator-only edit permissions.
 */
export function canEditPoll(user: AuthzUser, poll: PollAuthzFields): boolean {
  const ownerId = poll.authorId ?? null;
  return isOwner(user?.id, ownerId);
}

/**
 * Voting allowed when:
 * - if requireLogin → user must be present
 * - poll not ended (endsAt/ends_at in the future or unset)
 */
export function canVote(user: AuthzUser, poll: PollAuthzFields): boolean {
  if (getRequireLogin(poll) && !user?.id) return false;
  const ends = getEndsAtDate(poll);
  if (ends && Date.now() >= ends.getTime()) return false;
  return true;
}


