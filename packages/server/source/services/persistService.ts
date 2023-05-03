class PersistService<T> {

    private store: Map<string, T>;

    private static _instance: PersistService<any>;

    private constructor() {
        this.store = new Map();
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public save(key: string, value: T): void {
        this.store.set(key.toLowerCase(), value);
    }

    public delete(key: string): void {
        this.store.delete(key);
    }

    public retrieve(key: string): T | undefined {
        return this.store.get(key.toLowerCase());
    }

    public getKeys(): string[] {
        return Array.from(this.store.keys());
    }

    public clearAll() {
        this.store.clear();
    }
}

export default PersistService;