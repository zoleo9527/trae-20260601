// @ts-nocheck
import type { LayoutLoad } from './$types';

export const load = async ({ fetch }: Parameters<LayoutLoad>[0]) => {
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      const { user } = await response.json();
      return { user };
    }
  } catch {
    // ignore
  }
  return { user: null };
};