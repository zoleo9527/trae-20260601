

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.8c88d282.js","_app/immutable/chunks/scheduler.a6fc3364.js","_app/immutable/chunks/index.13f43f06.js","_app/immutable/chunks/stores.cb0f73c7.js","_app/immutable/chunks/singletons.d9858e5a.js","_app/immutable/chunks/index.9b8e8a7d.js","_app/immutable/chunks/paths.25c105ea.js"];
export const stylesheets = [];
export const fonts = [];
