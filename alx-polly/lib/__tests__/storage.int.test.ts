import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPolls,
  savePolls,
  addPoll,
  getPollById,
  updatePoll,
  deletePoll,
  hasVotedBrowser,
  setVotedBrowser,
  recordVote,
  type StoredPoll,
} from "../storage";

declare const global: any;

// Simple in-memory localStorage mock
class LocalStorageMock {
  store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe("storage integration", () => {
  const KEY = "alx_polly_polls";

  beforeEach(() => {
    global.window = {} as any;
    global.localStorage = new LocalStorageMock();
  });

  it("creates, fetches, votes, flags browser voted, updates and deletes a poll", () => {
    expect(getPolls()).toEqual([]);

    const created = addPoll({
      title: "Test Poll",
      options: ["A", "B", "C"],
      authorId: "u1",
      authorName: "Alice",
      description: "desc",
      voters: [],
      settings: { allowMultiple: false, requireLogin: false },
    });

    const all = getPolls();
    expect(all.length).toBe(1);
    expect(all[0].title).toBe("Test Poll");
    expect(all[0].optionVotes).toEqual([0, 0, 0]);

    const fetched = getPollById(created.id)!;
    expect(fetched.id).toBe(created.id);

    // record a vote
    const afterVote = recordVote(created.id, 1, "u1")!;
    expect(afterVote.optionVotes[1]).toBe(1);
    expect(afterVote.votes).toBe(1);
    expect(afterVote.voters?.includes("u1")).toBe(true);

    // browser flag
    expect(hasVotedBrowser(created.id)).toBe(false);
    setVotedBrowser(created.id);
    expect(hasVotedBrowser(created.id)).toBe(true);

    // update poll: change title via updater
    const updated = updatePoll(created.id, (p) => ({ ...p, title: "Updated" }))!;
    expect(updated.title).toBe("Updated");

    // delete
    const removed = deletePoll(created.id);
    expect(removed).toBe(true);
    expect(getPollById(created.id)).toBeUndefined();
    expect(getPolls().length).toBe(0);
  });

  it("returns [] on SSR (no window)", () => {
    global.window = undefined;
    expect(getPolls()).toEqual([]);
  });

  it("handles invalid JSON in storage gracefully", () => {
    global.localStorage.setItem(KEY, "not-json");
    expect(getPolls()).toEqual([]);
  });

  it("update/delete return expected results for non-existent poll", () => {
    const updated = updatePoll("missing", (p: StoredPoll) => p);
    expect(updated).toBeUndefined();
    const removed = deletePoll("missing");
    expect(removed).toBe(false);
  });

  it("repairs missing optionVotes length on vote", () => {
    const p = addPoll({ title: "T", options: ["A", "B"], voters: [] });
    // Corrupt stored poll: remove optionVotes
    const all = getPolls();
    all[0] = { ...all[0], optionVotes: [] } as any;
    savePolls(all);
    const after = recordVote(p.id, 1)!;
    expect(after.optionVotes.length).toBe(2);
    expect(after.optionVotes[1]).toBe(1);
  });
});


