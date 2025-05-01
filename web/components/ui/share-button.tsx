// web/components/ui/share-button.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './button';

interface ShareButtonProps {
  postId: string;
  userId: string;
}

export function ShareButton({ postId, userId }: ShareButtonProps) {
  const [shareCount, setShareCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const supabase = createClientComponentClient();

  // Fetch initial share count
  useEffect(() => {
    const fetchShares = async () => {
      const { data: shares, error } = await supabase
        .from('shares')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);

      if (error) {
        console.error('Error fetching share count:', error);
        return;
      }
      setShareCount(shares.length);
    };

    fetchShares();
  }, [postId, supabase]);

  // Handle copying the post link
  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle reposting within the app
  const handleRepost = async () => {
    const { error } = await supabase
      .from('shares')
      .insert({ post_id: postId, user_id: userId });

    if (error) {
      console.error('Error sharing post:', error);
      return;
    }
    setShareCount((prev) => prev + 1);
  };

  return (
    <div className="flex gap-2">
      <Button id="copy" onClick={handleCopyLink}>
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
      <Button id="repost" variant="outline" onClick={handleRepost}>
        Repost ({shareCount})
      </Button>
    </div>
  );
}

function useEffect(arg0: () => void, arg1: (string | SupabaseClient<any, "public", any>)[]) {
  throw new Error('Function not implemented.');
}
