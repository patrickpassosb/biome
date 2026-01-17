/**
 * Custom React hook for handling asynchronous data fetching with state management.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

// Internal state structure for the hook.
type AsyncState<T> = {
  data: T | null;    // Parsed response data.
  error: string | null; // Error message if the fetch fails.
  loading: boolean;  // True while the request is in flight.
};

/**
 * useAsyncData Hook
 *
 * Automates the common pattern of fetching data on component mount (or dependency change),
 * while exposing loading states and a manual refresh trigger.
 *
 * @template T - The expected type of the data returned by the fetcher.
 * @param fetcher - An async function that returns a Promise of type T.
 * @param deps - An array of dependencies that, when changed, trigger a re-fetch.
 * @returns An object containing data, error, loading state, and a refresh callback.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
) {
  // Initialize state with 'loading: true' to prevent flash of empty data.
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  // Tick state is used to manually force a re-fetch.
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    // Flag to prevent state updates if the component unmounts.
    let active = true;

    // Reset loading state for new requests.
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    // Execute the provided fetcher.
    fetcher()
      .then((data) => {
        // Only update if the effect is still active (not unmounted).
        if (!active) return;
        setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        // Normalize the error message.
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        setState({ data: null, error: message, loading: false });
      });

    // Cleanup: Mark as inactive on unmount.
    return () => {
      active = false;
    };
    // Include tick in dependencies to support manual refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refresh };
}
