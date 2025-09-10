"use client";

import { useFormStatus } from "react-dom";
import Button from "../../components/shadcn/Button";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="mt-3 self-end bg-black text-white"
      disabled={pending}
    >
      {pending ? "Creating..." : "Create Poll"}
    </Button>
  );
}
