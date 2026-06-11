import{a as x,b as y,c as S,d as f,r as i,_ as w,e as a,j as t,O as j,M as g,f as k,S as M}from"./components-COoCAsbi.js";/**
 * @remix-run/react v2.17.5
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function O({getKey:e,...c}){let{isSpaMode:u}=x(),o=y(),d=S();f({getKey:e,storageKey:l});let p=i.useMemo(()=>{if(!e)return null;let s=e(o,d);return s!==o.key?s:null},[]);if(u)return null;let h=((s,m)=>{if(!window.history.state||!window.history.state.key){let r=Math.random().toString(32).slice(2);window.history.replaceState({key:r},"")}try{let n=JSON.parse(sessionStorage.getItem(s)||"{}")[m||window.history.state.key];typeof n=="number"&&window.scrollTo(0,n)}catch(r){console.error(r),sessionStorage.removeItem(s)}}).toString();return i.createElement("script",w({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${h})(${a(JSON.stringify(l))}, ${a(JSON.stringify(p))})`}}))}const N=()=>[];function R({children:e}){return t.jsxs("html",{lang:"zh-CN",children:[t.jsxs("head",{children:[t.jsx("meta",{charSet:"utf-8"}),t.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),t.jsx(g,{}),t.jsx(k,{})]}),t.jsxs("body",{children:[e,t.jsx(O,{}),t.jsx(M,{})]})]})}function _(){return t.jsx(j,{})}export{R as Layout,_ as default,N as links};
