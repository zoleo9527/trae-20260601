import { Database } from 'sqlite';
export declare const getDb: () => Promise<Database>;
export declare const initDatabase: () => Promise<void>;
export declare const closeDatabase: () => Promise<void>;
