import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";

const supabase = createSupabaseComponentClient();

export async function addComment(
  userId: string,
  workoutId: string,
  content: string
) {
  return await supabase
    .from("comments")
    .insert({ user_id: userId, workout_id: workoutId, content });
}

export async function getComments(workoutId: string) {
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("workout_id", workoutId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

