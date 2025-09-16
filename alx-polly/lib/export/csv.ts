export type CsvOptions = {
  includeHeader?: boolean;
  delimiter?: "," | ";";
  excelCompat?: boolean; // Adds BOM and CRLF when returning full string
};

const DEFAULT_DELIMITER: "," | ";" = ",";

export function sanitizeForSpreadsheet(value: string): string {
  if (!value) return value;
  const dangerous = ["=", "+", "-", "@"]; // CSV injection vectors
  return dangerous.some((p) => value.startsWith(p)) ? `'${value}` : value;
}

export function escapeCsvField(value: string, delimiter: "," | ";" = DEFAULT_DELIMITER): string {
  const str = String(value ?? "");
  const sanitized = sanitizeForSpreadsheet(str);
  const mustQuote = sanitized.includes("\n") || sanitized.includes("\r") || sanitized.includes("\"") || sanitized.includes(delimiter);
  if (mustQuote) {
    const escaped = sanitized.replace(/\"/g, '""');
    return `"${escaped}"`;
  }
  return sanitized;
}

function joinRows(rows: string[][], delimiter: "," | ";"): string {
  return rows.map((r) => r.join(delimiter)).join("\r\n");
}

export function talliesToCsv(
  tallies: { label: string; count: number; percent: number }[],
  opts?: CsvOptions
): string {
  const delimiter = opts?.delimiter ?? DEFAULT_DELIMITER;
  const includeHeader = opts?.includeHeader ?? true;
  const excelCompat = opts?.excelCompat ?? true;

  const rows: string[][] = [];
  if (includeHeader) rows.push(["Option", "Count", "Percent"]);
  for (const t of tallies) {
    rows.push([
      escapeCsvField(t.label, delimiter),
      escapeCsvField(String(t.count), delimiter),
      escapeCsvField(`${Math.round(t.percent)}`, delimiter),
    ]);
  }
  const body = joinRows(rows, delimiter) + "\r\n";
  return excelCompat ? `\uFEFF${body}` : body;
}

export type Vote = {
  pollId: string;
  optionId: string;
  voterId?: string | null;
  createdAt: string;
};

export function rawVotesToCsv(
  args: { pollTitle: string; optionsById: Record<string, { label: string }>; votes: Vote[] },
  opts?: CsvOptions
): string {
  const delimiter = opts?.delimiter ?? DEFAULT_DELIMITER;
  const includeHeader = opts?.includeHeader ?? true;
  const excelCompat = opts?.excelCompat ?? true;

  const rows: string[][] = [];
  if (includeHeader) rows.push(["Poll", "Option", "VoterId", "CreatedAt"]);
  for (const v of args.votes) {
    const label = args.optionsById[v.optionId]?.label ?? "Unknown";
    rows.push([
      escapeCsvField(args.pollTitle, delimiter),
      escapeCsvField(label, delimiter),
      escapeCsvField(v.voterId ?? "", delimiter),
      escapeCsvField(v.createdAt, delimiter),
    ]);
  }
  const body = joinRows(rows, delimiter) + "\r\n";
  return excelCompat ? `\uFEFF${body}` : body;
}

export function streamCsv(
  rows: AsyncIterable<string>,
  opts?: { excelCompat?: boolean }
): ReadableStream<Uint8Array> {
  const excelCompat = opts?.excelCompat ?? false; // streaming: omit BOM by default
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      if (excelCompat) controller.enqueue(encoder.encode("\uFEFF"));
    },
    async pull(controller) {
      const iterator = (rows as any)[Symbol.asyncIterator] as () => AsyncIterator<string>;
      if (!iterator) {
        controller.close();
        return;
      }
      const it = iterator();
      for await (const chunk of { [Symbol.asyncIterator]: it } as any as AsyncIterable<string>) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

export function slugifyFilename(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-\s_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}



