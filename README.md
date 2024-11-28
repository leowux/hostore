# Hostore

![npm](https://img.shields.io/npm/v/hostore?style=flat-square)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/hostore?style=flat-square)
![NPM](https://img.shields.io/npm/l/hostore?style=flat-square)
![npm](https://img.shields.io/npm/dy/hostore?style=flat-square)

简单、高效的 React hooks 状态管理方案。

## 安装

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

## 示例

### 基础示例

```tsx
import { useState } from "react";
import { createStore, useEvent } from "hostore";

// 创建 Store
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

// 消费 Store
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

// 提供 Store
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

### 性能优化

上述示例中，由于 `React Context` 的更新机制，导致每次 `count` 更新时，所有子组件（`Child1` `Child2` `Child3`）都会重新渲染。（理想情况是只更新 `count` 所在 `Child1`。）

为了解决上述子组件重复渲染的问题，`hostore` 提供「选择更新」功能：通过给 `useStore(selector)` 传递 `selector` 函数，开发者可以选择需要获取的状态。只有被选择的状态更新时，才会重新渲染该组件。

同时，`hostore` 还提供 `useEvent` 用来代替 `useCallback` ，在不需要传依赖数组的前提下保证「函数引用的恒定」。

```tsx
// 创建 Store
export const CounterStore = createStore(() => {
  const [count, setCount] = useState(0);
  // 使用 useEvent 保证函数引用不会改变
  const increase = useEvent(() => {
    setCount((v) => v + 1);
  });
  // 使用 useEvent 保证函数引用不会改变
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
  // 使用 selector 函数选择 count 属性，当且仅当 count 变动时，组件重新渲染。
  const count = CounterStore.useStore((state) => state.count);
  return <div>{count}</div>;
};
const Child2 = () => {
  // 使用 selector 函数选择 increase 属性，当且仅当 increase 变动时，组件重新渲染。
  const increase = CounterStore.useStore((state) => state.increase);
  return <button onClick={increase}>Increase</button>;
};
const Child3 = () => {
  // 使用 selector 函数选择 decrease 属性，当且仅当 decrease 变动时，组件重新渲染。
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

传入一个自定义 `Hook`，创建一个 `Store` 对象。

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

提供 `Store`。

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

提供 `Store`，并设置参数 `props`。

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

消费 `Store`。当 `Store` 的值变化，触发组件的 `rerender`。

```tsx
const Child = () => {
  const { count } = CounterStore.useStore();
  return <div>{count}</div>;
};
```

### `Store.useStore(selector)`

消费 `Store`，并传入 `selector` 选择函数。只有当被选择的值发生变化时，才会触发组件的 `rerender`。

```tsx
const Child = () => {
  const count = CounterStore.useStore((value) => value.count);
  // 当且仅当 count 值变化时，才会重新渲染组件
  return <div>{count}</div>;
};
```

### `useEvent(callback)`

传入一个函数，返回一个恒定的函数引用（不需要传 `deps` 的 `useCallback`）。可以用来避免函数引用变更造成的无效重复渲染，以优化性能。

```tsx
// 返回恒定的函数引用
const increase = useEvent(() => {
  setCount((v) => v + 1);
});
```

### `<ComposeProviders providers />`

用于优雅地组合多个 `Provider`，避免层层嵌套。

```tsx
const App = () => {
  return (
    // 组合多个 Provider
    <ComposeProviders providers={[CounterStore.Provider, ToggleStore.Provider]}>
      <Child />
    </ComposeProviders>
  );
};
```

完整示例：

```tsx
import { useState } from "react";
import { ComposeProviders, createStore, useEvent } from "./hostore";
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
    // 组合多个 Provider
    <ComposeProviders providers={[CounterStore.Provider, ToggleStore.Provider]}>
      <Child />
    </ComposeProviders>
  );
};
export default App;
```
