import {
  ActionsType,
  app,
  Children,
  Component,
  h,
  View,
  VNode,
} from "hyperapp";
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
interface RyperVNode extends VNode {
  parent?: VNode;
}
interface RyperView<State, Actions, Attributes> extends View<State, Actions> {
  (
    state?: State,
    actions?: Actions,
    props?: Attributes,
    children?: Array<Children | Children[]>
  ): RyperVNode;
  [x: string]: any;
}
interface RyperComponent<State, Actions, Attributes> extends Component {
  (attributes: Attributes, children: Array<Children | Children[]>): RyperResult<
    State,
    Actions,
    Attributes
  >;
}
type RyperResult<State, Actions, Attributes> =
  | RyperView<State, Actions, Attributes>
  | RyperVNode
  | V2VNode;

declare global {
  namespace JSX {
    interface Element extends RyperView<any, any, any> {}
  }
}

const React = (() => {
  let createRyperViewKey = Symbol();
  let rootActions: any;

  const isComponent = (type: Component | string): type is Component => {
    return typeof type === "function";
  };
  const isRyperView = <State, Actions, Attributes>(
    elFn: RyperResult<State, Actions, Attributes>
  ): elFn is RyperView<State, Actions, Attributes> => {
    return typeof elFn === "function" && elFn.key === createRyperViewKey;
  };
  const isV2VNode = (el: V2VNode | any): el is V2VNode => {
    const V2NodeKeys = ["type", "props", "children", "node", "tag", "key"];
    return (
      typeof el === "object" &&
      V2NodeKeys.every((key) => Object.keys(el).includes(key))
    );
  };
  // const isVNode = (el: VNode | any): el is VNode => {
  //   const VNodeKeys = ["nodeName", "attributes", "children", "key"];
  //   return (
  //     typeof el === "object" &&
  //     VNodeKeys.every((key) => Object.keys(el).includes(key))
  //   );
  // };
  const versionDown = <State, Actions, Attributes>(newEl: V2VNode): VNode => {
    const { key, children, tag, props } = newEl;
    const el = {
      nodeName: tag,
      attributes: props,
      children: children.map((child: RyperResult<State, Actions, Attributes>) =>
        typeof child !== "boolean" ? child : ""
      ),
      key,
    };

    return el;
  };
  const convertVersion = (newEl: V2VNode | VNode): VNode => {
    return isV2VNode(newEl) ? versionDown(newEl) : newEl;
  };
  const getVNode = <State, Actions, Attributes>(
    newEl: RyperResult<State, Actions, Attributes>
  ): VNode => {
    const el: V2VNode | VNode = isRyperView(newEl) ? newEl() : newEl;
    return convertVersion(el);
  };
  const getEl = <State, Actions, Attributes>(
    type: RyperComponent<State, Actions, Attributes>,
    props: Attributes,
    children: Array<Children | Children[]>
  ): VNode => {
    const result: RyperResult<State, Actions, Attributes> = h(
      type,
      props,
      ...children
    );
    const el = getVNode(result);
    return el;
  };
  const getParent = (el?: RyperVNode): RyperVNode | undefined => {
    let result;

    if (!el || el.children.some((child: any) => child.isComponent)) {
      result = el;
    } else {
      result = getParent(el.parent);
    }

    return result;
  };
  const componentInit = () => {};
  const componentFinal = () => {};
  const componentRender = <State, Actions, Attributes>(
    type: RyperComponent<State, Actions, Attributes>,
    props: Attributes,
    children: Array<Children | Children[]>
  ): RyperVNode => {
    componentInit();
    const el: VNode = getEl(type, props, children);
    componentFinal();
    return el;
  };
  const elementRender = <Attributes>(
    type: string,
    props: Attributes,
    children: Array<Children | Children[]>
  ): RyperVNode => {
    return h(type, props, ...children);
  };
  const createElement = <State, Actions, Attributes>(
    type: RyperComponent<State, Actions, Attributes> | string,
    props: Attributes,
    ...children: Array<Children | Children[]>
  ): RyperView<State, Actions, Attributes> => {
    const createRyperView = (
      ...params: [
        state?: State,
        actions?: Actions,
        props?: Attributes,
        children?: Array<Children | Children[]>
      ]
    ): RyperVNode => {
      const [, , addProps = {}, addChildren = []] = params;
      const newProps = { ...props, ...addProps };
      const newChildren = [...children, ...addChildren];

      return isComponent(type)
        ? componentRender(type, newProps, newChildren)
        : elementRender(type, newProps, newChildren);
    };
    createRyperView.key = createRyperViewKey;
    createRyperView.isComponent = isComponent(type);

    return createRyperView;
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
    return view;
  };
  const render = <State, Actions, Attributes>(
    state: State,
    actions: ActionsType<State, Actions>,
    view: RyperView<State, Actions, Attributes>,
    container: Element | null
  ): void => {
    rootActions = app(state, createActions(actions), init(view), container);
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
    createElement,
    render,
    getState,
    getActions,
  };
})();

export default React;
export const { getState, getActions } = React;
