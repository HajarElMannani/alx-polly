"use client";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import Input from "../../components/shadcn/Input";
import Button from "../../components/shadcn/Button";
import { useAuth } from "../../components/AuthProvider";
import { supabaseBrowser } from "../../lib/supabaseClient";

/**
 * ProfilePage
 *
 *  Lets authenticated users update profile metadata and change passwords.
 *  Account management screen integrated with Supabase auth/profile tables.
 *  User session provides email; username stored in user metadata.
 *  Verifies old password before updating; shows inline status and error messages.
 *  Calls Supabase auth update APIs and reads from `useAuth()`.
 */
export default function ProfilePage() {
  const { user } = useAuth();
  const supabase = supabaseBrowser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? null);
  }, [user]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const { error } = await supabase!.auth.updateUser({ data: { username } });
    if (error) setError(error.message);
    else setMessage("Profile updated successfully.");
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!email) {
      setError("Missing email in session.");
      return;
    }
    if (oldPassword.length < 6) {
      setError("Old password is required.");
      return;
    }
    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    // Verify old password by signing in before updating
    const { error: verifyErr } = await supabase!.auth.signInWithPassword({ email, password: oldPassword });
    if (verifyErr) {
      setError("Old password is incorrect.");
      return;
    }
    // Update to new password
    const { error: updErr } = await supabase!.auth.updateUser({ password });
    if (updErr) setError(updErr.message);
    else {
      setMessage("Password updated successfully.");
      setOldPassword("");
      setPassword("");
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-lg bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>
          {message && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{message}</div>}
          {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <div className="mt-1">{email}</div>
            </div>
            <form className="flex flex-col gap-4" onSubmit={updateProfile}>
              <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              <Button type="submit" className="bg-black text-white self-end">Save Profile</Button>
            </form>
            <form className="flex flex-col gap-4" onSubmit={updatePassword}>
              <Input label="Old Password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
              <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              <Button type="submit" className="bg-black text-white self-end">Update Password</Button>
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
