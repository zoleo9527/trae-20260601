import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch }) => {
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