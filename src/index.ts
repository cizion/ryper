import { ActionsType, app, Children, h, View, VNode } from "hyperapp";

interface RyperView<State, Actions, Attributes> extends View<State, Actions> {
  (
    state?: State,
    actions?: Actions,
    props?: Attributes,
    children?: Array<Children | Children[]>
  ): VNode;
}

declare global {
  namespace JSX {
    interface Element extends RyperView<any, any, any> {}
  }
}

const React = (() => {
  let rootActions: any;

  const createElement = (type: any, props: any, ...children: any[]) => {
    return () => h(type, props, children);
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

  const init = <State, Actions, Attributes>(
    view: RyperView<State, Actions, Attributes>
  ): RyperView<State, Actions, Attributes> => {
    console.log("init");
    return view;
  };

  const render = <State, Actions, Attributes>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: RyperView<State, Actions, Attributes>,
    container: Element | null
  ) => {
    console.log("render");
    rootActions = app(state, createActions(actions), init(view), container);
    console.log(rootActions);
  };

  return {
    render,
    createElement,
  };
})();

export default React;
