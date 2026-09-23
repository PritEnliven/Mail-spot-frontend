import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const CHUNK_RELOAD_KEY = 'mailspot_chunk_reload';

/** Detect Vite/webpack dynamic-import failures (stale deploy hashes, network blips). */
export const isChunkLoadError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk [\d]+ failed|error loading dynamically imported module|ChunkLoadError/i.test(
    message,
  );
};

/**
 * Lazy-load a route/component. On chunk-load failure, reload the page once
 * so the browser picks up the latest Firebase `index.html` + hashed assets.
 */
// Props vary per route module; keep this permissive so callers stay simple.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

export function lazyWithRetry(
  factory: () => Promise<{ default: AnyComponent }>,
): LazyExoticComponent<AnyComponent> {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return mod;
    } catch (error) {
      if (isChunkLoadError(error) && sessionStorage.getItem(CHUNK_RELOAD_KEY) !== '1') {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        window.location.reload();
        // Hold Suspense open while the reload runs
        return new Promise<{ default: AnyComponent }>(() => undefined);
      }
      throw error;
    }
  });
}
