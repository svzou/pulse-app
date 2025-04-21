/**
 * This file contains all of the Zod validation models
 * used to ensure that our Supabase query functions
 * ultimately return data in the correct format.
 *
 * Zod is the industry standard for schema validation.
 * It allows for easy casting of and validation of data.
 *
 * Zod types are defined as objects that contains fields.
 * We can compose Zod types as well as shown below.
 *
 * To access the pure type of any Zod model, we can use:
 * z.infer<typeof Model>
 *
 * In the future, we will use Zod in many more places, so
 * it is good to introduce it here.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { z } from "zod";

// workout author
export const WorkoutAuthor = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string().datetime(),
  bio: z.string(),
  fitness_level: z.string(),
});

/** Defines the schema for individual likes. */
export const WorkoutLikes = z.object({
  user_id: z.string(),
});

/** Defines the schema for posts. */
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

/** Defines thes schema for following data. */
export const Following = z.object({
  following: WorkoutAuthor,
});

/**
 * Helper variables containing empty models so that
 * `npm run dev` runs when on the blank starter code.
 */

export const emptyWorkoutAuthor = WorkoutAuthor.parse({
  id: "",
  email: "",
  full_name: "",
  avatar_url: "",
  created_at: new Date().toISOString(),
  bio: "",
  fitness_level: "",
});

export const emptyWorkoutLikes = WorkoutLikes.parse({
  user_id: "",
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
