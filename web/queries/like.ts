import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Toggle the like status of a workout
 */
export async function toggleLike(userId: string, workoutId: string) {
  const supabase = createClientComponentClient();

  const { data: existingLike, error: checkError } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_id", workoutId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("workout_id", workoutId);

    if (deleteError) throw deleteError;
    return false;
  } else {
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("user_id")
      .eq("id", workoutId)
      .single();

    if (workoutError || !workout) throw workoutError;

    const { error: insertError } = await supabase.from("likes").insert({
      user_id: userId,
      workout_id: workoutId,
      post_owner_id: workout.user_id,
    });

    if (insertError) throw insertError;
    return true;
  }
}

/**
 * Get like count for a workout
 */
export async function getLikesCount(workoutId: string): Promise<number> {
  const supabase = createClientComponentClient();

  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("workout_id", workoutId);

  if (error) {
    console.error("Error getting likes count:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Check if a user has liked a workout
 */
export async function isLikedByUser(
  userId: string,
  workoutId: string
): Promise<boolean> {
  if (!userId || !workoutId) return false;

  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_id", workoutId)
    .maybeSingle();

  if (error) {
    console.error("Error checking like:", error);
    return false;
  }

  return !!data;
}
