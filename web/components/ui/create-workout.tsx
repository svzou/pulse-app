import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  createWorkout, 
  uploadWorkoutAttachment,
  addExercisesToWorkout
} from "@/utils/supabase/queries/workout";
import { Image, Plus, X, FileImage, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Exercise selection component
interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_group: string;
}

interface ExerciseSelectorProps {
  selectedExercises: Exercise[];
  onExerciseAdd: (exercise: Exercise) => void;
  onExerciseRemove: (index: number) => void;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ selectedExercises, onExerciseAdd, onExerciseRemove }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Fetch available exercises from database
    const fetchExercises = async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, category, muscle_group");

      if (!error && data) {
        setExercises(data);
      } else if (error) {
        console.error("Error fetching exercises:", error);
        toast.error("Failed to load exercises", {
          description: "Please try refreshing the page",
        });
      }
    };

    fetchExercises();
  }, [supabase]);

  const handleAddExercise = () => {
    if (selectedExercise) {
      const exercise = exercises.find(ex => ex.id === selectedExercise);
      if (exercise) {
        onExerciseAdd(exercise);
        setSelectedExercise("");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedExercise} onValueChange={setSelectedExercise}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an exercise" />
          </SelectTrigger>
          <SelectContent 
            position="popper" 
            className="z-50 max-h-60 overflow-y-auto bg-white"
            align="start"
            sideOffset={8}
          >
            {exercises.map((exercise) => (
              <SelectItem key={exercise.id} value={exercise.id}>
                {exercise.name} ({exercise.muscle_group})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button id="add exercise" type="button" onClick={handleAddExercise} size="sm">
          <Plus size={16} />
        </Button>
      </div>

      {selectedExercises.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Exercises:</h4>
          <div className="grid gap-2">
            {selectedExercises.map((exercise, index) => (
              <div 
                key={`${exercise.id}-${index}`} 
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-md"
              >
                <div>
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {exercise.muscle_group}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onExerciseRemove(index)}
                  className="h-8 w-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function CreateWorkout({ user }: { user: User }) {
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [visibility, setVisibility] = useState("public");
  const [selectedExercises, setSelectedExercises] = useState<{ id: string; name: string; category: string; muscle_group: string }[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [debug, setDebug] = useState({});

  // Handle file selection
interface FileChangeEvent extends React.ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & { files: FileList | null };
}

const handleFileChange = (e: FileChangeEvent): void => {
    const file: File | null = e.target.files?.[0] || null;
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large", {
                description: "Please select an image under 5MB",
            });
            return;
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
            toast.error("Invalid file type", {
                description: "Please select an image file",
            });
            return;
        }

        setImage(file);
        // Create preview URL
        const previewUrl: string = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    }
};

  // Remove selected image
  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Add exercise to selection
interface HandleExerciseAddProps {
    id: string;
    name: string;
    category: string;
    muscle_group: string;
}

const handleExerciseAdd = (exercise: HandleExerciseAddProps): void => {
    // Make sure exercise has all required fields
    if (!exercise || !exercise.id) {
        console.error("Invalid exercise object:", exercise);
        return;
    }
    
    // Check if this exercise is already selected
    const isDuplicate = selectedExercises.some((ex: HandleExerciseAddProps) => ex.id === exercise.id);
    if (isDuplicate) {
        toast.info("Exercise already added", {
            description: "This exercise is already in your workout"
        });
        return;
    }
    
    setSelectedExercises([...selectedExercises, exercise]);
};

  // Remove exercise from selection
const handleExerciseRemove = (index: number): void => {
    const updated: Exercise[] = [...selectedExercises];
    updated.splice(index, 1);
    setSelectedExercises(updated);
};

  // Submit the workout
interface WorkoutData {
    title: string;
    description: string;
    duration_minutes: number;
    visibility: string;
    attachment_url: string;
}

interface ValidExercise {
    id: string;
    name: string;
    category: string;
    muscle_group: string;
}

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!title) {
        toast.error("Title required", {
            description: "Please provide a title for your workout",
        });
        return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);
    
    try {
        // Step 1: Create workout in database
        const workoutData: WorkoutData = {
            title,
            description,
            duration_minutes: duration,
            visibility,
            attachment_url: "",
        };

        console.log("Creating workout with data:", workoutData);
        const workout = await createWorkout(supabase, user, workoutData);
        
        if (!workout) {
            throw new Error("Failed to create workout");
        }
        
        setDebug(prev => ({ ...prev, workout }));
        console.log("Workout created:", workout);
        setUploadProgress(30);
        
        // Step 2: Upload image if provided
        let imageUploaded = true;
        if (image && workout.id) {
            console.log("Uploading image for workout:", workout.id);
            const attachmentUrl = await uploadWorkoutAttachment(
                supabase,
                user,
                workout.id,
                image
            );
            
            if (!attachmentUrl) {
                console.warn("Image upload failed, but workout was created");
                imageUploaded = false;
            } else {
                console.log("Image uploaded successfully:", attachmentUrl);
            }
        }
        
        setUploadProgress(60);
        
        // Step 3: Add selected exercises to workout
        let exercisesAdded = true;
        if (selectedExercises.length > 0 && workout.id) {
            console.log("Adding exercises to workout:", workout.id);
            console.log("Exercises to add:", selectedExercises);
            
            // Make sure each exercise has the required id field
            const validExercises: ValidExercise[] = selectedExercises.filter(
                (ex): ex is ValidExercise => ex && ex.id !== undefined
            );
            if (validExercises.length !== selectedExercises.length) {
                console.warn("Some exercises are missing id field, filtering them out");
            }
            
            if (validExercises.length > 0) {
                const success = await addExercisesToWorkout(
                    supabase,
                    workout.id,
                    validExercises
                );
                
                if (!success) {
                    console.warn("Failed to add exercises to workout");
                    exercisesAdded = false;
                } else {
                    console.log("Exercises added successfully");
                }
            } else {
                console.warn("No valid exercises to add");
                exercisesAdded = false;
            }
        }
        
        setUploadProgress(90);

        // Refresh the feed
        await queryClient.invalidateQueries({ queryKey: ["feed"] });
        
        // Reset form
        setTitle("");
        setDescription("");
        setDuration(30);
        setVisibility("public");
        setSelectedExercises([]);
        removeImage();
        
        setUploadProgress(100);
        
        // Show success message with appropriate warnings if needed
        if (!imageUploaded || !exercisesAdded) {
            toast.success("Workout created with issues", {
                description: `Your workout was created but ${!imageUploaded ? 'the image' : ''}${!imageUploaded && !exercisesAdded ? ' and ' : ''}${!exercisesAdded ? 'the exercises' : ''} couldn't be saved.`,
            });
        } else {
            toast.success("Workout Posted", {
                description: "Your workout has been successfully shared!",
            });
        }
    } catch (error) {
        console.error("Error creating workout:", error);
        toast.error("Failed to create workout", {
            description: "An error occurred while creating your workout.",
        });
    } finally {
        setIsSubmitting(false);
        setTimeout(() => setUploadProgress(0), 1000); // Reset progress after 1 second
    }
};

  return (
    <Card className="p-4 dark:bg-gray-400 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Workout Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your workout"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="999"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent
                position="popper" 
                className="max-h-60 overflow-y-auto bg-white"
                align="start"
                sideOffset={5}
              >
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="exercises">Add Exercises</TabsTrigger>
            <TabsTrigger value="image">Add Image</TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="pt-4">
            <ExerciseSelector
              selectedExercises={selectedExercises}
              onExerciseAdd={handleExerciseAdd}
              onExerciseRemove={handleExerciseRemove}
            />
          </TabsContent>

          <TabsContent value="image" className="pt-4">
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center">
                    <FileImage className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Upload an image of your workout
                    </p>
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition duration-150 ease-in-out cursor-pointer"
                    >
                      Choose File
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-lg mx-auto"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                    onClick={removeImage}
                  >
                    <X size={16} />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Progress bar shown during submission */}
        {isSubmitting && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-sky-700 hover:bg-sky-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadProgress < 100 ? "Posting..." : "Finalizing..."}
            </>
          ) : (
            "Share Workout"
          )}
        </Button>
      </form>
    </Card>
  );
}