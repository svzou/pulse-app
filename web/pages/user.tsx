"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, PlusCircle, Image as ImageIcon, Edit, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/router";
import { Session, User as AuthUser } from "@supabase/supabase-js";
import { UserProfile as User } from "@/utils/supabase/queries/profile";
import Link from "next/link";

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
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

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
        .from("profiles")
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
        setPhotos(workoutPhotos.map((w) => w.attachment_url));
      }

      // Get followers count
      const { count: followersCount, error: followersCountError } = await supabase
        .from("following")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (followersCountError) {
        console.error("Followers count error:", followersCountError);
      } else {
        setFollowersCount(followersCount || 0);
      }

      // Get following count
      const { count: followingCount, error: followingCountError } = await supabase
        .from("following")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      if (followingCountError) {
        console.error("Following count error:", followingCountError);
      } else {
        setFollowingCount(followingCount || 0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!initialUser?.id) return;
    
    try {
      // Get followers (people who follow this user)
      const { data, error } = await supabase
        .from("following")
        .select(`
          follower_id,
          profiles:follower_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("following_id", initialUser.id);

      if (error) {
        console.error("Error fetching followers:", error);
        return;
      }

      if (data) {
        setFollowers(data.map(item => item.profiles));
        setShowFollowers(true);
        setShowFollowing(false);
      }
    } catch (error) {
      console.error("Error in fetchFollowers:", error);
    }
  };

  const fetchFollowing = async () => {
    if (!initialUser?.id) return;
    
    try {
      // Get following (people this user follows)
      const { data, error } = await supabase
        .from("following")
        .select(`
          following_id,
          profiles:following_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("follower_id", initialUser.id);

      if (error) {
        console.error("Error fetching following:", error);
        return;
      }

      if (data) {
        setFollowing(data.map(item => item.profiles));
        setShowFollowing(true);
        setShowFollowers(false);
      }
    } catch (error) {
      console.error("Error in fetchFollowing:", error);
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
        .from("profiles")
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
        .from("profiles")
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
          <Button id="loginbutton"
            className="mt-4"
            onClick={() => (window.location.href = "/login")}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Calculate total workout duration if stats is not available
  const totalWorkoutDuration = workouts.length > 0 
    ? workouts.reduce((total: number, workout: any) => total + (workout.duration_minutes || 0), 0)
    : 0;

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
              <Button id="is editing"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              
              {/* Followers/Following Stats */}
              <div className="flex justify-between w-full mt-6">
                <button 
                  onClick={fetchFollowers}
                  className="text-center focus:outline-none"
                >
                  <div className="font-bold">{followersCount}</div>
                  <div className="text-gray-600 text-sm">Followers</div>
                </button>
                <button 
                  onClick={fetchFollowing}
                  className="text-center focus:outline-none"
                >
                  <div className="font-bold">{followingCount}</div>
                  <div className="text-gray-600 text-sm">Following</div>
                </button>
              </div>
            </div>
          </Card>
          
          {/* Followers/Following Modal */}
          {(showFollowers || showFollowing) && (
            <Card className="p-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {showFollowers ? "Followers" : "Following"}
                </h3>
                <button 
                  onClick={() => {
                    setShowFollowers(false);
                    setShowFollowing(false);
                  }}
                  className="text-gray-500 text-sm"
                >
                  Close
                </button>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {(showFollowers ? followers : following).map((profile) => (
                    <Link 
                      href={`/profile/${profile.id}`} 
                      key={profile.id}
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                        <img
                          src={profile.avatar_url || "/default-avatar.png"}
                          alt={profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-gray-600 text-sm">@{profile.id}</p>
                      </div>
                    </Link>
                  ))}
                  {(showFollowers ? followers : following).length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      {showFollowers 
                        ? "No followers yet" 
                        : "Not following anyone yet"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>

        {/* Middle Column - Stats and Workouts */}
        <div className="md:col-span-6">
          {/* Stats Section */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Workout Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Total Workouts</p>
                <p className="text-2xl font-bold">
                  {stats?.total_workouts || workouts.length || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold">
                  {stats?.total_duration_ever || totalWorkoutDuration || 0}min
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Workouts */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Workouts</h2>
              <Button id="pluscircle">
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
                {workouts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No workouts yet. Add your first workout!
                  </div>
                )}
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
              {photos.map((photo, index) => {
                if(photo) return (
                <img
                  key={index}
                  src={photo}
                  alt={`Workout photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                );
                return null;
              })}
              {photos.filter(p => p).length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No workout photos yet
                </div>
              )}
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
            <Card className="relative z-50 w-full max-w-md bg-gray-500 dark:bg-gray-200">
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
                        <Button id="avatar"
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
                    <Button id="isediting"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button id="savechanges" onClick={handleProfileUpdate}>Save Changes</Button>
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