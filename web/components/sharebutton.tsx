"use client";

import React from "react";
import { Copy } from "lucide-react";

interface Props {
  workoutId: string;
}

export function ShareButton({ workoutId }: Props) {
  const copyToClipboard = async () => {
    const url = `${window.location.origin}/post/${workoutId}`;
    await navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  return (
    <button id="share" onClick={copyToClipboard} className="flex items-center space-x-1 text-sm text-blue-500 hover:underline">
      <Copy className="w-4 h-4" />
      <span>Share</span>
    </button>
  );
}

