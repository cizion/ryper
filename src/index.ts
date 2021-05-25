import {
  ActionsType,
  app,
  Children,
  Component,
  h,
  View,
  VNode,
} from "hyperapp";
interface V2VNode {
  type: any;
  props: any;
  children: any;
  node: any;
  tag: any;
  key: any;
  memo?: any;
  events?: any;
}
interface RyperAttributes {
  oncreate?: null | ((_el: Element) => void);
  onupdate?: null | ((_el: Element) => void);
  ondestroy?: null | ((_el: Element) => void);
  ref?: null | Ref<any>;
  [key: string]: any;
}
interface RyperVNode extends VNode {
  attributes?: RyperAttributes;
  parent?: RyperVNode;
  oldParent?: RyperVNode;
}
interface RyperView<State, Actions> extends View<State, Actions> {
  (
    state?: State,
    actions?: Actions,
    props?: RyperAttributes,
    children?: Array<Children | Children[]>
  ): RyperVNode;
  [x: string]: any;
}
interface RyperComponent<State, Actions> extends Component {
  (
    attributes: RyperAttributes,
    children: Array<Children | Children[]>
  ): RyperResult<State, Actions>;
}
type RyperResult<State, Actions> =
  | RyperView<State, Actions>
  | RyperVNode
  | V2VNode;
interface Ref<Value> {
  current: Value;
}
interface Effect<Value> {
  depArray: Array<Value>;
  effect: Function;
  effectCallback?: Function;
  hasChange: boolean;
}
interface Hook<State, Actions, StateValue, RefValue, EffectValue> {
  type: RyperComponent<State, Actions>;
  key: string | number | null;
  states: Array<StateValue>;
  refs: Array<Ref<RefValue>>;
  effects: Array<Effect<EffectValue>>;
  el?: RyperVNode;
}
declare global {
  namespace JSX {
    interface Element extends RyperView<any, any> {}
  }
  interface Window {
    hooks: Array<any>;
  }
}
declare module "hyperapp" {
  function app<State, Actions>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: () => RyperView<State, Actions>,
    container: Element | null
  ): Actions;
}

const React = (() => {
  let createRyperViewKey = Symbol();
  let rootActions: any;

  let parent: RyperVNode | undefined;

  let hooksIdx = 0;
  let statesIdx = 0;
  let effectsIdx = 0;
  let refsIdx = 0;

  let hooks: Array<Hook<any, any, any, any, any>> = [];

  let keys: Array<number> = [];

  let elements: Array<RyperVNode> = [];
  let oldElements: Array<RyperVNode> = [];

  const isEmpty = (arr: Array<any>, index: number): boolean => {
    return arr.length - 1 < index;
  };
  const isNotSameComponent = <
    State,
    Actions,
    StateValue,
    RefValue,
    EffectValue
  >(
    type: RyperComponent<State, Actions>,
    key: any,
    component?: Hook<State, Actions, StateValue, RefValue, EffectValue>
  ): boolean => {
    return type !== component?.type || (key && key !== component?.key);
  };
  const isComponent = (type: Component | string): type is Component => {
    return typeof type === "function";
  };
  const isRyperView = <State, Actions>(
    elFn: RyperResult<State, Actions>
  ): elFn is RyperView<State, Actions> => {
    return typeof elFn === "function" && elFn.key === createRyperViewKey;
  };
  const isV2VNode = (el: V2VNode | any): el is V2VNode => {
    const V2NodeKeys = ["type", "props", "children", "node", "tag", "key"];
    return (
      typeof el === "object" &&
      V2NodeKeys.every((key) => Object.keys(el).includes(key))
    );
  };
  const getKey = (): number => {
    let key = Date.now();
    if (keys.includes(key)) {
      key = getKey();
    } else {
      keys.push(key);
    }

    return key;
  };
  // const isVNode = (el: VNode | any): el is VNode => {
  //   const VNodeKeys = ["nodeName", "attributes", "children", "key"];
  //   return (
  //     typeof el === "object" &&
  //     VNodeKeys.every((key) => Object.keys(el).includes(key))
  //   );
  // };
  const versionDown = <State, Actions>(newEl: V2VNode): VNode => {
    const { key, children, tag, props } = newEl;
    const el = {
      nodeName: tag,
      attributes: props,
      children: children.map((child: RyperResult<State, Actions>) =>
        typeof child !== "boolean" ? child : ""
      ),
      key,
    };

    return el;
  };
  const convertVersion = (newEl: V2VNode | VNode): VNode => {
    return isV2VNode(newEl) ? versionDown(newEl) : newEl;
  };
  const getVNode = <State, Actions>(
    newEl: RyperResult<State, Actions>
  ): VNode => {
    const el: V2VNode | VNode = isRyperView(newEl) ? newEl() : newEl;
    return convertVersion(el);
  };
  const getEl = <State, Actions>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode => {
    const result: RyperResult<State, Actions> = h(type, props, ...children);
    const el = getVNode(result);
    return el;
  };
  const getParent = (el?: RyperVNode): RyperVNode | undefined => {
    let result;

    if (
      !el ||
      el === el.parent ||
      el.children.some((child: any) => child.isComponent)
    ) {
      result = el;
    } else {
      result = getParent(el.parent);
    }

    return result;
  };
  const getChildren = <State, Actions>(el?: RyperResult<State, Actions>) => {
    let children: Array<RyperResult<State, Actions>> = [];
    if (!el || !el.children) {
      return children;
    } else {
      children = el.children.reduce(
        (
          result: Array<RyperResult<State, Actions>>,
          child: RyperResult<State, Actions>
        ) => {
          return [...result, ...getChildren(child)];
        },
        [el]
      );
    }

    return children;
  };
  const createHook = <State, Actions, StateValue, RefValue, EffectValue>(
    type: RyperComponent<State, Actions>
  ): Hook<State, Actions, StateValue, RefValue, EffectValue> => {
    let _hook: Hook<State, Actions, StateValue, RefValue, EffectValue> = {
      key: getKey(),
      type: type,
      states: [],
      effects: [],
      refs: [],
    };

    return _hook;
  };
  const componentInit = <State, Actions, StateValue, RefValue, EffectValue>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes
  ): Hook<State, Actions, StateValue, RefValue, EffectValue> => {
    parent = getParent(parent);

    const _hooksIdx = hooksIdx++;
    let _hook: Hook<any, any, any, any, any>;

    if (isEmpty(hooks, _hooksIdx)) {
      _hook = createHook(type);
      hooks[_hooksIdx] = _hook;
    } else if (isNotSameComponent(type, props.key, hooks[_hooksIdx])) {
      const parentKey = parent?.key;
      const newParent = elements.find((el) => el.key === parentKey);
      const oldParent = oldElements.find((el) => el.key === parentKey);

      const deleteFn = () => {
        const children = getChildren(hooks[_hooksIdx].el);
        children.forEach((child) => {
          let flag: boolean;
          do {
            const i = hooks.findIndex((hook) => hook.key === child.key);
            flag = !!~i;
            flag && hooks.splice(i, 1);
          } while (flag);
        });
        return hooks[_hooksIdx];
      };
      const addFn = () => {
        const _hook = createHook(type);
        hooks.splice(_hooksIdx, 0, _hook);
        return _hook;
      };

      if (!oldParent) {
        // children add
        // console.log("children add");
        _hook = addFn();
      } else if (!newParent) {
        // children del
        // console.log("children del");
        _hook = deleteFn();
      } else if (oldParent.children.length < newParent.children.length) {
        // add
        // console.log("add");
        _hook = addFn();
      } else if (oldParent.children.length > newParent.children.length) {
        // del
        // console.log("del");
        _hook = deleteFn();
      } else {
        // change
        // console.log("change");
        deleteFn();
        _hook = addFn();
      }
    } else {
      _hook = hooks[_hooksIdx];
    }

    return _hook;
  };
  const componentFinal = (el: RyperVNode) => {
    statesIdx = 0;
    effectsIdx = 0;
    refsIdx = 0;

    elements.push(el);
    parent = getParent(el);
  };
  const componentRender = <State, Actions>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): RyperVNode => {
    const _hook = componentInit(type, props);
    const el: RyperVNode = getEl(type, props, children);
    const key = props.key || el.key || _hook.key;
    _hook.key = key;
    _hook.el = el;
    el.key = key;
    el.parent = parent;

    const elementProps = el.attributes || (el.attributes = {});

    const oldCreate = elementProps.oncreate;
    elementProps.oncreate = (_el) => {
      elementProps.ref && (elementProps.ref.current = _el);
      // console.log("oncreate", _hook);
      _hook.effects.forEach((e) => {
        e.effectCallback = e.hasChange && e.effect();
      });
      oldCreate && oldCreate(_el);
    };

    const oldUpdate = elementProps.onupdate;
    elementProps.onupdate = (_el) => {
      elementProps.ref && (elementProps.ref.current = _el);
      // console.log("onupdate", _hook);
      _hook.effects.forEach((e) => {
        e.effectCallback = e.hasChange && e.effect();
      });
      oldUpdate && oldUpdate(_el);
    };

    const oldDestroy = elementProps.ondestroy;
    elementProps.ondestroy = (_el) => {
      // console.log("ondestroy", _hook);
      _hook.effects.forEach((e) => {
        e.effectCallback && e.effectCallback();
      });

      oldDestroy && oldDestroy(_el);
    };

    componentFinal(el);
    return el;
  };
  const elementRender = (
    type: string,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): RyperVNode => {
    const oldCreate = props.oncreate;
    props.oncreate = (_el) => {
      props.ref && (props.ref.current = _el);
      oldCreate && oldCreate(_el);
    };

    const oldUpdate = props.onupdate;
    props.onupdate = (_el) => {
      props.ref && (props.ref.current = _el);
      oldUpdate && oldUpdate(_el);
    };

    const oldDestroy = props.ondestroy;
    props.ondestroy = (_el) => {
      oldDestroy && oldDestroy(_el);
    };

    return h(type, props, ...children);
  };
  const createElement = <State, Actions>(
    type: RyperComponent<State, Actions> | string,
    props: RyperAttributes,
    ...children: Array<Children | Children[]>
  ): RyperView<State, Actions> => {
    const createRyperView = (
      ...params: [
        state?: State,
        actions?: Actions,
        props?: RyperAttributes,
        children?: Array<Children | Children[]>
      ]
    ): RyperVNode => {
      const [, , addProps = {}, addChildren = []] = params;
      const newProps = { ...props, ...addProps };
      const newChildren = [...children, ...addChildren];

      return isComponent(type)
        ? componentRender(type, newProps, newChildren)
        : elementRender(type, newProps, newChildren);
    };
    createRyperView.key = createRyperViewKey;
    createRyperView.isComponent = isComponent(type);

    return createRyperView;
  };
  const cloneElement = <State, Actions>(
    component: RyperView<State, Actions>,
    props?: RyperAttributes,
    ...children: Array<Children | Children[]>
  ): RyperVNode => {
    return component(undefined, undefined, props, children);
  };
  const createActions = <State, Actions>(
    actions: ActionsType<State, Actions>
  ): ActionsType<State, Actions> => {
    return {
      ...actions,
      change: () => (state) => ({ ...state }),
      getState: () => (state) => state,
    };
  };
  const init = <State, Actions>(
    view: RyperView<State, Actions>
  ): RyperView<State, Actions> => {
    parent = undefined;
    oldElements = elements;
    elements = [];

    hooksIdx = 0;
    statesIdx = 0;
    effectsIdx = 0;
    refsIdx = 0;

    window.hooks = hooks;

    return view;
  };
  const render = <State, Actions>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: RyperView<State, Actions>,
    container: Element | null
  ): void => {
    rootActions = app(
      state,
      createActions(actions),
      () => init(view),
      container
    );
  };

  const useState = <Value>(
    initValue: Value
  ): [value: Value, setState: (newValue: Value) => void] => {
    const _hooksIdx = hooksIdx - 1;
    const _hook = hooks[_hooksIdx];

    const _statesIdx = statesIdx++;
    const _states = _hook.states;

    const setState = (newValue: Value, flag = true) => {
      if (flag && _states[_statesIdx] === newValue) {
        return;
      }

      _states[_statesIdx] = newValue;

      flag && rootActions.change();
    };
    isEmpty(_states, _statesIdx) && setState(initValue, false);

    const _state = _states[_statesIdx];
    return [_state, setState];
  };
  const useEffect = <Value>(effect: Function, depArray: Array<Value>) => {
    const _hooksIdx = hooksIdx - 1;
    const _hook = hooks[_hooksIdx];

    const _effectsIdx = effectsIdx++;
    const _effects = _hook.effects;
    let newEffect: Effect<Value> = { effect, depArray, hasChange: true };

    if (!isEmpty(_effects, _effectsIdx)) {
      const oldDepArray = _effects[_effectsIdx].depArray;

      newEffect = {
        ..._effects[_effectsIdx],
        effect,
        depArray,
        hasChange: depArray.some((dep, i) => !Object.is(dep, oldDepArray[i])),
      };
    }

    _effects[_effectsIdx] = newEffect;
  };
  const useRef = <Value>(value: Value): Ref<Value> => {
    const _hooksIdx = hooksIdx - 1;
    const _hook = hooks[_hooksIdx];

    const _refsIdx = refsIdx++;
    const _refs = _hook.refs;
    const newRef: Ref<Value> = { current: value };

    isEmpty(_refs, _refsIdx) && (_refs[_refsIdx] = newRef);

    return _refs[_refsIdx];
  };

  const getState = (selector?: (state: any) => any): any => {
    const state = rootActions.getState();
    return selector ? selector(state) : state;
  };
  const getActions = (selector?: (state: any) => any): any => {
    return selector ? selector(rootActions) : rootActions;
  };
  return {
    createElement,
    render,
    getState,
    getActions,
    useState,
    useEffect,
    useRef,
    cloneElement,
  };
})();

export default React;
export const { getState, getActions, useState, useEffect, useRef } = React;
