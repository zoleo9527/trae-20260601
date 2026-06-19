

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.5da3738f.js","_app/immutable/chunks/scheduler.a6fc3364.js","_app/immutable/chunks/index.a7de669a.js","_app/immutable/chunks/stores.b28e1e1a.js","_app/immutable/chunks/singletons.0254f6b9.js","_app/immutable/chunks/index.9b8e8a7d.js","_app/immutable/chunks/paths.783532ba.js"];
export const stylesheets = [];
export const fonts = [];
