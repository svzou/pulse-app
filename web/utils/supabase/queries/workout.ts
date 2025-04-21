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
