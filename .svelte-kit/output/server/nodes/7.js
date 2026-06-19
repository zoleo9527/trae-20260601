

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/logout/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/7.936f0636.js","_app/immutable/chunks/scheduler.a6fc3364.js","_app/immutable/chunks/index.a7de669a.js","_app/immutable/chunks/index.9b8e8a7d.js"];
export const stylesheets = [];
export const fonts = [];
