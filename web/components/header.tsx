'use client';
/**
 * Header component appearing at the top of all pages.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */
import { SidebarTrigger } from "./ui/sidebar";
// import UserProfile from "./ui/profile-card";
import { HeartPulse, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
// import { getProfileData } from "@/utils/supabase/queries/profile";
import { ModeToggle } from "./ui/mode-toggle";

export default function Header() {
  // Create necessary hooks for clients and providers.
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch the user profile data so that it can be displayed in the header.
//   const { data } = useQuery({
//     queryKey: ["user_profile"],
//     queryFn: async () => {
//       const { data } = await supabase.auth.getUser();
//       if (!data) return null;
//       return await getProfileData(supabase, data.user!, data.user!.id);
//     },
//   });

  return (
    <header className="flex px-3 pt-3 h-16 shrink-0 items-center justify-end gap-2 fixed top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        hellio
 </div>
 </header>
  )
};
        {/* <UserProfile /> */}
      
      {/* <div className="absolute left-4 pointer-events-auto">
        <SidebarTrigger className="text-gray-600 dark:text-gray-300" />
      </div> */}
      {/* {data && (
        <div className="flex items-center gap-3 pointer-events-auto"> */}
          {/* Dark mode / light mode toggle */}
          <ModeToggle />
          {/* Dropdown menu for the user, if it exists */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="mt-1">
                <AvatarImage
                  src={
                    supabase.storage
                      .from("avatars")
                      .getPublicUrl(data.avatar_url ?? "").data.publicUrl
                  }
                />
                <AvatarFallback>
                  {data.name!.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/profile/${data.id}`)}
              >
                <UserRound /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  queryClient.resetQueries({ queryKey: ["user_profile"] });
                  router.push("/");
                }}
              >
                <LogOut /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        {/* </div>
      )} */}
   