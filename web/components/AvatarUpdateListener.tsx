"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

type AvatarUpdateListenerProps = {
  userId: string;
};

export default function AvatarUpdateListener({ userId }: AvatarUpdateListenerProps) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("realtime:profile-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        async (payload) => {
          const updated = payload.new;
          const previous = payload.old;

          if (updated.avatar_url !== previous.avatar_url) {
            const updatedUserId = updated.id;

            const { data: follow } = await supabase
              .from("following")
              .select("*")
              .eq("follower_id", userId)
              .eq("following_id", updatedUserId)
              .maybeSingle();

            if (follow) {
              toast(`${updated.full_name} updated their profile picture! 📸`);
              console.log("Realtime: Avatar updated by someone you follow:", updated.full_name);
            }
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
