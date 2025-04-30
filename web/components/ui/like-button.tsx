// web/components/ui/like-button.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './button'; // Assuming you have a reusable Button component

interface LikeButtonProps {
  postId: string;
  userId: string;
}

export function LikeButton({ postId, userId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const supabase = createClientComponentClient();

  // Fetch initial like status and count
  useEffect(() => {
    const fetchLikes = async () => {
      // Get like count
      const { data: likes, error: countError } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);

      if (countError) {
        console.error('Error fetching like count:', countError);
        return;
      }
      setLikeCount(likes.length);

      // Check if user has liked the post
      const { data: userLike, error: userLikeError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (userLikeError && userLikeError.code !== 'PGRST116') {
        console.error('Error checking user like:', userLikeError);
        return;
      }
      setLiked(!!userLike);
    };

    fetchLikes();
  }, [postId, userId, supabase]);

  // Handle like/unlike
  const handleLike = async () => {
    if (liked) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unliking post:', error);
        return;
      }
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        console.error('Error liking post:', error);
        return;
      }
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  return (
    <Button id="likebutton" variant={liked ? 'default' : 'outline'} onClick={handleLike}>
      {liked ? 'Unlike' : 'Like'} ({likeCount})
    </Button>
  );
}
