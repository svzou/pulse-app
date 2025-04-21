"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// import { User, Workout, UserStats } from '@/types/database'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, PlusCircle, Image as ImageIcon, Edit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/router";
import { Session, User as AuthUser } from "@supabase/supabase-js";
import { UserProfile as User } from "@/utils/supabase/queries/profile";

import { type GetServerSidePropsContext } from "next";
import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
function createClient({ req, res }: GetServerSidePropsContext) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({
            name,
            value: req.cookies[name] || "",
          }));
        },
        setAll(cookiesToSet) {
          res.setHeader(
            "Set-Cookie",
            cookiesToSet.map(({ name, value, options }) =>
              serializeCookieHeader(name, value, options)
            )
          );
        },
      },
    }
  );
  return supabase;
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createClient(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: `/login?returnUrl=${encodeURIComponent("/profile")}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};

interface ProfilePageProps {
  initialSession: Session;
  user: AuthUser;
}

export default function ProfilePage({
  initialSession,
  user: initialUser,
}: ProfilePageProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<any>([]);
  const [stats, setStats] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUser) {
      fetchProfileData(initialUser.id);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (event === "SIGNED_IN" && session) {
        fetchProfileData(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser]);

  const fetchProfileData = async (userId: string) => {
    try {
      console.log("Fetching profile data for user:", userId);

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        return;
      }

      if (profile) {
        console.log("Profile loaded:", profile);
        setUser(profile);
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url || "");
      }

      // Get user stats
      const { data: userStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (statsError) {
        console.error("Stats error:", statsError);
      }

      if (userStats) {
        console.log("Stats loaded:", userStats);
        setStats(userStats);
      }

      // Get recent workouts
      const { data: recentWorkouts, error: workoutsError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (workoutsError) {
        console.error("Workouts error:", workoutsError);
      }

      if (recentWorkouts) {
        console.log("Workouts loaded:", recentWorkouts);
        setWorkouts(recentWorkouts);
      }

      // Get workout photos
      const { data: workoutPhotos, error: photosError } = await supabase
        .from("workouts")
        .select("attachment_url")
        .eq("user_id", userId)
        .not("attachment_url", "is", null);

      if (photosError) {
        console.error("Photos error:", photosError);
      }

      if (workoutPhotos) {
        console.log("Photos loaded:", workoutPhotos);
        setPhotos(workoutPhotos.map((w) => w.attachment_url!));
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploadingAvatar(true);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("Please select an image file");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${(initialUser as AuthUser).id}/${fileExt}`;
      const filePath = fileName;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialUser.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setUser((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));

      // Refresh profile data
      await fetchProfileData(initialUser.id);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setError(error.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setError(null);

      if (!initialUser?.id) {
        throw new Error("No user found");
      }

      const updates = {
        bio: bio.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", initialUser.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh profile data
      await fetchProfileData(initialUser.id);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      setError(error.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Please log in to view your profile</p>
          <Button
            className="mt-4"
            onClick={() => (window.location.href = "/login")}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-3">
          <Card className="p-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 relative group cursor-pointer">
                <img
                  src={user.avatar_url || "/default-avatar.png"}
                  alt={user.id}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="w-full h-full flex items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={uploadAvatar}
                      className="hidden"
                    />
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Edit className="h-6 w-6 text-white" />
                    )}
                  </label>
                </div>
              </div>
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <p className="text-gray-600">@{user.id}</p>
              {user.bio && <p className="mt-2 text-center">{user.bio}</p>}
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>

        {/* Middle Column - Stats and Workouts */}
        <div className="md:col-span-6">
          {/* Stats Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Workout Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600">Total Workouts</p>
                <p className="text-2xl font-bold">
                  {stats?.total_workouts || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Weight</p>
                <p className="text-2xl font-bold">
                  {stats?.total_weight_ever || 0}kg
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Reps</p>
                <p className="text-2xl font-bold">
                  {stats?.total_reps_ever || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold">
                  {stats?.total_duration_ever || 0}min
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Workouts */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Workouts</h2>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Workout
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {workouts.map((workout: any) => (
                  <Card key={workout.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{workout.title}</h3>
                        <p className="text-gray-600">{workout.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Duration: {workout.duration_minutes} minutes
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(workout.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Right Column - Photo Gallery */}
        <div className="md:col-span-3">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Workout Photos
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Workout photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black opacity-70"
            onClick={() => setIsEditing(false)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <Card className="relative z-50 w-full max-w-md bg-background">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
                {error && (
                  <div className="mb-4 p-3 rounded bg-red-100 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={avatarUrl || "/default-avatar.png"}
                          alt={"Profile"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full relative overflow-hidden"
                          disabled={uploadingAvatar}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={uploadAvatar}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingAvatar}
                          />
                          {uploadingAvatar ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                              Uploading...
                            </div>
                          ) : (
                            "Change Picture"
                          )}
                        </Button>
                        {error && (
                          <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleProfileUpdate}>Save Changes</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}