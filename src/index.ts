import { ActionsType, app, Children, Component, h, VNode } from "hyperapp";

declare global {
  interface Window {
    hooks: Array<any>;
  }
}

interface Refs<Value> {
  current: Value;
}
interface RyperAttributes {
  oncreate?: null | ((_el: Element) => void);
  onupdate?: null | ((_el: Element) => void);
  ondestroy?: null | ((_el: Element) => void);
  ref?: null | Refs<any>;
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
    | V2VNode;
}

const React = (() => {
  let rootActions: any;

  let hookIdx = 0;
  let hooks: Array<any> = [];
  let hook: Array<any> = [];

  const isUndefined = <Value>(value: Value) => {
    return value === undefined;
  }
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
    let elFn: RyperComponentResult<State, Actions> | V2VNode | any = type(
      props,
      children
    );
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
    return el;
  };
  const elementRender = <State, Actions>(
    type: RyperComponent<State, Actions> | string,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode<RyperAttributes> => {
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
    console.log("init");
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
  const useState = <Value>(initValue: Value):[value: Value, setState: (newValue: Value) => Value]  => {
    const _idx = hookIdx;

    const setState = (newValue: Value, falg = true) => {
      
    }

    const state = isUndefined() ? : 

    return [initValue, setState];
  };
  const getState = (selector?: (state: any) => any): any => {
    const state = rootActions.getState();
    return selector ? selector(state) : state;
  };
  const getActions = (selector?: (state: any) => any): any => {
    return selector ? selector(rootActions) : rootActions;
  };

  return { render, createElement, getState, getActions };
})();

export const { getState, getActions } = React;

export default React;
