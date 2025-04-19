'use client';

/**
 * Improved Header component with fixes for authentication persistence
 */
import { SidebarTrigger } from './ui/sidebar';
import { LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createSupabaseComponentClient } from '@/utils/supabase/clients/component';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getProfileData } from '@/utils/supabase/queries/profile';
import { ModeToggle } from './ui/mode-toggle';
import { useEffect, useState, useCallback } from "react";

export default function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createSupabaseComponentClient());

  // Create a memoized function to fetch user session
  const fetchUserSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error fetching session:", error);
        return null;
      }

      return data?.session?.user || null;
    } catch (error) {
      console.error("Unexpected error checking session:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch user profile data for header display
  const { data: profile } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => {
      const user = await fetchUserSession();
      if (!user) return null;
      return getProfileData(supabase, user, user.id);
    },
  });
  
  // Initialize auth state
  useEffect(() => {
    fetchUserSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session) {
        queryClient.invalidateQueries({ queryKey: ['user_profile'] });
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        queryClient.resetQueries({ queryKey: ['user_profile'] });
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        // Important to handle token refresh events to maintain session
        if (session) {
          queryClient.invalidateQueries({ queryKey: ['user_profile'] });
        }
      }
    });

    return () => {
      // Clean up auth listener
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, fetchUserSession, queryClient]);

  // Handle tab visibility changes to refresh auth state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUserSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUserSession]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.resetQueries({ queryKey: ["user_profile"] });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl
    : "";

  return (
    <header className="flex px-3 pt-3 h-16 shrink-0 items-center justify-end gap-2 fixed top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="absolute left-2 mt-8 pointer-events-auto">
        <SidebarTrigger className="text-gray-600 dark:text-gray-300" />
      </div> 
      <div className="pointer-events-auto">
        {!loading && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="mt-1">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                  {profile.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl">
              <DropdownMenuItem onClick={() => router.push(`/profile/${profile.id}`)} className="cursor-pointer text-gray-700 dark:text-gray-300">
                <UserRound className="mr-2 h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-gray-700 dark:text-gray-300">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : loading ? (
          <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="text-gray-900 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white font-medium transition-all hover:underline underline-offset-4"
          >
            Sign in
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 pointer-events-auto">
        <ModeToggle />
      </div>
    </header>
  );
}