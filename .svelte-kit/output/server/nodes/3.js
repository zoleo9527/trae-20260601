

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.e8c205e7.js","_app/immutable/chunks/scheduler.a6fc3364.js","_app/immutable/chunks/index.a7de669a.js","_app/immutable/chunks/navigation.185be131.js","_app/immutable/chunks/singletons.0254f6b9.js","_app/immutable/chunks/index.9b8e8a7d.js","_app/immutable/chunks/paths.783532ba.js","_app/immutable/chunks/api.16de10c8.js","_app/immutable/chunks/wine.2d336701.js","_app/immutable/chunks/Icon.068ef20e.js"];
export const stylesheets = [];
export const fonts = [];
