"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toggleLike, getLikesCount, isLikedByUser } from "@/queries/like";
import { useUser } from "@/utils/supabase/auth";

interface LikeButtonProps {
  workoutId: string;
}

export function LikeButton({ workoutId }: LikeButtonProps) {
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user) {
      isLikedByUser(user.id, workoutId).then(setLiked);
    }
    getLikesCount(workoutId).then(setCount);
  }, [user, workoutId]);

  const handleLike = async () => {
    if (!user) return;
    await toggleLike(user.id, workoutId);
    const updatedCount = await getLikesCount(workoutId);
    const userLiked = await isLikedByUser(user.id, workoutId);
    setLiked(userLiked);
    setCount(updatedCount);
  };

  return (
    <button id="like" onClick={handleLike} className="flex items-center space-x-1">
      <Heart fill={liked ? "red" : "none"} className="w-5 h-5" />
      <span>{count}</span>
    </button>
  );
}