import { ThemeProvider } from "@/components/theme/theme-provider";
import Header from "@/components/header";
import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import { ModeToggle } from "@/components/ui/mode-toggle";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    // Wrap the app in the query client provider to enable react-query
    // and the theme provider to enable toggling between light / dark mode.
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-row w-full h-screen">
            <AppSidebar  />
            <div className="flex-1 flex flex-col h-screen">
              <Header/>
              <main className="flex-1 overflow-auto pt-16 px-4 flex justify-center">
              <Component {...pageProps} />
              </main>
            </div>
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    </SidebarProvider>
  );
}
