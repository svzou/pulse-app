import { useState, useEffect } from "react";
import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { User } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import CreateWorkoutPost from "@/components/ui/create-workout";
import WorkoutCard from "@/components/ui/workoutcard";
import { getFeed } from "@/utils/supabase/queries/workout";
import { Workout } from "@/utils/supabase/models/workout";

// --- Types ---
type WorkoutType = z.infer<typeof Workout>;

type FeedProps = {
  user: User;
  workouts: InfiniteData<WorkoutType[]> | undefined;
  fetchNextPage: () => void;
  showCreatePost?: boolean;
  isLoading?: boolean;
  additionalWorkouts?: any[];
};

// --- Main Feed Component ---
export default function Feed({ 
  user, 
  workouts, 
  fetchNextPage, 
  showCreatePost = false,
  isLoading = false
}: FeedProps) {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClientComponentClient();

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Please sign in to view the feed.
      </div>
    );
  }

  if (isLoading || !workouts) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-gray-500">Loading workouts...</p>
        </div>
      </div>
    );
  }

  const allWorkouts = workouts.pages.flat();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Invalidate and refetch the feed query
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      
      // Manually fetch the latest data to ensure we get new posts
      const latestWorkouts = await getFeed(supabase, user, 0);
      
      // Update the cache with the fresh data
      queryClient.setQueryData(["feed"], (oldData: any) => {
        if (!oldData) return { pages: [latestWorkouts], pageParams: [0] };
        
        // Replace just the first page with new data
        return {
          ...oldData,
          pages: [latestWorkouts, ...oldData.pages.slice(1)]
        };
      });
      
      console.log("Feed refreshed with latest data:", latestWorkouts);
    } catch (err) {
      console.error("Error refreshing feed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (allWorkouts.length === 0) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No workouts found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {showCreatePost
            ? "Be the first to share your workout!"
            : "Follow more users or check back later for new content."}
        </p>
        
        {showCreatePost && (
          <div className="mt-6">
            <CreateWorkoutPost user={user} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Workouts</h2>
      </div>
      
      {showCreatePost && (
        <div className="mb-6">
          <CreateWorkoutPost user={user} />
        </div>
      )}

      <ScrollArea className="h-[70vh] w-full rounded-md border">
        <div className="space-y-4 p-4">
          {allWorkouts.map((workout, index) => (
            <div 
              key={`workout_${workout.id}`}
              ref={index === allWorkouts.length - 5 ? () => fetchNextPage() : undefined}
            >
              <WorkoutCard
                workout={workout}
                user={user}
              />
            </div>
          ))}

          {/* Loading more indicator */}
          {workouts.pages[workouts.pages.length - 1].length === 25 && (
            <div className="py-4 text-center">
              <Loader2 className="inline-block h-6 w-6 animate-spin text-primary" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading more...</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}