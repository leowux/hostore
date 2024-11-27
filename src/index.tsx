import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from "react";

const useSafeEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface ContextObject<Value> {
  value: Value;
  events: Set<(value: Value) => void>;
}

export function createStore<Value, Props>(useHook: (props: Props) => Value) {
  const Context = createContext<ContextObject<Value>>({} as unknown as ContextObject<Value>);
  function Provider({ children, props }: PropsWithChildren<{ props?: Props }>) {
    const value = useHook(props as Props);
    const context = useRef<ContextObject<Value>>({ value, events: new Set() }).current;
    context.value = value;
    useSafeEffect(() => {
      context.events.forEach((event) => {
        event(value);
      });
    });
    return <Context.Provider value={context}>{children}</Context.Provider>;
  }
  function useStore<SelectedValue = Value>(selector?: (value: Value) => SelectedValue): SelectedValue {
    const [, forceUpdate] = useReducer(() => ({}), {});
    const { value, events } = useContext(Context);
    const selectedValue = selector ? selector(value) : value;
    const current = {
      value,
      selectedValue,
      events,
      selector,
    };
    const ref = useRef(current);
    ref.current = current;
    useSafeEffect(() => {
      function event(nextValue: Value) {
        const { value, selectedValue, selector } = ref.current;
        if (value === nextValue) return;
        const nextSelectedValue = selector ? selector(nextValue) : nextValue;
        if (selectedValue === nextSelectedValue) return;
        forceUpdate();
      }
      ref.current.events.add(event);
      return () => {
        ref.current.events.delete(event);
      };
    }, []);
    return selectedValue as SelectedValue;
  }
  return { Provider, useStore };
}

export function useEvent<Args extends unknown[], Return>(fn: (...args: Args) => Return): (...args: Args) => Return {
  const ref = useRef(fn);
  useSafeEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: Args) => ref.current(...args), []);
}

export default function ComposeProviders(props: {
  providers: Array<React.JSXElementConstructor<React.PropsWithChildren<unknown>>>;
  children: React.ReactNode;
}) {
  const { providers = [], children } = props;
  return (
    <>
      {providers.reduceRight((acc, Provider) => {
        return <Provider>{acc}</Provider>;
      }, children)}
    </>
  );
}
