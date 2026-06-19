import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.200f0107.js","_app/immutable/chunks/scheduler.a6fc3364.js","_app/immutable/chunks/index.a7de669a.js","_app/immutable/chunks/wine.2d336701.js","_app/immutable/chunks/Icon.068ef20e.js","_app/immutable/chunks/file-text.892010f3.js","_app/immutable/chunks/user.dfe2d04d.js"];
export const stylesheets = ["_app/immutable/assets/0.328f14cd.css"];
export const fonts = [];
