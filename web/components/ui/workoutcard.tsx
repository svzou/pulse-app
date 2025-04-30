import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { 
  Heart, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Eye, 
  Dumbbell,
  Calendar, 
  Loader2,
  Router
} from 'lucide-react';
import { getWorkoutExercises } from '@/utils/supabase/queries/workout';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { isLikedByUser, getLikesCount, toggleLike } from '@/queries/like';

// Types
type WorkoutCardProps = {
  workout: any;
  user: User;
  onDelete?: (id: string) => Promise<void>;
};

export default function WorkoutCard({ 
  workout, 
  user, 
  onDelete
}: WorkoutCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [fetchingExercises, setFetchingExercises] = useState(false);
  const [imageError, setImageError] = useState(false);
  const supabase = createClientComponentClient();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  useEffect(() => {
    // Check if user liked this workout and get likes count
    const fetchLikeData = async () => {
      if (user && workout.id) {
        try {
          // Check if the user has liked this workout
          const isLiked = await isLikedByUser(user.id, workout.id);
          setLiked(isLiked);
          
          // Get the likes count
          const count = await getLikesCount(workout.id);
          setLikesCount(count);
        } catch (err) {
          console.error("Error fetching like data:", err);
        }
      }
    };
    
    fetchLikeData();
    
    // Fetch exercises for this workout
    const fetchExercises = async () => {
      setFetchingExercises(true);
      
      try {
        console.log("Fetching exercises for workout:", workout.id);
        // Always fetch exercises directly to ensure we get the most up-to-date data
        const exerciseData = await getWorkoutExercises(supabase, workout.id);
        console.log("Exercise data received:", exerciseData);
        
        if (exerciseData && exerciseData.length > 0) {
          setExercises(exerciseData);
        } else {
          console.log("No exercises found for this workout");
          setExercises([]);
        }
      } catch (err) {
        console.error("Error fetching workout exercises:", err);
        setExercises([]);
      } finally {
        setFetchingExercises(false);
      }
    };
    
    fetchExercises();
  }, [workout.id, user?.id, supabase]);
  
  const handleLike = async () => {
    if (loading || !user || !workout.id) return;
    setLoading(true);
    
    try {
      console.log("Toggling like for workout", workout.id);
      
      // Toggle the like in the database
      const newLikeStatus = await toggleLike(user.id, workout.id);
      console.log("New like status:", newLikeStatus);
      
      // Update local state based on the result
      setLiked(newLikeStatus);
      setLikesCount(prev => newLikeStatus ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Get author information
  const authorName = workout.profiles?.full_name || workout.author?.full_name || 'Unknown';
  const authorHandle = workout.profiles?.email 
    ? `@${workout.profiles.email.split('@')[0]}` 
    : workout.author?.email 
      ? `@${workout.author.email.split('@')[0]}`
      : '@user';
  const authorAvatar = workout.profiles?.avatar_url || workout.author?.avatar_url || null;
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const router = useRouter(); 
  return (
    <>
      <Card className="p-4 overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Author section */}
            <div className="flex items-center mb-3"
              onClick={() => router.push(`/profile/${workout.profiles?.id || workout.author?.id}`)}>
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={authorAvatar || undefined} alt={authorName} />
                <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{authorName}</p>
                <p className="text-xs text-gray-500">{authorHandle}</p>
              </div>
            </div>
            
            {/* Workout title and description */}
            <h3 className="font-semibold text-lg">{workout.title}</h3>
            {workout.description && (
              <p className="text-gray-600 dark:text-gray-400 my-2">{workout.description}</p>
            )}
            
            {/* Workout metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{workout.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={14} />
                <span className="capitalize">{workout.visibility}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(workout.created_at)}</span>
              </div>
              {exercises.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  <Dumbbell className="h-3 w-3 mr-1" />
                  {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {/* Image preview if available - always shown */}
            {workout.attachment_url && (
              <div className="my-3 relative">
                {imageError ? (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-md h-48 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">Unable to load image</p>
                  </div>
                ) : (
                  <img
                    src={workout.attachment_url}
                    alt={`Image for ${workout.title}`}
                    className="rounded-md max-h-64 w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            )}
            
            {/* Actions section */}
            <div className="flex items-center mt-3">
              <Button id="actions"
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={loading}
                className="p-0 h-8 hover:bg-transparent"
              >
                <Heart className={`w-5 h-5 mr-1 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
              </Button>
              <span className="text-sm text-gray-500">{likesCount} likes</span>
              
              {exercises.length > 0 && (
                <Button id="show deets"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="ml-auto"
                >
                  {showDetails ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Expandable exercises section */}
        {showDetails && (
          <div className="mt-4 space-y-4">
            {fetchingExercises ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : exercises.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <Dumbbell size={18} className="mr-2" />
                  <h4 className="font-medium">Exercises</h4>
                </div>
                <div className="grid gap-2">
                  {exercises.map((exercise, index) => (
                    <div 
                      key={`${exercise.id || ''}-${index}`}
                      className="flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-md"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{exercise.name}</span>
                        {exercise.muscle_group && (
                          <span className="text-xs text-gray-500 ml-2">
                            {exercise.muscle_group}
                          </span>
                        )}
                      </div>
                      {exercise.category && (
                        <span className="text-xs text-gray-500">
                          {exercise.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-2">No exercises found for this workout</p>
            )}
          </div>
        )}
      </Card>
      <Separator className="bg-gray-200 dark:bg-gray-700 my-2" />
    </>
  );
}