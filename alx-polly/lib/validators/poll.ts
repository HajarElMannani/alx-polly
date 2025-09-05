// Simple, dependency-free validation utilities for polls
//
//  Minimal runtime validation for creating polls and casting votes.
//  Keeps client logic predictable and resilient without adding heavy
// schema libraries, and provides clear, user-friendly error messages.

/**
 * Minimum number of characters required for a poll title/question.
 * Why: Discourages trivial/empty prompts while remaining user-friendly.
 */
export const MIN_QUESTION_LENGTH = 3;
/**
 * Bounds for number of selectable options a poll can have.
 * Why: Enforces meaningful choice while keeping UI manageable.
 */
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;

export class ValidationError extends Error {
  issues: string[];
  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export type CreatePollInput = {
  title: string;
  options: string[];
};

export type VoteInput = {
  optionIndex: number;
};

function toStringRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value);
}

function uniqueCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

export const createPollSchema = {
  /**
   * Purpose: Parses and validates input for creating a poll.
   * Context: Enforces minimum title length, required number of options,
   * and uniqueness before persistence.
   * Assumptions: Raw input is an object-like payload; options contain strings.
   * Edge cases: Trims whitespace, filters empty strings, caps total options, and
   * deduplicates case-insensitively.
   * Interactions: Used by `pollsService.create` prior to writing to storage.
   */
  parse(input: unknown): CreatePollInput {
    const obj = toStringRecord(input);
    const issues: string[] = [];
    if (!obj) {
      throw new ValidationError("Invalid input for create poll", ["Expected an object"]);
    }

    const rawTitle = typeof obj.title === "string" ? obj.title : "";
    const title = rawTitle.trim();
    if (!title) {
      issues.push("Title is required");
    } else if (title.length < MIN_QUESTION_LENGTH) {
      issues.push(`Title must be at least ${MIN_QUESTION_LENGTH} characters`);
    }

    const rawOptions = Array.isArray(obj.options) ? obj.options : [];
    const options = rawOptions
      .map((o) => (typeof o === "string" ? o.trim() : ""))
      .filter((o) => o.length > 0);

    if (options.length < MIN_OPTIONS) {
      issues.push(`Provide at least ${MIN_OPTIONS} options`);
    }
    if (options.length > MAX_OPTIONS) {
      issues.push(`Provide no more than ${MAX_OPTIONS} options`);
    }

    const deduped = uniqueCaseInsensitive(options);
    if (deduped.length !== options.length) {
      issues.push("Options must be unique (case-insensitive)");
    }

    if (issues.length > 0) {
      throw new ValidationError("Create poll validation failed", issues);
    }

    return { title, options: deduped };
  },
};

export const voteSchema = {
  // Optionally supply optionsCount to enforce bounds
  /**
   * Purpose: Parses and validates input for a vote action.
   * Context: Ensures the selected option index is an integer and within range
   * when the options count is known.
   * Assumptions: `optionIndex` originates from a UI selection (radio/button).
   * Edge cases: Rejects negative numbers, non-integers, and out-of-bounds indices.
   * Interactions: Used by `pollsService.vote` to guard writes.
   */
  parse(input: unknown, ctx?: { optionsCount?: number }): VoteInput {
    const obj = toStringRecord(input);
    const issues: string[] = [];
    if (!obj) {
      throw new ValidationError("Invalid input for vote", ["Expected an object"]);
    }

    const optionIndex = isFiniteInteger(obj.optionIndex) ? (obj.optionIndex as number) : NaN;
    if (!Number.isFinite(optionIndex)) {
      issues.push("optionIndex must be an integer");
    } else if (optionIndex < 0) {
      issues.push("optionIndex must be >= 0");
    }

    if (typeof ctx?.optionsCount === "number") {
      const count = ctx.optionsCount;
      if (count <= 0) {
        issues.push("optionsCount must be > 0 when provided");
      } else if (Number.isFinite(optionIndex) && (optionIndex < 0 || optionIndex >= count)) {
        issues.push("optionIndex is out of range");
      }
    }

    if (issues.length > 0) {
      throw new ValidationError("Vote validation failed", issues);
    }

    return { optionIndex };
  },
};


