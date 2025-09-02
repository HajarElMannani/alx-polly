import { describe, it, expect } from "vitest";
import { createPollSchema, voteSchema, ValidationError } from "../validators/poll";

describe("createPollSchema", () => {
  it("accepts valid title and 2-6 unique options (trimmed)", () => {
    const res = createPollSchema.parse({ title: "  My Poll  ", options: [" A ", "B", "C "] });
    expect(res.title).toBe("My Poll");
    expect(res.options).toEqual(["A", "B", "C"]);
  });

  it("rejects missing title or too short", () => {
    expect(() => createPollSchema.parse({ title: " ", options: ["A", "B"] })).toThrow(ValidationError);
    expect(() => createPollSchema.parse({ title: "ab", options: ["A", "B"] })).toThrow(ValidationError);
  });

  it("requires at least 2 options and at most 6", () => {
    expect(() => createPollSchema.parse({ title: "T", options: ["A"] })).toThrow(ValidationError);
    expect(() => createPollSchema.parse({ title: "Title", options: ["A", "B", "C", "D", "E", "F", "G"] })).toThrow(
      ValidationError
    );
  });

  it("rejects duplicate options case-insensitively", () => {
    expect(() => createPollSchema.parse({ title: "Title", options: ["A", "a"] })).toThrow(ValidationError);
  });
});

describe("voteSchema", () => {
  it("accepts a non-negative integer optionIndex in range when optionsCount given", () => {
    const res = voteSchema.parse({ optionIndex: 1 }, { optionsCount: 3 });
    expect(res.optionIndex).toBe(1);
  });

  it("rejects non-integers or negatives", () => {
    expect(() => voteSchema.parse({ optionIndex: -1 })).toThrow(ValidationError);
    expect(() => voteSchema.parse({ optionIndex: 1.1 })).toThrow(ValidationError);
    expect(() => voteSchema.parse({ optionIndex: "1" as any })).toThrow(ValidationError);
  });

  it("rejects out-of-range when optionsCount provided", () => {
    expect(() => voteSchema.parse({ optionIndex: 3 }, { optionsCount: 3 })).toThrow(ValidationError);
  });
});


