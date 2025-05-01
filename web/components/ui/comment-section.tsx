'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './button';

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  users: { username: string };
}

interface CommentSectionProps {
  postId: string;
  userId: string;
}

export function CommentSection({ postId, userId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const supabase = createClientComponentClient();

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, user_id, post_id, content, created_at, users!username')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }
      setComments(data as unknown as Comment[]);
    };

    fetchComments();
  }, [postId, supabase]);

  // Handle new comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, content: newComment });

    if (error) {
      console.error('Error adding comment:', error);
      return;
    }

    // Refetch comments
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('id, user_id, post_id, content, created_at, users (username)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching comments:', fetchError);
      return;
    }
    setComments(data as unknown as Comment[]);
    setNewComment('');
  };

  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="border rounded px-2 py-1 flex-1"
        />
        <Button id="submit" onClick={handleSubmitComment}>Post</Button>
      </div>
      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b pb-2">
            <p className="font-semibold">{comment.users.username}</p>
            <p>{comment.content}</p>
            <p className="text-sm text-gray-500">
              {new Date(comment.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}