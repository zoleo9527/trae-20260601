
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
		RouteId(): "/" | "/api" | "/api/arrangements" | "/api/arrangements/batch-confirm" | "/api/arrangements/check-conflict" | "/api/arrangements/[id]" | "/api/arrangements/[id]/confirm" | "/api/auth" | "/api/auth/login" | "/api/checkin" | "/api/checkin/history" | "/api/checkin/[id]" | "/api/checkin/[id]/batch-check" | "/api/checkin/[id]/check" | "/api/checkin/[id]/report-anomaly" | "/api/exam-rooms" | "/api/exams" | "/api/recent-changes" | "/api/risks" | "/api/statistics" | "/api/statistics/absent" | "/api/statistics/anomalies" | "/api/statistics/invigilator-workload" | "/api/todos" | "/api/users" | "/arrangement" | "/arrangement/new" | "/arrangement/[id]" | "/checkin" | "/checkin/history" | "/checkin/[id]" | "/exam-room" | "/login" | "/statistics";
		RouteParams(): {
			"/api/arrangements/[id]": { id: string };
			"/api/arrangements/[id]/confirm": { id: string };
			"/api/checkin/[id]": { id: string };
			"/api/checkin/[id]/batch-check": { id: string };
			"/api/checkin/[id]/check": { id: string };
			"/api/checkin/[id]/report-anomaly": { id: string };
			"/arrangement/[id]": { id: string };
			"/checkin/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/api": { id?: string | undefined };
			"/api/arrangements": { id?: string | undefined };
			"/api/arrangements/batch-confirm": Record<string, never>;
			"/api/arrangements/check-conflict": Record<string, never>;
			"/api/arrangements/[id]": { id: string };
			"/api/arrangements/[id]/confirm": { id: string };
			"/api/auth": Record<string, never>;
			"/api/auth/login": Record<string, never>;
			"/api/checkin": { id?: string | undefined };
			"/api/checkin/history": Record<string, never>;
			"/api/checkin/[id]": { id: string };
			"/api/checkin/[id]/batch-check": { id: string };
			"/api/checkin/[id]/check": { id: string };
			"/api/checkin/[id]/report-anomaly": { id: string };
			"/api/exam-rooms": Record<string, never>;
			"/api/exams": Record<string, never>;
			"/api/recent-changes": Record<string, never>;
			"/api/risks": Record<string, never>;
			"/api/statistics": Record<string, never>;
			"/api/statistics/absent": Record<string, never>;
			"/api/statistics/anomalies": Record<string, never>;
			"/api/statistics/invigilator-workload": Record<string, never>;
			"/api/todos": Record<string, never>;
			"/api/users": Record<string, never>;
			"/arrangement": { id?: string | undefined };
			"/arrangement/new": Record<string, never>;
			"/arrangement/[id]": { id: string };
			"/checkin": { id?: string | undefined };
			"/checkin/history": Record<string, never>;
			"/checkin/[id]": { id: string };
			"/exam-room": Record<string, never>;
			"/login": Record<string, never>;
			"/statistics": Record<string, never>
		};
		Pathname(): "/" | "/api/arrangements" | "/api/arrangements/batch-confirm" | "/api/arrangements/check-conflict" | `/api/arrangements/${string}` & {} | `/api/arrangements/${string}/confirm` & {} | "/api/auth/login" | "/api/checkin" | "/api/checkin/history" | `/api/checkin/${string}` & {} | `/api/checkin/${string}/batch-check` & {} | `/api/checkin/${string}/check` & {} | `/api/checkin/${string}/report-anomaly` & {} | "/api/exam-rooms" | "/api/exams" | "/api/recent-changes" | "/api/risks" | "/api/statistics/absent" | "/api/statistics/anomalies" | "/api/statistics/invigilator-workload" | "/api/todos" | "/api/users" | "/arrangement" | "/arrangement/new" | `/arrangement/${string}` & {} | "/checkin" | "/checkin/history" | `/checkin/${string}` & {} | "/exam-room" | "/login" | "/statistics";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}