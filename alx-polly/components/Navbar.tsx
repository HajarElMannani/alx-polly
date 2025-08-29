"use client";
import React, { useState } from "react";
import Button from "./shadcn/Button";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    setDropdownOpen(false);
    window.location.replace("/login");
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b relative">
      {/* Site Title */}
      <span className="text-2xl font-bold">ALX Polly</span>
      {/* Centered Links */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-8">
        <a href="/explore" className="hover:underline">Explore</a>
        <a href="/polls" className="hover:underline">My Polls</a>
        <a href="/create-poll" className="hover:underline">Create Poll</a>
      </div>
      {/* Right */}
      <div className="flex items-center gap-4">
        <Button
          className="bg-transparent border border-black text-black !text-black hover:bg-gray-100 px-4 py-2"
          onClick={() => (window.location.href = "/create-poll")}
        >
          Create Poll
        </Button>
        {!user ? (
          <div className="flex items-center gap-3">
            <a className="hover:underline" href="/login">Login</a>
            <a className="hover:underline" href="/register" onClick={(e) => e.stopPropagation()}>Register</a>
          </div>
        ) : (
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-label="Profile menu"
              type="button"
            >
              <span role="img" aria-label="profile">👤</span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
                <div className="px-4 py-2 text-sm text-gray-500">{user.email}</div>
                <a href="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
                <button type="button" className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

