import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Toggle the like status of a workout
 * @param userId The ID of the user toggling the like
 * @param workoutId The ID of the workout being liked/unliked
 */
export async function toggleLike(userId: string, workoutId: string) {
  try {
    const supabase = createClientComponentClient();
    
    // Check if the user has already liked this workout
    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", userId)
      .eq("workout_id", workoutId)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking like status:", error);
      throw error;
    }
    
    // If the like exists, delete it; otherwise, add it
    if (data) {
      console.log("Removing like", { userId, workoutId });
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("workout_id", workoutId);
      
      if (deleteError) {
        console.error("Error removing like:", deleteError);
        throw deleteError;
      }
      return false; // Return new like status (unliked)
    } else {
      console.log("Adding like", { userId, workoutId });
      // Add a new like with just the required fields
      const { error: insertError } = await supabase
        .from("likes")
        .insert({ 
          user_id: userId, 
          workout_id: workoutId 
        });
      
      if (insertError) {
        console.error("Error adding like:", insertError);
        throw insertError;
      }
      return true; // Return new like status (liked)
    }
  } catch (error) {
    console.error("Unexpected error in toggleLike:", error);
    throw error;
  }
}

/**
 * Get the number of likes for a workout
 * @param workoutId The ID of the workout
 * @returns The number of likes
 */
export async function getLikesCount(workoutId: string): Promise<number> {
  try {
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
  } catch (error) {
    console.error("Unexpected error in getLikesCount:", error);
    return 0;
  }
}

/**
 * Check if a user has liked a workout
 * @param userId The ID of the user
 * @param workoutId The ID of the workout
 * @returns True if the user has liked the workout, false otherwise
 */
export async function isLikedByUser(
  userId: string,
  workoutId: string
): Promise<boolean> {
  if (!userId || !workoutId) return false;
  
  try {
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", userId)
      .eq("workout_id", workoutId)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking if liked by user:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("Unexpected error in isLikedByUser:", error);
    return false;
  }
}