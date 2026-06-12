const DB_NAME = 'AuctionDB';
const DB_VERSION = 1;

class AuctionDB {
    constructor() {
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('bids')) {
                    const bidStore = db.createObjectStore('bids', { keyPath: 'id' });
                    bidStore.createIndex('bidNo', 'bidNo', { unique: true });
                    bidStore.createIndex('status', 'status');
                }

                if (!db.objectStoreNames.contains('deposits')) {
                    const depositStore = db.createObjectStore('deposits', { keyPath: 'id' });
                    depositStore.createIndex('bidId', 'bidId');
                    depositStore.createIndex('bidderId', 'bidderId');
                    depositStore.createIndex('status', 'status');
                    depositStore.createIndex('slowRefund', 'slowRefund');
                }

                if (!db.objectStoreNames.contains('bidders')) {
                    const bidderStore = db.createObjectStore('bidders', { keyPath: 'id' });
                    bidderStore.createIndex('idCard', 'idCard', { unique: true });
                    bidderStore.createIndex('name', 'name');
                }

                if (!db.objectStoreNames.contains('qualifications')) {
                    const qualStore = db.createObjectStore('qualifications', { keyPath: 'id' });
                    qualStore.createIndex('bidId', 'bidId');
                    qualStore.createIndex('bidderId', 'bidderId');
                    qualStore.createIndex('status', 'status');
                }

                if (!db.objectStoreNames.contains('logs')) {
                    const logStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
                    logStore.createIndex('targetId', 'targetId');
                    logStore.createIndex('targetType', 'targetType');
                    logStore.createIndex('action', 'action');
                }
            };
        });
    }

    async add(storeName, data) {
        await this.ensureOpen();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        await this.ensureOpen();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        await this.ensureOpen();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        await this.ensureOpen();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllByIndex(storeName, indexName, value) {
        await this.ensureOpen();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        await this.ensureOpen();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async ensureOpen() {
        if (!this.db) {
            await this.open();
        }
    }

    async addLog(targetId, targetType, action, remark = '') {
        const log = {
            id: Date.now(),
            targetId,
            targetType,
            action,
            remark,
            operator: '当前用户',
            createdAt: new Date().toISOString()
        };
        return this.add('logs', log);
    }

    async getLogs(targetId, targetType) {
        const allLogs = await this.getAll('logs');
        return allLogs.filter(log => log.targetId === targetId && log.targetType === targetType)
                     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

const db = new AuctionDB();

window.addEventListener('load', async () => {
    try {
        await db.open();
        console.log('数据库连接成功');
    } catch (error) {
        console.error('数据库连接失败:', error);
    }
});

window.AuctionDB = AuctionDB;
window.db = db;
