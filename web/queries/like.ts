// import { supabase } from "@/utils/supabase/client";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";

const supabase = createSupabaseComponentClient();

export async function toggleLike(userId: string, workoutId: string) {
  const { data } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_id", workoutId)
    .maybeSingle();

  if (data) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("workout_id", workoutId);
  } else {
    await supabase
      .from("likes")
      .insert({ user_id: userId, workout_id: workoutId });
  }
}

export async function getLikesCount(workoutId: string): Promise<number> {
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("workout_id", workoutId);
  return count ?? 0;
}

export async function isLikedByUser(
  userId: string,
  workoutId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_id", workoutId)
    .maybeSingle();
  return !!data;
}

