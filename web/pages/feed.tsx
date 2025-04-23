/**
 * Component to display an infinitely scrolling feed of workout posts.
 *
 * @license MIT
 */

import { Fragment, useState, useEffect } from "react";
import { z } from "zod";
import { Workout, WorkoutAuthor } from "@/utils/supabase/models/workout";
import { InfiniteData } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLikedByUser, toggleLike, getLikesCount } from "@/queries/like";

// Create a combined workout type for the feed
type WorkoutWithAuthor = z.infer<typeof Workout> & {
  author: z.infer<typeof WorkoutAuthor>;
};

type FeedProps = {
  user: User;
  workouts: InfiniteData<WorkoutWithAuthor[], number> | undefined;
  fetchNextPage: () => void;
};

export default function Feed({ user, workouts, fetchNextPage }: FeedProps) {
  if (!workouts) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Loading workouts...</p>
      </div>
    );
  }

  const allWorkouts = workouts.pages.flat();
  
  if (allWorkouts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No workouts found.
      </div>
    );
  }

  return (
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
      </div>
    </ScrollArea>
  );
}

type WorkoutCardProps = {
  workout: WorkoutWithAuthor;
  user: User;
  isLastItem: boolean;
  onLastVisible: () => void;
};

function WorkoutCard({ workout, user, isLastItem, onLastVisible }: WorkoutCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if the user has liked this workout
    const checkLiked = async () => {
      const isLiked = await isLikedByUser(user.id, workout.id);
      setLiked(isLiked);
    };

    // Get the total likes count
    const getLikes = async () => {
      const count = await getLikesCount(workout.id);
      setLikesCount(count);
    };

    checkLiked();
    getLikes();

    // Trigger onLastVisible if this is the last item
    if (isLastItem) {
      onLastVisible();
    }
  }, [workout.id, user.id, isLastItem, onLastVisible]);

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await toggleLike(user.id, workout.id);
      const newLiked = !liked;
      setLiked(newLiked);
      setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle possible null values in author data
  const authorName = workout.author?.full_name || 'Unknown User';
  const authorEmail = workout.author?.email || '';
  const authorHandle = authorEmail ? `@${authorEmail.split('@')[0]}` : '@user';

  return (
    <>
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{workout.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {workout.description || 'No description'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Duration: {workout.duration_minutes} minutes
            </p>
            <p className="text-sm text-gray-500">
              By: {authorName} ({authorHandle})
            </p>
            
            <div className="flex items-center mt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLike}
                disabled={loading}
                className="p-0 h-8 hover:bg-transparent"
              >
                <Heart 
                  className={`w-5 h-5 mr-1 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
                />
              </Button>
              <span className="text-sm text-gray-500">{likesCount} likes</span>
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {new Date(workout.created_at).toLocaleDateString()}
          </span>
        </div>
      </Card>
      <Separator className="bg-gray-200 dark:bg-gray-700" />
    </>
  );
}