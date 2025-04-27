import { Fragment, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLikedByUser, toggleLike, getLikesCount } from "@/queries/like";
import WorkoutDetail from "@/components/ui/workout-detail";

type WorkoutCardProps = {
  workout: any;
  user: any;
  isLastItem: boolean;
  onLastVisible: () => void;
};

export function WorkoutCard({ workout, user, isLastItem, onLastVisible }: WorkoutCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent opening the detail view
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

  // Open workout detail dialog
  const openDetail = () => {
    setDetailOpen(true);
  };

  // Close workout detail dialog
  const closeDetail = () => {
    setDetailOpen(false);
  };

  // Handle possible null values in author data
  const authorName = workout.author?.full_name || 'Unknown User';
  const authorEmail = workout.author?.email || '';
  const authorHandle = authorEmail ? `@${authorEmail.split('@')[0]}` : '@user';

  return (
    <>
      <Card className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={openDetail}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{workout.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {workout.description 
                ? (workout.description.length > 100 
                    ? workout.description.substring(0, 100) + '...' 
                    : workout.description)
                : 'No description'}
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

        {/* Display thumbnail for attachment if available */}
        {workout.attachment_url && (
          <div className="mt-3 rounded-md overflow-hidden h-32 border">
            {workout.attachment_url.endsWith('.pdf') ? (
              <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-300">PDF Attachment</span>
              </div>
            ) : (
              <img 
                src={workout.attachment_url} 
                alt="Workout attachment" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}
      </Card>
      <Separator className="bg-gray-200 dark:bg-gray-700" />

      {/* Detailed Workout View */}
      <WorkoutDetail 
        workout={workout} 
        user={user} 
        open={detailOpen} 
        onClose={closeDetail} 
      />
    </>
  );
}