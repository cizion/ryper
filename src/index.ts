import {ActionsType, ActionType, VNode, app, h, Component, Children } from 'hyperapp';

declare global {
  namespace JSX {
    interface Element extends RyperComponentResult<unknown, unknown>, VNode<any> {}
  }
}

type refType = {current: Element | any};

type effectType = {callback: Function | null};

type RyperActionsType<State, Actions> = ActionsType<State, Actions> & {
  change: ActionType<any, State, Actions>,
  getState: ActionType<any, State, Actions>,
}

interface RyperAttributes {
  oncreate: null | ((_el: Element) => void),
  ondestroy: null | ((_el: Element) => void),
  ref: null | refType,
  [key: string]: any
};

interface RyperVNode extends VNode {
  attributes: RyperAttributes
}

interface RyperComponentResult<State, Actions> {
  (state?: State, actions?: Actions, props?: any, children?: Array<Children | Children[]>): RyperVNode
}

interface RyperComponent<State, Actions> extends Component {
  (attributes: RyperAttributes, children: Array<Children | Children[]>): RyperComponentResult<State, Actions>
}

const React = (() => {
  let rootActions: any;

  let hookIdx = 0;
  let hooks:Array<any> = [];

  let effectFlag = false;
  let effectIdx = 0;
  let effects: Array<Array<Array<any> | effectType>> = [];

  let elements:RyperVNode[] = [];

  const componentRender = <State, Actions>(type: RyperComponent<State, Actions>, props:RyperAttributes, children: Array<Children | Children[]>): RyperVNode => {
    const elFn = type(props, children);
    const el = elFn();

    const _effectIdx = effectIdx;
    const _effectFlag = effectFlag;

    const element = elements[elements.length - 1];
    const elementProps = element.attributes;

    const oldCreate = elementProps.oncreate;
    elementProps.oncreate = (_el) => {
      oldCreate && oldCreate(_el);
    }

    const oldDestroy = elementProps.ondestroy;
    elementProps.ondestroy = (_el) => {
      if(_effectFlag) {
        const effect = effects[_effectIdx - 1];
        const destroy = <effectType>effect[effect.length - 1];
        destroy && destroy.callback && destroy.callback(_el);
      }

      oldDestroy && oldDestroy(_el);
    };

    effectFlag = false;

    return el;
  };

  const elementRender = (type: string, props: RyperAttributes, children: Array<Children | Children[]>): RyperVNode => {
    const el = <RyperVNode>h(type, props, ...children);

    const oldCreate = props.oncreate;
    props.oncreate = (_el) => {
      props.ref && (props.ref.current = _el)
      oldCreate && oldCreate(_el);
    }

    const oldDestroy = props.ondestroy;
    props.ondestroy = (_el) => {
      oldDestroy && oldDestroy(_el);
    };

    elements.push(el);
    return el;
  };

  const createElement = <Attributes, State, Actions>(type: RyperComponent<State, Actions> | string, props: Attributes, ...children: Array<Children | Children[]>): RyperComponentResult<State, Actions> => {
    const defaultProps = {oncreate: null, ondestroy: null, ref: null};
    const newProps: RyperAttributes = {...defaultProps, ...props};

    return (...params) => {
      const[,, addProps = {}, addChildren = []] = params;
      
      const newAddProps = {...newProps, ...addProps};
      const newAddChildren = [...children, ...addChildren];

      return typeof type === 'function'
        ? componentRender(type, newAddProps, newAddChildren)
        : elementRender(type, newAddProps, newAddChildren)
    };
  };

  const cloneElement = <Attributes, State, Actions>(component: RyperComponentResult<State, Actions>, props?: Attributes, ...children: Array<Children | Children[]>): RyperVNode => {
    return component(undefined, undefined, props, children);
  };

  const createActions = <State, Actions>(actions: ActionsType<State, Actions>): RyperActionsType<State, Actions> => ({
    ...actions,
    change: () => (state) => ({...state}),
    getState: () => (state) => (state)
  });

  const createComponent = (view: VNode): VNode => {
    hookIdx = 0;
    effectIdx = 0;
    effectFlag = false;
    elements = [];

    return view;
  };

  const render = <State, Actions>(state: State, actions: ActionsType<State, Actions>, view: VNode, container: Element | null): RyperActionsType<State, Actions> => {
    const wiredActions = app<State, RyperActionsType<State, Actions>>(
      state,
      createActions(actions),
      () => createComponent(view),
      container
    );

    rootActions = wiredActions;

    return wiredActions;
  };

  const useState = (initValue:any): [value:any, setState:(newVal: any, reRender?: boolean) => any] => {
    const _idx = hookIdx;
    const setState = (newVal:any, reRender = true): any => {
      if(hooks[_idx] === newVal) {return hooks[_idx]};
      hooks[_idx] = newVal;
      reRender && rootActions.change();
      return hooks[_idx];
    }
    const state = hooks[hookIdx] !== undefined ? hooks[hookIdx] : setState(initValue, false);
    hookIdx++;
    return [state, setState];
  };

  const useRef = (val: any): refType => {
    return useState({current: val})[0];
  };

  const useEffect = (cb: Function, depArray: Array<any>): void => {
    const oldDeps = effects[effectIdx];
    let hasChanged = true;

    if (oldDeps) {
      hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
      depArray.push(oldDeps[oldDeps.length - 1]);
    } else {
      depArray.push({callback: null});
    }

    if (hasChanged) setTimeout(async () => {
      const callback = await cb();
      const destroy:effectType = depArray[depArray.length - 1];
      destroy.callback = callback;
    });

    effects[effectIdx] = depArray;

    effectFlag = true;
    effectIdx++;
  };

  const getState = (selector?: Function): any => {
    const state = rootActions.getState();
    return selector ? selector(state) : state;
  };

  const getActions = (selector?: string): any => {
    return selector ? rootActions[selector] : rootActions;
  }

  return {render, createElement, cloneElement, useState, useRef, useEffect, getState, getActions};
})();

export const {
  useState,
  useRef,
  useEffect,
  getState,
  getActions
} = React;


export default React;