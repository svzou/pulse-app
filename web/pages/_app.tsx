import { ThemeProvider } from "@/components/theme/theme-provider";
import Header from "@/components/header";
import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react"
import LikeListener from "@/components/LikeListener";
import AvatarUpdateListener from "@/components/AvatarUpdateListener";
import FollowerListener from "@/components/FollowerListener";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Toaster position="top-right" />
          {pageProps?.user?.id && (
            <>
              <LikeListener userId={pageProps.user.id} />
              <AvatarUpdateListener userId={pageProps.user.id} />
              <FollowerListener userId={pageProps.user.id} />
            </>
          )}
          <div className="flex flex-row w-full h-screen">
            <AppSidebar />
            <div className="flex-1 flex flex-col h-screen">
              <Header />
              <main className="flex-1 overflow-auto pt-16 px-4 flex justify-center">
                <Component {...pageProps} />
                <Analytics />
              </main>
            </div>
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    </SidebarProvider>
  );
}
