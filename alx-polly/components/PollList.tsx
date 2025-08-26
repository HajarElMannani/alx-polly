import React from "react";
import type { Poll } from "../lib/types";
import Button from "./shadcn/Button";

const sample: Poll[] = [
  { id: "1", title: "Favorite color?", options: [{ id: "a", label: "Red" }, { id: "b", label: "Blue" }], createdAt: new Date().toISOString() },
  { id: "2", title: "Best pet?", options: [{ id: "a", label: "Cat" }, { id: "b", label: "Dog" }], createdAt: new Date().toISOString() },
];

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
