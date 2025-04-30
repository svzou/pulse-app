"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Exercise = {
  id: string;
  name: string;
  description: string;
  muscle_group: string;
  secondary_muscle: string;
  equipment: string[];
  image_url: string;
};

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching exercises:", error);
      } else {
        setExercises(data || []);
        if (data && data.length > 0) setSelected(data[0]);
      }
    };

    fetchExercises();
  }, []);

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex px-6 pt-6 gap-6 max-w-screen-xl mx-auto relative">
      {/* Center Panel */}
      <div className="flex-1 max-w-4xl mr-72">
        {selected ? (
          <div>
            <h1 className="text-3xl font-bold mb-4">{selected.name}</h1>
            
            <img
              src={selected.image_url || "/placeholder.png"}
              alt={selected.name}
              className="w-full max-w-xl mx-auto mb-6 rounded shadow"
            />

            <div className="space-y-2 text-lg">
              <p><strong>Equipment:</strong> {selected.equipment?.join(", ")}</p>
              <p><strong>Primary Muscle Group:</strong> {selected.muscle_group}</p>
              <p><strong>Secondary Muscle Group:</strong> {selected.secondary_muscle}</p>
              <p><strong>Description:</strong> {selected.description}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-lg">Select an exercise from the list.</p>
        )}
      </div>

      {/* Right Sidebar - Fixed Position */}
      <aside className="w-64 min-w-64 flex-shrink-0 fixed right-6 top-42 h-[calc(100vh-6rem)]">
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
    <h2 className="text-lg font-semibold mb-2 text-black dark:text-white">Exercise Library</h2>
    <input
      type="text"
      placeholder="Search exercises..."
      className="w-full mb-3 p-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
    <ul className="space-y-1 overflow-y-auto flex-1">
      {filtered.map((ex) => (
        <li key={ex.id}>
          <button
            onClick={() => setSelected(ex)}
            className={`w-full text-left px-3 py-2 border border-black dark:border-gray-600 rounded hover:bg-sky-200 dark:hover:bg-gray-700 transition ${
              selected?.id === ex.id ? "bg-sky-200 dark:bg-blue-600 font-semibold text-black dark:text-white" : "text-black dark:text-gray-200"
            }`}
          >
            {ex.name}{" "}
            <span className="text-sm text-gray-500 dark:text-gray-400">({ex.muscle_group})</span>
          </button>
        </li>
      ))}
    </ul>
  </div>
</aside>
    </div>
  );
}