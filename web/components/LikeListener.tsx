"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

type LikeListenerProps = {
  userId: string;
};

export default function LikeListener({ userId }: LikeListenerProps) {
  useEffect(() => {
    if (!userId) return;

    console.log("📡 Subscribing to realtime likes for user:", userId);

    const channel = supabase
      .channel("realtime:likes") 
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "likes",
        },
        (payload) => {
          const like = payload.new;
          console.log("📨 Realtime like payload received:", like);

          // Show notification if current user owns the liked post
          if (like?.post_owner_id === userId) {
            toast.success("💪 Someone liked your post!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
