import type { ActiveTab } from '@/types/eduspare';

/**
 * Tab views are code-split (see app/page.tsx). Kick off their chunk download
 * ahead of time — on hover/touch of a nav item, or during browser idle time —
 * so switching tabs never shows a spinner.
 */
const loaders: Partial<Record<ActiveTab, () => Promise<unknown>>> = {
  dashboard: () => Promise.resolve(),
  tasks: () => import('@/components/tasks/TaskListView'),
  blog: () => import('@/components/blog/BlogFeedView'),
  chat: () => import('@/components/chat/ChatView'),
  profile: () => import('@/components/profile/ProfileView'),
  communities: () => import('@/components/community/CommunityView'),
};

const done = new Set<ActiveTab>();

export function prefetchView(tab: ActiveTab) {
  if (done.has(tab)) return;
  done.add(tab);
  loaders[tab]?.().catch(() => done.delete(tab));
}

/** Prefetch every view when the browser is idle and the connection allows it. */
export function prefetchAllViewsWhenIdle() {
  if (typeof window === 'undefined') return;
  const conn = (navigator as any).connection;
  if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;

  const run = () => (Object.keys(loaders) as ActiveTab[]).forEach(prefetchView);
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
}
