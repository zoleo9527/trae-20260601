import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.33a82ad4.js","_app/immutable/chunks/scheduler.a6fc3364.js","_app/immutable/chunks/index.13f43f06.js","_app/immutable/chunks/bar-chart-3.6bc8ccd4.js","_app/immutable/chunks/Icon.e6f8fb94.js","_app/immutable/chunks/music.86cd77e2.js","_app/immutable/chunks/calendar.b92cc30c.js","_app/immutable/chunks/wine.c61bc3e8.js","_app/immutable/chunks/file-text.d1a74499.js","_app/immutable/chunks/user.18bb9057.js"];
export const stylesheets = ["_app/immutable/assets/0.328f14cd.css"];
export const fonts = [];
