

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/login/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.D5an-iDl.js","_app/immutable/chunks/BqjfsWb9.js","_app/immutable/chunks/BFG5TxkM.js"];
export const stylesheets = ["_app/immutable/assets/3.BhAtsbI3.css"];
export const fonts = [];
