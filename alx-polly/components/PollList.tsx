import React from "react";
import type { Poll } from "../lib/types";
import Button from "./shadcn/Button";

const sample: Poll[] = [
  { id: "1", title: "Favorite color?", options: [{ id: "a", label: "Red" }, { id: "b", label: "Blue" }], createdAt: new Date().toISOString() },
  { id: "2", title: "Best pet?", options: [{ id: "a", label: "Cat" }, { id: "b", label: "Dog" }], createdAt: new Date().toISOString() },
];

/**
 * Renders a list of polls with quick action buttons.
 * Why: Provides a simple overview for the dashboard and a place to launch actions.
 * Assumptions: Data will eventually come from a service/API; here we stub sample data.
 * Edge cases: Empty lists should render a friendly empty state (future enhancement).
 * Connects: Buttons trigger navigation or voting; integrates with pollsService in real flows.
 */
export default function PollList() {
  return (
    <div className="space-y-4">
      {sample.map((p) => (
        <div key={p.id} className="p-4 border rounded-md">
          <h3 className="font-semibold">{p.title}</h3>
          <div className="mt-2 flex gap-2">
            {p.options.map((o) => (
              <Button key={o.id} variant="ghost">
                {o.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
