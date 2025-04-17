import { useQuery } from "@tanstack/react-query";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { getProfileData } from "@/utils/supabase/queries/profile";
import { PostAuthor } from "@/utils/supabase/models/post";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserProfile() {
  const supabase = createSupabaseComponentClient();

  // Fetch user and profile data
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return null;
      const profileData = await getProfileData(supabase, data.user, data.user.id);
      return { user: data.user, profile: PostAuthor.parse(profileData) };
    },
  });

  if (isLoading) {
    return <div className="text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  if (error || !userData) {
    return null; // Don't render if there's an error or no user
  }

  const { profile } = userData;

  return (
    <div className="flex items-center mt-8 gap-2">
      <div className="flex flex-col items-end">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {profile.name || "Unknown"}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          @{profile.handle || "unknown"}
        </p>
        <div className="flex gap-2 mt-1">
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1">
              Workouts
            </span>
            <span className="text-xs text-gray-900 dark:text-gray-100">
              {profile.workouts || 0}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1">
              Followers
            </span>
            <span className="text-xs text-gray-900 dark:text-gray-100">
              {profile.followers?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1">
              Following
            </span>
            <span className="text-xs text-gray-900 dark:text-gray-100">
              {profile.following || 0}
            </span>
          </div>
        </div>
      </div>
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={
            supabase.storage
              .from("avatars")
              .getPublicUrl(profile.avatar_url ?? "").data.publicUrl
          }
        />
        <AvatarFallback>
          {profile.name ? profile.name.slice(0, 2).toUpperCase() : "UN"}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}