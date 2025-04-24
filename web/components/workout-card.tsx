import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { isLikedByUser, toggleLike, getLikesCount } from '@/queries/like';
import { User } from '@supabase/supabase-js';

type WorkoutCardProps = {
  workout: any;
  user: User;
};

export default function WorkoutCard({ workout, user }: WorkoutCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLiked = async () => {
      const isLiked = await isLikedByUser(user.id, workout.id);
      setLiked(isLiked);
    };

    const getLikes = async () => {
      const count = await getLikesCount(workout.id);
      setLikesCount(count);
    };

    checkLiked();
    getLikes();
  }, [workout.id, user.id]);

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await toggleLike(user.id, workout.id);
      const newLiked = !liked;
      setLiked(newLiked);
      setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  };

  const authorName = workout.profiles?.full_name || 'Unknown';
  const authorHandle = workout.profiles?.email ? `@${workout.profiles.email.split('@')[0]}` : '@user';

  return (
    <>
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{workout.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{workout.description || 'No description'}</p>
            <p className="text-sm text-gray-500 mt-2">Duration: {workout.duration_minutes} minutes</p>
            <p className="text-sm text-gray-500">By: {authorName} ({authorHandle})</p>
            <div className="flex items-center mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={loading}
                className="p-0 h-8 hover:bg-transparent"
              >
                <Heart className={`w-5 h-5 mr-1 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
              </Button>
              <span className="text-sm text-gray-500">{likesCount} likes</span>
            </div>
          </div>
          <span className="text-sm text-gray-500">{new Date(workout.created_at).toLocaleDateString()}</span>
        </div>
      </Card>
      <Separator className="bg-gray-200 dark:bg-gray-700" />
    </>
  );
}
