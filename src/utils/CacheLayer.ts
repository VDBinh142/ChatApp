export class CacheLayer<T> {
  constructor(
    private prefix: string,
    private bloomCheckFn: (key: string) => Promise<boolean>,
    private redisGetFn: (key: string) => Promise<T | null>,
    private dbGetFn: (id: string) => Promise<T | null>,
    private bloomAddFn: (key: string) => Promise<boolean>,
    private redisSetFn: (key: string, value: T) => Promise<string | null>,
    private redisDeleteFn?: (key: string) => Promise<number>
  ) {}

  private getKey(id: string) {
    return `${this.prefix}:${id}`;
  }

  async get(id: string): Promise<T | null> {
    const key = this.getKey(id);

    if (!(await this.bloomCheckFn(key))) return null;

    const cachedValue = await this.redisGetFn(key);
    if (cachedValue !== null) return cachedValue;

    const fromDb = await this.dbGetFn(id);
    if (fromDb !== null) {
      await Promise.all([this.bloomAddFn(key), this.redisSetFn(key, fromDb)]);
    }

    return fromDb;
  }

  async set(id: string): Promise<boolean> {
    const key = this.getKey(id);

    await this.bloomAddFn(key);
    return true;
  }

  /**
   * Invalidate a cached entry after the underlying DB row has changed
   * (e.g. password/username update). Note: this only clears the Redis
   * value, not the bloom filter entry - bloom filters don't support
   * removal. That's fine: the bloom filter just gates "might exist",
   * the next get() will fall through to the DB and re-cache fresh data.
   */
  async invalidate(id: string): Promise<void> {
    if (!this.redisDeleteFn) {
      throw new Error(
        `CacheLayer for "${this.prefix}" was not given a delete function`
      );
    }
    await this.redisDeleteFn(this.getKey(id));
  }
}
