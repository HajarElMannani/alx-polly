import React from "react";
import Input from "./shadcn/Input";
import Button from "./shadcn/Button";

/**
 * Collects user input for creating a poll.
 * Why: Encapsulates UI concerns while delegating validation/persistence to services/actions.
 * Assumptions: At least two options will be provided; server/service revalidates inputs.
 * Edge cases: Empty fields or duplicates should be handled gracefully with inline errors (future).
 * Connects: Calls `pollsService.create` or a server action; success navigates to the dashboard.
 */
export default function PollForm() {
  return (
    <form className="max-w-lg w-full flex flex-col gap-4">
      <Input label="Title" placeholder="Poll title" name="title" />
      <Input label="Option 1" placeholder="First option" name="option1" />
      <Input label="Option 2" placeholder="Second option" name="option2" />
      <div className="flex gap-2">
        <Button type="submit">Create Poll</Button>
      </div>
    </form>
  );
}
