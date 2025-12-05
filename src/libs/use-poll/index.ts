import { useEffect, useRef, useState } from "react";


const _intervals: {
  [key: number]: {
    id: number;
    callbacks: (() => void)[];
  };
} = {};


/**
 * Creates a read only state that can be sync'd with some other global state.
 * 
 * Use sparingly. Too much polling is bad.
 */
function usePoll<T>(
  /**
   * Check that determines if readonly state should be updated.
   * 
   * Frequency of this check is determined by the given interval.
   * 
   * If it returns true, the readonly state must be updated and the component rerendered.
   */
  isOutOfSync: (state: T) => boolean,
  /**
   * Must return the new value of the read only state.
   * 
   * Careful with mutations.
   * Follow react useState rules so react can detect when it must rerender.
   */
  updateReadOnlyState: () => T,
  /** Milliseconds between state update checks */
  interval?: number
): [state: T, synchronizeState: () => void] {
  const [state, setState] = useState(updateReadOnlyState);
  const currentState = useRef(state);
  const syncState = useRef(() => {
    if (isOutOfSync(currentState.current)) {
      const newState = updateReadOnlyState();
      setState(newState);
      currentState.current = newState;
    }
  });

  useEffect(() => {
    const i = interval ?? 0;
    if (!_intervals[i]) {
      const intervalData = {
        id: setInterval(() => {
          for (const callback of intervalData.callbacks) {
            callback();
          }
        }, i),
        callbacks: [] as (() => void)[]
      };
      _intervals[i] = intervalData;
    }

    const callback = syncState.current;
    _intervals[i].callbacks.push(callback);

    return () => {
      if (_intervals[i]) {
        const j = _intervals[i].callbacks.indexOf(callback);
        if (j !== -1) {
          _intervals[i].callbacks.splice(j, 1);
        }
        if (_intervals[i].callbacks.length === 0) {
          clearInterval(_intervals[i].id);
          delete _intervals[i];
        }
      }
    };
  }, []);

  return [state, syncState.current];
}

export default usePoll;