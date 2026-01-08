/**
 * 防重入的异步函数包装器
 * 确保同一个函数在同时被多次调用时，只会执行一次
 */
export function onceAsync<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T {
  let promise: Promise<unknown> | null = null;

  return ((...args: unknown[]) => {
    if (promise) {
      return promise;
    }

    promise = fn(...args).finally(() => {
      promise = null;
    });

    return promise;
  }) as T;
}
