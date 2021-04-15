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
interface RyperComponentResult<State, Actions> {
  (
    state?: State,
    actions?: Actions,
    props?: RyperAttributes,
    children?: Array<Children | Children[]>
  ): VNode<RyperAttributes>;
}
interface RyperComponent<State, Actions> extends Component {
  (
    attributes: RyperAttributes,
    children: Array<Children | Children[]>
  ): RyperComponentResult<State, Actions>;
}

const React = (() => {
  let rootActions: any;
  // const componentRender = () => {};
  // const elementRender = () => {};
  // const isComponent = () => {};
  const createElement = <State, Actions>(
    type: RyperComponent<State, Actions> | string,
    props: RyperAttributes,
    ...children: Array<Children | Children[]>
  ): RyperComponentResult<State, Actions> => {
    console.log(type, props, ...children);
    return () => {
      return h(type, props, ...children);
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
