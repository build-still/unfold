import { useEffect, useMemo, useState } from 'react';

interface TimestampNode {
  updatedAt?: string;
  createdAt?: string;
}

function parseNodeTimestamp(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelativeTime(timestamp: Date, nowMs: number): string {
  const diffMs = timestamp.getTime() - nowMs;
  const absMs = Math.abs(diffMs);

  if (absMs < 45_000) {
    return 'just now';
  }

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;

  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), 'minute');
  }

  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), 'hour');
  }

  return rtf.format(Math.round(diffMs / day), 'day');
}

export function useRelativeEditedTime(activeNode: TimestampNode | null) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    const editedDate = parseNodeTimestamp(activeNode?.updatedAt ?? activeNode?.createdAt);
    if (!editedDate) {
      return { relativeText: null, absoluteText: null };
    }

    return {
      relativeText: formatRelativeTime(editedDate, nowMs),
      absoluteText: editedDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    };
  }, [activeNode?.createdAt, activeNode?.updatedAt, nowMs]);
}
