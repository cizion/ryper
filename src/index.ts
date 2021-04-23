import {
  ActionsType,
  app,
  Children,
  Component,
  h,
  View,
  VNode,
} from "hyperapp";

declare global {
  interface Window {
    hooks: Array<any>;
    effects: Array<any>;
  }
}
interface Effect<Value> {
  depArray: Array<Value>;
  effectCallback?: Function;
}
interface Ref<Value> {
  current: Value;
}
interface Hook<StateValue, RefValue, EffectValue> {
  name: string;
  key: any;
  states: Array<StateValue>;
  refs: Array<Ref<RefValue>>;
  effects: Array<Effect<EffectValue>>;
}
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
interface RyperView<State, Actions> extends View<State, Actions> {
  (
    state?: State,
    actions?: Actions,
    props?: RyperAttributes,
    children?: Array<Children | Children[]>
  ): VNode<RyperAttributes>;
}
interface RyperComponent<State, Actions> extends Component {
  (attributes: RyperAttributes, children: Array<Children | Children[]>):
    | RyperView<State, Actions>
    | V2VNode
    | any;
}
const React = (() => {
  let rootActions: any;

  let hooksIdx = 0;
  let statesIdx = 0;
  let effectsIdx = 0;
  let refsIdx = 0;
  let hooks: Array<Hook<any, any, any>> = [];
  let hook: Hook<any, any, any> | null = null;

  const isV2VNode = (elFn: V2VNode | any): elFn is V2VNode => {
    const V2NodeKeys = ["type", "props", "children", "node", "tag", "key"];
    return (
      typeof elFn === "object" && V2NodeKeys.every((key) => Object.keys(key))
    );
  };
  const isRyperComponentResult = <State, Actions>(
    elFn: RyperView<State, Actions> | V2VNode | any
  ): elFn is RyperView<State, Actions> => {
    return typeof elFn === "function";
  };
  const isRyperComponent = <State, Actions>(
    type: RyperComponent<State, Actions> | string
  ): type is RyperComponent<State, Actions> => {
    return typeof type === "function";
  };
  const getVNode = <State, Actions>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode<RyperAttributes> => {
    let elFn = type(props, children);
    let el: VNode<RyperAttributes>;

    if (isRyperComponentResult(elFn)) {
      el = elFn();
    } else if (isV2VNode(elFn)) {
      const { key, children, tag, props } = elFn;
      el = {
        nodeName: tag,
        attributes: props,
        children,
        key,
      };
    } else {
      el = elFn;
    }

    return el;
  };

  const isEmpty = (arr: Array<any>, index: number): boolean => {
    return arr.length - 1 < index;
  };
  const isNotSameComponent = (
    name: string,
    key: any,
    component: Hook<any, any, any>
  ): boolean => {
    return name !== component.name || key !== component.key;
  };
  const componentInit = (name: string, key: any) => {
    const _hooksIdx = hooksIdx++;
    let _hooks: Hook<any, any, any> = {
      name,
      key,
      states: [],
      refs: [],
      effects: [],
    };

    if (isEmpty(hooks, _hooksIdx)) {
      hooks[_hooksIdx] = _hooks;
    } else if (isNotSameComponent(name, key, hooks[_hooksIdx])) {
      hooks.splice(_hooksIdx, 0, _hooks);
    } else {
      _hooks = hooks[_hooksIdx];
    }

    hook = _hooks;
  };
  const componentFinal = () => {
    statesIdx = 0;
    effectsIdx = 0;
    refsIdx = 0;
    hook = null;
  };
  const componentRender = <State, Actions>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode<RyperAttributes> => {
    componentInit(type.name, props.key);
    const el = getVNode(type, props, children);

    const _hook = hook;
    const elementProps = el.attributes || (el.attributes = {});

    const oldCreate = elementProps.oncreate;
    elementProps.oncreate = (_el) => {
      oldCreate && oldCreate(_el);
    };

    const oldUpdate = elementProps.onupdate;
    elementProps.onupdate = (_el) => {
      oldUpdate && oldUpdate(_el);
    };

    const oldDestroy = elementProps.ondestroy;
    elementProps.ondestroy = (_el) => {
      const index = hooks.findIndex((h) => h === _hook);
      hooks.splice(index, 1);

      const effects = _hook?.effects || [];
      effects.forEach((e) => {
        e.effectCallback && e.effectCallback();
      });

      oldDestroy && oldDestroy(_el);
    };

    componentFinal();
    return el;
  };
  const elementRender = <State, Actions>(
    type: RyperComponent<State, Actions> | string,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode<RyperAttributes> => {
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

    const el = h(type, props, ...children);

    return el;
  };
  const createElement = <State, Actions>(
    type: RyperComponent<State, Actions> | string,
    props: RyperAttributes,
    ...children: Array<Children | Children[]>
  ): RyperView<State, Actions> => {
    return (
      ...params: [
        state?: State,
        actions?: Actions,
        props?: RyperAttributes,
        children?: Array<Children | Children[]>
      ]
    ) => {
      const [, , addProps = {}, addChildren = []] = params;
      const newProps = { ...props, ...addProps };
      const newChildren = [...children, ...addChildren];
      return isRyperComponent(type)
        ? componentRender(type, newProps, newChildren)
        : elementRender(type, newProps, newChildren);
    };
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
  const init = (view: VNode): VNode => {
    hooksIdx = 0;
    statesIdx = 0;
    effectsIdx = 0;
    refsIdx = 0;
    hook = null;

    window.hooks = hooks;
    return view;
  };
  const render = <State, Actions>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: VNode,
    container: Element | null
  ) => {
    rootActions = app<State, Actions>(
      state,
      createActions(actions),
      () => init(view),
      container
    );
  };

  const useState = <Value>(
    initValue: Value
  ): [value: Value, setState: (newValue: Value) => void] => {
    if (hook === null) {
      throw "[useState]: hook is null";
    }

    const _statesIdx = statesIdx++;
    const _states = hook.states;

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
    if (hook === null) {
      throw "[useState]: hook is null";
    }

    const _effectsIdx = effectsIdx++;
    const _effects = hook.effects;
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
    if (hook === null) {
      throw "[useState]: hook is null";
    }

    const _refsIdx = refsIdx++;
    const _refs = hook.refs;
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
    render,
    getState,
    getActions,
    createElement,
    useState,
    useEffect,
    useRef,
  };
})();

export const { getState, getActions, useState, useEffect, useRef } = React;

export default React;
