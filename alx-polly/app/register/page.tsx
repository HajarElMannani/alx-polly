"use client";
import React, { useState } from "react";
import Input from "../../components/shadcn/Input";
import Button from "../../components/shadcn/Button";
import { useAuth } from "../../components/AuthProvider";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    if (!username.trim()) {
      setLoading(false);
      setError("Username is required");
      return;
    }
    const { error } = await signUp(email, password, username.trim());
    setLoading(false);
    if (error) setError(error);
    else setInfo("Registration successful. Please check your email to verify your account.");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        {info && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{info}</div>}
        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="bg-black text-white" disabled={loading}>{loading ? "Please wait..." : "Register"}</Button>
        </form>
        <div className="mt-4 text-sm">
          Already have an account? <a className="text-blue-600 hover:underline" href="/login">Login</a>
        </div>
      </div>
    </main>
  );
}
