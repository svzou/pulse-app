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

// Define profile interface
interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at?: string;
  bio?: string | null;
  fitness_level?: string | null;
}

// Define workout interface with profile
interface WorkoutWithProfile {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  duration_minutes: number;
  visibility: string;
  attachment_url?: string | null;
  profiles?: Profile | Record<string, any>; // Handle both single profile and array/object
  exercise_count?: number;
  author?: Profile;
  [key: string]: any; // Allow for additional properties
}

/**
 * Loads data for the user's workout feed with improved error handling and sorting
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
  cursor: number = 0
): Promise<WorkoutWithProfile[]> => {
  try {
    console.log(`Fetching feed for user ${user.id}, starting at cursor ${cursor}`);
    
    // Query workouts with proper ordering and limit
    const { data, error } = await supabase
      .from("workouts")
      .select(`
        id,
        user_id,
        title,
        description,
        created_at,
        duration_minutes, 
        visibility,
        attachment_url,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false }) // Most recent first
      .range(cursor, cursor + 24);
      
    if (error) {
      console.error("Error fetching feed:", error);
      throw new Error(`Failed to fetch feed: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log("No workouts found in feed");
      return [];
    }
    
    console.log(`Fetched ${data.length} workouts for feed`);
    
    // For each workout, check if there are any exercises
    const workoutsWithExerciseCounts = await Promise.all(
      data.map(async (workout) => {
        try {
          // Count the exercises for this workout
          const { count, error: countError } = await supabase
            .from("workout_exercises")
            .select("*", { count: "exact", head: true })
            .eq("workout_id", workout.id);
            
          if (countError) {
            console.warn(`Error counting exercises for workout ${workout.id}:`, countError);
            return {
              ...workout,
              exercise_count: 0
            };
          }
          
          return {
            ...workout,
            exercise_count: count || 0
          };
        } catch (err) {
          console.error(`Error processing workout ${workout.id}:`, err);
          return workout;
        }
      })
    );
    
    // Double-check that the workouts are actually sorted by created_at (most recent first)
    const sortedWorkouts = workoutsWithExerciseCounts.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Most recent first
    });
    
    // Type assertion to fix the type mismatch
    return sortedWorkouts as WorkoutWithProfile[];
  } catch (err) {
    console.error("Unexpected error in getFeed:", err);
    throw err;
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
): Promise<WorkoutWithProfile[]> => {
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

// Define WorkoutData interface
interface WorkoutData {
  title: string;
  description: string;
  duration_minutes: number;
  visibility: string;
  attachment_url?: string;
}

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
  workoutData: WorkoutData
): Promise<WorkoutWithProfile | null> => {
  if (!user) return null;

  try {
    // Create a timestamp for right now
    const currentTimestamp = new Date().toISOString();
    
    // Prepare the workout data with the user ID and explicit timestamp
    const newWorkout = {
      user_id: user.id,
      title: workoutData.title,
      description: workoutData.description,
      duration_minutes: workoutData.duration_minutes,
      visibility: workoutData.visibility,
      attachment_url: workoutData.attachment_url || "",
      created_at: currentTimestamp, // Explicitly set creation time
    };

    console.log("Creating workout with data:", newWorkout);

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

    console.log("Successfully created workout:", data);
    return data;
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

// Define Exercise interface
interface Exercise {
  id: string;
  name: string;
  category?: string;
  muscle_group?: string;
  equipment?: string;
}

/**
 * Adds exercises to a workout
 * 
 * @param supabase Supabase client instance
 * @param workoutId The ID of the workout to add exercises to
 * @param exercises Array of exercise objects to add
 * @returns Promise<boolean> indicating success or failure
 */
export async function addExercisesToWorkout(
  supabase: SupabaseClient,
  workoutId: string,
  exercises: Exercise[]
): Promise<boolean> {
  try {
    // Create an array of exercise entries with order positions
    const exerciseEntries = exercises.map((exercise, index) => ({
      workout_id: workoutId,
      exercise_id: exercise.id,
      order_position: index + 1, // 1-based indexing for order position
    }));

    // Log the entries being inserted for debugging
    console.log("Inserting workout_exercises:", exerciseEntries);

    // Insert the exercise entries into the workout_exercises table
    const { data, error } = await supabase
      .from("workout_exercises")
      .insert(exerciseEntries);

    if (error) {
      console.error("Database error adding exercises:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error adding exercises to workout:", error);
    // Return detailed error for debugging
    console.error("Error details:", JSON.stringify(error, null, 2));
    return false;
  }
}

/**
 * Upload an attachment for a workout with improved error handling
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
  if (!user || !workoutId || !file) return null;

  try {
    // Create a unique file path with a timestamp to avoid overwrites
    const fileExt = file.name.split(".").pop();
    const timestamp = new Date().getTime();
    const filePath = `${user.id}/${workoutId}_${timestamp}.${fileExt}`;

    console.log("Uploading file:", { filePath, type: file.type });

    // Change "workout-attachments" to "images" to match your bucket name
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error("Error uploading attachment:", uploadError);
      return null;
    }

    console.log("Successfully uploaded file:", uploadData);

    // Get the public URL - use correct bucket name here too
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error("Failed to get public URL for attachment");
      return null;
    }

    // Update the workout with the attachment URL
    const attachmentUrl = publicUrlData.publicUrl;
    console.log("Attachment URL:", attachmentUrl);
    
    const { error: updateError } = await supabase
      .from("workouts")
      .update({ 
        attachment_url: attachmentUrl,
        // 3. Fix the timestamp issue by explicitly updating created_at
        created_at: new Date().toISOString()
      })
      .eq("id", workoutId)
      .eq("user_id", user.id);

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

/**
 * Get exercises for a specific workout
 * 
 * @param supabase Supabase client
 * @param workoutId ID of the workout
 * @returns Array of exercises associated with the workout
 */
export const getWorkoutExercises = async (
  supabase: SupabaseClient,
  workoutId: string
): Promise<Exercise[]> => {
  if (!workoutId) {
    console.error("No workoutId provided to getWorkoutExercises");
    return [];
  }

  try {
    console.log(`Fetching exercises for workout ID: ${workoutId}`);
    
    // First, get the exercise IDs from the workout_exercises join table
    const { data: workoutExercises, error: joinError } = await supabase
      .from("workout_exercises")
      .select(`
        exercise_id,
        order_position
      `)
      .eq("workout_id", workoutId)
      .order("order_position", { ascending: true });

    if (joinError) {
      console.error("Error fetching workout_exercises join data:", joinError);
      return [];
    }

    if (!workoutExercises || workoutExercises.length === 0) {
      console.log(`No exercises found for workout ID: ${workoutId}`);
      return [];
    }

    console.log(`Found ${workoutExercises.length} exercises in join table:`, workoutExercises);
    
    // Extract the exercise IDs
    const exerciseIds = workoutExercises.map(we => we.exercise_id);
    
    // Now fetch the actual exercise details from the exercises table
    const { data: exerciseData, error: exercisesError } = await supabase
      .from("exercises")
      .select(`
        id,
        name,
        category,
        muscle_group,
        equipment
      `)
      .in("id", exerciseIds);

    if (exercisesError) {
      console.error("Error fetching exercise details:", exercisesError);
      return [];
    }

    if (!exerciseData || exerciseData.length === 0) {
      console.log("Exercise IDs were found but no exercise details were returned");
      return [];
    }

    console.log(`Retrieved ${exerciseData.length} exercise details:`, exerciseData);
    
    // Sort the exercises based on the original order_position
    const sortedExercises = exerciseIds.map(id => {
      return exerciseData.find(exercise => exercise.id === id);
    }).filter(Boolean) as Exercise[]; // Remove any nulls/undefined (just in case)
    
    return sortedExercises;
  } catch (err) {
    console.error("Unexpected error in getWorkoutExercises:", err);
    return [];
  }
};