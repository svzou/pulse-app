import { ThemeProvider } from "@/components/theme/theme-provider";
import Header from "@/components/header";
import "@/styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    // Wrap the app in the query client provider to enable react-query
    // and the theme provider to enable toggling between light / dark mode.
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          <AppSidebar />

        </ SidebarProvider>
        {/* The header is then shown above all components. */}
        <div className="flex h-screen flex-col px-4 overflow-hidden">
          <Header />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
