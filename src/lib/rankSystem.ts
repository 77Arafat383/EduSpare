export interface RankTier {
  minPoints: number;
  maxPoints: number;
  rank: string;
}

export const RANK_TIERS: RankTier[] = [
  { minPoints: 5000, maxPoints: Infinity, rank: 'Master Scholar' },
  { minPoints: 3000, maxPoints: 4999, rank: 'Top 5% Contributor' },
  { minPoints: 1500, maxPoints: 2999, rank: 'Top 10% Contributor' },
  { minPoints: 800, maxPoints: 1499, rank: 'Dedicated Contributor' },
  { minPoints: 300, maxPoints: 799, rank: 'Active Learner' },
  { minPoints: 0, maxPoints: 299, rank: 'New Scholar' },
];

export const POINT_REWARDS = {
  WELCOME_BONUS: 100,
  TASK_COMPLETED: 50,
  BLOG_CREATED: 50,
  DAILY_STREAK: 10,
  ENGAGEMENT_LIKE: 5,
};

/**
 * Calculates the user's rank string based on total accumulated points.
 */
export function getRankFromPoints(points: number): string {
  const tier = RANK_TIERS.find((t) => points >= t.minPoints);
  return tier ? tier.rank : 'New Scholar';
}

/**
 * Returns progress metrics for the next rank tier.
 */
export function getRankProgress(points: number) {
  const currentRank = getRankFromPoints(points);
  const currentTierIndex = RANK_TIERS.findIndex((t) => t.rank === currentRank);

  if (currentTierIndex <= 0) {
    return {
      currentRank,
      nextRank: null,
      pointsToNext: 0,
      progressPercentage: 100,
    };
  }

  const currentTier = RANK_TIERS[currentTierIndex];
  const nextTier = RANK_TIERS[currentTierIndex - 1];

  const pointsInCurrentTier = points - currentTier.minPoints;
  const tierRange = nextTier.minPoints - currentTier.minPoints;
  const progressPercentage = Math.min(100, Math.max(0, Math.round((pointsInCurrentTier / tierRange) * 100)));

  return {
    currentRank,
    nextRank: nextTier.rank,
    pointsToNext: nextTier.minPoints - points,
    progressPercentage,
  };
}
