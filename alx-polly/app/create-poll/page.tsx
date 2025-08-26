"use client";
import React, { useState } from "react";
import Input from "../../components/shadcn/Input";
import Button from "../../components/shadcn/Button";
import { addPoll } from "../../lib/storage";
import { useRouter } from "next/navigation";

export default function CreatePollPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [requireLogin, setRequireLogin] = useState(false);
  const [endDate, setEndDate] = useState("");

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  const addOptionField = () => {
    setOptions((opts) => [...opts, ""]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = options.map(o => o.trim()).filter(Boolean);
    if (!title.trim() || trimmed.length < 2) {
      alert("Please enter a title and at least two options.");
      return;
    }
    addPoll({
      title: title.trim(),
      description: description.trim() || undefined,
      options: trimmed,
      votes: 0,
      settings: {
        allowMultiple,
        requireLogin,
        endDate: endDate || undefined,
      },
    });
    router.push("/polls");
  };

  return (
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
                  <Input label="Poll Title" placeholder="Enter poll title" name="title" required value={title} onChange={e => setTitle(e.target.value)} />
                  <Input label="Description (optional)" placeholder="Enter description" name="description" value={description} onChange={e => setDescription(e.target.value)} />
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
                      checked={allowMultiple}
                      onChange={(e) => setAllowMultiple(e.target.checked)}
                    />
                    <span>Allow users to select multiple options</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={requireLogin}
                      onChange={(e) => setRequireLogin(e.target.checked)}
                    />
                    <span>Require users to be logged in to vote</span>
                  </label>
                  <Input
                    label="Poll End Date (optional)"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <Button type="submit" className="mt-6 self-end bg-black text-white">Create Poll</Button>
        </form>
      </div>
    </main>
  );
}
