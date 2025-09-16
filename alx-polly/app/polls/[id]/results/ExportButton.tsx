"use client";

import { useMemo } from "react";

export default function ExportButton(props: { pollId: string; mode?: "tallies" | "raw" }) {
  const { pollId, mode = "tallies" } = props;
  const href = useMemo(() => {
    const params = new URLSearchParams({ mode });
    return `/polls/${pollId}/export?${params.toString()}`;
  }, [pollId, mode]);

  const label = mode === "raw" ? "Export raw votes (CSV)" : "Export tallies (CSV)";

  return (
    <a
      href={href}
      download={mode === "tallies"}
      className="inline-flex items-center px-3 py-2 text-sm border rounded hover:bg-gray-50"
      aria-label={label}
    >
      {label}
    </a>
  );
}



