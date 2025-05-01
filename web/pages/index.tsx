import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { RotateCcw, Plus, X } from 'lucide-react';
import UserProfile from '@/components/ui/profile-card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createSupabaseServerClient } from '@/utils/supabase/clients/server-props';
import { useRouter } from 'next/router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed, getLikesFeed } from '@/utils/supabase/queries/workout';
import Feed from "@/pages/feed";
import CreateWorkout from '@/components/ui/create-workout';
import { getProfileData } from '@/utils/supabase/queries/profile';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/auth-helpers-nextjs';
import { Analytics } from "@vercel/analytics/react"

enum HomePageTab {
  FOR_YOU = 'ForYou',
  LIKED = 'Liked',
}

interface HomeProps {
  user: any;
  profile: any;
}

export default function Home({ user, profile }: HomeProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(HomePageTab.FOR_YOU);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const supabase = createClientComponentClient();
  const [workoutCount, setWorkoutCount] = useState<number>(0);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);

  let avatarPublicUrl = '';
  if (profile.avatar_url) {
    const { data } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(profile.avatar_url);
    avatarPublicUrl = data.publicUrl;
  }

  // Redirect to login page if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Determine which data fetching function should be used
  const fetchDataFn =
    activeTab === HomePageTab.FOR_YOU
      ? getFeed
      : getLikesFeed;

  // Infinite query to fetch the workouts from the server
  const { data: workouts, fetchNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed', activeTab, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      return await fetchDataFn(supabase, user, pageParam);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < 25 ? undefined : allPages.length * 25;
    },
    initialPageParam: 0,
    enabled: !!user?.id,
  });

  // Fetch recent workouts and merge them into the feed
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
              avatar_url,
              followers,
              following
            )
          `)
          .order("created_at", { ascending: false });

        if (!workoutsError && recentWorkoutsData) {
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
    setLoading(false);
  };

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
  };

  // If user is not logged in, don't render anything while redirecting
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col w-full mx-auto max-w-[600px] min-h-screen pt-6 pb-20 text-foreground bg-background transition-colors duration-300">
      {/* Profile Card */}
      <div className="mx-4 mb-8  bg-background border border-border shadow-md p-6 transition-shadow hover:shadow-lg">
        <UserProfile
          name={profile?.full_name || 'User'}
          handle={`@${profile?.email?.split('@')[0] || 'user'}`}
          avatarUrl={profile.avatar_url || "/images/default-avatar.png"}
          stats={[
            { label: 'Workouts', value: workoutCount }
          ]}
        />
      </div>

      {/* Create Post Button or Form */}
      <div className="mx-4 mb-6">
        {!showCreateForm ? (
          <Button
            id="create form"
            onClick={toggleCreateForm}
            className="w-full flex items-center justify-center gap-2 bg-sky-700 text-white font-medium py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus size={18} />
            Share Your Workout
          </Button>
        ) : (
          <div className="bg-background border border-border rounded-xl shadow-md p-4 mb-4 transition-all relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Create New Workout</h3>
              <Button
                id="toggle create form"
                variant="ghost"
                size="sm"
                onClick={toggleCreateForm}
                className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-muted-foreground hover:bg-muted/10 dark:hover:bg-muted/20"
              >
                <X size={18} />
              </Button>
            </div>
            <CreateWorkout user={user} />
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as HomePageTab)} className="w-full">
        <div className="flex flex-row items-center gap-3 mx-4 mb-4">
          <TabsList className="grid grid-cols-2 w-full h-[52px] bg-muted rounded-xl p-1.5 shadow-sm border border-border">
            <TabsTrigger
              value={HomePageTab.FOR_YOU}
              className="rounded-lg text-gray-700 dark:text-gray-500 font-medium transition-all duration-200 data-[state=active]:bg-sky-700 data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-sm"
            >
              For You
            </TabsTrigger>
            <TabsTrigger
              value={HomePageTab.LIKED}
              className="rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 data-[state=active]:bg-sky-700 data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-sm"
            >
              Liked
            </TabsTrigger>
          </TabsList>
          <Button
            id="refresh"
            variant="secondary"
            size="sm"
            onClick={refresh}
            className="rounded-full w-12 h-12 flex items-center justify-center bg-background border border-border hover:bg-muted/10 dark:hover:bg-muted/20 transition-colors shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-t-2 border-b-2 border-gray-600 dark:border-gray-300 rounded-full animate-spin"></div>
            ) : (
              <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </Button>
        </div>

        {/* Feed Content */}
        <div className="mt-2 bg-muted rounded-xl mx-4 p-2 border border-border">
          <TabsContent value={HomePageTab.FOR_YOU}>
            <Feed
              user={user}
              workouts={workouts ? { ...workouts, pages: workouts.pages.map(page => page.map(workout => ({ ...workout, attachment_url: workout.attachment_url || '' }))) } : undefined}
              fetchNextPage={fetchNextPage}
              additionalWorkouts={recentWorkouts}
            />
          </TabsContent>
          <TabsContent value={HomePageTab.LIKED}>
            <Feed
              user={user}
              workouts={workouts ? { ...workouts, pages: workouts.pages.map(page => page.map(workout => ({ ...workout, attachment_url: workout.attachment_url || '' }))) } : undefined}
              fetchNextPage={fetchNextPage}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

interface ServerSideProps {
  user: User;
  profile: any; // Replace `any` with a more specific type if available
}

export async function getServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<ServerSideProps>> {
  const supabase: SupabaseClient = createSupabaseServerClient(context);
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