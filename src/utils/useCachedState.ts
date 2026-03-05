import { useEffect, useState } from "react"

function useCachedState<S>(
  init: S | (() => S),
  storageKey: string,
  deserialize: (s: string) => S,
  serialize: (s: S) => string
): [S, React.Dispatch<React.SetStateAction<S>>] {
  const initVal = localStorage.getItem(storageKey);
  const [s, setS] = useState(initVal !== null ? deserialize(initVal) : init);
  useEffect(() => {
    const cache = localStorage.getItem(storageKey);
    const serialized = serialize(s);
    if (cache !== serialized) {
      localStorage.setItem(storageKey, serialized);
    }
  }, [s]);

  return [s, setS];
}

export default useCachedState