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
		client: {start:"_app/immutable/entry/start.DjnJCJ9Y.js",app:"_app/immutable/entry/app.jqeU_h-K.js",imports:["_app/immutable/entry/start.DjnJCJ9Y.js","_app/immutable/chunks/CICbJFZ-.js","_app/immutable/chunks/BqjfsWb9.js","_app/immutable/entry/app.jqeU_h-K.js","_app/immutable/chunks/BqjfsWb9.js","_app/immutable/chunks/BFG5TxkM.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/auth/current-user",
				pattern: /^\/api\/auth\/current-user\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/current-user/_server.ts.js'))
			},
			{
				id: "/api/auth/login",
				pattern: /^\/api\/auth\/login\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/login/_server.ts.js'))
			},
			{
				id: "/api/auth/logout",
				pattern: /^\/api\/auth\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/logout/_server.ts.js'))
			},
			{
				id: "/api/dashboard/stats",
				pattern: /^\/api\/dashboard\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/dashboard/stats/_server.ts.js'))
			},
			{
				id: "/api/risk-alerts",
				pattern: /^\/api\/risk-alerts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/risk-alerts/_server.ts.js'))
			},
			{
				id: "/api/risk-alerts/[id]",
				pattern: /^\/api\/risk-alerts\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/risk-alerts/_id_/_server.ts.js'))
			},
			{
				id: "/api/risk-alerts/[id]/follow-ups",
				pattern: /^\/api\/risk-alerts\/([^/]+?)\/follow-ups\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/risk-alerts/_id_/follow-ups/_server.ts.js'))
			},
			{
				id: "/api/risk-alerts/[id]/process",
				pattern: /^\/api\/risk-alerts\/([^/]+?)\/process\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/risk-alerts/_id_/process/_server.ts.js'))
			},
			{
				id: "/api/todos",
				pattern: /^\/api\/todos\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/todos/_server.ts.js'))
			},
			{
				id: "/api/todos/[id]/complete",
				pattern: /^\/api\/todos\/([^/]+?)\/complete\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/todos/_id_/complete/_server.ts.js'))
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/risk-alerts",
				pattern: /^\/risk-alerts\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/risk-alerts/new",
				pattern: /^\/risk-alerts\/new\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/risk-alerts/[id]",
				pattern: /^\/risk-alerts\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/todos",
				pattern: /^\/todos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
