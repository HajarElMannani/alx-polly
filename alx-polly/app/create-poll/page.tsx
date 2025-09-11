"use client";
import React, { useState, useEffect } from "react";
import { useActionState } from "react";
import Input from "../../components/shadcn/Input";
import Button from "../../components/shadcn/Button";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { createPoll } from "./actions";
import { SubmitButton } from "./SubmitButton";
import { supabaseBrowser } from "../../lib/supabaseClient";

const initialState = {
  error: "",
  pollId: null,
};

export default function CreatePollPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(createPoll, initialState);
  const [activeTab, setActiveTab] = useState("basic");
  const [options, setOptions] = useState(["", ""]);
  const [accessToken, setAccessToken] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data } = (await supabase?.auth.getSession()) ?? { data: undefined };
        const token = data?.session?.access_token;
        if (token) setAccessToken(token);
      } catch {}
    })();
  }, []);

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  const addOptionField = () => {
    setOptions((opts) => [...opts, ""]);
  };

  useEffect(() => {
    if (state.error) {
      alert(state.error);
    }
    if (state.pollId) {
      router.push(`/polls/${state.pollId}`);
    }
  }, [state, router]);

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
          <form className="flex-1 flex flex-col" action={formAction}>
            <input type="hidden" name="accessToken" value={accessToken} />
            <div className="flex-1">
              <div hidden={activeTab !== "basic"}>
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
                          name="options[]"
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
              <div hidden={activeTab !== "settings"}>
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
            </div>
            <SubmitButton />
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
