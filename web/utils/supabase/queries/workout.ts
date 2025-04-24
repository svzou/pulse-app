/**
 * /queries/Workouts contains all of the Supabase queries for
 * creating, reading, updating, and deleting data in our
 * database relating to Workouts.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { SupabaseClient, User } from "@supabase/supabase-js";
import { emptyWorkout, Workout } from "../models/workout";
import { z } from "zod";

/**
 * TODO: Loads data for a specific Workout given its ID.
 *
 * The data returned should match the format of the
 * `Workout` Zod model. Make sure to select the correct
 * columns and perform any joins that are necessary.
 * Refer to the Supabase documentation for details.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view any Workout you added in your
 *       database at the route:
 *       /Workout/:id
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param WorkoutId: Workout data to retrieve.
 * @returns: Workout object.
 */
export const getWorkout = async (
  supabase: SupabaseClient,
  user: User,
  WorkoutId: string
): Promise<z.infer<typeof Workout>> => {
  try {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        id,
        user_id,
        title,
        description,
        created_at,
        duration_minutes,
        visibility,
        attachment_url
        `
      )
      .eq("id", WorkoutId)
      .single();
    if (error) {
      throw new Error(`Failed to fetch Workout: ${error.message}`);
    }
    if (!data) {
      throw new Error("Workout not found");
    }
    const WorkoutData = {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      description: data.description,
      created_at: data.created_at,
      duration_minutes: data.duration_minutes,
      visibility: data.visibility,
      attachment_url: data.attachment_url,
    };
    return Workout.parse(WorkoutData);
  } catch (err) {
    console.error("Error in getWorkout:", err);
    return Workout.parse(emptyWorkout);
  }
};

/**
 * TODO: Loads data for the user's Workout feed.
 *
 * This function should the most recent Workouts in the
 * `Workout` database in reverse chronological order
 * (so that the *most recent Workouts* appear first).
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the Workout to load. Each page should be a length
 * of 25 Workouts long. For example, if the database
 * contains 100 Workouts and the cursor is set to 10, Workouts
 * 10 through 35 should be loaded.
 *
 * The data returned should match the format of an array of
 * `Workout` Zod models. Make sure to select the correct
 * columns and perform any joins that are necessary.
 * Refer to the Supabase documentation for details.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view recent Workouts at the route:
 *       /
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Workout object.
 */
export const getFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number
): Promise<z.infer<typeof Workout>[]> => {
  // ... your implementation here ...
  try {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        author:author_id (id, name, handle, avatar_url),
        likes:like (profile_id)
      `
      )
      .order("created_at", { ascending: false })
      .range(cursor, cursor + 24);
    if (error) {
      throw new Error(`Failed to fetch feed Workouts: ${error.message}`);
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log("Fetched data:", data);
    try {
      const Workouts = Workout.array().parse(data);
      return Workouts;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Failed to toggle like: ${err.message}`);
      } else {
        throw new Error(`Failed to toggle like: Unknown error`);
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to toggle like: ${err.message}`);
    } else {
      throw new Error(`Failed to toggle like: Unknown error`);
    }
  }
};

/**
 * TODO: Loads data for the user's 'following' Workout feed.
 *
 * This function should the most recent Workouts in the
 * `Workout` database in reverse chronological order
 * (so that the *most recent Workouts* appear first) made by
 * accounts that the user follows.
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the Workout to load. Each page should be a length
 * of 25 Workouts long. For example, if the database
 * contains 100 Workouts and the cursor is set to 10, Workouts
 * 10 through 35 should be loaded.
 *
 * The data returned should match the format of an array of
 * `Workout` Zod models. Make sure to select the correct
 * columns and perform any joins that are necessary.
 * Refer to the Supabase documentation for details.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view your recents feed at the route:
 *       /
 *       (Navigate to the following tab)
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Workout object.
 */
export const getFollowingFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number = 0
): Promise<z.infer<typeof Workout>[]> => {
  // ... your implementation here ...
  const { data: following, error: followError } = await supabase
    .from("following")
    .select("following_id")
    .eq("follower_id", user.id);
  if (followError)
    throw new Error(`Failed to fetch following: ${followError.message}`);
  if (!following || following.length === 0) return [];
  const followingIds = following.map((f) => f.following_id);
  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
        id,
        created_at,
        content,
        attachment_url,
        author:profile!Workout_author_id_fkey (
          id,
          name,
          handle,
          avatar_url
        ),
        likes:like (profile_id)
      `
    )
    .in("author_id", followingIds)
    .order("created_at", { ascending: false })
    .range(cursor, cursor + 24);
  if (error)
    throw new Error(`Failed to fetch following feed: ${error.message}`);
  if (!data || data.length === 0) return [];
  console.log("Raw following feed data:", data);
  return Workout.array().parse(data);
};

/**
 * TODO: Loads data for the user's 'likes' Workout feed.
 *
 * This function should the most recent Workouts in the
 * `Workout` database in reverse chronological order
 * (so that the *most recent Workouts* appear first) that
 * the user has liked.
 *
 * HINT: To do this effectively, you may need to write
 * two separate .select() calls - one to fetch all of the
 * Workout IDs that the user has liked from the `like` table,
 * then again on the Workout table.
 *
 * This method takes is *paginated* - meaning that it
 * should only load a range of data at a time, but not
 * all of the data at once. The method passes in a
 * `cursor` parameter which should determine the starting
 * index for the Workout to load. Each page should be a length
 * of 25 Workouts long. For example, if the database
 * contains 100 Workouts and the cursor is set to 10, Workouts
 * 10 through 35 should be loaded.
 *
 * The data returned should match the format of an array of
 * `Workout` Zod models. Make sure to select the correct
 * columns and perform any joins that are necessary.
 * Refer to the Supabase documentation for details.
 *
 * You can perform casting and validation of any generic
 * data to a Zod model using: ModelName.parse(data)
 *
 *
 * Ensure to throw errors if present.
 *
 * @note Once you implement this method, you should
 *       be able to view your likes feed at the route:
 *       /
 *       (Navigate to the likes tab)
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param cursor: Starting index of the page.
 * @returns: Workout object.
 */
export const getLikesFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number
): Promise<z.infer<typeof Workout>[]> => {
  // ... your implementation here ...
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
      .range(cursor, cursor + 24);

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
    console.error("Unexpected error fetching likes feed:", err);
    return [];
  }
};

/**
 * TODO: Toggles whether or not a user has liked a
 * Workout with a given ID.
 *
 * If the user has already liked the Workout, remove the like
 * by deleting an entry from the `like` table.
 *
 * If the user has not already liked the Workout, add a like
 * by creating an entry on the `like` table.
 *
 * Ensure to throw errors if present.
 *
 * This method should succeed silently (return nothing).
 *
 * @note Once you implement this method, you should
 *       be able to toggle likes on a Workout. To test this,
 *       press the "like" button on any Workout and refresh.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param WorkoutId: ID of the Workout to work with.
 */
export const toggleLike = async (
  supabase: SupabaseClient,
  user: User,
  WorkoutId: string
): Promise<void> => {
  // ... your implementation here ...
  try {
    const { data: likeExists, error: toggleError } = await supabase
      .from("likes")
      .select("workout_id, profile_id")
      .eq("workout_id", WorkoutId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (toggleError) {
      throw toggleError;
    }
    if (likeExists) {
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("workout_id", WorkoutId)
        .eq("profile_id", user.id);
      if (deleteError) {
        throw new Error(`Error removing like: ${deleteError.message}`);
      }
    } else {
      const { error: insertError } = await supabase.from("like").insert({
        profile_id: user.id,
        Workout_id: WorkoutId,
      });
      if (insertError) {
        throw new Error(`Error adding like: ${insertError.message}`);
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to toggle like: ${err.message}`);
    } else {
      throw new Error(`Failed to toggle like: Unknown error`);
    }
  }
};

/**
 * TODO: Creates a Workout in the database.
 *
 * This particular function is best performed in three parts:
 *
 * 1. Create a new Workout in the database and retrieve the Workout
 *    that was created. This is because we need to access the
 *    ID of the Workout added so that we can refer to it next.
 *
 * 2. If a file has been provided, we want to add this file
 *    as an image in the `images` bucket in Supabase storage.
 *    The name of the file should be the *ID of the Workout!*
 *    Do NOT include any extensions (like .png or .jpg) because
 *    it will make finding this image later more difficult.
 *
 * 3. When the file upload succeeds, we then want to *update* the
 *    Workout we just made to change its `attachment_url` to the path
 *    of the file we just uploaded. This should be accessible from
 *    the data returned from the storage.upload() call using
 *    `fileData.path`. You can skip this step if the user did not
 *    upload any photo / file.
 *
 * Ensure to throw errors if present.
 *
 * This method should succeed silently (return nothing).
 *
 * @note Once you implement this method, you should
 *       be able to create Workouts on the home page, and the feed
 *       should update to show the new Workout.
 *
 * @param supabase: Supabase client to use.
 * @param user: Active user making the request.
 * @param content: The content of the Workout to make.
 * @param file: The image attachment, if any, with the Workout.
 */
export const createWorkout = async (
  supabase: SupabaseClient,
  user: User,
  content: string,
  file: File | null
): Promise<void> => {
  // ... your implementation here ...
  const { data: Workout, error: WorkoutError } = await supabase
    .from("Workout")
    .insert({ author_id: user.id, content, attachment_url: null })
    .select("*")
    .single();
  if (WorkoutError) {
    throw new Error(`Failed to create Workout: ${WorkoutError.message}`);
  }
  if (!Workout) {
    throw new Error("Workout creation failed: No data returned");
  }
  if (file) {
    const filePath = `${Workout.id}`;
    const { data: fileData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    const { error: updateError } = await supabase
      .from("Workout")
      .update({ attachment_url: fileData.path })
      .eq("id", Workout.id);
    if (updateError) {
      throw new Error(`Failed to update Workout: ${updateError.message}`);
    }
  }
};
