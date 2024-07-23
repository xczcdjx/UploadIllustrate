// utils/indexedDb.ts
export const useIndexedDB = (dbName: string, storeName: string) => {
    const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
            }
        };
    });

    const getObjectStore = (mode: IDBTransactionMode) =>
        dbPromise.then((db) => db.transaction(storeName, mode).objectStore(storeName));

    return {
        async setItem(key: string, value: any) {
            const store = await getObjectStore("readwrite");
            const request = store.put(value, key);
            return new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        },
        async getItem<T>(key: string): Promise<T | undefined> {
            const store = await getObjectStore("readonly");
            const request = store.get(key);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result as T);
                request.onerror = () => reject(request.error);
            });
        },
        async deleteItem(key: string) {
            const store = await getObjectStore("readwrite");
            const request = store.delete(key);
            return new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        },
        async getAllKeys() {
            const store = await getObjectStore("readonly");
            const request = store.getAllKeys();
            return new Promise<string[]>((resolve, reject) => {
                request.onsuccess = () => resolve(request.result as string[]);
                request.onerror = () => reject(request.error);
            });
        },
        async clearAllData() {
            const store = await getObjectStore("readwrite");
            const request = store.clear();
            return new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    };
};
