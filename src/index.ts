import { ActionsType, app, Children, Component, h, VNode } from "hyperapp";

declare global {
  interface Window {
    test: any;
  }
}
interface Ref<Value> {
  current: Value;
}
interface Attributes {
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

const React = (() => {
  let rootActions: any;

  const isComponent = (type: Component | string): type is Component => {
    return typeof type === "function";
  };
  const isV2VNode = (el: V2VNode | any): el is V2VNode => {
    const V2NodeKeys = ["type", "props", "children", "node", "tag", "key"];
    return (
      typeof el === "object" &&
      V2NodeKeys.every((key) => Object.keys(el).includes(key))
    );
  };
  const versionDown = (el: V2VNode): VNode => {
    const { key, children, tag, props } = el;
    const newEl = {
      nodeName: tag,
      attributes: props,
      children: children.map((child: any) =>
        typeof child !== "boolean" ? child : ""
      ),
      key,
    };

    return newEl;
  };

  const componentInit = () => {};
  const componentFinal = () => {};
  const getVNode = (
    type: Component,
    props: Attributes,
    children: Array<Children | Children[]>
  ): VNode => {
    let newEl: VNode | V2VNode = h(type, props, ...children);
    const el: VNode = isV2VNode(newEl) ? versionDown(newEl) : newEl;

    return el;
  };

  const componentRender = (
    type: Component,
    props: Attributes,
    children: Array<Children | Children[]>
  ): VNode<Attributes> => {
    componentInit();
    const el = getVNode(type, props, children);
    componentFinal();
    return el;
  };
  const elementRender = (
    type: string,
    props: Attributes,
    children: Array<Children | Children[]>
  ): VNode<Attributes> => {
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
  const createElement = (
    type: Component | string,
    props: Attributes,
    ...children: Array<Children | Children[]>
  ): VNode<Attributes> => {
    return isComponent(type)
      ? componentRender(type, { ...props }, children)
      : elementRender(type, { ...props }, children);
  };

  const createActions = <State, Actions>(
    actions: ActionsType<State, Actions>
  ): ActionsType<State, Actions> => {
    console.log("createActions");
    return {
      ...actions,
      change: () => (state) => ({ ...state }),
      getState: () => (state) => state,
    };
  };
  const init = ({ nodeName, attributes = {}, children = [] }: VNode): VNode => {
    console.log("init");
    return createElement(nodeName, attributes, children);
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
    console.log(rootActions);
  };

  const getState = <State, Target>(
    selector?: (state: State) => Target
  ): Target => {
    console.log(rootActions);
    const state = rootActions.getState();
    return selector ? selector(state) : state;
  };
  const getActions = <Actions, Target>(
    selector?: (state: Actions) => Target
  ): Target => {
    return selector ? selector(rootActions) : rootActions;
  };

  return {
    render,
    createElement,
    getState,
    getActions,
  };
})();

export const { getState, getActions } = React;

export default React;
