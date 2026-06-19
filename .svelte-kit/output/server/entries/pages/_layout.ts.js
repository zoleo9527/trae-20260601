const load = async ({ fetch }) => {
  try {
    const response = await fetch("/api/user");
    if (response.ok) {
      const { user } = await response.json();
      return { user };
    }
  } catch {
  }
  return { user: null };
};
export {
  load
};
