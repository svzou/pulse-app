'use client';
/**
 * Header component appearing at the top of all pages.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
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
} from './ui/dropdown-menu';
import { createSupabaseComponentClient } from '@/utils/supabase/clients/component';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getProfileData } from '@/utils/supabase/queries/profile';
import { ModeToggle } from './ui/mode-toggle';

export default function Header() {
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch user profile data for header display
  const { data: profile } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return null;
      return getProfileData(supabase, data.user, data.user.id);
    },
  });

  return (
    <header className="flex px-3 pt-3 h-16 shrink-0 items-center justify-between fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-900">
      {/* Sidebar trigger on left */}
      <div className="absolute left-4 pointer-events-auto">
        <SidebarTrigger className="text-gray-600 dark:text-gray-300" />
      </div>

      {/* Brand or title in center */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <Link href="/" className="text-xl font-bold">
          hellio
        </Link>
      </div>

      {/* Profile actions on right */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <ModeToggle />
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="mt-1">
                <AvatarImage
                  src={
                    supabase.storage
                      .from('avatars')
                      .getPublicUrl(profile.avatar_url ?? '').data.publicUrl
                  }
                  alt={profile.full_name ?? 'User avatar'}
                />
                <AvatarFallback>
                  {profile.full_name?.slice(0, 2).toUpperCase() || 'UN'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/profile/${profile.id}`)}>
                <UserRound /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  queryClient.resetQueries({ queryKey: ['user_profile'] });
                  router.push('/');
                }}
              >
                <LogOut /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
