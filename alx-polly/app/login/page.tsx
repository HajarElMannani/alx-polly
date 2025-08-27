"use client";
import React, { useState } from "react";
import Input from "../../components/shadcn/Input";
import Button from "../../components/shadcn/Button";
import { useAuth } from "../../components/AuthProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
    else router.push("/polls");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="bg-black text-white" disabled={loading}>{loading ? "Please wait..." : "Login"}</Button>
        </form>
        <div className="mt-4 text-sm">
          Don't have an account? <a className="text-blue-600 hover:underline" href="/register">Register</a>
        </div>
      </div>
    </main>
  );
}
