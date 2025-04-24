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
  secondary_muscle: string; // text (not array)
  equipment: string[]; // text[] from Supabase
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

      if (error) console.error("Error fetching exercises:", error);
      else {
        setExercises(data || []);
        if (data && data.length > 0) setSelected(data[0]); // default selection
      }
    };

    fetchExercises();
  }, []);

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex px-6 pt-6 gap-6 max-w-screen-xl mx-auto">
      {/* Center Panel */}
      <div className="flex-1 max-w-4xl">
        {selected ? (
          <div>
            <h1 className="text-3xl font-bold mb-4">{selected.name}</h1>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="space-y-2 text-lg">
                <p><strong>Equipment:</strong> {selected.equipment?.join(", ")}</p>
                <p><strong>Primary Muscle Group:</strong> {selected.muscle_group}</p>
                <p><strong>Secondary Muscle Group:</strong> {selected.secondary_muscle}</p>
                <p><strong>Description:</strong> {selected.description}</p>
              </div>
              <img
                src={selected.image_url || "/placeholder.png"}
                alt={selected.name}
                className="w-64 h-auto rounded shadow"
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-lg">Select an exercise from the list.</p>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="w-64">
        <h2 className="text-lg font-semibold mb-2">Exercise Library</h2>
        <input
          type="text"
          placeholder="Search exercises..."
          className="w-full mb-3 p-2 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="space-y-1 max-h-[80vh] overflow-y-auto">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <button
                onClick={() => setSelected(ex)}
                className={`w-full text-left px-3 py-1 rounded hover:bg-gray-100 ${
                  selected?.id === ex.id ? "bg-gray-200 font-semibold" : ""
                }`}
              >
                {ex.name}{" "}
                <span className="text-sm text-gray-500">
                  ({ex.muscle_group})
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}