import { ActionsType, app, Children, Component, h, VNode } from "hyperapp";

type refsType<Value> = { current: Element | Value };
// type effectCallback = (_el:Element) => void | Promise<void>;
// type effectCb = (_el:Element) => void | effectCallback | Promise<void | effectCallback>;
type effectsType<Value> = { _el: Element; depArray: Array<Value>; callback: null | Function };
type effectType<Value> = { cb: Function; depArray: Array<Value> } | null;

interface RyperAttributes {
  oncreate?: null | ((_el: Element) => void);
  onupdate?: null | ((_el: Element) => void);
  ondestroy?: null | ((_el: Element) => void);
  ref?: null | refsType<any>;
  [key: string]: any;
}

interface RyperComponentResult<State, Actions> {
  (state?: State, actions?: Actions, props?: RyperAttributes, children?: Array<Children | Children[]>): VNode<RyperAttributes>;
}

interface RyperComponent<State, Actions> extends Component {
  (attributes: RyperAttributes, children: Array<Children | Children[]>): RyperComponentResult<State, Actions>;
}

const React = (() => {
  let rootActions: any;

  let hookIdx = 0;
  let hooks: Array<any> = [];
  let hook: Array<any> = [];

  let refs: Array<refsType<any>> = [];

  let effects: Array<effectsType<any>> = [];
  let effect: effectType<any> = null;

  let elements: Array<VNode<RyperAttributes>> = [];

  const componentRender = <State, Actions>(type: RyperComponent<State, Actions>, props: RyperAttributes, chlidren: Array<Children | Children[]>): VNode<RyperAttributes> => {
    const el = type(props, chlidren)();

    const element = elements[elements.length - 1];
    const elementProps = element.attributes || (element.attributes = {});

    const _effect = effect;
    const _hookIdx = hookIdx;
    const _hook = hook;

    const oldCreate = elementProps.oncreate;
    elementProps.oncreate = async (_el) => {
      hooks.splice(_hookIdx - _hook.length, _hook.length, ..._hook);
      rootActions.change();

      if (_effect) {
        const { cb, depArray } = _effect;
        let e: effectsType<null> = { _el, depArray, callback: null };
        effects.push(e);

        cb && (e.callback = (await cb(_el)) || null);
      }

      oldCreate && oldCreate(_el);
    };

    const oldUpdate = elementProps.onupdate;
    elementProps.onupdate = async (_el) => {
      if (_effect) {
        const { cb, depArray } = _effect;
        let e = effects.find((e) => e._el === _el);

        if (e) {
          const hasChanged = !!(e.depArray.length && depArray.some((dep, i) => !Object.is(dep, e?.depArray[i])));
          hasChanged && (await cb(_el), (e.depArray = depArray));
        }
      }
      oldUpdate && oldUpdate(_el);
    };

    const oldDestroy = elementProps.ondestroy;
    elementProps.ondestroy = async (_el) => {
      let e = effects.find((e) => e._el === _el);
      e?.callback && (await e.callback(_el), (e.callback = null));

      oldDestroy && oldDestroy(_el);
    };

    effect = null;
    hook = [];

    return el;
  };
  const elementRender = (type: string, props: RyperAttributes, children: Array<Children | Children[]>): VNode<RyperAttributes> => {
    const el = h(type, props, ...children);

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

    elements.push(el);
    return el;
  };
  const createElement = <State, Actions>(type: RyperComponent<State, Actions> | string, props: RyperAttributes, ...children: Array<Children | Children[]>): RyperComponentResult<State, Actions> => {
    return (...params) => {
      const [, , addProps = {}, addChildren = []] = params;

      const newAddProps = { ...props, ...addProps };
      const newAddChildren = [...children, ...addChildren];

      return typeof type === "function" ? componentRender(type, newAddProps, newAddChildren) : elementRender(type, newAddProps, newAddChildren);
    };
  };
  const createActions = <State, Actions>(actions: ActionsType<State, Actions>): ActionsType<State, Actions> => {
    return {
      ...actions,
      change: () => (state) => ({ ...state }),
      getState: () => (state) => state,
    };
  };
  const cloneElement = <State, Actions>(component: RyperComponentResult<State, Actions>, props?: RyperAttributes, ...children: Array<Children | Children[]>): VNode<RyperAttributes> => {
    return typeof component === "function" ? component(undefined, undefined, props, children) : component;
  };
  const init = (view: VNode): VNode => {
    hookIdx = 0;
    effect = null;
    elements = [];
    refs = [];

    return view;
  };
  const render = <State, Actions>(state: State, actions: ActionsType<State, Actions>, view: VNode, container: Element | null) => {
    rootActions = app<State, Actions>(state, createActions(actions), () => init(view), container);
  };
  const useState = <Value>(initValue: Value): [value: Value, setState: (newValue: Value) => Value] => {
    const _idx = hookIdx;
    const setState = (newVal: Value, flag = true) => {
      if (hooks[_idx] === newVal) {
        return hooks[_idx];
      }
      hooks[_idx] = newVal;
      flag && rootActions.change();
      return hooks[_idx];
    };
    const state = hooks[hookIdx] !== undefined ? hooks[hookIdx] : setState(initValue, false);

    hookIdx++;
    hook.push(initValue);

    return [state, setState];
  };
  const useRef = <Value>(val: Value): refsType<Value> => {
    const ref: refsType<Value> = { current: val };
    refs.push(ref);
    return ref;
  };
  const useEffect = <Value>(cb: Function, depArray: Array<Value>) => {
    effect = { cb, depArray };
  };
  const getState = (selector?: (state: any) => any): any => {
    const state = rootActions.getState();
    return selector ? selector(state) : state;
  };
  const getActions = (selector?: (state: any) => any): any => {
    return selector ? selector(rootActions) : rootActions;
  };

  return { render, createElement, cloneElement, useState, useRef, useEffect, getState, getActions };
})();

export const { useState, useRef, useEffect, getState, getActions } = React;

export default React;
