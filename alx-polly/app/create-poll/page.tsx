"use client";
import React, { useState } from "react";
import Input from "../../components/shadcn/Input";
import Button from "../../components/shadcn/Button";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { createPoll } from "./actions";

/**
 * CreatePollPage
 *
 *  Multi-tab form for authors to create a new poll with options and settings.
 * Context: Guides through basic info and advanced settings to produce consistent rows.
 *  Authenticated user exists; Supabase schema for polls/options is available.
 *  Validates minimum options; prevents submission without title; disables while submitting.
 *  Writes poll and its options; routes to the new poll page after creation.
 */
export default function CreatePollPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  const addOptionField = () => {
    setOptions((opts) => [...opts, ""]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    // Attach access token for server action if cookies are unavailable
    try {
      const supabase = supabaseBrowser();
      const { data } = (await supabase?.auth.getSession()) ?? { data: undefined };
      const token = data?.session?.access_token;
      if (token) {
        formData.set("accessToken", token);
      }
    } catch {}
    options.forEach((option) => {
      formData.append("options[]", option);
    });
    const result = await createPoll(formData);
    setSubmitting(false);
    if (result.error) {
      alert(result.error);
    } else {
      router.push("/polls");
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-xl bg-white rounded-lg shadow p-8 flex flex-col min-h-[600px]">
          <h1 className="text-3xl font-bold mb-6">Create New Poll</h1>
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b mb-6 w-full">
            <button
              className={`w-full text-center px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === "basic" ? "border-black text-black" : "border-transparent text-gray-500"}`}
              onClick={() => setActiveTab("basic")}
            >
              Basic info
            </button>
            <button
              className={`w-full text-center px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === "settings" ? "border-black text-black" : "border-transparent text-gray-500"}`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>
          {/* Form wrapping all tab contents with a persistent footer button */}
          <form className="flex-1 flex flex-col" onSubmit={handleSubmit}>
            <div className="flex-1">
              {activeTab === "basic" && (
                <div>
                  <h2 className="text-xl font-semibold mb-1">Poll Information</h2>
                  <p className="text-gray-500 mb-6">Enter the details of your new poll.</p>
                  <div className="flex flex-col gap-4">
                    <Input label="Poll Title" placeholder="Enter poll title" name="title" required />
                    <Input label="Description (optional)" placeholder="Enter description" name="description" />
                    <div>
                      <label className="text-sm font-medium">Poll Options</label>
                      <div className="flex flex-col gap-2 mt-2">
                        {options.map((opt, idx) => (
                          <Input
                            key={idx}
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={e => handleOptionChange(idx, e.target.value)}
                            required={idx < 2}
                          />
                        ))}
                      </div>
                      <Button type="button" variant="ghost" className="mt-2 w-fit" onClick={addOptionField}>
                        + Add option
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "settings" && (
                <div>
                  <h2 className="text-xl font-semibold mb-1">Poll Settings</h2>
                  <p className="text-gray-500 mb-6">Configure additional options for your poll.</p>
                  <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        name="allowMultiple"
                        value="true"
                      />
                      <span>Allow users to select multiple options</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        name="requireLogin"
                        value="true"
                      />
                      <span>Require users to be logged in to vote</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        name="isPublic"
                        value="true"
                        defaultChecked
                      />
                      <span>List this poll on Explore (public)</span>
                    </label>
                    <Input
                      label="Poll End Date (optional)"
                      type="datetime-local"
                      name="endDate"
                    />
                  </div>
                </div>
              )}
            </div>
            <Button type="submit" className="mt-3 self-end bg-black text-white" disabled={submitting}>
              {submitting ? "Creating..." : "Create Poll"}
            </Button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
