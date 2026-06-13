
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/auth" | "/api/auth/current-user" | "/api/auth/login" | "/api/auth/logout" | "/api/dashboard" | "/api/dashboard/stats" | "/api/risk-alerts" | "/api/risk-alerts/[id]" | "/api/risk-alerts/[id]/follow-ups" | "/api/risk-alerts/[id]/process" | "/api/todos" | "/api/todos/[id]" | "/api/todos/[id]/complete" | "/login" | "/risk-alerts" | "/risk-alerts/new" | "/risk-alerts/[id]" | "/todos";
		RouteParams(): {
			"/api/risk-alerts/[id]": { id: string };
			"/api/risk-alerts/[id]/follow-ups": { id: string };
			"/api/risk-alerts/[id]/process": { id: string };
			"/api/todos/[id]": { id: string };
			"/api/todos/[id]/complete": { id: string };
			"/risk-alerts/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/api": { id?: string | undefined };
			"/api/auth": Record<string, never>;
			"/api/auth/current-user": Record<string, never>;
			"/api/auth/login": Record<string, never>;
			"/api/auth/logout": Record<string, never>;
			"/api/dashboard": Record<string, never>;
			"/api/dashboard/stats": Record<string, never>;
			"/api/risk-alerts": { id?: string | undefined };
			"/api/risk-alerts/[id]": { id: string };
			"/api/risk-alerts/[id]/follow-ups": { id: string };
			"/api/risk-alerts/[id]/process": { id: string };
			"/api/todos": { id?: string | undefined };
			"/api/todos/[id]": { id: string };
			"/api/todos/[id]/complete": { id: string };
			"/login": Record<string, never>;
			"/risk-alerts": { id?: string | undefined };
			"/risk-alerts/new": Record<string, never>;
			"/risk-alerts/[id]": { id: string };
			"/todos": Record<string, never>
		};
		Pathname(): "/" | "/api/auth/current-user" | "/api/auth/login" | "/api/auth/logout" | "/api/dashboard/stats" | "/api/risk-alerts" | `/api/risk-alerts/${string}` & {} | `/api/risk-alerts/${string}/follow-ups` & {} | `/api/risk-alerts/${string}/process` & {} | "/api/todos" | `/api/todos/${string}/complete` & {} | "/login" | "/risk-alerts" | "/risk-alerts/new" | `/risk-alerts/${string}` & {} | "/todos";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}