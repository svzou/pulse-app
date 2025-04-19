'use client';

/**
 * Header component appearing at the top of all pages.
 */
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header() {
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          setUserEmail(data.session.user.email ?? null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUserEmail(session.user.email ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

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

  return (
    <header className="flex px-3 pt-3 h-16 shrink-0 items-center justify-between fixed top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm shadow-sm">
      <div className="pointer-events-auto">
        <SidebarTrigger className="text-gray-600 dark:text-gray-300" />
      </div>
      
      <div className="flex items-center gap-3 pointer-events-auto">
        {!loading && userEmail ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {getUserInitial()}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                <UserRound className="mr-2 h-4 w-4" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : loading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}