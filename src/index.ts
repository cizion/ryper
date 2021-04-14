import { ActionsType, app, h, VNode } from "hyperapp";

declare global {
  interface Window {
    hooks: Array<any>;
  }
}

const React = (() => {
  const init = (view: VNode): VNode => {
    return view;
  };

  const createElement = (type: any, ...props: any) => {
    console.log(type, props);
    return h(type, ...props);
  };

  const render = <State, Actions>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: VNode,
    container: Element | null
  ) => {
    app(state, actions, () => init(view), container);
  };

  return { render, createElement };
})();

export default React;
