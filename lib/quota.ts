export const PLANS = {
  free: {
    name: "Free Tier",
    maxBytes: 100 * 1024 * 1024,      // 100 MB
    maxFileBytes: 5 * 1024 * 1024,    // 5 MB
  },
  pro: {
    name: "Storack Pro",
    maxBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    maxFileBytes: 20 * 1024 * 1024,   // 20 MB
  },
} as const;

export type PlanKey = keyof typeof PLANS;
