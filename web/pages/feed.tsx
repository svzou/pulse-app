import { Fragment } from "react";
import { InfiniteData } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkoutCard } from "@/components/ui/workoutcard";
import CreateWorkoutPost from "@/components/ui/create-post";

type FeedProps = {
  user: User;

  workouts: InfiniteData<WorkoutWithAuthor[], number> | undefined;

  fetchNextPage: () => void;
  showCreatePost?: boolean;
};

export default function Feed({ user, workouts, fetchNextPage, showCreatePost = false }: FeedProps) {
  if (!user) {
    return (
      <div className="p-4 texthttps://github.com/comp426-25s/final-project-team-17/pull/19/conflict?name=web%252Futils%252Fsupabase%252Fqueries%252Fworkout.ts&ancestor_oid=cd2cde2159eb15885ac13444ee9a2e7018cc99f1&base_oid=631b52d778efe7955129fb264d92a937418eb939&head_oid=420f270c2d7c2934b4a620a24ba1c87648be07e1-center text-gray-500 dark:text-gray-400">
        Please sign in to view the feed.
      </div>
    );
  }

  if (!workouts) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-t-2 border-b-2 border-gray-600 dark:border-gray-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  const allWorkouts = workouts.pages.flat();
  
  if (allWorkouts.length === 0) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No workouts found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {showCreatePost 
            ? "Be the first to share your workout!" 
            : "Follow more users or check back later for new content."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showCreatePost && (
        <CreateWorkoutPost user={user} />
      )}
      
      <ScrollArea className="h-[70vh] w-full rounded-xl border bg-card text-card-foreground shadow">
        <div className="space-y-4 p-4">
          {allWorkouts.map((workout, index) => (
            <WorkoutCard 
              key={`workout_${workout.id}`} 
              workout={workout}
              user={user}
              isLastItem={index === allWorkouts.length - 5}
              onLastVisible={fetchNextPage}
            />
          ))}
          
          {/* Load more indicator */}
          {workouts.pages[workouts.pages.length - 1].length === 25 && (
            <div className="py-4 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading more...</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}