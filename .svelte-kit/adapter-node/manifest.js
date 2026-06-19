export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.126a268e.js","app":"_app/immutable/entry/app.37a96801.js","imports":["_app/immutable/entry/start.126a268e.js","_app/immutable/chunks/scheduler.a6fc3364.js","_app/immutable/chunks/singletons.d9858e5a.js","_app/immutable/chunks/index.9b8e8a7d.js","_app/immutable/chunks/paths.25c105ea.js","_app/immutable/entry/app.37a96801.js","_app/immutable/chunks/scheduler.a6fc3364.js","_app/immutable/chunks/index.13f43f06.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js')),
			__memo(() => import('./nodes/12.js')),
			__memo(() => import('./nodes/13.js')),
			__memo(() => import('./nodes/14.js')),
			__memo(() => import('./nodes/15.js')),
			__memo(() => import('./nodes/16.js')),
			__memo(() => import('./nodes/17.js')),
			__memo(() => import('./nodes/18.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/attachments",
				pattern: /^\/api\/attachments\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/attachments/_server.ts.js'))
			},
			{
				id: "/api/attachments/[id]",
				pattern: /^\/api\/attachments\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/attachments/_id_/_server.ts.js'))
			},
			{
				id: "/api/guests",
				pattern: /^\/api\/guests\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/guests/_server.ts.js'))
			},
			{
				id: "/api/guests/[id]",
				pattern: /^\/api\/guests\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/guests/_id_/_server.ts.js'))
			},
			{
				id: "/api/login",
				pattern: /^\/api\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/login/_server.ts.js'))
			},
			{
				id: "/api/logs",
				pattern: /^\/api\/logs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/logs/_server.ts.js'))
			},
			{
				id: "/api/performances",
				pattern: /^\/api\/performances\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/performances/_server.ts.js'))
			},
			{
				id: "/api/performances/[id]",
				pattern: /^\/api\/performances\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/performances/_id_/_server.ts.js'))
			},
			{
				id: "/api/reservations",
				pattern: /^\/api\/reservations\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reservations/_server.ts.js'))
			},
			{
				id: "/api/reservations/[id]",
				pattern: /^\/api\/reservations\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/reservations/_id_/_server.ts.js'))
			},
			{
				id: "/api/user",
				pattern: /^\/api\/user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/user/_server.ts.js'))
			},
			{
				id: "/api/wine-storage",
				pattern: /^\/api\/wine-storage\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/wine-storage/_server.ts.js'))
			},
			{
				id: "/api/wine-storage/[id]",
				pattern: /^\/api\/wine-storage\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/wine-storage/_id_/_server.ts.js'))
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/guests",
				pattern: /^\/guests\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/guests/edit/[id]",
				pattern: /^\/guests\/edit\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/guests/new",
				pattern: /^\/guests\/new\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/logout",
				pattern: /^\/logout\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/logs",
				pattern: /^\/logs\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/performances",
				pattern: /^\/performances\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/performances/edit/[id]",
				pattern: /^\/performances\/edit\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/performances/new",
				pattern: /^\/performances\/new\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/reservations",
				pattern: /^\/reservations\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/reservations/edit/[id]",
				pattern: /^\/reservations\/edit\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/reservations/new",
				pattern: /^\/reservations\/new\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/wine-storage",
				pattern: /^\/wine-storage\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/wine-storage/edit/[id]",
				pattern: /^\/wine-storage\/edit\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/wine-storage/new",
				pattern: /^\/wine-storage\/new\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/wine-storage/retrieve/[id]",
				pattern: /^\/wine-storage\/retrieve\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 18 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();

export const prerendered = new Set([]);
