/**
 * This file contains all of the Zod validation models
 * used to ensure that our Supabase query functions
 * ultimately return data in the correct format.
 */

import { z } from "zod";

// workout author (from users table)
export const WorkoutAuthor = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string().datetime(),
  bio: z.string().nullable().optional(),
  fitness_level: z.string().nullable().optional(),
});

/** Defines the schema for individual likes. */
export const WorkoutLikes = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  workout_id: z.string(),
  created_at: z.string().optional(),
});

/** Defines the schema for workouts. */
export const Workout = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  created_at: z.string(),
  duration_minutes: z.number(),
  visibility: z.string(),
  attachment_url: z.string(),
});

/** Defines the schema for following data. */
export const Following = z.object({
  id: z.string().optional(),
  follower_id: z.string(),
  following_id: z.string(),
  created_at: z.string().optional(),
});

/**
 * Helper variables containing empty models

 */
export const emptyWorkoutAuthor = WorkoutAuthor.parse({
  id: "",
  email: "",
  full_name: "",
  avatar_url: null,
  created_at: new Date().toISOString(),
  bio: null,
  fitness_level: null,
});

export const emptyWorkoutLikes = WorkoutLikes.parse({
  user_id: "",
  workout_id: "",
});

export const emptyWorkout = Workout.parse({
  id: crypto.randomUUID(),
  user_id: crypto.randomUUID(),
  title: "",
  description: "",
  created_at: new Date().toISOString(),
  duration_minutes: 0,
  visibility: "",
  attachment_url: "",
});



export const emptyFollowing = Following.parse({
  follower_id: "",
  following_id: "",
});

