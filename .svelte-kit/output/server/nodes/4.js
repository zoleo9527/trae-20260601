

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/risk-alerts/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/4.Cb55nj7a.js","_app/immutable/chunks/BqjfsWb9.js","_app/immutable/chunks/BFG5TxkM.js","_app/immutable/chunks/D6YF6ztN.js"];
export const stylesheets = ["_app/immutable/assets/4.BSDBOlkz.css"];
export const fonts = [];
