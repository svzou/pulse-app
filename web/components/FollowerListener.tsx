"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

type FollowerListenerProps = {
  userId: string;
};

export default function FollowerListener({ userId }: FollowerListenerProps) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("realtime:followers")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "following",
        },
        async (payload) => {
          const newFollow = payload.new;

          if (newFollow.following_id === userId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newFollow.follower_id)
              .single();

            const name = profile?.full_name || "Someone";
            toast(`${name} started following you! 👀`);
            console.log("🔔 New follower detected:", name);
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
