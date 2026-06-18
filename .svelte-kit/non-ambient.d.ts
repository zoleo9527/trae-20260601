
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
		RouteId(): "/" | "/api" | "/api/batch" | "/api/inventory" | "/api/login" | "/api/logs" | "/api/orders" | "/api/reservations" | "/api/reset" | "/api/rooms" | "/api/users" | "/home" | "/inventory" | "/login" | "/orders" | "/rooms" | "/settings";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/api": Record<string, never>;
			"/api/batch": Record<string, never>;
			"/api/inventory": Record<string, never>;
			"/api/login": Record<string, never>;
			"/api/logs": Record<string, never>;
			"/api/orders": Record<string, never>;
			"/api/reservations": Record<string, never>;
			"/api/reset": Record<string, never>;
			"/api/rooms": Record<string, never>;
			"/api/users": Record<string, never>;
			"/home": Record<string, never>;
			"/inventory": Record<string, never>;
			"/login": Record<string, never>;
			"/orders": Record<string, never>;
			"/rooms": Record<string, never>;
			"/settings": Record<string, never>
		};
		Pathname(): "/" | "/api/batch" | "/api/inventory" | "/api/login" | "/api/logs" | "/api/orders" | "/api/reservations" | "/api/reset" | "/api/rooms" | "/api/users" | "/home" | "/inventory" | "/login" | "/orders" | "/rooms" | "/settings";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}