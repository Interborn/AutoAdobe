'use client';

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

interface TimeAgoProps {
  date: Date | string;
}

export function TimeAgo({ date }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    const dateObj = date instanceof Date ? date : new Date(date);
    setTimeAgo(formatDistanceToNow(dateObj, { addSuffix: true }));

    // Update every minute
    const interval = setInterval(() => {
      setTimeAgo(formatDistanceToNow(dateObj, { addSuffix: true }));
    }, 60000);

    return () => clearInterval(interval);
  }, [date]);

  if (!timeAgo) {
    return null;
  }

  return <span>{timeAgo}</span>;
} 