export interface TaskWithPriority {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  dueAt: Date | string;
  importance: number; // 0 to 100
  status: string;
  notes?: string | null;
  materials?: string;
  createdAt?: Date | string;
}

/**
 * Calculates priority score and sorts tasks according to requirement 5.b:
 * 1. Tasks with less remaining time will be shown first.
 * 2. If remaining time is equal (or within same 1-minute window), higher importance rating (0-100) comes first.
 */
export function sortTasksByPriority<T extends TaskWithPriority>(tasks: T[]): T[] {
  const now = Date.now();

  return [...tasks].sort((a, b) => {
    const timeRemainingA = new Date(a.dueAt).getTime() - now;
    const timeRemainingB = new Date(b.dueAt).getTime() - now;

    // Standardize time comparison to 1-minute buckets so minor millisecond differences don't override importance
    const minuteBucketA = Math.floor(timeRemainingA / 60000);
    const minuteBucketB = Math.floor(timeRemainingB / 60000);

    if (minuteBucketA !== minuteBucketB) {
      return timeRemainingA - timeRemainingB; // Less remaining time first
    }

    // Tie-breaker: higher importance rating first (0-100)
    return b.importance - a.importance;
  });
}

export function formatTimeRemaining(dueAt: Date | string): { text: string; urgent: boolean; expired: boolean } {
  const diffMs = new Date(dueAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return { text: 'Overdue', urgent: true, expired: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return { text: `${days}d remaining`, urgent: days <= 1, expired: false };
  } else if (hours > 0) {
    return { text: `${hours}h remaining`, urgent: hours <= 6, expired: false };
  } else {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return { text: `${mins}m remaining`, urgent: true, expired: false };
  }
}
