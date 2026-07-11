/**
 * The only file most people need to edit.
 * Changes are reflected on the next Cloudflare Pages deployment.
 */
export const siteConfig = {
  name: 'Shiori',
  owner: '書庫の持ち主',
  description: '日々の出来事と、小さな達成を収める私の書庫。',
  language: 'ja',
  locale: 'ja-JP',
  timezone: 'Asia/Tokyo',
  startYear: 2026,
  profile: {
    shortBio: 'つくったもの、学んだこと、忘れたくない日を記録しています。',
  },
  home: {
    recentMonths: 6,
    recordLimit: 60,
    featuredLimit: 3,
  },
} as const;

export type SiteConfig = typeof siteConfig;
