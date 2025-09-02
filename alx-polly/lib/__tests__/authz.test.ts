
import { describe, it, expect } from "vitest";
import { isOwner, canEditPoll, canVote } from "../authz";

describe("isOwner", () => {
  it("returns true when both ids match", () => {
    expect(isOwner("u1", "u1")).toBe(true);
  });

  it("returns false when ids differ or are missing", () => {
    expect(isOwner("u1", "u2")).toBe(false);
    expect(isOwner(null, "u2")).toBe(false);
    expect(isOwner("u1", undefined)).toBe(false);
  });
});

describe("canEditPoll", () => {
  it("allows only the author to edit", () => {
    const poll = { authorId: "author-1" };
    expect(canEditPoll({ id: "author-1" }, poll)).toBe(true);
    expect(canEditPoll({ id: "someone-else" }, poll)).toBe(false);
    expect(canEditPoll(null, poll)).toBe(false);
  });
});

describe("canVote", () => {
  const futureIso = () => new Date(Date.now() + 60_000).toISOString();
  const pastIso = () => new Date(Date.now() - 60_000).toISOString();

  it("allows anonymous vote when login not required and poll open", () => {
    const poll = { requireLogin: false, endsAt: futureIso() };
    expect(canVote(null, poll)).toBe(true);
  });

  it("blocks anonymous vote when login required", () => {
    const poll = { requireLogin: true, endsAt: futureIso() };
    expect(canVote(null, poll)).toBe(false);
    expect(canVote({ id: "u1" }, poll)).toBe(true);
  });

  it("blocks voting when poll has ended (endsAt)", () => {
    const poll = { endsAt: pastIso() };
    expect(canVote({ id: "u1" }, poll)).toBe(false);
  });

  it("blocks voting when poll has ended (ends_at snake case)", () => {
    const poll = { ends_at: pastIso() } as any;
    expect(canVote({ id: "u1" }, poll)).toBe(false);
  });

  it("allows voting when endsAt is in the future", () => {
    const poll = { endsAt: futureIso() };
    expect(canVote({ id: "u1" }, poll)).toBe(true);
  });

  it("allows voting when no end date is set", () => {
    const poll = {};
    expect(canVote({ id: "u1" }, poll)).toBe(true);
  });
});


