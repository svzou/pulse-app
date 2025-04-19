import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/router";
import Link from "next/link";
import { AtSign, Lock, User, UserPlus } from "lucide-react";
import React from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
  
    try {
      console.log("Signup attempt with:", { email, fullName });
      
      // Create the user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
  
      if (authError) {
        console.error("Auth signup error:", authError);
        console.error("Auth error details:", {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });
        setError(authError.message);
        return;
      }
  
      console.log("Auth signup successful:", authData);
  
      if (authData.user) {
        const userData = {
          id: authData.user.id,
          email: email,
          full_name: fullName,
          created_at: new Date().toISOString(),
        };
        
        console.log("Attempting to insert user data:", userData);
        
        // Insert additional user data into the users table
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .insert(userData)
          .select();
  
        if (profileError) {
          console.error("Profile creation error:", profileError);
          console.error("Profile error details:", {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint
          });
          setError(profileError.message);
          return;
        }
  
        console.log("Profile creation successful:", profileData);
        
        // Redirect to home page on successful signup
        console.log("Signup complete, redirecting to home page");
        router.push("/");
      } else {
        console.error("Auth data returned without user object:", authData);
        setError("User account created but session not established");
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack
        });
      }
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-4 w-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300" />
                </div>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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