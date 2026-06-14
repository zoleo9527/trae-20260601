
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
		RouteId(): "/" | "/api" | "/api/attachments" | "/api/notifications" | "/api/notifications/[id]" | "/api/notifications/[id]/ack" | "/api/orders" | "/api/orders/[id]" | "/api/orders/[id]/transition" | "/orders" | "/orders/[id]";
		RouteParams(): {
			"/api/notifications/[id]": { id: string };
			"/api/notifications/[id]/ack": { id: string };
			"/api/orders/[id]": { id: string };
			"/api/orders/[id]/transition": { id: string };
			"/orders/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/api": { id?: string | undefined };
			"/api/attachments": Record<string, never>;
			"/api/notifications": { id?: string | undefined };
			"/api/notifications/[id]": { id: string };
			"/api/notifications/[id]/ack": { id: string };
			"/api/orders": { id?: string | undefined };
			"/api/orders/[id]": { id: string };
			"/api/orders/[id]/transition": { id: string };
			"/orders": { id?: string | undefined };
			"/orders/[id]": { id: string }
		};
		Pathname(): "/" | "/api/attachments" | "/api/notifications" | `/api/notifications/${string}/ack` & {} | "/api/orders" | `/api/orders/${string}` & {} | `/api/orders/${string}/transition` & {} | "/orders" | `/orders/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}