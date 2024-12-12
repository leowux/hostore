# Hostore

![npm](https://img.shields.io/npm/v/hostore?style=flat-square)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/hostore?style=flat-square)
![NPM](https://img.shields.io/npm/l/hostore?style=flat-square)
![npm](https://img.shields.io/npm/dy/hostore?style=flat-square)

[English](README.md) | [简体中文](README.zh_CN.md)

A simple and efficient state management solution for React hooks.

## Installation

npm:

```bash
npm i hostore
```

yarn:

```bash
yarn add hostore
```

pnpm:

```bash
pnpm i hostore
```

## Examples

### Basic Example

Firstly, create a `Store` by using `createStore`, passing a custom hook.

```tsx
import { useState } from "react";
import { createStore } from "hostore";

// Create a Store
const CounterStore = createStore(() => {
  const [count, setCount] = useState(0);
  const increase = () => {
    setCount((v) => v + 1);
  };
  const decrease = () => {
    setCount((v) => v - 1);
  };
  return {
    count,
    increase,
    decrease,
  };
});
```

Next, use the `CounterStore.Provider` to wrap child components.

```tsx
// Provide a Store
const App = () => {
  return (
    <CounterStore.Provider>
      <Child1 />
      <Child2 />
      <Child3 />
    </CounterStore.Provider>
  );
};
export default App;
```

Lastly, use `Store.useStore` in child components to get the custom hook's state and methods.

```tsx
// Consume a Store
const Child1 = () => {
  const { count } = CounterStore.useStore();
  return <div>{count}</div>;
};
const Child2 = () => {
  const { increase } = CounterStore.useStore();
  return <button onClick={increase}>Increase</button>;
};
const Child3 = () => {
  const { decrease } = CounterStore.useStore();
  return <button onClick={decrease}>Decrease</button>;
};
```

### Performance Optimization

In the above example, due to the update mechanism of `React Context`, every time `count` is updated, all child components (`Child1`, `Child2`, `Child3`) will re-render. (The ideal situation is to only update `count` in `Child1`.)

To solve the problem of repeated rendering of child components, `hostore` provides a 'selective update' feature: by passing a `selector` function to `useStore(selector)`, developers can choose the state they need. Only when the selected state is updated will the component re-render.

At the same time, `hostore` also provides `useEvent` to replace `useCallback`, ensuring a 'constant function reference' without the need to pass a dependency array.

```tsx
import { useState } from "react";
import { createStore } from "hostore";

// Create Store
export const CounterStore = createStore(() => {
  const [count, setCount] = useState(0);
  // Use useEvent to ensure the function reference does not change
  const increase = useEvent(() => {
    setCount((v) => v + 1);
  });
  // Use useEvent to ensure the function reference does not change
  const decrease = useEvent(() => {
    setCount((v) => v - 1);
  });
  return {
    count,
    increase,
    decrease,
  };
});

const Child1 = () => {
  // Use selector function to select count property, and the component will re-render only when count changes.
  const count = CounterStore.useStore((state) => state.count);
  return <div>{count}</div>;
};
const Child2 = () => {
  // Use selector function to select increase property, and the component will re-render only when increase changes.
  const increase = CounterStore.useStore((state) => state.increase);
  return <button onClick={increase}>Increase</button>;
};
const Child3 = () => {
  // Use selector function to select decrease property, and the component will re-render only when decrease changes.
  const decrease = CounterStore.useStore((state) => state.decrease);
  return <button onClick={decrease}>Decrease</button>;
};

const App = () => {
  return (
    <CounterStore.Provider>
      <Child1 />
      <Child2 />
      <Child3 />
    </CounterStore.Provider>
  );
};
```

## API

### `createStore(useHook)`

Pass a custom `Hook` to create a `Store` object.

```tsx
import { useState } from "react";
import { createStore } from "hostore";

const CounterStore = createStore(() => {
  const [count, setCount] = useState(0);
  const increase = () => {
    setCount((v) => v + 1);
  };
  const decrease = () => {
    setCount((v) => v - 1);
  };
  return {
    count,
    increase,
    decrease,
  };
});
```

### `<Store.Provider>`

Provide `Store`.

```tsx
const App = () => {
  return (
    <CounterStore.Provider>
      <Child1 />
      <Child2 />
      <Child3 />
    </CounterStore.Provider>
  );
};
```

### `<Store.Provider props>`

Provide `Store` and set parameters `props`.

```tsx
const CounterStore = createStore((props: { initialCount: number }) => {
  const [count, setCount] = useState(props.initialCount);
  // ...
});

const App = () => {
  return (
    <CounterStore.Provider props={{ initialCount: 0 }}>
      <Child1 />
      <Child2 />
      <Child3 />
    </CounterStore.Provider>
  );
};
```

### `Store.useStore()`

Consume `Store`. When the `Store` value changes, trigger component `rerender`.

```tsx
const Child = () => {
  const { count } = CounterStore.useStore();
  return <div>{count}</div>;
};
```

### `Store.useStore(selector)`

Consume `Store` and pass in `selector` selection function. The component will only trigger `rerender` when the selected value changes.

```tsx
const Child = () => {
  const count = CounterStore.useStore((value) => value.count);
  // The component will only re-render when the count value changes
  return <div>{count}</div>;
};
```

### `useEvent(callback)`

Pass a function and return a constant function reference (a `useCallback` without `deps`). It can be used to avoid unnecessary re-renders caused by changes in function references, optimizing performance.

```tsx
// Return a constant function reference
const increase = useEvent(() => {
  setCount((v) => v + 1);
});
```

### `<ComposeProviders providers />`

Used to elegantly combine multiple `Provider`s to avoid nested structures.

```tsx
const App = () => {
  return (
    // Combine multiple Providers
    <ComposeProviders providers={[CounterStore.Provider, ToggleStore.Provider]}>
      <Child />
    </ComposeProviders>
  );
};
```

Complete Example:

```tsx
import { useState } from "react";
import { ComposeProviders, createStore, useEvent } from "hostore";
const CounterStore = createStore(() => {
  const [count, setCount] = useState(0);
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
const ToggleStore = createStore(() => {
  const [state, setState] = useState(false);
  const toggle = useEvent(() => {
    setState((v) => !v);
  });
  return {
    toggle,
    state,
  };
});
const Child = () => {
  const { count, increase, decrease } = CounterStore.useStore();
  const { state, toggle } = ToggleStore.useStore();
  return (
    <>
      <div>
        <div>Count: {count}</div>
        <button onClick={increase}>Increase</button>
        <button onClick={decrease}>Decrease</button>
      </div>
      <div>
        <div>State: {String(state)}</div>
        <button onClick={toggle}>Toggle</button>
      </div>
    </>
  );
};
const App = () => {
  return (
    // Combine multiple Providers
    <ComposeProviders providers={[CounterStore.Provider, ToggleStore.Provider]}>
      <Child />
    </ComposeProviders>
  );
};
export default App;
```
