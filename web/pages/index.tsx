// Home page showing feed

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { getProfileData } from "@/utils/supabase/queries/profile";
import { User } from "@supabase/supabase-js";
import { RotateCcw } from "lucide-react";
import Feed from "@/pages/feed";
import { useRouter } from "next/router";
import UserProfile from "@/components/ui/profile-card";
import { 
  getFeed, 
  getFollowingFeed, 
  getLikesFeed
} from "@/utils/supabase/queries/workout";

enum HomePageTab {
  FOR_YOU = "ForYou",
  FOLLOWING = "Following",
  LIKED = "Liked",
}

type HomePageProps = { 
  user: User; 
  profile: any 
};

export default function Home({ user, profile }: HomePageProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(HomePageTab.FOR_YOU);
  const [loading, setLoading] = useState(false);
  
  const supabase = createSupabaseComponentClient();
  
  // Determine which data fetching function should be used
  const fetchDataFn =
    activeTab === HomePageTab.FOR_YOU
      ? getFeed
      : activeTab === HomePageTab.FOLLOWING
      ? getFollowingFeed
      : getLikesFeed;

  // Infinite query to fetch the workouts from the server
  const { data: workouts, fetchNextPage } = useInfiniteQuery({
    queryKey: ['feed', activeTab, user?.id], // Include the active tab in the query key
    queryFn: async ({ pageParam = 0 }) => {
      // Fetch workouts using the appropriate function
      return await fetchDataFn(supabase, user, pageParam);
    },
    getNextPageParam: (lastPage, allPages) => {
      // Determine the next page to fetch
      // If the last page has fewer than 25 workouts, there are no more pages
      return lastPage.length < 25 ? undefined : allPages.length * 25;
    },
    initialPageParam: 0, // Start fetching from the first page
  });

  const refresh = async () => {
    setLoading(true);
    await queryClient.invalidateQueries({ queryKey: ['feed', activeTab, user?.id] });
    router.replace(router.asPath);
    setLoading(false);
  };
    
  return (
    <div className="w-full mx-auto max-w-[600px] h-full">
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab)} className="w-full mt-16">
        <div className="flex flex-row items-center gap-3 px-2">
          <TabsList className="grid grid-cols-3 w-full h-[48px] bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm">
            <TabsTrigger
              value="ForYou"
              className="rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              For You
            </TabsTrigger>
            <TabsTrigger
              value="Following"
              className="rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Following
            </TabsTrigger>
            <TabsTrigger
              value="Liked"
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

        <TabsContent value="ForYou">
          {user ? (
            <Feed user={user} workouts={workouts} fetchNextPage={fetchNextPage} />
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Please sign in to view the For You feed.
            </div>
          )}
        </TabsContent>
        <TabsContent value="Following">
          {user ? (
            <Feed user={user} workouts={workouts} fetchNextPage={fetchNextPage} />
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Please sign in to view the Following feed.
            </div>
          )}
        </TabsContent>
        <TabsContent value="Liked">
          {user ? (
            <Feed user={user} workouts={workouts} fetchNextPage={fetchNextPage} />
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Please sign in to view the Liked feed.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {user && profile ? (
        <UserProfile
          name={profile.full_name || 'User'}
          handle={`@${profile.email.split('@')[0]}`}
          avatarUrl="/images/default-avatar.png"
          stats={[
            { label: 'Workouts', value: 0 },
            { label: 'Followers', value: profile.Followers?.length || 0 },
            { label: 'Following', value: profile.Following?.length || 0 },
          ]}
        />
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
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData) {
    return {
      props: {
        user: null,
        profile: null,
      },
    };
  }

  const profile = await getProfileData(supabase, userData.user, userData.user.id);

  return {
    props: {
      user: userData.user,
      profile: profile,
    },
  };
}