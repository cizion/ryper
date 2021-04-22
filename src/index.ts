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
  // ref?: null | Ref<any>;
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

  let componentIdx = 0;
  // let hooksIdx = 0;
  let hooks: Array<any> = [];
  let hook: any;

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

  const componentInit = (name: string, key: any) => {
    const _componentIdx = componentIdx;

    !hooks[_componentIdx] &&
      (hooks[_componentIdx] = { name, key, states: [], refs: [], effects: [] });
    hook = hooks[_componentIdx];
  };

  const componentFinal = () => {
    console.log(hook);
    componentIdx++;
    // hooksIdx = 0;
    // hook= null;
  };

  const componentRender = <State, Actions>(
    type: RyperComponent<State, Actions>,
    props: RyperAttributes,
    children: Array<Children | Children[]>
  ): VNode<RyperAttributes> => {
    componentInit(type.name, props.key);
    const el = getVNode(type, props, children);
    componentFinal();
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
    componentIdx = 0;
    // hooksIdx = 0;
    // hook=null

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
  };
})();

export const { getState, getActions } = React;

export default React;
