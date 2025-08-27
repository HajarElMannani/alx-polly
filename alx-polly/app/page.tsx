"use client";
import { useAuth } from "../components/AuthProvider";

export default function Home() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl">
        <section className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-800 to-gray-700" />
          <div className="relative px-8 py-24 sm:py-28 text-white text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">ALX Polly</h1>
            <p className="mt-4 max-w-2xl mx-auto text-gray-200">
              Create polls, share them with anyone, and see results in real time.
              Simple, fast, and great for quick decisions.
            </p>
          </div>
        </section>

        {user ? (
          <div className="mt-8 bg-white border rounded-xl shadow p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Welcome back</h2>
            <p className="text-sm text-gray-600 mb-4">
              Ready to launch a new poll or review your existing ones?
            </p>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <a href="/create-poll" className="block rounded-md px-4 py-3 text-center text-white bg-emerald-600 hover:bg-emerald-700">Create Poll</a>
              <a href="/polls" className="block rounded-md px-4 py-3 text-center text-white bg-blue-600 hover:bg-blue-700">My Polls</a>
              <a href="/profile" className="block rounded-md px-4 py-3 text-center text-white bg-purple-600 hover:bg-purple-700">Profile</a>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-white border rounded-xl shadow p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Get started</h2>
            <p className="text-sm text-gray-600 mb-4">
              New here? Create an account to make polls. Or explore existing polls and vote.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <a href="/register" className="block rounded-md px-4 py-3 text-center text-white bg-emerald-600 hover:bg-emerald-700">Register</a>
              <a href="/polls" className="block rounded-md px-4 py-3 text-center text-white bg-blue-600 hover:bg-blue-700">See Polls</a>
              <a href="/login" className="block rounded-md px-4 py-3 text-center text-white bg-indigo-600 hover:bg-indigo-700">Login</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
