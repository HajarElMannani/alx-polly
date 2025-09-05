// Authorization helpers for poll operations
//
//  Pure functions that determine whether a user can perform an action
// (e.g., edit a poll or cast a vote) based on poll fields and timing.
//  Centralizes business rules so UI and services can rely on one source
// of truth, making behavior more testable and maintainable.

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
 *  Protects against votes on closed polls and enforces login-only polls.
 * Timestamps are ISO strings; null means no end.
 * Invalid date strings are treated as no end; anonymous users blocked when required.
 * Consulted by services and pages before persisting a vote.
 */
export function canVote(user: AuthzUser, poll: PollAuthzFields): boolean {
  if (getRequireLogin(poll) && !user?.id) return false;
  const ends = getEndsAtDate(poll);
  if (ends && Date.now() >= ends.getTime()) return false;
  return true;
}


