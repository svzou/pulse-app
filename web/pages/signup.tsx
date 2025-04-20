import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useQueryClient } from "@tanstack/react-query";
import { AtSign, Lock, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";

export default function SignUpPage() {
  // Create necessary hooks for clients and providers.
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const queryClient = useQueryClient();
  // Create states for each field in the form.
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
      console.error(error);
      setIsLoading(false);
      return;
    }
    
    queryClient.resetQueries({ queryKey: ["user_profile"] });
    router.push("/");
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-lg p-8 space-y-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-100 dark:border-gray-800">
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mb-3">
            <UserPlus className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create an account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Join us and get started with your new account
          </p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50/80 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300" />
                </div>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-transparent border-gray-200 dark:border-gray-700 rounded-xl focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <AtSign className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-transparent border-gray-200 dark:border-gray-700 rounded-xl focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-transparent border-gray-200 dark:border-gray-700 rounded-xl focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters
              </p>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-xl transition-all dark:bg-white dark:text-black dark:hover:bg-gray-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white dark:border-black rounded-full animate-spin mr-2"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                "Sign up"
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or</span>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-gray-900 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}