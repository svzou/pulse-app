import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import UserProfile from '@/components/ui/profile-card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { createSupabaseServerClient } from '@/utils/supabase/clients/server-props';
import { getProfileData } from '@/utils/supabase/queries/profile';
import { Card } from '@/components/ui/card';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed, getFollowingFeed, getLikesFeed } from '@/utils/supabase/queries/workout';
import Feed from './feed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfilePage from './profile';
import uploadAvatar from "./profile"
import WorkoutCard from '@/components/workout-card';




enum HomePageTab {
  FOR_YOU = 'ForYou',
  FOLLOWING = 'Following',
  LIKED = 'Liked',
}

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
  const [workoutCount, setWorkoutCount] = useState<number>(0);


  let avatarPublicUrl = '';
  if (profile.avatar_url) {
    const { data } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(profile.avatar_url);
    avatarPublicUrl = data.publicUrl;
  }

  const fetchDataFn =
    activeTab === HomePageTab.FOR_YOU
      ? getFeed
      : activeTab === HomePageTab.FOLLOWING
      ? getFollowingFeed
      : getLikesFeed;

  const { data: posts, fetchNextPage } = useInfiniteQuery({
    queryKey: ['feed', activeTab, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      return await fetchDataFn(supabase, user, pageParam);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < 25 ? undefined : allPages.length * 25;
    },
    initialPageParam: 0,
  });



  
  // Fetch recent workouts and merge them into the feed
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  useEffect(() => {
    if (user?.id) {
      const fetchWorkoutData = async () => {
        // Fetch recent workouts
        const { data: recentWorkoutsData, error: workoutsError } = await supabase
          .from("workouts")
          .select(`
            *,
            profiles:user_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .order("created_at", { ascending: false });
  
        if (!workoutsError && recentWorkoutsData) {
          console.log("Workouts loaded:", recentWorkoutsData);
          setRecentWorkouts(recentWorkoutsData);
        }
  
        // Fetch workout count for the user
        const { count, error: countError } = await supabase
          .from("workouts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
  
        if (!countError && typeof count === "number") {
          setWorkoutCount(count);
        }
      };
  
      fetchWorkoutData();
    }
  }, [user?.id, supabase]);
  
  

  const refresh = async () => {
    setLoading(true);
    await queryClient.invalidateQueries({ queryKey: ['feed', activeTab, user?.id] });
    router.replace(router.asPath);
    setLoading(false);
  };

  const renderWorkouts = (workouts: any[] | undefined, additionalWorkouts: any[] = []) => {
    const allWorkouts = [...(additionalWorkouts || []), ...(workouts?.flat() || [])];
  
    return (
      <ScrollArea className="mt-4 h-[70vh] w-full border bg-card text-card-foreground shadow-2xl">
        <div className="space-y-4 p-4">
          {allWorkouts.length > 0 ? (
            allWorkouts.map((workout: any) => (
              <WorkoutCard key={workout.id} workout={workout} user={user} />
            ))
          ) : (
            <p className="text-center text-gray-500">No workouts found.</p>
          )}
        </div>
      </ScrollArea>
    );
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
          {user ? renderWorkouts(posts?.pages, recentWorkouts) : <div className="p-4 text-center text-gray-500 dark:text-gray-400">Please sign in to view the For You feed.</div>}
        </TabsContent>
        <TabsContent value="Following">
          {user ? renderWorkouts(posts?.pages) : <div className="p-4 text-center text-gray-500 dark:text-gray-400">Please sign in to view the Following feed.</div>}
        </TabsContent>
        <TabsContent value="Liked">
        {user ? (
             <Feed user={user} workouts={posts} fetchNextPage={fetchNextPage} />) : (
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
          avatarUrl={profile.avatar_url}
          
          stats={[
            { label: 'Workouts', value: workoutCount },
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
      redirect: {
        destination: '/login',
        permanent: false,
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