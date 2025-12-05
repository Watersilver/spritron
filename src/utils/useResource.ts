import { useEffect, useRef, useState } from "react"


// /**
//  * Returns a stateful value, and a function to update it.
//  */
// function useAsyncStateExample<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
// // convenience overload when first argument is omitted
// /**
//  * Returns a stateful value, and a function to update it.
//  */
// function useAsyncStateExample<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];

// function useAsyncStateExample<S>(initialState?: S | (() => S)) {
//   const [s, setS] = useState(initialState);

//   return [s, setS];
// }

function useResource<S>({
  creator, cleanup, deps, dontRunOnMount
}: {
  creator: () => Promise<S>;
  cleanup?: (prev: S) => void;
  deps: React.DependencyList;
  dontRunOnMount?: boolean;
}) {
  const [data, setData] = useState<S | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const currentIdRef = useRef(Symbol('Use resource current ref'));
  const mounted = useRef(false);

  const update = () => {
    if (dontRunOnMount && !mounted.current) {
      return;
    }

    setLoading(true);

    currentIdRef.current = Symbol('Use resource current ref');
    const currentId = currentIdRef.current;

    let done = false;

    creator()
    .then(v => {
      done = true;
      if (currentId === currentIdRef.current) {
        setData(v);
        setLoading(false);
      } else {
        cleanup?.(v);
      }
    })
    .catch(e => {
      done = true;
      if (currentId === currentIdRef.current) {
        setError(e);
        setLoading(false);
      }
    });

    return () => {
      if (currentId === currentIdRef.current && !done) {
        setLoading(false);
        currentIdRef.current = Symbol('Use resource current ref');
      }
    };
  };


  const updateRef = useRef(update);
  useEffect(() => {updateRef.current = update;});
  useEffect(() => {
    return updateRef.current();
  }, deps);

  
  const cleanupRef = useRef(cleanup);
  useEffect(() => {cleanupRef.current = cleanup;});
  useEffect(() => () => {data && cleanupRef.current?.(data)}, [data]);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    }
  }, []);

  return {
    data, loading, error, update
  }
}

export default useResource