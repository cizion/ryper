import { ActionsType, app } from "../../hyperapp";
import { EffectTag, ROOT_TYPE } from "./constants";
import { createDom } from "./dom";
import { createChildrenElement } from "./fiber";
import { ElChildren, ElProps, ElType, Fiber, Hook, Ref } from "./type";
import { isEmpty, isEmptyArrIndex } from "./utils";

const React = (() => {
  let rootActions: any;
  let wipRoot: Fiber | undefined;
  let currentRoot: Fiber | undefined;
  let nextUnitOfWork: Fiber | undefined;
  let wipFiber: Fiber | undefined;
  let statesIdx = 0;
  let effectsIdx = 0;
  let refsIdx = 0;
  let memosIdx = 0;
  let callbacksIdx = 0;
  let deletions: Fiber[] = [];

  const resetIdx = () => {
    statesIdx = 0;
    effectsIdx = 0;
    refsIdx = 0;
    memosIdx = 0;
    callbacksIdx = 0;
  };

  const commitWork = (fiber?: Fiber) => {
    if (!fiber) {
      return;
    }

    let domParentFiber = fiber.parent;

    while (!domParentFiber?.dom) {
      domParentFiber = domParentFiber?.parent;
    }

    const domParent = domParentFiber.dom;

    !isEmpty(fiber.dom) && domParent.children.push(fiber.dom);

    commitWork(fiber.child);
    commitWork(fiber.sibling);
  };

  const commitDeletion = (fiber?: Fiber) => {
    if (!fiber) {
      return;
    }

    fiber.hook?.effects.forEach((effect: any) => {
      effect.returnCallback && effect.returnCallback();
    });

    commitDeletion(fiber.child);
    commitDeletion(fiber.sibling);
  };

  const commitRoot = () => {
    deletions.forEach(commitDeletion);
    commitWork(wipRoot?.child);
  };

  const reconcileChildren = (wipFiber: Fiber, elements: Fiber[]): Fiber => {
    let index = 0;
    let oldFiber = wipFiber?.alternate?.child;
    let prevSibling: Fiber | undefined;

    while (index < elements.length || !isEmpty(oldFiber)) {
      const element = elements[index];
      let newFiber: Fiber | undefined;

      const sameType =
        element &&
        oldFiber &&
        element.type === oldFiber.type &&
        element.props.key === oldFiber.props.key;

      if (sameType) {
        newFiber = {
          type: element.type,
          props: element.props,
          parent: wipFiber,
          alternate: oldFiber,
          effectTag: EffectTag.Update,
        };
      }

      if (element && !sameType) {
        newFiber = {
          type: element.type,
          props: element.props,
          parent: wipFiber,
          effectTag: EffectTag.Placement,
        };
      }

      if (oldFiber && !sameType) {
        const newDeletion = {
          ...oldFiber,
          sibling: undefined,
          effectTag: EffectTag.Deletion,
        };
        deletions.push(newDeletion);
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }

      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (element && prevSibling) {
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
      index++;
    }

    return wipFiber;
  };

  const updateComponent = (fiber: Fiber): [Fiber, Fiber[]] => {
    wipFiber = fiber;
    resetIdx();

    const { children, ...attributes } = fiber.props;

    if (fiber.type instanceof Function) {
      const newChildren = createChildrenElement([
        fiber.type(attributes, children),
      ]);
      return [fiber, newChildren];
    } else {
      fiber.dom = createDom(fiber);
      return [fiber, children];
    }
  };

  const performUnitOfWork = (fiber: Fiber): Fiber | undefined => {
    const [wipFiber, elements] = updateComponent(fiber);
    const newFiber = reconcileChildren(wipFiber, elements);

    let nextFiber: Fiber | undefined = newFiber;

    if (newFiber.child) {
      nextFiber = newFiber.child;
    } else {
      while (nextFiber) {
        if (nextFiber.sibling) {
          nextFiber = nextFiber.sibling;
          break;
        }
        nextFiber = nextFiber.parent;
      }
    }

    return nextFiber;
  };

  const workLoop = () => {
    while (nextUnitOfWork) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }

    commitRoot();
  };

  const createElement = (
    type: ElType,
    props: ElProps,
    ...children: ElChildren
  ): Fiber => ({
    type,
    props: {
      ...props,
      children: createChildrenElement(children),
    },
  });

  const initView =
    <State, Actions>(view: Fiber) =>
    (_state: State, _actions: Actions) => {
      wipRoot = {
        type: ROOT_TYPE,
        props: {
          children: [view],
        },
        alternate: currentRoot,
      };

      nextUnitOfWork = wipRoot;

      workLoop();

      currentRoot = wipRoot;
      wipRoot = undefined;
      nextUnitOfWork = undefined;
      wipFiber = undefined;
      deletions = [];
      resetIdx();

      return currentRoot.dom;
    };

  const initActions = <State, Actions>(
    actions: ActionsType<State, Actions>
  ): ActionsType<State, Actions> => ({
    ...actions,
    __setState: () => (state) => ({ ...state }),
    __getState: () => (state) => state,
  });

  const render = <State, Actions>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: Fiber,
    container: Element | null
  ) => {
    rootActions = app(state, initActions(actions), initView(view), container);
  };

  const getState = (selector?: (state: any) => any): any => {
    const state = rootActions.__getState();
    return selector ? selector(state) : state;
  };

  const getActions = (selector?: (state: any) => any): any => {
    const { __getState, __setState, ...actions } = rootActions;
    return selector ? selector(rootActions) : actions;
  };

  const getHook = <StateValue, RefValue, MemoValue, CallbackValue>(): Hook<
    StateValue,
    RefValue,
    MemoValue,
    CallbackValue
  > => {
    const nowHook = wipFiber?.hook;
    const oldHook = wipFiber?.alternate?.hook;
    const newHook = {
      states: [],
      effects: [],
      refs: [],
      memos: [],
      callbacks: [],
    };

    return oldHook ?? nowHook ?? newHook;
  };

  const useState = <Value>(
    initValue: Value
  ): [Value, (newValue: Value) => void] => {
    if (!wipFiber) {
      return [initValue, () => {}];
    }

    const hook = getHook();
    wipFiber.hook = hook;

    const __statesIdx = statesIdx++;
    const __states = wipFiber.hook.states;

    const setState = (newValue: Value, flag = true) => {
      if (__states[__statesIdx] === newValue) {
        return;
      }

      __states[__statesIdx] = newValue;

      flag && rootActions.__setState();
    };

    isEmptyArrIndex(__states, __statesIdx) &&
      (__states[__statesIdx] = initValue);

    const __state = __states[__statesIdx];

    return [__state, setState];
  };

  const useEffect = (effect: Function, depArray: Array<any>): void => {
    if (!wipFiber) {
      return;
    }

    const hook = getHook();
    wipFiber.hook = hook;

    const __effectsIdx = effectsIdx++;
    const __effects = wipFiber.hook.effects;

    let hasChange = true;

    if (!isEmptyArrIndex(__effects, __effectsIdx)) {
      const oldDepArray = __effects[__effectsIdx].depArray;
      hasChange = depArray.some((dep, i) => !Object.is(dep, oldDepArray[i]));
    }

    if (hasChange) {
      __effects[__effectsIdx] = { depArray };

      setTimeout(async () => {
        __effects[__effectsIdx].returnCallback = await effect();
      });
    }
  };

  const useRef = <Value>(initValue: Value): Ref<Value> => {
    if (!wipFiber) {
      return { current: initValue };
    }

    const hook = getHook();
    wipFiber.hook = hook;

    const __refsIdx = refsIdx++;
    const __refs = wipFiber.hook.refs;

    isEmptyArrIndex(__refs, __refsIdx) &&
      (__refs[__refsIdx] = { current: initValue });

    return __refs[__refsIdx];
  };

  const useMemo = <Value>(
    compute: () => Value,
    depArray: Array<any>
  ): Value => {
    if (!wipFiber) {
      return compute();
    }

    const hook = getHook();
    wipFiber.hook = hook;

    const __memosIdx = memosIdx++;
    const __memos = wipFiber.hook.memos;

    let hasChange = true;

    if (!isEmptyArrIndex(__memos, __memosIdx)) {
      const oldDepArray = __memos[__memosIdx].depArray;
      hasChange = depArray.some((dep, i) => !Object.is(dep, oldDepArray[i]));
    }

    if (hasChange) {
      const computed = compute();
      __memos[__memosIdx] = { depArray, computed };
    }

    return __memos[__memosIdx].computed;
  };

  const useCallback = <Value>(
    hooksCallback: Value,
    depArray: Array<any>
  ): Value => {
    if (!wipFiber) {
      return hooksCallback;
    }

    const hook = getHook();
    wipFiber.hook = hook;

    const __callbacksIdx = callbacksIdx++;
    const __callbacks = wipFiber.hook.callbacks;

    let hasChange = true;

    if (!isEmptyArrIndex(__callbacks, __callbacksIdx)) {
      const oldDepArray = __callbacks[__callbacksIdx].depArray;
      hasChange = depArray.some((dep, i) => !Object.is(dep, oldDepArray[i]));
    }

    if (hasChange) {
      __callbacks[__callbacksIdx] = { depArray, hooksCallback };
    }

    return __callbacks[__callbacksIdx].hooksCallback;
  };

  const Fragment = (_props: ElProps, children: ElChildren) => {
    return children;
  };

  return {
    getState,
    getActions,
    createElement,
    render,
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    Fragment,
  };
})();

export const {
  getState,
  getActions,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} = React;
export default React;
