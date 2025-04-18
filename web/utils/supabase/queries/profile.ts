/**
 * /queries/profile contains all of the Supabase queries for
 * creating, reading, updating, and deleting data in our
 * database relating to profiles.
 */

import { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";
import { emptyWorkoutAuthor, WorkoutAuthor } from "../models/workout";
import { Workout } from "../models/workout";

/**
 * Loads data for a specific profile (user) given their ID.
 */
export const getProfileData = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string
): Promise<z.infer<typeof WorkoutAuthor>> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", profileId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch profile data: ${error.message}`);
    }

    if (!data) {
      throw new Error("Profile not found");
    }

    return WorkoutAuthor.parse(data);
  } catch (err) {
    console.error("Error in getProfileData:", err);
    return WorkoutAuthor.parse(emptyWorkoutAuthor);
  }
};

/**
 * Retrieves all accounts the user is following.
 */
export const getFollowing = async (
  supabase: SupabaseClient,
  user: User
): Promise<z.infer<typeof WorkoutAuthor>[]> => {
  try {
    const { data, error } = await supabase
      .from("following")
      .select(`
        following_id (
          id, email,
          full_name,
          avatar_url, created_at, 
          bio,
          fitness_level
        )
      `)
      .eq("follower_id", user.id);

    if (error) {
      throw new Error(`Failed to fetch following: ${error.message}`);
    }

    const followingProfiles = data.map((entry) => entry.following_id);
    return WorkoutAuthor.array().parse(followingProfiles);
  } catch (err) {
    console.error("Error in getFollowing:", err);
    return [];
  }
};

/**
 * Loads data for a user's workout feed.
 * This is paginated: loads 25 workouts at a time.
 */
export const getProfilePosts = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string,
  cursor: number = 0
): Promise<z.infer<typeof Workout>[]> => {
  try {
    const { data, error } = await supabase
      .from("workouts")
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          avatar_url
        ),
        likes (
          user_id
        )
      `)
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
      .range(cursor, cursor + 24);

    if (error) {
      throw new Error(`Failed to fetch workouts: ${error.message}`);
    }

    return Workout.array().parse(data);
  } catch (err) {
    console.error("Error in getProfilePosts:", err);
    return [];
  }
};

/**
 * Toggles following/unfollowing a profile.
 */
export const toggleFollowing = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string
): Promise<void> => {
  try {
    const { data: existingFollow, error } = await supabase
      .from("following")
      .select("*")
      .eq("follower_id", user.id)
      .eq("following_id", profileId)
      .maybeSingle();

    if (error) throw error;

    if (existingFollow) {
      const { error: deleteError } = await supabase
        .from("following")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profileId);

      if (deleteError) {
        throw new Error(`Unfollow failed: ${deleteError.message}`);
      }
    } else {
      const { error: insertError } = await supabase
        .from("following")
        .insert({
          follower_id: user.id,
          following_id: profileId,
        });

      if (insertError) {
        throw new Error(`Follow failed: ${insertError.message}`);
      }
    }
  } catch (err) {
    console.error("Toggle following error:", err);
    throw err;
  }
};

/**
 * Updates a user's avatar in Supabase storage.
 * If no file is provided, the avatar is removed.
 */
export const updateProfilePicture = async (
  supabase: SupabaseClient,
  user: User,
  file: File | null
): Promise<void> => {
  if (!file) {
    const { error } = await supabase
      .from("users")
      .update({ avatar_url: null })
      .eq("id", user.id);
    if (error) {
      throw new Error(`Failed to delete avatar: ${error.message}`);
    }
    return;
  }

  const filePath = `${user.id}`;
  const { data: fileData, error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: fileData.path })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(`Update URL failed: ${updateError.message}`);
  }
};