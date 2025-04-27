/**
 * /queries/workouts.ts - Supabase queries for workouts
 * Contains all database operations related to workouts
 */

import { SupabaseClient, User } from "@supabase/auth-helpers-nextjs";
import { emptyWorkout, Workout } from "../models/workout";
import { z } from "zod";

/**
 * Loads data for a specific workout by ID
 * 
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param workoutId Workout ID to retrieve
 * @returns Workout object
 */
export const getWorkout = async (
  supabase: SupabaseClient,
  user: User,
  workoutId: string
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
      .eq("id", workoutId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch workout: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Workout not found");
    }
    
    const workoutData = {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      description: data.description,
      created_at: data.created_at,
      duration_minutes: data.duration_minutes,
      visibility: data.visibility,
      attachment_url: data.attachment_url,
    };
    
    return Workout.parse(workoutData);
  } catch (err) {
    console.error("Error in getWorkout:", err);
    return Workout.parse(emptyWorkout);
  }
};

/**
 * Loads data for the user's workout feed
 * Returns recent workouts in reverse chronological order
 * 
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param cursor Starting index for pagination (loads 25 workouts)
 * @returns Array of workout objects
 */
export const getFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number
): Promise<z.infer<typeof Workout>[]> => {
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
      throw new Error(`Failed to fetch feed workouts: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    console.log("Fetched data:", data);
    
    try {
      const workouts = Workout.array().parse(data);
      return workouts;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Failed to parse workouts: ${err.message}`);
      } else {
        throw new Error(`Failed to parse workouts: Unknown error`);
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to fetch feed: ${err.message}`);
    } else {
      throw new Error(`Failed to fetch feed: Unknown error`);
    }
  }
};

/**
 * Loads workout data from users that the current user follows
 * 
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param cursor Starting index for pagination (loads 25 workouts)
 * @returns Array of workout objects
 */
export const getFollowingFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number = 0
): Promise<z.infer<typeof Workout>[]> => {
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
 * Loads workouts the user has liked
 * 
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param cursor Starting index for pagination (loads 25 workouts)
 * @returns Array of workout objects
 */
export const getLikesFeed = async (
  supabase: SupabaseClient,
  user: User,
  cursor: number
): Promise<z.infer<typeof Workout>[]> => {
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
 * Toggles a like on a workout
 * 
 * @param supabase Supabase client
 * @param user Current authenticated user
 * @param workoutId ID of workout to like/unlike
 */
export const toggleLike = async (
  supabase: SupabaseClient,
  user: User,
  workoutId: string
): Promise<void> => {
  try {
    const { data: likeExists, error: toggleError } = await supabase
      .from("likes")
      .select("workout_id, profile_id")
      .eq("workout_id", workoutId)
      .eq("profile_id", user.id)
      .maybeSingle();
      
    if (toggleError) {
      throw toggleError;
    }
    
    if (likeExists) {
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("workout_id", workoutId)
        .eq("profile_id", user.id);
        
      if (deleteError) {
        throw new Error(`Error removing like: ${deleteError.message}`);
      }
    } else {
      const { error: insertError } = await supabase
        .from("like")
        .insert({
          profile_id: user.id,
          Workout_id: workoutId,
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
 * Create a new workout post
 * 
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
 * 
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
 * 
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
 * 
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