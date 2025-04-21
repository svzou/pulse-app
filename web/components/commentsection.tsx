// "use client";

// import React, { useEffect, useState } from "react";
// import { getComments, addComment } from "@/queries/comment";
// import { useUser } from "@/supabase/auth";
// import { Textarea } from "@/components/ui/textarea";

// interface Comment {
//   user_id: string;
//   content: string;
//   created_at: string;
// }

// interface Props {
//   workoutId: string;
// }

// export function CommentSection({ workoutId }: Props) {
//   const { user } = useUser();
//   const [comments, setComments] = useState<Comment[]>([]);
//   const [newComment, setNewComment] = useState("");

//   useEffect(() => {
//     getComments(workoutId).then(setComments);
//   }, [workoutId]);

//   const handleAddComment = async () => {
//     if (!user || !newComment.trim()) return;
//     await addComment(user.id, workoutId, newComment);
//     setNewComment("");
//     getComments(workoutId).then(setComments);
//   };

//   return (
//     <div>
//       <div className="space-y-2">
//         {comments.map((c, i) => (
//           <div key={i} className="border rounded p-2 text-sm">
//             <p className="font-medium">{c.user_id}</p>
//             <p>{c.content}</p>
//           </div>
//         ))}
//       </div>

//       <div className="mt-4">
//         <Textarea
//           placeholder="Write a comment..."
//           value={newComment}
//           onChange={(e) => setNewComment(e.target.value)}
//         />
//         <button onClick={handleAddComment} className="mt-2 text-blue-600 hover:underline">
//           Post Comment
//         </button>
//       </div>
//     </div>
//   );
// }