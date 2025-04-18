"use client";
import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import Header from "@/components/header";
import { Tooltip } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <div className="flex w-full h-screen">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 pt-16 px-4 overflow-auto bg-red-400">
                <Component {...pageProps} />
                <Tooltip />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
