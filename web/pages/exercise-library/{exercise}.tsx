import Link from "next/link";
import { supabase } from "@/lib/supabase";
import * as React from "react";

type Exercise = {
  name: string;
  category: string;
};

export default function ExerciseList() {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("name, category")
        .order("name");

      if (error) {
        console.error("Error fetching exercises:", error);
        return;
      }

      setExercises(data);
    };

    fetchExercises();
  }, []);

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Library</h2>
      <input
        type="text"
        placeholder="Search exercises..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <h3 className="text-sm font-medium mb-2">All Exercises</h3>
      <ul>
        {filteredExercises.map((exercise) => (
          <li key={exercise.name} className="mb-2">
            <Link href={`/exercise-library/${exercise.category.toLowerCase()}/${exercise.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <span className={exercise.name === "Bench Press" ? "font-bold" : ""}>
                {exercise.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
