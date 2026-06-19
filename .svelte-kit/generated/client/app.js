export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/dashboard": [3],
		"/guests": [4],
		"/guests/edit/[id]": [5],
		"/guests/new": [6],
		"/logout": [7],
		"/logs": [8],
		"/performances": [9],
		"/performances/edit/[id]": [10],
		"/performances/new": [11],
		"/reservations": [12],
		"/reservations/edit/[id]": [13],
		"/reservations/new": [14],
		"/wine-storage": [15],
		"/wine-storage/edit/[id]": [16],
		"/wine-storage/new": [17],
		"/wine-storage/retrieve/[id]": [18]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
};

export { default as root } from '../root.svelte';