import { describe, it, expect } from "vitest";
import { escapeCsvField, sanitizeForSpreadsheet, talliesToCsv, rawVotesToCsv } from "../export/csv";

describe("CSV utils", () => {
  it("sanitizes leading formula characters", () => {
    expect(sanitizeForSpreadsheet("=1+1")).toBe("'=1+1");
    expect(sanitizeForSpreadsheet("@cmd")).toBe("'@cmd");
    expect(sanitizeForSpreadsheet("safe")).toBe("safe");
  });

  it("escapes quotes and commas", () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('He said "hi"')).toBe('"He said ""hi"""');
  });

  it("generates tallies csv with header and BOM", () => {
    const csv = talliesToCsv([
      { label: "A", count: 2, percent: 50 },
      { label: "B", count: 2, percent: 50 },
    ], { excelCompat: true });
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.includes("Option,Count,Percent")).toBe(true);
  });

  it("generates raw votes csv with header", () => {
    const csv = rawVotesToCsv({
      pollTitle: "My Poll",
      optionsById: { o1: { label: "A" } },
      votes: [
        { pollId: "p1", optionId: "o1", voterId: "u1", createdAt: new Date().toISOString() },
      ],
    });
    expect(csv.includes("Poll,Option,VoterId,CreatedAt")).toBe(true);
    expect(csv.includes("My Poll")).toBe(true);
    expect(csv.includes("A")).toBe(true);
  });
});


