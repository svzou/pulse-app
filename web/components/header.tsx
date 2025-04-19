'use client';

/**
 * Improved Header component with fixes for authentication persistence
 */
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { LogOut, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createSupabaseComponentClient());

  // Create a memoized function to fetch user session
  const fetchUserSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error fetching session:", error);
        return;
      }

      if (data?.session?.user) {
        setUserEmail(data.session.user.email || null);
      } else {
        setUserEmail(null);
      }
    } catch (error) {
      console.error("Unexpected error checking session:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    fetchUserSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN' && session) {
        setUserEmail(session.user.email || null);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        // Important to handle token refresh events to maintain session
        if (session) {
          setUserEmail(session.user.email || null);
        }
      }
    });

    return () => {
      // Clean up auth listener
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, fetchUserSession]);

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
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    return userEmail ? userEmail.charAt(0).toUpperCase() : 'U';
  };

  const profileNavigation = () => {
    router.push("/profile");
  };

  return (
    <header className="flex justify-end px-6 py-4 w-full">
      <div className="pointer-events-auto">
        {!loading && userEmail ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="h-10 w-10 rounded-xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-medium transition-all hover:bg-gray-800 dark:hover:bg-gray-200">
                {getUserInitial()}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl">
              <DropdownMenuItem onClick={profileNavigation} className="cursor-pointer text-gray-700 dark:text-gray-300">
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
    </header>
  );
}