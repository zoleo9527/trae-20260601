

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.DpKmoJfX.js","_app/immutable/chunks/BqjfsWb9.js","_app/immutable/chunks/BFG5TxkM.js","_app/immutable/chunks/D6YF6ztN.js"];
export const stylesheets = ["_app/immutable/assets/2.DAi7F7KW.css"];
export const fonts = [];
