

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BaRGa7Cx.js","_app/immutable/chunks/BqjfsWb9.js","_app/immutable/chunks/BFG5TxkM.js"];
export const stylesheets = ["_app/immutable/assets/0.DlOn9eiZ.css"];
export const fonts = [];
