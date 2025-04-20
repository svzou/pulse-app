// Home page showing feed
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import UserProfile from "@/components/ui/profile-card";
import { createClientComponentClient, SupabaseClient, User } from "@supabase/auth-helpers-nextjs";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { getProfileData } from "@/utils/supabase/queries/profile";

enum HomePageTab {
  FOR_YOU = "ForYou",
  FOLLOWING = "Following",
  LIKED = "Liked",
}

// Define types for the props
interface HomeProps {
  user: any;
  profile: any;
}

export default function Home({ user, profile }: HomeProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(HomePageTab.FOR_YOU);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

   // const fetchDataFn =
  // activeTab === HomePageTab.FOR_YOU
  //   ? getFeed
  //   : activeTab === HomePageTab.FOLLOWING
  //   ? getFollowingFeed
  //   : getLikesFeed;
  // const { data: posts, fetchNextPage } = useInfiniteQuery({
  //   queryKey: ['feed', activeTab, user.id], // Include the active tab in the query key
  //   queryFn: async ({ pageParam = 0 }) => {
  //     // Fetch posts using the appropriate function
  //     return await fetchDataFn(supabase, user, pageParam);
  //   },
  //   getNextPageParam: (lastPage, allPages) => {
  //     // Determine the next page to fetch
  //     // If the last page has fewer than 25 posts, there are no more pages
  //     return lastPage.length < 25 ? undefined : allPages.length * 25;
  //   },
  //   initialPageParam: 0, // Start fetching from the first page
  // });

  // Handle data refresh
  const refresh = async () => {
    setLoading(true);
    queryClient.invalidateQueries();
    
    // Refresh the page to get updated data
    router.replace(router.asPath);
    
    setLoading(false);
  };
    
  return (
    <div className="w-full mx-auto max-w-[600px] h-full">
      {/* Display all three tabs for each feed + the refresh button. */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => setActiveTab(tab)}
        className="w-full mt-16"
      >
        <div className="flex flex-row items-center gap-3 px-2">
          <TabsList className="grid grid-cols-3 w-full h-[48px] bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm">
            <TabsTrigger
              value={HomePageTab.FOR_YOU}
              className="rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              For You
            </TabsTrigger>
            <TabsTrigger
              value={HomePageTab.FOLLOWING}
              className="rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Following
            </TabsTrigger>
            <TabsTrigger
              value={HomePageTab.LIKED}
              className="rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Liked
            </TabsTrigger>
          </TabsList>
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            className="rounded-full w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-t-2 border-b-2 border-gray-600 dark:border-gray-300 rounded-full animate-spin"></div>
            ) : (
              <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </Button>
        </div>
      </Tabs>
      
      {user && profile ? (
        <>
          <UserProfile
            name={profile.full_name || "User"}
            handle={`@${profile.email.split('@')[0]}`}
            avatarUrl="/images/default-avatar.png"
            stats={[
              { label: "Workouts", value: 0 },
              { label: "Followers", value: 0 },
              { label: "Following", value: 0 },
            ]}
          />
          <ScrollArea className="mt-4 h-[70vh] w-full border bg-card text-card-foreground shadow-2xl">
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Your feed will appear here.
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="mt-10 text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Welcome!</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Please sign in to see your feed.</p>
          <Button 
            onClick={() => router.push('/login')}
            className="mt-4 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Create the supabase context that works specifically on the server
  const supabase = createSupabaseServerClient(context);

  // Attempt to load the user data
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // If the user is not logged in, redirect them to the login page
  if (userError || !userData) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Load the profile data
  const profile = await getProfileData(
    supabase,
    userData.user,
    userData.user.id
  );

  // Return the user and profile as props
  return {
    props: {
      user: userData.user,
      profile: profile,
    },
  };
}
