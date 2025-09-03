// confidenceScore.ts
export function calculateConfidence(post: {
  text: string;
  authorVerified: boolean;
  hasImage: boolean;
  parsedSchedule: { date: string | null; timeRange: string | null; location: string | null };
}) {
  let score = 0;

  if (post.authorVerified) score += 40;
  if (post.hasImage) score += 10;
  if (post.parsedSchedule.date) score += 15;
  if (post.parsedSchedule.timeRange) score += 15;
  if (post.parsedSchedule.location) score += 20;

  return Math.min(score, 100);
}
