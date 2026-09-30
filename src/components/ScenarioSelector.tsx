"use client";

import { useState, type FormEvent } from "react";
import { SCENARIOS } from "@/features/scenario/lib/scenario-definitions";

interface ScenarioSelectorProps {
  onSelect: (scenario: string, topic: string) => void;
  isLoading: boolean;
}

export function ScenarioSelector({ onSelect, isLoading }: ScenarioSelectorProps) {
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSelect(scenario, topic.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto">
            E
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">EmilyTalks</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Choose a scenario to start practicing</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Scenario</label>
          <div className="grid grid-cols-1 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScenario(s.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all ${
                  scenario === s.id
                    ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Ordering coffee at Starbucks"
            className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
              rounded-xl px-4 py-3 text-sm
              placeholder:text-zinc-400 dark:placeholder:text-zinc-500
              outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={!topic.trim() || isLoading}
          className="w-full bg-blue-600 dark:bg-blue-500 text-white rounded-xl py-3 text-sm font-medium
            hover:bg-blue-500 dark:hover:bg-blue-400
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Preparing..." : "Start Conversation"}
        </button>
      </form>
    </div>
  );
}
