import React from "react";
import AuthForm from "../../components/AuthForm";

export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        <AuthForm />
      </div>
    </main>
  );
}
