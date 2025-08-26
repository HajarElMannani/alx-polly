import React from "react";
import Input from "./shadcn/Input";
import Button from "./shadcn/Button";

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
