import React from "react";
import Input from "./shadcn/Input";
import Button from "./shadcn/Button";

export default function AuthForm() {
  return (
    <form className="max-w-md w-full flex flex-col gap-4">
      <Input label="Email" placeholder="you@example.com" type="email" name="email" />
      <Input label="Password" placeholder="••••••••" type="password" name="password" />
      <div className="flex gap-2">
        <Button type="submit">Sign in</Button>
        <Button type="button" variant="ghost">Register</Button>
      </div>
    </form>
  );
}
