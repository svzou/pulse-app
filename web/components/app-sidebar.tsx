"use client";
import { HeartPulse, User } from "lucide-react";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  BookOpen,
  Bot,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  SquareTerminal,
} from "lucide-react";

import Link from "next/link";
import NavProjects from "@/components/nav-projects";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useRouter } from "next/router";

const data = {
  projects: [
    {
      name: "Home",
      url: "/",
      icon: Frame,
    },
    {
      name: "Workout History",
      url: "workout-history",
      icon: PieChart,
    },
    {
      name: "Exercise Library",
      url: "exercise-library",
      icon: Map,
    },
    {
      name: "Profile",
      url: "/profile",
      icon: User,
    },
  ],
};


export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const hideSidebarRoutes = ['/login', '/signup'];
  if (hideSidebarRoutes.includes(router.pathname)) {
    return null;
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3">
          <HeartPulse className="w-6 h-6 text-sky-700" />
          <p className="text-lg font-bold text-sky-700 top-5">Pulse</p>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        {/* <NavUser user={user} profile={profile} /> soph-UPDATE WITH USER FIELD IN HEADER*/}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
