import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, PlusCircle, Image as ImageIcon, Edit, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/router";
import Link from "next/link";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createSupabaseServerClient } from '@/utils/supabase/clients/server-props';
import { getProfileData } from '@/utils/supabase/queries/profile';

export default function ProfilePage({ user: initialUser, profile: initialProfile }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [user, setUser] = useState<any>(initialProfile || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(initialUser);
  const [loading, setLoading] = useState(true);

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
        setUser(profile);
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
        setStats(userStats);
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
        setWorkouts(recentWorkouts);
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
        setPhotos(workoutPhotos.map((w) => w.attachment_url));
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
      return profile;
    } catch (error) {
      console.error("Fetch error:", error);
      setLoading(false);
    }   
  };

  useEffect(() => {
    // Check auth status on client-side
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setLoggedInUser(data.session.user);
      }
    };
    
    checkUser();
  }, []);

  useEffect(() => {
    if (router.query.id) {
      fetchProfileData(router.query.id as string);
    }
  }, [router.query.id]);

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
        .eq("following_id", router.query.id);

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
        .eq("follower_id", router.query.id);

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

  const uploadAvatar = async (e: any) => {
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
        .eq("id", router.query.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setUser((prev: any|null) => (prev ? { ...prev, avatar_url: publicUrl } : null));

      // Refreshing profile data
      await fetchProfileData(router.query.id as string);
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
        .eq("id", router.query.id);

      if (updateError) {
        throw updateError;
      }

      await fetchProfileData(router.query.id as string);
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
                  src={user.avatar_url || "/default-avatar.png"}
                  alt={user.id}
                  className="w-full h-full object-cover"
                />
                {loggedInUser?.id === user.id && (
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
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <p className="text-gray-600">@{user.id}</p>
              {user.bio && <p className="mt-2 text-center">{user.bio}</p>}
              {loggedInUser?.id === user.id && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              )}
              
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
                photos.map((photo, index) => {
                  if(photo) return (
                  <img
                    key={index}
                    src={photo}
                    alt={`Workout photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )})
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

export async function getServerSideProps(context) {
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