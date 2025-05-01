import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Edit, Users, UserPlus, UserMinus, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/router";
import Link from "next/link";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createSupabaseServerClient } from '@/utils/supabase/clients/server-props';
import { toast } from "sonner";
import { GetServerSidePropsContext } from "next";
import { getProfileData } from '@/utils/supabase/queries/profile';

// Define TypeScript interfaces
interface User {
  id: string;
  email?: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  updated_at?: string;
}

interface Workout {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  created_at: string;
  user_id: string;
  attachment_url?: string;
}

interface Stats {
  user_id: string;
  total_workouts: number;
  total_duration: number;
}

interface ProfilePageProps {
  user: User | null;
  profile: Profile | null;
}

export default function ProfilePage({ user: initialUser, profile: initialProfile }: ProfilePageProps) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [user, setUser] = useState<Profile | null>(initialProfile);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfileData = async (userId: string) => {
    try {
      setLoading(true);
      console.log("Fetching profile data for user:", userId);

      // user profile
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
        setUser(profile as Profile);
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url || "");
      }

      // user stats
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
        setStats(userStats as Stats);
      }

      // recent workouts
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
        setWorkouts(recentWorkouts as Workout[]);
      }

      // workout photos
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
        setPhotos(workoutPhotos.map((w) => w.attachment_url).filter(Boolean) as string[]);
      }

      // followers count
      const { count: followersCount, error: followersCountError } = await supabase
        .from("following")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (followersCountError) {
        console.error("Followers count error:", followersCountError);
      } else {
        setFollowersCount(followersCount || 0);
      }

      // following count
      const { count: followingCount, error: followingCountError } = await supabase
        .from("following")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      if (followingCountError) {
        console.error("Following count error:", followingCountError);
      } else {
        setFollowingCount(followingCount || 0);
      }

      setLoading(false);
      return profile as Profile;
    } catch (error) {
      console.error("Fetch error:", error);
      setLoading(false);
      return null;
    }   
  };

  // Check if logged-in user is following profile user
  const checkFollowStatus = async () => {
    if (!loggedInUser?.id || !router.query.id || loggedInUser?.id === router.query.id) {
      return;
    }

    try {
      console.log("Checking follow status:", {
        followerId: loggedInUser.id,
        followingId: router.query.id
      });
      
      const { data, error } = await supabase
        .from("following")
        .select("*")
        .eq("follower_id", loggedInUser.id)
        .eq("following_id", router.query.id as string)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Follow status check error:", error);
        return;
      }

      console.log("Follow status check result:", data ? "Following" : "Not following");
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  // Handle follow/unfollow action
  const handleFollowAction = async () => {
    if (!loggedInUser?.id || !router.query.id) {
      // Redirect to login if not logged in
      router.push('/login');
      return;
    }
  
    try {
      setFollowLoading(true);
      console.log("Attempting follow action:", { 
        followerId: loggedInUser.id, 
        followingId: router.query.id,
        currentStatus: isFollowing ? "following" : "not following" 
      });
      
      if (isFollowing) {
        // Unfollow user
        console.log("Unfollowing user");
        const { error } = await supabase
          .from("following")
          .delete()
          .eq("follower_id", loggedInUser.id)
          .eq("following_id", router.query.id as string);
  
        if (error) {
          console.error("Unfollow error details:", error);
          throw error;
        }
  
        console.log("Successfully unfollowed");
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        
        toast.success("Unfollowed user", {
          description: "You'll no longer see their workouts in your feed",
          duration: 3000,
        });
      } else {
        // Follow user
        console.log("Following user");
        
        // Check if entry already exists
        const { data: existingFollow, error: checkError } = await supabase
          .from("following")
          .select("*")
          .eq("follower_id", loggedInUser.id)
          .eq("following_id", router.query.id as string)
          .maybeSingle();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error("Check follow status error:", checkError);
        }
        
        // Only insert if not already following
        if (!existingFollow) {
          // Make sure we're using the ID as a string, not an array
          const followerId = typeof loggedInUser.id === 'string' ? loggedInUser.id : String(loggedInUser.id);
          const followingId = typeof router.query.id === 'string' ? router.query.id : String(router.query.id);
          
          const { error } = await supabase
            .from("following")
            .insert({
              follower_id: followerId,
              following_id: followingId
            });
  
          if (error) {
            console.error("Follow error details:", error);
            throw error;
          }
          
          console.log("Successfully followed");
        } else {
          console.log("Already following, no need to insert");
        }
  
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        
        toast.success("Following user", {
          description: "You'll now see their workouts in your feed",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Follow action error:", error);
      setError("Failed to update follow status");
      
      // Log detailed error information for debugging
      if (error.details) console.error("Error details:", error.details);
      if (error.hint) console.error("Error hint:", error.hint);
      if (error.code) console.error("Error code:", error.code);
      
      toast.error("Failed to update follow status", {
        description: "Please try again later",
        duration: 5000,
      });
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    // Check auth status on client-side
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setLoggedInUser(data.session.user as User);
      }
    };
    
    checkUser();
  }, []);

  useEffect(() => {
    if (router.query.id) {
      fetchProfileData(router.query.id as string);
    }
  }, [router.query.id]);

  useEffect(() => {
    if (loggedInUser?.id && router.query.id) {
      checkFollowStatus();
    }
  }, [loggedInUser, router.query.id]);

  const fetchFollowers = async () => {
    if (!router.query?.id) return;
    
    try {
      // followers  
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
        .eq("following_id", router.query.id as string);

      if (error) {
        console.error("Error fetching followers:", error);
        return;
      }

      if (data) {
        setFollowers(data.map(item => item.profiles as Profile));
        setShowFollowers(true);
        setShowFollowing(false);
      }
    } catch (error) {
      console.error("Error in fetchFollowers:", error);
    }
  };

  const fetchFollowing = async () => {
    if (!router.query?.id) return;
    
    try {
      // following 
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
        .eq("follower_id", router.query.id as string);

      if (error) {
        console.error("Error fetching following:", error);
        return;
      }

      if (data) {
        setFollowers(data.map(item => item.profiles as Profile));
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
      const fileName = `${router.query.id}/${fileExt}`;
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

      // Updating user profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", router.query.id as string);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setUser((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));

      // Show success toast
      toast.success("Profile picture updated");

      // Refreshing profile data
      await fetchProfileData(router.query.id as string);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setError(error.message || "Failed to upload avatar");
      toast.error("Failed to upload avatar", {
        description: error.message || "Please try again later",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setError(null);

      if (!router.query?.id) {
        throw new Error("No user found");
      }

      const updates = {
        bio: bio.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", router.query.id as string);

      if (updateError) {
        throw updateError;
      }

      toast.success("Profile updated successfully");
      await fetchProfileData(router.query.id as string);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Profile update error:", error);
      setError(error.message || "Failed to update profile");
      toast.error("Failed to update profile", {
        description: error.message || "Please try again later",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push('/')}>
            Return Home
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
                  src={user?.avatar_url || "/default-avatar.png"}
                  alt={user?.id}
                  className="w-full h-full object-cover"
                />
                {loggedInUser?.id === user?.id && (
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
                )}
              </div>
              <h1 className="text-2xl font-bold">{user?.full_name}</h1>
              <p className="text-gray-600">@{user?.id}</p>
              {user?.bio && <p className="mt-2 text-center">{user.bio}</p>}
              
              <div className="mt-4 flex gap-2 w-full">
                {loggedInUser?.id === user?.id ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : loggedInUser ? (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className={isFollowing 
                      ? "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium shadow-sm transition-colors" 
                      : "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"}
                    onClick={handleFollowAction}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2 text-red-500" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
              
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
                  {workouts.length}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold">
                  {workouts.length > 0 ? workouts.map((x) => x.duration_minutes).reduce((acc, a) => acc+a, 0) : 0}min
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Workouts</h2>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {workouts.length > 0 ? (
                  workouts.map((workout) => (
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
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No workouts yet</p>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Workout Photos
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {photos.length > 0 ? (
                photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Workout photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))
              ) : (
                <p className="col-span-2 text-center text-gray-500 py-4">No workout photos yet</p>
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error("Auth error in getServerSideProps:", userError);
  }

  // Even if there's no logged-in user, we still want to fetch the profile for the requested ID
  const userId = context.params?.id;
  
  if (!userId) {
    return {
      notFound: true,
    };
  }

  try {
    // Get the profile of the requested user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error("Profile fetch error in getServerSideProps:", profileError);
      return {
        notFound: true,
      };
    }

    return {
      props: {
        user: userData?.user || null,
        profile: profile || null,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      notFound: true,
    };
  }
}