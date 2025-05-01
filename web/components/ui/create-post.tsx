import { useState } from "react";
import { useRouter } from "next/router";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';

/**
 * Component for creating new workout posts
 */
interface User {
  id: string;
  [key: string]: any;
}

export default function CreatePost({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();
  
  // State for form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [visibility, setVisibility] = useState("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Handle form submission
  interface WorkoutPost {
    user_id: string;
    title: string;
    description: string;
    duration_minutes: number;
    visibility: string;
    attachment_url: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be signed in to create a workout post");
      return;
    }
    
    if (!title) {
      setError("Title is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Insert new workout into the database
      const { data, error: insertError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          title,
          description,
          duration_minutes: durationMinutes,
          visibility,
          attachment_url: "",
        })
        .select()
        .single();
        
      if (insertError) {
        throw new Error(insertError.message);
      }
      
      // Clear form and show success
      setTitle("");
      setDescription("");
      setDurationMinutes(30);
      setShowForm(false);
      
      // Invalidate and refetch feed queries to show the new post
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      
    } catch (err) {
      console.error("Error creating workout:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Toggle form visibility
  const toggleForm = () => {
    setShowForm(!showForm);
    if (error) setError(null);
  };
  
  return (
    <div className="my-4">
      {!showForm ? (
        <Button id="toggle form"
          onClick={toggleForm}
          className="w-full flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black"
        >
          <Plus size={16} />
          Create New Workout Post
        </Button>
      ) : (
        <Card className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Workout Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Morning Run"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share details about your workout"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  min={1}
                  max={999}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={visibility}
                  onValueChange={setVisibility}
                >
                  <SelectTrigger id="visibility">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              
              <div className="flex gap-2">
                <Button id="submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black text-white dark:bg-white dark:text-black"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Post Workout"
                  )}
                </Button>
                
                <Button id="toggle"
                  type="button"
                  variant="outline"
                  onClick={toggleForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}