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

const React = (() => {
  let rootActions: any;

  const isComponent = (type: Component | string): type is Component => {
    return typeof type === "function";
  };

  const componentRender = (
    type: Component,
    props: Attributes,
    children: Array<Children | Children[]>
  ) => {
    return h(type, props, ...children);
  };
  const elementRender = (
    type: string,
    props: Attributes,
    children: Array<Children | Children[]>
  ) => {
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
  ): VNode => {
    return isComponent(type)
      ? componentRender(type, props, children)
      : elementRender(type, props, children);
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
  const init = ({ nodeName, attributes = {}, children = [] }: VNode): VNode => {
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
  };

  const getState = <State, Target>(
    selector?: (state: State) => Target
  ): Target => {
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
