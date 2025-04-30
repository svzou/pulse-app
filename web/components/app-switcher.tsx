"use client"
import { HeartPulse } from "lucide-react";

import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar";
import {

  BookOpen,
  Bot,

  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,

  SquareTerminal,
} from "lucide-react"

import NavUser from "./nav-user";
import Link from "next/link";
import NavProjects from "@/components/nav-projects"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"



// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    }
  ],
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Workouts",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Exercise Library",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
  
  ],
  projects: [
    {
      name: "Home",
      url: "#",
      icon: Frame,
    },
    
    {
      name: "Exercise Library",
      url: "#",
      icon: Map,
    },
  ],
}

export default function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        {/* <NavUser user={data.user}  /> soph-UPDATE WITH USER FIELD IN HEADER */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
