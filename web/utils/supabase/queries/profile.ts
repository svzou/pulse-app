/**
 * /queries/profile contains all of the Supabase queries for
 * creating, reading, updating, and deleting data related to user profiles.
 */

import { SupabaseClient, User } from "@supabase/supabase-js";

// Define a type for the user profile based on your database structure
export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  created_at: string;
  bio?: string | null;
  fitness_level?: string | null;
};

/**
 * Loads data for a specific profile (user) given their ID.
 */
export const getProfileData = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (error) {
      console.error(`Failed to fetch profile data: ${error.message}`);
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    console.error("Error in getProfileData:", err);
    return null;
  }
};

/**
 * Retrieves all accounts the user is following.
 */
export const getFollowing = async (
  supabase: SupabaseClient,
  user: User
): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from("following")
      .select(
        `
        following_id,
        profiles!following_id(*)
      `
      )
      .eq("follower_id", user.id);

    if (error) {
      console.error(`Failed to fetch following: ${error.message}`);
      return [];
    }

    // Extract the user profiles from the joined data
    return data.flatMap((item) => item.profiles) as UserProfile[];
  } catch (err) {
    console.error("Error in getFollowing:", err);
    return [];
  }
};

/**
 * Check if the current user is following a specific profile.
 */
export const isFollowing = async (
  supabase: SupabaseClient,
  user: User,
  profileId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("following")
      .select("*")
      .eq("follower_id", user.id)
      .eq("following_id", profileId)
      .maybeSingle();

    if (error) {
      console.error(`Failed to check following status: ${error.message}`);
      return false;
    }

    return !!data; // Return true if data exists (user is following), false otherwise
  } catch (err) {
    console.error("Error in isFollowing:", err);
    return false;
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
    // Check if already following
    const isCurrentlyFollowing = await isFollowing(supabase, user, profileId);

    if (isCurrentlyFollowing) {
      // Unfollow
      const { error: deleteError } = await supabase
        .from("following")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profileId);

      if (deleteError) {
        throw new Error(`Unfollow failed: ${deleteError.message}`);
      }
    } else {
      // Follow
      const { error: insertError } = await supabase.from("following").insert({
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
 * Updates a user's profile information.
 */
export const updateProfile = async (
  supabase: SupabaseClient,
  user: User,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data as UserProfile;
  } catch (err) {
    console.error("Update profile error:", err);
    return null;
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
): Promise<string | null> => {
  try {
    if (!file) {
      // Remove the avatar
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) {
        throw new Error(`Failed to delete avatar: ${error.message}`);
      }

      return null;
    }

    // Upload the new avatar
    const filePath = `${user.id}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Update the user's avatar_url
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: filePath })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`Update URL failed: ${updateError.message}`);
    }

    // Return the path to the avatar
    return filePath;
  } catch (err) {
    console.error("Update avatar error:", err);
    throw err;
  }
};
