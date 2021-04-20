import { ActionsType, app, Children, Component, h, VNode } from "hyperapp";

declare global {
  interface Window {
    hooks: Array<any>;
    effects: Array<any>;
  }
}

interface Ref<Value> {
  current: Value;
}
interface Effect<Value> {
  cb: Function;
  depArray: Array<Value>;
}
interface EffectResult<Value> {
  depArray: Array<Value>;
  callback: null | Function;
}
interface Effects<Value> {
  _el: Element;
  results: Array<EffectResult<Value>>;
}
interface RyperAttributes {
  oncreate?: null | ((_el: Element) => void);
  onupdate?: null | ((_el: Element) => void);
  ondestroy?: null | ((_el: Element) => void);
  ref?: null | Ref<any>;
  [key: string]: any;
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
interface RyperComponentResult<State, Actions> {
  (
    state?: State,
    actions?: Actions,
    props?: RyperAttributes,
    children?: Array<Children | Children[]>
  ): VNode<RyperAttributes>;
}
interface RyperComponent<State, Actions> extends Component {
  (attributes: RyperAttributes, children: Array<Children | Children[]>):
    | RyperComponentResult<State, Actions>
    | V2VNode
    | any;
}

const React = (() => {
  let rootActions: any;

  let timer: number;

  let hookIdx = 0;
  let hooks: Array<any> = [];
  let hook: Array<any> = [];

  let effects: Array<Effects<any>> = [];
  let effect: Array<Effect<any>> = [];

  let refs: Array<Ref<any>> = [];

  let elements: Array<VNode<RyperAttributes>> = [];

  const isUndefined = <Value>(value: Value) => {
    return value === undefined;
  };
  const isV2VNode = (elFn: V2VNode | any): elFn is V2VNode => {
    const V2NodeKeys = ["type", "props", "children", "node", "tag", "key"];
    return (
      typeof elFn === "object" && V2NodeKeys.every((key) => Object.keys(key))
    );
  };
  const isRyperComponentResult = <State, Actions>(
    elFn: RyperComponentResult<State, Actions> | V2VNode | any
  ): elFn is RyperComponentResult<State, Actions> => {
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
    elements.push(el);

    return el;
  };
  const componentRender = <State, Actions>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode<RyperAttributes> => {
    let el;
    try {
      el = getVNode(type, props, children);
    } catch (error) {
      el = getVNode(type, props, children);
    }

    const elementProps = el.attributes || (el.attributes = {});
    // const _hookIdx = hookIdx;
    // const _hook = hook;
    const _effect = effect;

    const oldCreate = elementProps.oncreate;
    elementProps.oncreate = (_el) => {
      console.log("create");
      // hooks.splice(_hookIdx - _hook.length, _hook.length, ..._hook);
      setTimeout(() => {
        const results = _effect.map(({ cb, depArray }) => {
          let e: EffectResult<null> = { depArray, callback: null };
          cb && (e.callback = cb(_el));
          return e;
        });

        effects.push({ _el, results });
      });

      oldCreate && oldCreate(_el);
    };

    const oldUpdate = elementProps.onupdate;
    elementProps.onupdate = (_el) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.log("aaa", effects);
      });
      oldUpdate && oldUpdate(_el);
    };

    const oldDestroy = elementProps.ondestroy;
    elementProps.ondestroy = (_el) => {
      setTimeout(() => {
        effects
          .filter((e) => e._el === _el)
          .forEach(({ results = [] }) => {
            results.forEach(({ callback }) => {
              callback && callback(_el);
            });
          });
        effects = effects.filter((e) => {
          return e._el !== _el;
        });
      });
      oldDestroy && oldDestroy(_el);
    };

    effect = [];
    hook = [];

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
  ): RyperComponentResult<State, Actions> => {
    return (...params) => {
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
    hookIdx = 0;

    hook = [];

    effect = [];

    elements = [];

    refs = [];

    window.hooks = hooks;
    window.effects = effects;

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
  ): [value: Value, setState: (newValue: Value) => Value] => {
    const _idx = hookIdx;

    const setState = (newValue: Value, flag = true) => {
      if (hooks[_idx] !== newValue) {
        hooks[_idx] = newValue;
        flag && rootActions.change();
      }

      return hooks[_idx];
    };

    const nowValue = hooks[hookIdx];
    const state = isUndefined(nowValue) ? setState(initValue, false) : nowValue;

    hookIdx++;
    hook.push(initValue);

    return [state, setState];
  };
  const useRef = <Value>(value: Value): Ref<Value> => {
    const ref: Ref<Value> = { current: value };
    refs.push(ref);
    return ref;
  };
  const useEffect = <Value>(cb: Function, depArray: Array<Value>) => {
    effect.push({ cb, depArray });
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
    createElement,
    useState,
    useRef,
    useEffect,
    getState,
    getActions,
  };
})();

export const { useState, useRef, useEffect, getState, getActions } = React;

export default React;
