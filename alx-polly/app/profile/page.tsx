"use client";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import Input from "../../components/shadcn/Input";
import Button from "../../components/shadcn/Button";
import { useAuth } from "../../components/AuthProvider";
import { updatePassword, updateProfile } from "./actions";

export default function ProfilePage() {
  const { user } = useAuth();
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

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setMessage("Profile updated successfully.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);
    if (result.error) {
      setError(result.error);
    } else {
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
            <form className="flex flex-col gap-4" onSubmit={handleUpdateProfile}>
              <Input name="username" label="Username" value={username} onChange={e => setUsername(e.target.value)} required />
              <Button type="submit" className="bg-black text-white self-end">Save Profile</Button>
            </form>
            <form className="flex flex-col gap-4" onSubmit={handleUpdatePassword}>
              <Input name="oldPassword" label="Old Password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
              <Input name="newPassword" label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              <Button type="submit" className="bg-black text-white self-end">Update Password</Button>
            </form>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
