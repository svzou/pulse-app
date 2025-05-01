import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  Clock,
  Calendar,
  Eye,
  Trash2,
  Edit,
  Dumbbell
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Workout, WorkoutAuthor } from "@/utils/supabase/models/workout";
import { formatDistanceToNow } from "date-fns";
import { z } from "zod";
import { updateWorkout, deleteWorkout } from "@/utils/supabase/queries/workout";
import { isLikedByUser, toggleLike, getLikesCount } from "@/queries/like";
import { useQueryClient } from "@tanstack/react-query";

type WorkoutWithAuthor = z.infer<typeof Workout> & {
  author: z.infer<typeof WorkoutAuthor>;
};

type WorkoutDetailProps = {
  workout: WorkoutWithAuthor;
  user: User;
  onClose: () => void;
  open: boolean;
};

export default function WorkoutDetail({ 
  workout, 
  user, 
  onClose, 
  open 
}: WorkoutDetailProps) {
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();
  
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [workoutExercises, setWorkoutExercises] = useState<{
    id: any;
    workout_id: any;
    exercise_id: any;
    order_position: any;
    exercises: {
      id: any;
      name: any;
      category: any;
      muscle_group: any;
      description: any;
      equipment: any;
      image_url: any;
    };
  }[]>([]);
  
  const isOwner = user?.id === workout?.author?.id;
  
  useEffect(() => {
    if (workout && user) {
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

      // Fetch exercises for this workout
      const fetchExercises = async () => {
        try {
          const { data, error } = await supabase
            .from("workout_exercises")
            .select(`
              id,
              workout_id,
              exercise_id,
              order_position,
              exercises (
                id,
                name,
                category,
                muscle_group,
                description,
                equipment,
                image_url
              )
            `)
            .eq("workout_id", workout.id)
            .order("order_position", { ascending: true });
            
          if (error) {
            console.error("Error fetching workout exercises:", error);
            return;
          }
          
          if (data) {
            setWorkoutExercises(
              data.map((item) => ({
                ...item,
                exercises: Array.isArray(item.exercises) ? item.exercises[0] : item.exercises,
              }))
            );
          }
        } catch (err) {
          console.error("Failed to fetch workout exercises:", err);
        }
      };

      checkLiked();
      getLikes();
      fetchExercises();
    }
  }, [workout?.id, user?.id, supabase]);

  const handleLike = async () => {
    if (loading || !user) return;
    
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

  const handleDeleteWorkout = async () => {
    if (!isOwner) return;

    setLoading(true);
    try {
      const success = await deleteWorkout(supabase, user, workout.id);
      if (success) {
        // Close both dialogs
        setDeleteConfirmOpen(false);
        onClose();
        
        // Invalidate feed queries to update the UI
        await queryClient.invalidateQueries({ queryKey: ['feed'] });
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format the created date
  const formattedDate = workout?.created_at 
    ? formatDistanceToNow(new Date(workout.created_at), { addSuffix: true })
    : '';

  // Handle possible null values in author data
  const authorName = workout?.author?.full_name || 'Unknown User';
  const authorEmail = workout?.author?.email || '';
  const authorHandle = authorEmail ? `@${authorEmail.split('@')[0]}` : '@user';
  const avatarUrl = workout?.author?.avatar_url || '';
  const avatarFallback = authorName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={authorName} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg">{workout?.title}</DialogTitle>
                <DialogDescription className="text-sm">
                  {authorName} ({authorHandle})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {workout?.attachment_url && (
              <div className="rounded-md overflow-hidden border">
                {workout.attachment_url.endsWith('.pdf') ? (
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center">
                    <a 
                      href={workout.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View PDF Attachment
                    </a>
                  </div>
                ) : (
                  <img 
                    src={workout.attachment_url} 
                    alt="Workout attachment" 
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                {workout?.description || 'No description'}
              </p>
              
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{workout?.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>
                    {workout?.visibility === 'public' 
                      ? 'Public' 
                      : workout?.visibility === 'friends' 
                        ? 'Friends Only' 
                        : 'Private'}
                  </span>
                </div>
              </div>
            </div>

            {/* Exercises Section */}
            {workoutExercises.length > 0 && (
              <div className="py-3 border-t border-b">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <Dumbbell size={16} />
                  Exercises
                </h3>
                <div className="space-y-2">
                  {workoutExercises.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">
                            {index + 1}. {item.exercises?.name || 'Unknown Exercise'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {item.exercises?.muscle_group} • {item.exercises?.equipment || 'No equipment'}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {item.exercises?.category || 'Exercise'}
                        </Badge>
                      </div>
                      {item.exercises?.description && (
                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                          {item.exercises.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex items-center space-x-4">
                <Button id="handle like"
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLike}
                  disabled={loading || !user}
                  className="flex items-center gap-1"
                >
                  <Heart 
                    className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
                  />
                  <span>{likesCount}</span>
                </Button>
                <Button id="message square"
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <span>0</span>
                </Button>
                <Button id="share"
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Share2 className="w-5 h-5 text-gray-500" />
                </Button>
              </div>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button id="more horiz" variant="ghost" size="sm">
                      <MoreHorizontal className="w-5 h-5 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Workout
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-500 focus:text-red-500"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Workout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Workout</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workout? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button id="dialog" variant="outline">Cancel</Button>
            </DialogClose>
            <Button id="destructive"
              variant="destructive" 
              onClick={handleDeleteWorkout}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Workout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}