import React, { render, fireEvent } from "@testing-library/react";
import { useRef, useState } from "react";
import { ComposeProviders, createStore, useEvent } from "../src";

const CounterStore = createStore(({ initialCount = 0 }: { initialCount: number }) => {
  const [count, setCount] = useState(initialCount);
  const increase = useEvent(() => {
    setCount((v) => v + 1);
  });
  const decrease = useEvent(() => {
    setCount((v) => v - 1);
  });
  return {
    count,
    increase,
    decrease,
  };
});

test("useStore", () => {
  const Child1 = () => {
    const { count } = CounterStore.useStore();
    return <div>Count: {count}</div>;
  };
  const Child2 = () => {
    const { increase } = CounterStore.useStore();
    return <button onClick={increase}>Increase</button>;
  };
  const Child3 = () => {
    const { decrease } = CounterStore.useStore();
    return <button onClick={decrease}>Decrease</button>;
  };
  const App = () => {
    return (
      <CounterStore.Provider props={{ initialCount: 0 }}>
        <Child1 />
        <Child2 />
        <Child3 />
      </CounterStore.Provider>
    );
  };
  const { getByText } = render(<App />);
  expect(getByText("Count: 0")).toBeDefined();
  fireEvent.click(getByText("Increase"));
  expect(getByText("Count: 1")).toBeDefined();
  fireEvent.click(getByText("Decrease"));
  expect(getByText("Count: 0")).toBeDefined();
});

test("useStore with selectors", () => {
  const Child1 = () => {
    const count = CounterStore.useStore((state) => state.count);
    return <div>Count: {count}</div>;
  };
  const Child2 = () => {
    const ref = useRef(0);
    ref.current++;
    const increase = CounterStore.useStore((state) => state.increase);
    return (
      <div>
        <span>Increase render count: {ref.current}</span>
        <button onClick={increase}>Increase</button>
      </div>
    );
  };
  const Child3 = () => {
    const ref = useRef(0);
    ref.current++;
    const decrease = CounterStore.useStore((state) => state.decrease);
    return (
      <div>
        <span>Decrease render count: {ref.current}</span>
        <button onClick={decrease}>Decrease</button>
      </div>
    );
  };
  const App = () => {
    return (
      <CounterStore.Provider props={{ initialCount: 0 }}>
        <Child1 />
        <Child2 />
        <Child3 />
      </CounterStore.Provider>
    );
  };
  const { getByText } = render(<App />);
  expect(getByText("Count: 0")).toBeDefined();
  fireEvent.click(getByText("Increase"));
  expect(getByText("Count: 1")).toBeDefined();
  fireEvent.click(getByText("Decrease"));
  expect(getByText("Count: 0")).toBeDefined();
  expect(getByText("Increase render count: 1")).toBeDefined();
  expect(getByText("Decrease render count: 1")).toBeDefined();
});

test("useEvent", () => {
  const App = () => {
    const [, setState] = useState({});
    const callback = useEvent(() => {
      setState({});
    });
    const lastCallback = useRef(callback).current;
    const isRefEqual = lastCallback === callback ? "true" : "false";
    return (
      <div>
        <span>{isRefEqual}</span>
        <button onClick={callback}>Update</button>
      </div>
    );
  };
  const { getByText } = render(<App />);
  fireEvent.click(getByText("Update"));
  expect(getByText("true")).toBeDefined();
});

test("ComposeProviders", () => {
  const Store1 = createStore(() => {
    const [count, setCount] = useState(0);
    return {
      count,
      increase: useEvent(() => setCount((c) => c + 1)),
    };
  });

  const Store2 = createStore(() => {
    const [text, setText] = useState("");
    return {
      text,
      setText: useEvent((value: string) => setText(value)),
    };
  });

  const Child = () => {
    const count = Store1.useStore((state) => state.count);
    const text = Store2.useStore((state) => state.text);
    const increase = Store1.useStore((state) => state.increase);
    const setText = Store2.useStore((state) => state.setText);
    return (
      <div>
        <span>Count: {count}</span>
        <span>Text: {text}</span>
        <button onClick={increase}>Increase</button>
        <button onClick={() => setText("hello")}>Set Text</button>
      </div>
    );
  };

  const App = () => {
    return (
      <ComposeProviders providers={[Store1.Provider, Store2.Provider]}>
        <Child />
      </ComposeProviders>
    );
  };

  const { getByText } = render(<App />);
  expect(getByText("Count: 0")).toBeDefined();
  expect(getByText("Text:")).toBeDefined();

  fireEvent.click(getByText("Increase"));
  expect(getByText("Count: 1")).toBeDefined();

  fireEvent.click(getByText("Set Text"));
  expect(getByText("Text: hello")).toBeDefined();
});
