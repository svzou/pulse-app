'use client';

import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { createSupabaseComponentClient } from '@/utils/supabase/clients/component';
import { ModeToggle } from './ui/mode-toggle';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export default function Header() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex p-4 items-center justify-end bg-transparent">
      <div className="flex items-center gap-4">
      <ModeToggle />
        
        {isLoading ? (
          <div className="h-10 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : user ? (    
            <Button 
              id="sign out"
              onClick={handleSignOut}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
        ) : (
          <Button
            id="sign in"
            onClick={handleSignIn}
            className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
}