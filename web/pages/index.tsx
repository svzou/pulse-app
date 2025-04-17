// Home page showing feed


import {  useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Geist, Geist_Mono } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/scroll-area";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

enum HomePageTab {
  FOR_YOU = "Feed",
  FOLLOWING = "Following",
  LIKED = "Liked",
}

export default function Home() {
  // const queryClient = useQueryClient();
  // const supabase = createSupabaseComponentClient();
  const [activeTab, setActiveTab] = useState<string>(HomePageTab.FOR_YOU);
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
  const refresh = () => {
    queryClient.resetQueries();
  };
    
  return (
    <div className="w-full max-w-[600px] h-full">
      {/* Display all three tabs for each feed + the refresh button. */}
      <Tabs
        value={activeTab.toString()}
        onValueChange={(tab) => setActiveTab(tab)}
        className="w-full mt-8"
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
          >
            {/* <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-300" /> */}
          </Button>
        </div>
      </Tabs>

      {/* Scroll area containing the feed. */}
      {/* {!posts || posts.pages.flat().length === 0 ? (
        <div>No posts available</div>
      ) : ( */}
        <ScrollArea className="mt-4 h-[70vh] w-full border bg-card text-card-foreground shadow-2xl">
          {/* <PostFeed user={user} posts={posts} fetchNext={fetchNextPage} /> */}
        </ScrollArea>
      {/* )} */}
    </div>
    
  );
}
