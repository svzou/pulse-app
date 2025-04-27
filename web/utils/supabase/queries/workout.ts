import { SupabaseClient, User } from "@supabase/supabase-js";
import { Workout, WorkoutAuthor } from "@/utils/supabase/models/workout";
import { z } from "zod";

// Type for a workout with its author
type WorkoutWithAuthor = z.infer<typeof Workout> & {
  author: z.infer<typeof WorkoutAuthor>;
};

/**
 * Get workouts for the main feed
 * @param supabase Supabase client
 * @param user Current user
 * @param pageParam Page parameter for pagination
 * @returns Array of workouts with author information
 */
export const getFeed = async (
  supabase: SupabaseClient,
  user: User | null,
  pageParam: number = 0
): Promise<WorkoutWithAuthor[]> => {
  if (!user) return [];

  try {
    // First get all workouts
    const { data: workoutsData, error: workoutsError } = await supabase
      .from("workouts")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(pageParam, pageParam + 24);

    if (workoutsError) {
      console.error("Error fetching workouts:", workoutsError);
      return [];
    }

    // If no workouts found, return empty array
    if (!workoutsData || workoutsData.length === 0) {
      return [];
    }

    // For each workout, fetch the author
    const workoutsWithAuthors = await Promise.all(
      workoutsData.map(async (workout) => {
        // Get the author for this workout
        const { data: authorData, error: authorError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", workout.user_id)
          .single();

        if (authorError) {
          console.error(
            `Error fetching author for workout ${workout.id}:`,
            authorError
          );
          return {
            ...workout,
            author: {
              id: "",
              email: "",
              full_name: "Unknown User",
              avatar_url: null,
              created_at: new Date().toISOString(),
              bio: null,
              fitness_level: null,
              updated_at: new Date().toISOString(),
            },
          };
        }

        return {
          ...workout,
          author: authorData,
        };
      })
    );

    return workoutsWithAuthors;
  } catch (err) {
    console.error("Unexpected error fetching feed:", err);
    return [];
  }
};

/**
 * Get workouts from users the current user is following
 * @param supabase Supabase client
 * @param user Current user
 * @param pageParam Page parameter for pagination
 * @returns Array of workouts with author information
 */
export const getFollowingFeed = async (
  supabase: SupabaseClient,
  user: User | null,
  pageParam: number = 0
): Promise<WorkoutWithAuthor[]> => {
  if (!user) return [];

  try {
    // First get the list of users the current user is following
    const { data: followingData, error: followingError } = await supabase
      .from("following")
      .select("following_id")
      .eq("follower_id", user.id);

    if (followingError) {
      console.error("Error fetching following list:", followingError);
      return [];
    }

    // If not following anyone, return empty array
    if (!followingData || followingData.length === 0) {
      return [];
    }

    // Get all the user IDs the current user is following
    const followingIds = followingData.map((follow) => follow.following_id);

    // Query workouts from users the current user is following
    const { data: workoutsData, error: workoutsError } = await supabase
      .from("workouts")
      .select("*")
      .in("user_id", followingIds)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(pageParam, pageParam + 24);

    if (workoutsError) {
      console.error("Error fetching following feed:", workoutsError);
      return [];
    }

    if (!workoutsData || workoutsData.length === 0) {
      return [];
    }

    // For each workout, fetch the author
    const workoutsWithAuthors = await Promise.all(
      workoutsData.map(async (workout) => {
        // Get the author for this workout
        const { data: authorData, error: authorError } = await supabase
          .from("users")
          .select("*")
          .eq("id", workout.user_id)
          .single();

        if (authorError) {
          console.error(
            `Error fetching author for workout ${workout.id}:`,
            authorError
          );
          return {
            ...workout,
            author: {
              id: "",
              email: "",
              full_name: "Unknown User",
              avatar_url: null,
              created_at: new Date().toISOString(),
              bio: null,
              fitness_level: null,
              updated_at: new Date().toISOString(),
            },
          };
        }

        return {
          ...workout,
          author: authorData,
        };
      })
    );

    return workoutsWithAuthors;
  } catch (err) {
    console.error("Unexpected error fetching following feed:", err);
    return [];
  }
};

/**
 * Get workouts the current user has liked
 * @param supabase Supabase client
 * @param user Current user
 * @param pageParam Page parameter for pagination
 * @returns Array of workouts with author information
 */
export const getLikesFeed = async (
  supabase: SupabaseClient,
  user: User | null,
  pageParam: number = 0
): Promise<WorkoutWithAuthor[]> => {
  if (!user) return [];

  try {
    // Get the list of workout IDs the user has liked
    const { data: likedWorkoutIds, error: likesError } = await supabase
      .from("likes")
      .select("workout_id")
      .eq("user_id", user.id);

    if (likesError) {
      console.error("Error fetching likes:", likesError);
      return [];
    }

    // If user hasn't liked any workouts, return empty array
    if (!likedWorkoutIds || likedWorkoutIds.length === 0) {
      return [];
    }

    // Extract the workout IDs
    const workoutIds = likedWorkoutIds.map((like) => like.workout_id);

    // Query the liked workouts
    const { data: workoutsData, error: workoutsError } = await supabase
      .from("workouts")
      .select("*")
      .in("id", workoutIds)
      .order("created_at", { ascending: false })
      .range(pageParam, pageParam + 24);

    if (workoutsError) {
      console.error("Error fetching liked workouts:", workoutsError);
      return [];
    }

    if (!workoutsData || workoutsData.length === 0) {
      return [];
    }

    // For each workout, fetch the author
    const workoutsWithAuthors = await Promise.all(
      workoutsData.map(async (workout) => {
        // Get the author for this workout
        const { data: authorData, error: authorError } = await supabase
          .from("users")
          .select("*")
          .eq("id", workout.user_id)
          .single();

        if (authorError) {
          console.error(
            `Error fetching author for workout ${workout.id}:`,
            authorError
          );
          return {
            ...workout,
            author: {
              id: "",
              email: "",
              full_name: "Unknown User",
              avatar_url: null,
              created_at: new Date().toISOString(),
              bio: null,
              fitness_level: null,
              updated_at: new Date().toISOString(),
            },
          };
        }

        return {
          ...workout,
          author: authorData,
        };
      })
    );

    return workoutsWithAuthors;
  } catch (err) {
    console.error("Unexpected error fetching likes feed:", err);
    return [];
  }
};

/**
 * Create a new workout post
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param workoutData Workout data to create
 * @returns The created workout or null if there was an error
 */
export const createWorkout = async (
  supabase: SupabaseClient,
  user: User,
  workoutData: {
    title: string;
    description: string;
    duration_minutes: number;
    visibility: string;
    attachment_url?: string;
  }
): Promise<z.infer<typeof Workout> | null> => {
  if (!user) return null;

  try {
    // Prepare the workout data with the user ID
    const newWorkout = {
      user_id: user.id,
      title: workoutData.title,
      description: workoutData.description,
      duration_minutes: workoutData.duration_minutes,
      visibility: workoutData.visibility,
      attachment_url: workoutData.attachment_url || "",
    };

    // Insert the workout into the database
    const { data, error } = await supabase
      .from("workouts")
      .insert(newWorkout)
      .select()
      .single();

    if (error) {
      console.error("Error creating workout:", error);
      return null;
    }

    return data as z.infer<typeof Workout>;
  } catch (err) {
    console.error("Unexpected error creating workout:", err);
    return null;
  }
};

/**
 * Update an existing workout
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param workoutId ID of the workout to update
 * @param updates Fields to update
 * @returns The updated workout or null if there was an error
 */
export const updateWorkout = async (
  supabase: SupabaseClient,
  user: User,
  workoutId: string,
  updates: Partial<{
    title: string;
    description: string;
    duration_minutes: number;
    visibility: string;
    attachment_url: string;
  }>
): Promise<z.infer<typeof Workout> | null> => {
  if (!user) return null;

  try {
    // First check if the user owns this workout
    const { data: existing, error: fetchError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      console.error("Error fetching workout or unauthorized:", fetchError);
      return null;
    }

    // Update the workout
    const { data, error } = await supabase
      .from("workouts")
      .update(updates)
      .eq("id", workoutId)
      .select()
      .single();

    if (error) {
      console.error("Error updating workout:", error);
      return null;
    }

    return data as z.infer<typeof Workout>;
  } catch (err) {
    console.error("Unexpected error updating workout:", err);
    return null;
  }
};

/**
 * Delete a workout
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param workoutId ID of the workout to delete
 * @returns True if successful, false otherwise
 */
export const deleteWorkout = async (
  supabase: SupabaseClient,
  user: User,
  workoutId: string
): Promise<boolean> => {
  if (!user) return false;

  try {
    // Delete the workout, ensuring it belongs to the current user
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting workout:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error deleting workout:", err);
    return false;
  }
};

/**
 * Upload an attachment for a workout
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param workoutId ID of the workout to attach to
 * @param file File to upload
 * @returns The attachment URL or null if there was an error
 */
export const uploadWorkoutAttachment = async (
  supabase: SupabaseClient,
  user: User,
  workoutId: string,
  file: File
): Promise<string | null> => {
  if (!user) return null;

  try {
    // First check if the user owns this workout
    const { data: workout, error: fetchError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !workout) {
      console.error("Error fetching workout or unauthorized:", fetchError);
      return null;
    }

    // Create a unique file path
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${workoutId}.${fileExt}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from("workout-attachments")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Error uploading attachment:", uploadError);
      return null;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("workout-attachments")
      .getPublicUrl(filePath);

    // Update the workout with the attachment URL
    const attachmentUrl = publicUrlData.publicUrl;
    const { error: updateError } = await supabase
      .from("workouts")
      .update({ attachment_url: attachmentUrl })
      .eq("id", workoutId);

    if (updateError) {
      console.error("Error updating workout with attachment URL:", updateError);
      return null;
    }

    return attachmentUrl;
  } catch (err) {
    console.error("Unexpected error uploading attachment:", err);
    return null;
  }
};
