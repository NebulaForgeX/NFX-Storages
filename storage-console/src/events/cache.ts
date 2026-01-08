export const cacheEvents = {
  // Category 相关
  INVALIDATE_CATEGORIES: "CACHE:INVALIDATE_CATEGORIES",
  INVALIDATE_CATEGORY: "CACHE:INVALIDATE_CATEGORY",
  
  // Subcategory 相关
  INVALIDATE_SUBCATEGORIES: "CACHE:INVALIDATE_SUBCATEGORIES",
  INVALIDATE_SUBCATEGORY: "CACHE:INVALIDATE_SUBCATEGORY",
  
  // Tea 相关
  INVALIDATE_TEAS: "CACHE:INVALIDATE_TEAS",
  INVALIDATE_TEA: "CACHE:INVALIDATE_TEA",
  
  // Profile 相关
  INVALIDATE_PROFILE: "CACHE:INVALIDATE_PROFILE",
  INVALIDATE_USERS: "CACHE:INVALIDATE_USERS",
} as const;

type CacheEvent = (typeof cacheEvents)[keyof typeof cacheEvents];

class CacheEventEmitter {
  private listeners: Record<CacheEvent, Set<Function>> = {
    [cacheEvents.INVALIDATE_CATEGORIES]: new Set<Function>(),
    [cacheEvents.INVALIDATE_CATEGORY]: new Set<Function>(),
    [cacheEvents.INVALIDATE_SUBCATEGORIES]: new Set<Function>(),
    [cacheEvents.INVALIDATE_SUBCATEGORY]: new Set<Function>(),
    [cacheEvents.INVALIDATE_TEAS]: new Set<Function>(),
    [cacheEvents.INVALIDATE_TEA]: new Set<Function>(),
    [cacheEvents.INVALIDATE_PROFILE]: new Set<Function>(),
    [cacheEvents.INVALIDATE_USERS]: new Set<Function>(),
  };

  on(event: CacheEvent, callback: Function) {
    this.listeners[event].add(callback);
  }

  off(event: CacheEvent, callback: Function) {
    this.listeners[event].delete(callback);
  }

  // emit 可以不传参数（使用默认 queryKey）或传入额外参数（如 id）
  emit(event: CacheEvent, ...args: unknown[]) {
    this.listeners[event].forEach((callback) => {
      callback(...args);
    });
  }
}

export const cacheEventEmitter = new CacheEventEmitter();

