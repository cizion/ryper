import { app, ActionsType, Children, Component } from "hyperapp";
interface Ref<Value> {
  current: Value;
}
interface Effect<Value> {
  depArray: Array<Value>;
  effectCallback?: Function;
}
interface Hook<StateValue, RefValue, EffectValue> {
  states: Array<StateValue>;
  refs: Array<Ref<RefValue>>;
  effects: Array<Effect<EffectValue>>;
}

const React = (() => {
  let rootActions: any = null;
  let wipRoot: any = null;
  let currentRoot: any = null;
  let nextUnitOfWork: any = null;
  let wipFiber: any = null;
  let statesIdx = 0;
  let effectsIdx = 0;
  let refsIdx = 0;
  let deletions: any[] = [];

  const isV2VNode = (el: any): boolean => {
    const V2NodeKeys = ["type", "props", "children", "node", "tag", "key"];
    return (
      typeof el === "object" &&
      V2NodeKeys.every((key) => Object.keys(el).includes(key))
    );
  };

  const versionDown = (newEl: any) => {
    const { key, children, tag, props } = newEl;
    const el = {
      nodeName: tag,
      attributes: props,
      children: children.map((child: any) =>
        typeof child !== "boolean" ? child : ""
      ),
      key,
    };

    return el;
  };

  const isEmpty = (arr: Array<any>, index: number): boolean => {
    return arr.length - 1 < index;
  };

  const flatDeep = (arr: any[], d = 1): any[] => {
    return d > 0
      ? arr.reduce(
          (acc, val) =>
            acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val),
          []
        )
      : arr.slice();
  };

  const createElement = (
    type: Component | string | number,
    attributes: { [key: string]: any } | null,
    ...children: Array<Children | Children[]>
  ): any => {
    console.log(type, attributes, children);
    const newProps = { ...attributes };
    // debugger;
    return {
      key: newProps.key,
      nodeName: type,
      attributes: newProps,
      children: flatDeep(children, Infinity).map((child) => {
        return typeof child === "object" ? child : createTextElement(child);
      }),
      type,
    };
  };

  const createTextElement = (text: string | number) => {
    return {
      nodeName: "TEXT_ELEMENT",
      attributes: {
        nodeValue: text,
      },
      children: [],
    };
  };

  const updateFunctionComponent = (fiber: any) => {
    wipFiber = fiber;
    statesIdx = 0;
    effectsIdx = 0;
    refsIdx = 0;

    const node = fiber.nodeName(fiber.attributes, fiber.children);
    const children = [isV2VNode(node) ? versionDown(node) : node];
    reconcileChildren(fiber, children);
  };

  const updateHostComponent = (fiber: any) => {
    reconcileChildren(fiber, fiber.children);
  };

  const reconcileChildren = (wipFiber: any, elements: any) => {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling: any = null;

    while (index < elements.length || oldFiber != null) {
      const element = elements[index];
      let newFiber: any = null;

      const newType = element && !oldFiber;
      const sameType =
        oldFiber &&
        element &&
        element.nodeName === oldFiber.nodeName &&
        element.key === oldFiber.key;

      if (newType) {
        newFiber = {
          key: element.key,
          nodeName: element.nodeName,
          attributes: element.attributes,
          children: element.children,
          parent: wipFiber,
          alternate: null,
          effectTag: "CREATE",
        };
      } else if (sameType) {
        newFiber = {
          key: oldFiber.key,
          nodeName: oldFiber.nodeName,
          attributes: element.attributes,
          children: element.children,
          parent: wipFiber,
          alternate: oldFiber,
          effectTag: "UPDATE",
        };
      } else {
        const oldParentFiberChildren = wipFiber.alternate.children;
        const nowParentFiberChildren = wipFiber.children;

        const deleteType =
          oldParentFiberChildren.length > nowParentFiberChildren.length;
        const addType =
          oldParentFiberChildren.length < nowParentFiberChildren.length;
        const changeType =
          oldParentFiberChildren.length === nowParentFiberChildren.length;

        if (addType) {
          newFiber = {
            key: element.key,
            nodeName: element.nodeName,
            attributes: element.attributes,
            children: element.children,
            parent: wipFiber,
            alternate: null,
            effectTag: "CREATE",
          };
        }
        if (changeType) {
          newFiber = {
            key: element.key,
            nodeName: element.nodeName,
            attributes: element.attributes,
            parent: wipFiber,
            children: element.children,
            alternate: null,
            effectTag: "CHANGE",
          };
          oldFiber.effectTag = "DELETION";
          deletions.push(oldFiber);
        }
        if (deleteType) {
          oldFiber.effectTag = "DELETION";
          deletions.push(oldFiber);
        }
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }

      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (element && prevSibling) {
        prevSibling.sibling = newFiber;
      }

      if (wipFiber.nodeName instanceof Function) {
        let targetFiber = wipFiber.parent;
        let changeFiber = wipFiber;
        while (targetFiber.nodeName instanceof Function) {
          targetFiber = targetFiber.parent;
          changeFiber = targetFiber;
        }
        const index = targetFiber.children.findIndex(
          (child: any) => child === changeFiber || child === wipFiber
        );
        targetFiber.children[index] = wipFiber.child;
      } else if (
        newFiber?.nodeName === "TEXT_ELEMENT" &&
        typeof newFiber?.attributes.nodeValue !== "boolean"
      ) {
        elements[index] = newFiber.attributes.nodeValue;
      } else if (
        newFiber?.nodeName === "TEXT_ELEMENT" &&
        typeof newFiber?.attributes.nodeValue === "boolean"
      ) {
        elements[index] = "";
      } else {
        elements[index] = newFiber;
      }

      prevSibling = newFiber;

      index++;
    }
  };

  const performUnitOfWork = (fiber: any) => {
    const isFunctionComponent = fiber.nodeName instanceof Function;
    if (isFunctionComponent) {
      updateFunctionComponent(fiber);
    } else {
      updateHostComponent(fiber);
    }

    if (fiber.child) {
      return fiber.child;
    }

    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent;
    }
  };

  const commitWork = (fiber: any) => {
    if (!fiber) {
      return;
    }

    if (fiber.hook) {
      fiber.hook.effects.forEach((effect: any) => {
        effect.effectCallback && effect.effectCallback();
      });
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
  };

  const commitRoot = () => {
    deletions.forEach((fiber: any) => {
      fiber.sibling = undefined;
      commitWork(fiber);
    });
    currentRoot = wipRoot;
    wipRoot = null;
  };

  const workLoop = () => {
    while (nextUnitOfWork) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }

    if (!nextUnitOfWork && wipRoot) {
      commitRoot();
    }
  };

  const initView = (view: JSX.Element) => {
    wipRoot = {
      attributes: {},
      children: [view],
      alternate: currentRoot,
    };

    nextUnitOfWork = wipRoot;

    workLoop();

    console.log(currentRoot.children[0]);

    return currentRoot.children[0];
  };

  const initActions = <State, Actions>(
    actions: ActionsType<State, Actions>
  ): ActionsType<State, Actions> => {
    return {
      ...actions,
      __change: () => (state) => ({ ...state }),
      __getState: () => (state) => state,
    };
  };

  const render = <State, Actions>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: JSX.Element,
    container: Element | null
  ) => {
    rootActions = app<State, Actions>(
      state,
      initActions(actions),
      () => initView(view),
      container
    );
  };

  const getHook = <StateValue, RefValue, EffectValue>(): Hook<
    StateValue,
    RefValue,
    EffectValue
  > => {
    const nowHook: Hook<StateValue, RefValue, EffectValue> = wipFiber.hook;
    const oldHook: Hook<StateValue, RefValue, EffectValue> =
      wipFiber?.alternate?.hook;
    const newHook: Hook<StateValue, RefValue, EffectValue> = {
      states: [],
      effects: [],
      refs: [],
    };

    return nowHook || oldHook || newHook;
  };

  const useState = <Value>(
    initValue: Value
  ): [value: Value, setState: (newValue: Value) => void] => {
    const hook = getHook();
    wipFiber.hook = hook;

    const _statesIdx = statesIdx++;
    const _states = wipFiber.hook.states;

    const setState = (newValue: Value, flag = true) => {
      if (flag && _states[_statesIdx] === newValue) {
        return;
      }

      _states[_statesIdx] = newValue;

      flag && rootActions.__change();
    };
    isEmpty(_states, _statesIdx) && setState(initValue, false);

    const _state = _states[_statesIdx];
    return [_state, setState];
  };

  const useEffect = <Value>(effect: Function, depArray: Array<Value>) => {
    const hook = getHook();
    wipFiber.hook = hook;

    const _effectsIdx = effectsIdx++;
    const _effects = wipFiber.hook.effects;
    let newEffect: Effect<Value> = { depArray };

    let hasChange = true;

    if (!isEmpty(_effects, _effectsIdx)) {
      newEffect.effectCallback = _effects[_effectsIdx].effectCallback;

      const oldDepArray = _effects[_effectsIdx].depArray;
      hasChange = depArray.some((dep, i) => !Object.is(dep, oldDepArray[i]));
    }

    if (hasChange) {
      setTimeout(async () => {
        newEffect.effectCallback = await effect();
      });
    }

    _effects[_effectsIdx] = newEffect;
  };

  const useRef = <Value>(value: Value): Ref<Value> => {
    const hook = getHook();
    wipFiber.hook = hook;

    const _refsIdx = refsIdx++;
    const _refs = wipFiber.hook.refs;
    const newRef: Ref<Value> = { current: value };

    isEmpty(_refs, _refsIdx) && (_refs[_refsIdx] = newRef);

    return _refs[_refsIdx];
  };

  const getState = (selector?: (state: any) => any): any => {
    const state = rootActions.__getState();
    return selector ? selector(state) : state;
  };

  const getActions = (selector?: (state: any) => any): any => {
    return selector ? selector(rootActions) : rootActions;
  };

  const Fragment = (attributes: any, children: any[]) => {
    return createElement("", attributes, ...children);
  };

  return {
    getState,
    getActions,
    createElement,
    render,
    useState,
    useEffect,
    useRef,
    Fragment,
  };
})();

const { getState, getActions, useState, useEffect, useRef } = React;
export { app, getState, getActions, useState, useEffect, useRef };
export default React;
